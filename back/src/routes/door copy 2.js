const express = require("express");
const ioDoorBoard = require("../services/ioDoorBoard");
const { clearOutputs } = require("../services/ioLift");
const { clearOutputs2 } = require("../services/ioLift2");

const IDLE_CLOSE_MS = 10000;
const POLL_INTERVAL_MS = 3000;

/** doorCode ใน data ของ getstatus */
const DOOR1_CODE = "MJ01";
const DOOR2_CODE = "MJ02";
const DOOR3_CODE = "MJ03";

function createSession(doorCode) {
  return {
    doorCode,
    // ตาม manual 3.2.4: 1=เปิดสุด (开门到位), 2=ปิดสุด (关门到位), 0=กำลังเปิด/ปิด
    // ไม่มี DI feedback → infer จาก output relay: ON=1, OFF=2 (ไม่ใช้ค่า 0)
    currentStatus: 2,
    idleTimer: null
  };
}

const door1 = createSession(DOOR1_CODE);
const door2 = createSession(DOOR2_CODE);
const door3 = createSession(DOOR3_CODE);

// ─── background poll: อ่าน output จริงจากบอร์ด sync กับ memory ─────────
// - กันปัญหา state ใน memory ไม่ตรงกับ relay จริง (restart, I/O fail, manual override)
// - ใช้ lastDoorWriteAt กัน race: ถ้ามี write เกิดระหว่างอ่าน → ข้าม ไม่ทับ state ที่ command เพิ่ง set
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

function scheduleIdleClose(session, channelToOff) {
  if (session.idleTimer) {
    clearTimeout(session.idleTimer);
  }
  session.idleTimer = setTimeout(async () => {
    session.idleTimer = null;
    session.currentStatus = 2;
    try {
      await ioDoorBoard.setOutputChannel(channelToOff, false);
      lastDoorWriteAt = Date.now();
    } catch (err) {
      console.error(`[Door] idle off ch${channelToOff} failed:`, err.message);
    }
  }, IDLE_CLOSE_MS);
}

function mapDoorActionFromStatus(statusRaw) {
  const st = Number(statusRaw);
  // ตาม manual 3.2.3: 1=请求开门 (ขอเปิด), 2=请求关门 (ขอปิด)
  if (st === 1) return "open";
  if (st === 2) return "close";
  return null;
}

async function handleDoorByStatus(req, res, session, applyPattern, channelToOff) {
  const body = req.body || {};
  const action = mapDoorActionFromStatus(body.status);
  console.log(
    `[Door] RCS command ${req.method} ${req.originalUrl} status=${body.status} action=${action} body=${JSON.stringify(body)}`
  );

  if (action === null) {
    return res.status(400).json({
      code: 1001,
      desc: "invalid status (expect 1=open, 2=close)",
      data: {}
    });
  }

  scheduleIdleClose(session, channelToOff);

  if (action === "close") {
    if (session.currentStatus === 2) {
      return res.status(200).json({ code: 1000, desc: "ok close (duplicate ignored)", data: {} });
    }
    try {
      await ioDoorBoard.setOutputChannel(channelToOff, false);
      lastDoorWriteAt = Date.now();
      session.currentStatus = 2;
      return res.status(200).json({ code: 1000, desc: "ok close", data: {} });
    } catch (err) {
      console.error("[Door] hardware error:", err.message);
      return res.status(503).json({ code: 1002, desc: err.message || "door board error", data: {} });
    }
  }

  // action=open
  if (session.currentStatus === 1) {
    return res.status(200).json({ code: 1000, desc: "ok open (duplicate ignored)", data: {} });
  }
  try {
    await applyPattern();
    lastDoorWriteAt = Date.now();
    session.currentStatus = 1;
    return res.status(200).json({ code: 1000, desc: "ok open", data: {} });
  } catch (err) {
    console.error("[Door] hardware error:", err.message);
    return res.status(503).json({ code: 1002, desc: err.message || "door board error", data: {} });
  }
}

const doorRouter = express.Router();

// ประตู 1 → บอร์ด 103: Output1 on, Output2 off (idle ปิด O1)
doorRouter.post("/controldoor1", (req, res) => {
  return handleDoorByStatus(req, res, door1, () => ioDoorBoard.applyDoor1Pattern(), 1);
});

// ประตู 2 → บอร์ด 103: Output2 on, Output1 off (idle ปิด O2)
doorRouter.post("/controldoor2", (req, res) => {
  return handleDoorByStatus(req, res, door2, () => ioDoorBoard.applyDoor2Pattern(), 2);
});

// ประตู 3 → บอร์ด 103: Output3 on, O1/O2 off (idle ปิด O3)
doorRouter.post("/controldoor3", (req, res) => {
  return handleDoorByStatus(req, res, door3, () => ioDoorBoard.applyDoor3Pattern(), 3);
});

doorRouter.post("/getstatus1", (req, res) => {
  console.log('Door1 Get Status');
  res.json(buildStatusBody(door1));
});

doorRouter.get("/getstatus1", (req, res) => {
  console.log('Door1 Get Status');
  res.json(buildStatusBody(door1));
});

doorRouter.post("/getstatus2", (req, res) => {
  console.log('Door2 Get Status');
  res.json(buildStatusBody(door2));
});
doorRouter.get("/getstatus2", (req, res) => {
  console.log('Door2 Get Status');
  res.json(buildStatusBody(door2));
});

doorRouter.post("/getstatus3", (req, res) => {
  console.log('Door3 Get Status');
  res.json(buildStatusBody(door3));
});
doorRouter.get("/getstatus3", (req, res) => {
  console.log('Door3 Get Status');
  res.json(buildStatusBody(door3));
});

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
    door1.currentStatus = 2;
    door2.currentStatus = 2;
    door3.currentStatus = 2;
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
    // ถ้ามี write เกิดขึ้นระหว่างเราอ่าน → poll อาจเห็น state เก่า ข้ามไป
    // (command handler set currentStatus ไปแล้ว ไม่ต้องให้ poll มาทับ)
    if (lastDoorWriteAt > pollStartAt) return;

    // manual 3.2.4: 1=เปิดสุด, 2=ปิดสุด — infer จาก output relay (ไม่มี DI feedback)
    const newStatus1 = status.outputs[0] ? 1 : 2;
    const newStatus2 = status.outputs[1] ? 1 : 2;
    const newStatus3 = status.outputs[2] ? 1 : 2;

    if (door1.currentStatus !== newStatus1) {
      console.log(`[Door] drift MJ01: memory=${door1.currentStatus} → hardware=${newStatus1}`);
      door1.currentStatus = newStatus1;
    }
    if (door2.currentStatus !== newStatus2) {
      console.log(`[Door] drift MJ02: memory=${door2.currentStatus} → hardware=${newStatus2}`);
      door2.currentStatus = newStatus2;
    }
    if (door3.currentStatus !== newStatus3) {
      console.log(`[Door] drift MJ03: memory=${door3.currentStatus} → hardware=${newStatus3}`);
      door3.currentStatus = newStatus3;
    }
  } catch (err) {
    console.error("[Door] poll error:", err.message);
    // ไม่แก้ state เดิม — RCS ได้ค่าล่าสุดที่เคยอ่านได้
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
