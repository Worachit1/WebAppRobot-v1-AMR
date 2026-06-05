const express = require("express");
const ioDoorBoard = require("../services/ioDoorBoard");
const { clearOutputs } = require("../services/ioLift");
const { clearOutputs2 } = require("../services/ioLift2");

/** controldoor1|2|3 ใช้ค่าชุดเดียวกัน */
const OPEN_WINDOW_MS = 5000;
const IDLE_CLOSE_MS = 10000;

/** doorCode ใน data ของ getstatus */
const DOOR1_CODE = "MJ01";
const DOOR2_CODE = "MJ02";
const DOOR3_CODE = "MJ03";

/**
 * status ใน data (สตริง):
 * "0" = ปิด/idle (ไม่มีรอบเปิดค้าง)
 * "1" = กำลังเปิด / ยังไม่ครบ 5 วินาที (not open yet)
 * "2" = เปิดพร้อมแล้ว (หลัง 5 วินาทีจากครั้งแรกของรอบ)
 */
function createSession(doorCode) {
  return {
    doorCode,
    firstPostAt: null,
    idleTimer: null
  };
}

const door1 = createSession(DOOR1_CODE);
const door2 = createSession(DOOR2_CODE);
const door3 = createSession(DOOR3_CODE);

function clearSessionTimers(s) {
  if (s.idleTimer) {
    clearTimeout(s.idleTimer);
    s.idleTimer = null;
  }
  s.firstPostAt = null;
}

function scheduleIdleClose(session, channelToOff) {
  if (session.idleTimer) {
    clearTimeout(session.idleTimer);
  }
  session.idleTimer = setTimeout(async () => {
    session.idleTimer = null;
    try {
      await ioDoorBoard.setOutputChannel(channelToOff, false);
    } catch (err) {
      console.error(`[Door] idle off ch${channelToOff} failed:`, err.message);
    }
    session.firstPostAt = null;
  }, IDLE_CLOSE_MS);
}

function buildStatusBody(session) {
  if (!session.firstPostAt) {
    return {
      code: 1000,
      desc: "success",
      data: {
        doorCode: session.doorCode,
        status: 1
      }
    };
  }
  const elapsed = Date.now() - session.firstPostAt;
  if (elapsed < OPEN_WINDOW_MS) {
    return {
      code: 1000,
      desc: "success",
      data: {
        doorCode: session.doorCode,
        status: 1
      }
    };
  }
  return {
    code: 1000,
    desc: "success",
    data: {
      doorCode: session.doorCode,
      status: 2
    }
  };
}

/** กฎเดียวกันทุกประตู: ครั้งแรก + ภายใน 5 วิ → 400; หลัง 5 วิ → 200; idle 10 วิ → ปิด output ที่เกี่ยวข้อง */
async function handleControlDoor(req, res, session, applyPattern, channelToOff) {
  try {
    const now = Date.now();

    if (session.firstPostAt == null) {
      await applyPattern();
      session.firstPostAt = now;
      scheduleIdleClose(session, channelToOff);
      return res.status(400).json({ error: "not open yet" });
    }

    scheduleIdleClose(session, channelToOff);

    const elapsed = now - session.firstPostAt;
    if (elapsed < OPEN_WINDOW_MS) {
      return res.status(400).json({ error: "not open yet" });
    }

    return res.status(200).json({ message: "ok open finish" });
  } catch (err) {
    console.error("[Door] hardware error:", err.message);
    return res.status(503).json({ error: err.message || "door board error" });
  }
}

const doorRouter = express.Router();

// ประตู 1 → บอร์ด 103: Output1 on, Output2 off (idle ปิด O1)
doorRouter.post("/controldoor1", (req, res) =>
  handleControlDoor(req, res, door1, () => ioDoorBoard.applyDoor1Pattern(), 1)
);

// ประตู 2 → บอร์ด 103: Output2 on, Output1 off (idle ปิด O2)
doorRouter.post("/controldoor2", (req, res) =>
  handleControlDoor(req, res, door2, () => ioDoorBoard.applyDoor2Pattern(), 2)
);

// ประตู 3 → บอร์ด 103: Output3 on, O1/O2 off (idle ปิด O3)
doorRouter.post("/controldoor3", (req, res) =>
  handleControlDoor(req, res, door3, () => ioDoorBoard.applyDoor3Pattern(), 3)
);

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
  clearSessionTimers(door1);
  clearSessionTimers(door2);
  clearSessionTimers(door3);
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
    results.door = "ok";
  } catch (e) {
    results.door = e.message;
  }
  const allOk = results.lift1 === "ok" && results.lift2 === "ok" && results.door === "ok";
  res.json({ ok: allOk, results });
});

function registerDoorRoutes(app) {
  app.use("/door", doorRouter);
  app.use("/api/test", testRouter);
}

module.exports = { registerDoorRoutes };
