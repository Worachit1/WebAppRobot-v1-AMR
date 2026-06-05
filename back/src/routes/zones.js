const express = require("express");
const { getConfig } = require("../services/store");

const router = express.Router();

function normalizeZones(zones = []) {
  return zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    groups: (zone.groups || zone.group || []).map((group) => ({
      id: group.id,
      name: group.name,
      spots: (group.spots || []).map((spot) => ({
        id: spot.id,
        name: spot.name,
        statusClass: spot.statusClass || "empty",
        rcsPosition: spot.rcsPosition,
      })),
    })),
  }));
}

// GET /zones/get/groups
router.get("/get/groups", async (req, res) => {
  const config = await getConfig();

  const zones = normalizeZones(config.pickupZones || []);

  res.json({
    ok: true,
    data: zones,
  });
});

// GET /zones/get/drop
router.get("/get/drops", async (req, res) => {
  const config = await getConfig();

  const zones = normalizeZones(config.dropZones || []);

  res.json({
    ok: true,
    data: zones,
  });
});

// GET /zones
router.get("/", async (req, res) => {
  const config = await getConfig();

  res.json({
    ok: true,
    data: {
      pickupZones: normalizeZones(config.pickupZones || []),
      dropZones: normalizeZones(config.dropZones || []),
    },
  });
});

module.exports = router;