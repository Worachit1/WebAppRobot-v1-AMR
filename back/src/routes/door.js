const fs = require("fs");
const path = require("path");
const express = require("express");
const ioDoorBoard = require("../services/ioDoorBoard");
const { clearOutputs } = require("../services/ioLift");
const { clearOutputs2 } = require("../services/ioLift2");

const POLL_INTERVAL_MS = 3000;

/** doorCode ใน data ของ getstatus */
const DOOR1_CODE = "MJ01";
const DOOR2_CODE = "MJ02";
const DOOR3_CODE = "MJ03";

// ─── file loggers (แยก control ↔ status) ────────────────────────────────
const LOG_DIR = path.join(__dirname, "..", "..", "logs");
const CONTROL_LOG = path.join(LOG_DIR, "door-control.log");
const STATUS_LOG = path.join(LOG_DIR, "door-status.log");

try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (_) {}

function writeLog(file, ...args) {
  const text = args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ");
  const line = `[${new Date().toISOString()}] ${text}\n`;
  process.stdout.write(line);
  try {
    fs.appendFileSync(file, line);
  } catch (_) {
    /* never let logging crash a request */
  }
}

const controlLog = (...args) => writeLog(CONTROL_LOG, ...args);
const statusLog = (...args) => writeLog(STATUS_LOG, ...args);

function createSession(doorCode) {
  return {
    doorCode,
    // manual 3.2.4: 1=เปิดสุด, 2=ปิดสุด (ไม่ใช้ค่า 0 — ไม่มี DI feedback)
    currentStatus: 2
  };
}

const door1 = createSession(DOOR1_CODE);
const door2 = createSession(DOOR2_CODE);
const door3 = createSession(DOOR3_CODE);

/** เปลี่ยน session.currentStatus — log เฉพาะตอนค่าเปลี่ยนจริง */
function setSessionStatus(session, newStatus, source) {
  if (session.currentStatus === newStatus) return;
  statusLog(
    `[Door] ${session.doorCode} status: ${session.currentStatus} → ${newStatus} (${source})`
  );
  session.currentStatus = newStatus;
}

// ─── background poll: อ่าน output จริงจากบอร์ด sync กับ memory ─────────
let doorPollInFlight = false;
let lastDoorWriteAt = 0;

function buildStatusBody(session) {
  return {
    code: 1000,
    desc: "success",
    data: {
      doorCode: session.doorCode,
      status: session.currentStatus
    }
  };
}

function mapDoorActionFromStatus(statusRaw) {
  const st = Number(statusRaw);
  // manual 3.2.3: 1=请求开门, 2=请求关门
  if (st === 1) return "open";
  if (st === 2) return "close";
  return null;
}

async function handleDoorByStatus(req, res, session, applyPattern, channelToOff) {
  const body = req.body || {};
  const action = mapDoorActionFromStatus(body.status);

  if (action === null) {
    controlLog(
      `[Door] RCS ${req.method} ${req.originalUrl} INVALID status=${body.status} body=${JSON.stringify(body)}`
    );
    return res.status(400).json({
      code: 1001,
      desc: "invalid status (expect 1=open, 2=close)",
      data: {}
    });
  }

  const requestedStatus = action === "open" ? 1 : 2;
  const isDuplicate = session.currentStatus === requestedStatus;

  // duplicate (สั่ง status เดิม) → ตอบ ok แต่ไม่ log + ไม่ยิง I/O
  if (isDuplicate) {
    return res.status(200).json({
      code: 1000,
      desc: `ok ${action} (duplicate ignored)`,
      data: {}
    });
  }

  // คำสั่งใหม่ — log
  controlLog(
    `[Door] RCS ${req.method} ${req.originalUrl} status=${body.status} action=${action} body=${JSON.stringify(body)}`
  );

  if (action === "close") {
    try {
      await ioDoorBoard.setOutputChannel(channelToOff, false);
      lastDoorWriteAt = Date.now();
      controlLog(`[Door] I/O write close ${session.doorCode} ch${channelToOff}=OFF`);
      setSessionStatus(session, 2, "close command");
      const resp = { code: 1000, desc: "ok close", data: {} };
      controlLog(`[Door] resp 200 ${session.doorCode}`, resp);
      return res.status(200).json(resp);
    } catch (err) {
      controlLog(`[Door] hardware error ${session.doorCode}:`, err.message);
      return res.status(503).json({ code: 1002, desc: err.message || "door board error", data: {} });
    }
  }

  // action === "open"
  try {
    await applyPattern();
    lastDoorWriteAt = Date.now();
    controlLog(`[Door] I/O write open ${session.doorCode} ch${channelToOff}=ON`);
    setSessionStatus(session, 1, "open command");
    const resp = { code: 1000, desc: "ok open", data: {} };
    controlLog(`[Door] resp 200 ${session.doorCode}`, resp);
    return res.status(200).json(resp);
  } catch (err) {
    controlLog(`[Door] hardware error ${session.doorCode}:`, err.message);
    return res.status(503).json({ code: 1002, desc: err.message || "door board error", data: {} });
  }
}

const doorRouter = express.Router();

// ทุกประตูอิสระ: เปิด = O ของช่องตัวเอง ON, ปิด = OFF (ไม่แตะช่องอื่น)
doorRouter.post("/controldoor1", (req, res) => {
  return handleDoorByStatus(req, res, door1, () => ioDoorBoard.applyDoor1Pattern(), 1);
});
doorRouter.post("/controldoor2", (req, res) => {
  return handleDoorByStatus(req, res, door2, () => ioDoorBoard.applyDoor2Pattern(), 2);
});
doorRouter.post("/controldoor3", (req, res) => {
  return handleDoorByStatus(req, res, door3, () => ioDoorBoard.applyDoor3Pattern(), 3);
});

// getstatus — ไม่ log ที่นี่ (status log เก็บเฉพาะตอน status เปลี่ยนจาก setSessionStatus)
doorRouter.post("/getstatus1", (req, res) => res.json(buildStatusBody(door1)));
doorRouter.get("/getstatus1", (req, res) => res.json(buildStatusBody(door1)));
doorRouter.post("/getstatus2", (req, res) => res.json(buildStatusBody(door2)));
doorRouter.get("/getstatus2", (req, res) => res.json(buildStatusBody(door2)));
doorRouter.post("/getstatus3", (req, res) => res.json(buildStatusBody(door3)));
doorRouter.get("/getstatus3", (req, res) => res.json(buildStatusBody(door3)));

const testRouter = express.Router();
testRouter.post("/clear-all-outputs", async (req, res) => {
  const results = { lift1: null, lift2: null, door: null };
  try {
    await clearOutputs();
    results.lift1 = "ok";
  } catch (e) {
    results.lift1 = e.message;
  }
  try {
    await clearOutputs2();
    results.lift2 = "ok";
  } catch (e) {
    results.lift2 = e.message;
  }
  try {
    await ioDoorBoard.clearAllOutputs();
    lastDoorWriteAt = Date.now();
    controlLog(`[Door] clear-all-outputs`);
    setSessionStatus(door1, 2, "clear-all-outputs");
    setSessionStatus(door2, 2, "clear-all-outputs");
    setSessionStatus(door3, 2, "clear-all-outputs");
    results.door = "ok";
  } catch (e) {
    results.door = e.message;
  }
  const allOk = results.lift1 === "ok" && results.lift2 === "ok" && results.door === "ok";
  res.json({ ok: allOk, results });
});

async function pollDoors() {
  if (doorPollInFlight) return;
  doorPollInFlight = true;
  const pollStartAt = Date.now();
  try {
    const status = await ioDoorBoard.readDoorBoardStatus();
    if (lastDoorWriteAt > pollStartAt) return;

    // 1=เปิดสุด, 2=ปิดสุด — infer จาก output relay (ไม่มี DI feedback)
    const newStatus1 = status.outputs[0] ? 1 : 2;
    const newStatus2 = status.outputs[1] ? 1 : 2;
    const newStatus3 = status.outputs[2] ? 1 : 2;

    if (door1.currentStatus !== newStatus1) {
      controlLog(`[Door] drift MJ01: memory=${door1.currentStatus} → hardware=${newStatus1}`);
      setSessionStatus(door1, newStatus1, "drift sync from hardware");
    }
    if (door2.currentStatus !== newStatus2) {
      controlLog(`[Door] drift MJ02: memory=${door2.currentStatus} → hardware=${newStatus2}`);
      setSessionStatus(door2, newStatus2, "drift sync from hardware");
    }
    if (door3.currentStatus !== newStatus3) {
      controlLog(`[Door] drift MJ03: memory=${door3.currentStatus} → hardware=${newStatus3}`);
      setSessionStatus(door3, newStatus3, "drift sync from hardware");
    }
  } catch (err) {
    controlLog(`[Door] poll error:`, err.message);
  } finally {
    doorPollInFlight = false;
  }
}

setInterval(pollDoors, POLL_INTERVAL_MS);
pollDoors();

function registerDoorRoutes(app) {
  app.use("/door", doorRouter);
  app.use("/api/test", testRouter);
}

module.exports = { registerDoorRoutes };
