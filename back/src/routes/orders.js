const express = require("express");
const { getConfig, getHistory, saveHistory } = require("../services/store");
const { dispatchOrderImmediate, getQueueSnapshot } = require("../services/queue");

const router = express.Router();

function findSpot(floors, spotId, spotName) {
  for (const floor of floors || []) {
    for (const spot of floor.spots || []) {
      if (spotId && spot.id === spotId) {
        return { ...spot, floorId: floor.id, floorName: floor.name };
      }
      if (spotName && spot.name === spotName) {
        return { ...spot, floorId: floor.id, floorName: floor.name };
      }
    }
  }
  return null;
}

function findRobot(config, robotId) {
  return (config.robots || []).find((robot) => robot.id === robotId);
}

function findRcsBaseUrl(config, robot) {
  const rcs = (config.rcs || []).find((item) => item.id === robot.rcsId);
  return rcs?.baseUrl || "";
}

router.post("/", async (req, res) => {
  const { robotId, pickupSpotId, dropSpotId, pickupSpotName, dropSpotName } = req.body || {};
  if (!robotId) {
    return res.status(400).json({ error: "Missing robotId" });
  }

  const config = await getConfig();
  const robot = findRobot(config, robotId);
  if (!robot) {
    return res.status(404).json({ error: "Robot not found" });
  }

  const pickupFloors = config.pickupFloors || config.floors || [];
  const dropFloors = config.dropFloors || config.floors || [];

  const pickup = findSpot(pickupFloors, pickupSpotId, pickupSpotName);
  const drop = findSpot(dropFloors, dropSpotId, dropSpotName);
  if (!pickup || !drop) {
    return res.status(404).json({ error: "Pickup or drop spot not found" });
  }

  const orderId = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
  const rcsBaseUrl = findRcsBaseUrl(config, robot);

  const taskPath = `${pickup.rcsPosition},${drop.rcsPosition}`;
  console.log(
    `[Orders] dispatch immediate robot=${robot.id} orderId=${orderId} taskPath=${taskPath} deviceNum=${robot.deviceNum} rcsBaseUrl=${rcsBaseUrl || "(empty)"}`
  );

  const order = {
    orderId,
    robotId: robot.id,
    robotName: robot.name,
    pickup: {
      id: pickup.id,
      name: pickup.name,
      floorId: pickup.floorId,
      floorName: pickup.floorName,
      rcsPosition: pickup.rcsPosition
    },
    drop: {
      id: drop.id,
      name: drop.name,
      floorId: drop.floorId,
      floorName: drop.floorName,
      rcsPosition: drop.rcsPosition
    }
  };

  const result = await dispatchOrderImmediate(order, {
    robot,
    startSpot: pickup,
    endSpot: drop,
    rcsBaseUrl
  });

  if (!result.ok) {
    return res.status(502).json({
      error: result.error || result.rcsResponse?.desc || "RCS send failed",
      orderId,
      status: "SEND_FAILED",
      rcsResponse: result.rcsResponse
    });
  }

  res.json({
    ok: true,
    orderId,
    status: "SEND_SUCCESS",
    rcsResponse: result.rcsResponse,
    queue: getQueueSnapshot()
  });
});

router.get("/history", async (req, res) => {
  const { status, q } = req.query;
  let history = await getHistory();

  if (status && status !== "ALL") {
    history = history.filter((item) => item.status === status);
  }

  if (q) {
    const query = q.toLowerCase();
    history = history.filter((item) => {
      return (
        item.orderId?.toLowerCase().includes(query) ||
        item.robotName?.toLowerCase().includes(query) ||
        item.pickup?.name?.toLowerCase().includes(query) ||
        item.drop?.name?.toLowerCase().includes(query)
      );
    });
  }

  res.json(history);
});

router.post("/:orderId/cancel", async (req, res) => {
  const { orderId } = req.params;
  const history = await getHistory();
  const index = history.findIndex((item) => item.orderId === orderId);
  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }
  history[index] = {
    ...history[index],
    status: "CANCELLED",
    finishedAt: new Date().toISOString(),
    note: "Cancelled (stub)"
  };
  await saveHistory(history);
  res.json({ ok: true });
});

module.exports = router;
