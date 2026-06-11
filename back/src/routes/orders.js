const express = require("express");
const {
  getConfig,
  saveConfig,
  getHistory,
  saveHistory,
} = require("../services/store");
const {
  dispatchOrderImmediate,
  getQueueSnapshot,
} = require("../services/queue");

const router = express.Router();

const MOCK_RCS = true;

function getGroups(zone) {
  return zone.groups || zone.group || [];
}

function findSpotInZones(zones, spotId, spotName) {
  for (const zone of zones || []) {
    for (const group of getGroups(zone)) {
      for (const spot of group.spots || []) {
        if (spotId && spot.id === spotId) {
          return {
            ...spot,
            zoneId: zone.id,
            zoneName: zone.name,
            groupId: group.id,
            groupName: group.name,
          };
        }

        if (spotName && spot.name === spotName) {
          return {
            ...spot,
            zoneId: zone.id,
            zoneName: zone.name,
            groupId: group.id,
            groupName: group.name,
          };
        }
      }
    }
  }

  return null;
}

function updateSpotStatusInZones(zones, spotId, updates) {
  for (const zone of zones || []) {
    for (const group of getGroups(zone)) {
      for (const spot of group.spots || []) {
        if (spot.id === spotId) {
          Object.assign(spot, updates);
          return true;
        }
      }
    }
  }

  return false;
}

function clearTaskByOrderId(zones, orderId) {
  for (const zone of zones || []) {
    for (const group of getGroups(zone)) {
      for (const spot of group.spots || []) {
        if (spot.orderId === orderId) {
          spot.statusCart = "empty";
          spot.statusWork = "free";

          delete spot.robotId;
          delete spot.cartId;
          delete spot.orderId;

          return spot;
        }
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

function clearTaskByOrderId(zones, orderId) {
  for (const zone of zones || []) {
    for (const group of getGroups(zone)) {
      for (const spot of group.spots || []) {
        if (spot.orderId === orderId) {
          spot.statusCart = "empty";
          spot.statusWork = "free";

          delete spot.robotId;
          delete spot.cartId;
          delete spot.cartName;
          delete spot.orderId;

          return spot;
        }
      }
    }
  }

  return null;
}

router.post("/", async (req, res) => {
  const {
    robotId,
    cartId,
    pickupSpotId,
    dropSpotId,
    pickupSpotName,
    dropSpotName,
  } = req.body || {};

  if (!robotId) {
    return res.status(400).json({ error: "Missing robotId" });
  }

  if (!pickupSpotId && !pickupSpotName) {
    return res
      .status(400)
      .json({ error: "Missing pickupSpotId or pickupSpotName" });
  }

  if (!dropSpotId && !dropSpotName) {
    return res
      .status(400)
      .json({ error: "Missing dropSpotId or dropSpotName" });
  }

  const config = await getConfig();

  const cart = (config.carts || []).find((item) => item.id === cartId);

  if (!cartId) {
    return res.status(400).json({ error: "Missing cartId" });
  }

  if (!cart) {
    return res.status(404).json({ error: "Cart not found" });
  }

  const robot = findRobot(config, robotId);
  if (!robot) {
    return res.status(404).json({ error: "Robot not found" });
  }

  const pickup = findSpotInZones(
    config.pickupZones || [],
    pickupSpotId,
    pickupSpotName,
  );
  const drop = findSpotInZones(
    config.dropZones || [],
    dropSpotId,
    dropSpotName,
  );

  if (!pickup || !drop) {
    return res.status(404).json({ error: "Pickup or drop spot not found" });
  }

  if (!pickup.rcsPosition || !drop.rcsPosition) {
    return res
      .status(400)
      .json({ error: "Pickup or drop rcsPosition is missing" });
  }

  if (
    drop.statusCart === "full" ||
    drop.statusWork === "delivering" ||
    drop.orderId
  ) {
    return res.status(409).json({
      error: "Drop spot is not available",
      drop: {
        id: drop.id,
        name: drop.name,
        statusCart: drop.statusCart,
        cartId: drop.cartId || null,
        statusWork: drop.statusWork,
        orderId: drop.orderId || null,
      },
    });
  }

  const orderId = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
  const rcsBaseUrl = findRcsBaseUrl(config, robot);
  const taskPath = `${pickup.rcsPosition},${drop.rcsPosition}`;

  console.log(
    `[Orders] dispatch robot=${robot.id} orderId=${orderId} taskPath=${taskPath} deviceNum=${robot.deviceNum}`,
  );

  const order = {
    orderId,
    robotId: robot.id,
    robotName: robot.name,
    cartId: cartId || null,
    cartName: cart.name,
    pickup: {
      id: pickup.id,
      name: pickup.name,
      zoneId: pickup.zoneId,
      zoneName: pickup.zoneName,
      groupId: pickup.groupId,
      groupName: pickup.groupName,
      rcsPosition: pickup.rcsPosition,
    },
    drop: {
      id: drop.id,
      name: drop.name,
      zoneId: drop.zoneId,
      zoneName: drop.zoneName,
      groupId: drop.groupId,
      groupName: drop.groupName,
      rcsPosition: drop.rcsPosition,
    },
  };

  let result;

  if (MOCK_RCS) {
    result = {
      ok: true,
      rcsResponse: {
        code: 1000,
        desc: "MOCK MODE",
        data: { orderId },
      },
    };

    const history = await getHistory();
    history.unshift({
      ...order,
      status: "SEND_SUCCESS",
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      rcsResponse: result.rcsResponse,
      note: "Mock order, no RCS call",
    });
    await saveHistory(history);
  } else {
    result = await dispatchOrderImmediate(order, {
      robot,
      startSpot: pickup,
      endSpot: drop,
      rcsBaseUrl,
    });

    if (!result.ok) {
      return res.status(502).json({
        error: result.error || result.rcsResponse?.desc || "RCS send failed",
        orderId,
        status: "SEND_FAILED",
        rcsResponse: result.rcsResponse,
      });
    }
  }

  updateSpotStatusInZones(config.dropZones || [], drop.id, {
    statusCart: "full",
    statusWork: "delivering",
    robotId: robot.id,
    cartId: cartId || null,
    cartName: cart.name || null,
    orderId,
  });

  await saveConfig(config);

  res.json({
    ok: true,
    orderId,
    status: "SEND_SUCCESS",
    rcsResponse: result.rcsResponse,
    queue: getQueueSnapshot(),
  });
});

router.post("/:orderId/clear-task", async (req, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    return res.status(400).json({ error: "orderId is required" });
  }

  const config = await getConfig();
  const clearedSpot = clearTaskByOrderId(config.dropZones || [], orderId);

  if (!clearedSpot) {
    return res.status(404).json({ error: "Task not found by orderId" });
  }

  await saveConfig(config);

  res.json({
    ok: true,
    message: "Task cleared",
    orderId,
    data: clearedSpot,
  });
});

router.patch("/:spotId/status-cart", async (req, res) => {
  const { spotId } = req.params;
  const { statusCart } = req.body || {};

  if (!["empty", "full"].includes(statusCart)) {
    return res.status(400).json({
      error: "statusCart must be empty or full",
    });
  }

  const config = await getConfig();

  let updatedSpot = null;

  for (const zone of config.dropZones || []) {
    const groups = zone.groups || zone.group || [];

    for (const group of groups) {
      for (const spot of group.spots || []) {
        if (spot.id === spotId) {
          spot.statusCart = statusCart;
          updatedSpot = spot;
          break;
        }
      }
    }
  }

  if (!updatedSpot) {
    return res.status(404).json({
      error: "Spot not found",
    });
  }

  await saveConfig(config);

  res.json({
    ok: true,
    data: updatedSpot,
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
    note: "Cancelled (stub)",
  };

  await saveHistory(history);
  res.json({ ok: true });
});

module.exports = router;
