const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const configRoutes = require("./routes/config");
const ordersRoutes = require("./routes/orders");
const statusRoutes = require("./routes/status");
const liftRoutes = require("./routes/lift");
const zoneRoutes = require("./routes/zones");
const { registerDoorRoutes } = require("./routes/door");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/config", configRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/lift", liftRoutes);
app.use("/api/zones", zoneRoutes);
registerDoorRoutes(app);

const server = app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});

function shutdown(signal) {
  console.log(`\nShutting down (${signal})...`);
  const forceExit = setTimeout(() => {
    console.error("Force exit (connections did not close in time).");
    process.exit(0);
  }, 3000);

  // ปิด socket ที่ค้างทันที (เช่น browser เปิดค้าง / keep-alive) — Node 18.2+
  if (typeof server.closeAllConnections === "function") {
    server.closeAllConnections();
  }

  server.close((err) => {
    clearTimeout(forceExit);
    if (err) console.error("Server close error:", err);
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
