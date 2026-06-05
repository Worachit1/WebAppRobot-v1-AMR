const express = require("express");
const { getConfig, saveConfig } = require("../services/store");

const router = express.Router();

router.get("/", async (req, res) => {
  const config = await getConfig();
  res.json(config);
});

router.put("/", async (req, res) => {
  const nextConfig = req.body || {};
  await saveConfig(nextConfig);
  res.json({ ok: true });
});

module.exports = router;
