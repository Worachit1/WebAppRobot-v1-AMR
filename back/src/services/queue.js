const { getConfig, getHistory, saveHistory } = require("./store");
const { sendTaskOrder } = require("./rcs");

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

/**
 * ส่ง addTask ไป RCS ทันทีทุกครั้ง — ไม่มีคิวใน backend (ให้ RCS จัดการคิวเอง)
 */
async function dispatchOrderImmediate(order, context) {
  const { robot, startSpot, endSpot, rcsBaseUrl } = context;
  const config = await getConfig();
  const now = new Date().toISOString();

  await appendHistory({
    orderId: order.orderId,
    robotId: order.robotId,
    robotName: order.robotName,
    pickup: order.pickup,
    drop: order.drop,
    status: "SENDING",
    createdAt: now,
    startedAt: now
  });

  if (!config.sendEnabled) {
    await updateHistory(order.orderId, {
      status: "SEND_SUCCESS",
      finishedAt: new Date().toISOString(),
      note: "Send disabled (simulation — no RCS call)"
    });
    return { ok: true, simulated: true };
  }

  const payload = {
    modelProcessCode: config.modelProcessCode || "moveShelf6",
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
      return { ok: false, rcsResponse: sendResult };
    }
    await updateHistory(order.orderId, {
      status: "SEND_SUCCESS",
      finishedAt: new Date().toISOString(),
      rcsResponse: sendResult
    });
    return { ok: true, rcsResponse: sendResult };
  } catch (err) {
    const errorPayload = err.response?.data || err.message;
    console.error("[RCS] SEND ERROR:", JSON.stringify(errorPayload, null, 2));
    await updateHistory(order.orderId, {
      status: "SEND_FAILED",
      finishedAt: new Date().toISOString(),
      error: err.message
    });
    return { ok: false, error: err.message };
  }
}

/** คงไว้เพื่อ backward compat — ไม่มีคิวใน memory แล้ว */
function getQueueSnapshot() {
  return {
    pending: 0,
    processing: false,
    currentOrderId: null,
    mode: "immediate"
  };
}

module.exports = {
  dispatchOrderImmediate,
  getQueueSnapshot
};
