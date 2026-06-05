const { getConfig, getHistory, saveHistory } = require("./store");
const { sendTaskOrder, getTaskOrderStatus } = require("./rcs");

const TASK_STATUS_MAP = {
  1: "NOT_SENT",
  3: "CANCELLED",
  4: "SENDING",
  5: "SEND_FAILED",
  6: "RUNNING",
  7: "EXECUTION_FAILED",
  8: "COMPLETED",
  9: "ISSUED"
};

const queues = new Map();

function getQueueState(robotId) {
  if (!queues.has(robotId)) {
    queues.set(robotId, {
      items: [],
      processing: false,
      current: null,
      pollTimer: null
    });
  }
  return queues.get(robotId);
}

async function updateHistory(orderId, updates) {
  const history = await getHistory();
  const index = history.findIndex((item) => item.orderId === orderId);
  if (index >= 0) {
    history[index] = { ...history[index], ...updates };
    await saveHistory(history);
  }
}

async function appendHistory(entry) {
  const history = await getHistory();
  history.unshift(entry);
  await saveHistory(history);
}

async function enqueueOrder(order, context) {
  const queue = getQueueState(order.robotId);
  queue.items.push({ order, context });
  if (queue.processing) {
    console.log(
      `[Queue] ${order.robotId}: job queued (orderId=${order.orderId}), waiting — current=${queue.current?.order?.orderId || "?"}, pending=${queue.items.length}`
    );
  }
  await appendHistory({
    orderId: order.orderId,
    robotId: order.robotId,
    robotName: order.robotName,
    pickup: order.pickup,
    drop: order.drop,
    status: "QUEUED",
    createdAt: new Date().toISOString()
  });
  if (!queue.processing) {
    processNext(order.robotId).catch((err) => {
      console.error("Queue processing error:", err);
    });
  }
}

async function processNext(robotId) {
  const queue = getQueueState(robotId);
  if (queue.processing) {
    return;
  }
  const job = queue.items.shift();
  if (!job) {
    return;
  }
  queue.processing = true;
  queue.current = job;

  const { order, context } = job;
  const config = await getConfig();
  const { robot, startSpot, endSpot, rcsBaseUrl } = context;

  await updateHistory(order.orderId, { status: "SENDING", startedAt: new Date().toISOString() });

  if (!config.sendEnabled) {
    await updateHistory(order.orderId, {
      status: "COMPLETED",
      finishedAt: new Date().toISOString(),
      note: "Send disabled (simulation)"
    });
    queue.processing = false;
    queue.current = null;
    processNext(robotId).catch(console.error);
    return;
  }

  const payload = {
    modelProcessCode: config.modelProcessCode || "pana02",
    fromSystem: config.fromSystem || "TSC",
    orderId: order.orderId,
    taskOrderDetail: [
      {
        taskPath: `${startSpot.rcsPosition},${endSpot.rcsPosition}`,
        deviceNum: robot.deviceNum
      }
    ]
  };

  try {
    const sendResult = await sendTaskOrder(rcsBaseUrl, payload);
    const ok = sendResult && Number(sendResult.code) === 1000;
    if (!ok) {
      console.error("[RCS] addTask rejected (body code):", JSON.stringify(sendResult, null, 2));
      await updateHistory(order.orderId, {
        status: "SEND_FAILED",
        finishedAt: new Date().toISOString(),
        rcsResponse: sendResult,
        error: sendResult?.desc || "RCS addTask code !== 1000"
      });
      queue.processing = false;
      queue.current = null;
      processNext(robotId).catch(console.error);
      return;
    }
    await updateHistory(order.orderId, {
      status: "RUNNING",
      rcsResponse: sendResult
    });
  } catch (err) {
    const errorPayload = err.response?.data || err.message;
    console.error("[RCS] SEND ERROR:", JSON.stringify(errorPayload, null, 2));
    await updateHistory(order.orderId, {
      status: "SEND_FAILED",
      finishedAt: new Date().toISOString(),
      error: err.message
    });
    queue.processing = false;
    queue.current = null;
    processNext(robotId).catch(console.error);
    return;
  }

  startPolling(robotId, order.orderId, rcsBaseUrl, config.pollingIntervalMs || 2000);
}

const MAX_CONSECUTIVE_POLL_FAILURES = 30;

function releaseQueueAfterPoll(robotId) {
  const queue = getQueueState(robotId);
  if (queue.pollTimer) {
    clearInterval(queue.pollTimer);
    queue.pollTimer = null;
  }
  queue.processing = false;
  queue.current = null;
  processNext(robotId).catch(console.error);
}

function startPolling(robotId, orderId, rcsBaseUrl, intervalMs) {
  const queue = getQueueState(robotId);
  if (queue.pollTimer) {
    clearInterval(queue.pollTimer);
  }
  let consecutivePollFailures = 0;
  queue.pollTimer = setInterval(async () => {
    try {
      const res = await getTaskOrderStatus(rcsBaseUrl, orderId);
      if (res.code !== 1000) {
        consecutivePollFailures += 1;
        await updateHistory(orderId, { lastPollError: res.desc });
        if (consecutivePollFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
          console.error(
            `[Queue] ${robotId}: abandon polling orderId=${orderId} after ${MAX_CONSECUTIVE_POLL_FAILURES} failures (last: ${res.desc})`
          );
          await updateHistory(orderId, {
            status: "POLL_ABANDONED",
            finishedAt: new Date().toISOString(),
            note: `Stopped polling after ${MAX_CONSECUTIVE_POLL_FAILURES} errors`
          });
          releaseQueueAfterPoll(robotId);
        }
        return;
      }
      consecutivePollFailures = 0;
      const statusCode = res.data.status;
      const statusText = TASK_STATUS_MAP[statusCode] || "UNKNOWN";
      await updateHistory(orderId, {
        status: statusText,
        taskStatusCode: statusCode,
        taskOrderDetail: res.data.taskOrderDetail || []
      });

      if (statusText === "COMPLETED" || statusText === "EXECUTION_FAILED" || statusText === "CANCELLED") {
        clearInterval(queue.pollTimer);
        queue.pollTimer = null;
        await updateHistory(orderId, { finishedAt: new Date().toISOString() });
        queue.processing = false;
        queue.current = null;
        processNext(robotId).catch(console.error);
      }
    } catch (err) {
      consecutivePollFailures += 1;
      await updateHistory(orderId, { lastPollError: err.message });
      if (consecutivePollFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
        console.error(
          `[Queue] ${robotId}: abandon polling orderId=${orderId} after ${MAX_CONSECUTIVE_POLL_FAILURES} exceptions`
        );
        await updateHistory(orderId, {
          status: "POLL_ABANDONED",
          finishedAt: new Date().toISOString(),
          note: `Stopped polling after ${MAX_CONSECUTIVE_POLL_FAILURES} network/API errors`
        });
        releaseQueueAfterPoll(robotId);
      }
    }
  }, intervalMs);
}

function getQueueSnapshot(robotId) {
  const queue = getQueueState(robotId);
  return {
    pending: queue.items.length,
    processing: queue.processing,
    currentOrderId: queue.current?.order?.orderId || null
  };
}

module.exports = {
  enqueueOrder,
  getQueueSnapshot
};
