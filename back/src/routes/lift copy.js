const express = require("express");
const { readLiftStatus, controlLift, clearOutputs } = require("../services/ioLift");
const { readLift2Status, controlLift2, clearOutputs2 } = require("../services/ioLift2");

const router = express.Router();
const LIFT_NUM = "DT01";
const LIFT2_NUM = "DT02";

// สีใน console: แดง = สิ่งที่ RCS ส่งมา/ถามมา, เขียว = สิ่งที่เราตอบกลับ
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

// Pulse สำหรับคำสั่ง "ไปชั้น" — ส่งสัญญาณแล้วเคลียร์ ไม่ให้ output ค้าง
const FLOOR_PULSE_MS = 800;
// ถ้าไม่มีคำสั่งใหม่จาก RCS เกินเวลานี้ ขณะ hold ประตูไว้ จะปิดประตูอัตโนมัติ
const RCS_IDLE_CLOSE_MS = 5000;
// หน่วงก่อนปิดประตูเมื่อ RCS สั่งปิด (รอ AGV ออก)
const DELAYED_CLOSE_MS = 10000;
let rcsIdleCloseTimer = null;
let delayedCloseTimer = null;

// สถานะประตูที่ RCS ใช้: 0=开门到位(เปิด到位), 1=非开门到位(ปิด), 5=异常(ผิดปกติ), 6=离线(ออฟไลน์)
const DOOR_STATUS = { OPEN: 0, CLOSED: 1, ABNORMAL: 5, OFFLINE: 6 };

// ใช้ตอนตอบ RCS (GET /status, POST /command): data.status ตามค่าด้านบน
function buildRcsLiftData(liftStatus, doorStatusOverride = null, ioStatus = null) {
  let status = doorStatusOverride;
  let currentFloor = 0;
  if (status == null && liftStatus) {
    const doorOpen = !!liftStatus.doorOpen;
    status = doorOpen ? DOOR_STATUS.OPEN : DOOR_STATUS.CLOSED;
    if (liftStatus.atFL1) currentFloor = 1;
    else if (liftStatus.atFL2) currentFloor = 2;
  }
  if (status == null) status = DOOR_STATUS.ABNORMAL;
  const data = {
    liftNum: LIFT_NUM,
    status,
    currentFloor,
    agvModel: 0
  };
  if (ioStatus) {
    data.rawBits = ioStatus.rawBits;
    data.outputs = ioStatus.outputs;
    data.inputs = ioStatus.inputs;
  }
  return data;
}

// ใช้ตอนตอบ RCS ของ DT02 (GET/POST /status2, POST /command2)
function buildRcsLift2Data(liftStatus, doorStatusOverride = null, ioStatus = null) {
  let status = doorStatusOverride;
  let currentFloor = 0;
  if (status == null && liftStatus) {
    const doorOpen = !!liftStatus.doorOpen;
    status = doorOpen ? DOOR_STATUS.OPEN : DOOR_STATUS.CLOSED;
    if (liftStatus.atFL1) currentFloor = 1;
    else if (liftStatus.atFL2) currentFloor = 2;
    else if (liftStatus.atFL3) currentFloor = 3;
  }
  if (status == null) status = DOOR_STATUS.ABNORMAL;
  const data = {
    liftNum: LIFT2_NUM,
    status,
    currentFloor,
    agvModel: 0
  };
  if (ioStatus) {
    data.rawBits = ioStatus.rawBits;
    data.outputs = ioStatus.outputs;
    data.inputs = ioStatus.inputs;
  }
  return data;
}

function rcsSuccess(data) {
  return { code: 1000, desc: "success", data };
}

function rcsError(code, desc, data = null) {
  return { code: code || 1001, desc: desc || "error", data };
}

/** สำหรับ console.log เท่านั้น — ไม่แสดง rawBits/outputs/inputs */
function rcsBodyForLog(body) {
  if (!body || typeof body !== "object") return body;
  const copy = JSON.parse(JSON.stringify(body));
  if (copy.data && typeof copy.data === "object") {
    const { rawBits, outputs, inputs, ...rest } = copy.data;
    copy.data = rest;
  }
  return copy;
}

function clearIdleCloseTimer() {
  if (rcsIdleCloseTimer) {
    clearTimeout(rcsIdleCloseTimer);
    rcsIdleCloseTimer = null;
  }
}

function clearDelayedCloseTimer() {
  if (delayedCloseTimer) {
    clearTimeout(delayedCloseTimer);
    delayedCloseTimer = null;
  }
}

function scheduleIdleDoorClose() {
  clearIdleCloseTimer();
  rcsIdleCloseTimer = setTimeout(async () => {
    try {
      await clearOutputs();
      console.log("[Lift] Auto close door: no RCS command for 5s");
    } catch (err) {
      console.log("[Lift] Auto close door error:", err.message);
    }
  }, RCS_IDLE_CLOSE_MS);
}

function scheduleDelayedDoorClose() {
  clearDelayedCloseTimer();
  delayedCloseTimer = setTimeout(async () => {
    try {
      await clearOutputs();
      console.log(GREEN + "[Lift] ปิดประตูแล้ว (หน่วง 10 วินาที)" + RESET);
    } catch (err) {
      console.log("[Lift] Delayed close error:", err.message);
    }
    delayedCloseTimer = null;
  }, DELAYED_CLOSE_MS);
}

// handler ร่วมสำหรับถามสถานะลิฟต์ (RCS เรียกได้ทั้ง GET และ POST)
async function handleStatus(req, res) {
  const method = req.method;
  console.log(RED + "[Lift] RCS ถาม status มา (" + method + " /status)" + RESET);
  try {
    const status = await readLiftStatus();
    const liftInfo = { atFL1: status.atFL1, atFL2: status.atFL2, doorOpen: status.doorOpen, currentFloor: status.currentFloor };
    const data = buildRcsLiftData(liftInfo, null, status);
    const body = rcsSuccess(data);
    console.log(GREEN + "[Lift] Body ที่ตอบกลับไป (" + method + " /status): " + JSON.stringify(rcsBodyForLog(body), null, 2) + RESET);
    res.json(body);
  } catch (err) {
    const isOffline = err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT" || err.code === "ENOTFOUND";
    const data = buildRcsLiftData(null, isOffline ? DOOR_STATUS.OFFLINE : DOOR_STATUS.ABNORMAL);
    const body = rcsSuccess(data);
    console.log(GREEN + "[Lift] Body ที่ตอบกลับไป (" + method + " /status error): " + JSON.stringify(rcsBodyForLog(body), null, 2) + RESET);
    res.json(body);
  }
}

// GET /api/lift/status (รองรับไว้)
router.get("/status", handleStatus);

// POST /api/lift/status — RCS ถามสถานะลิฟต์ด้วย POST
router.post("/status", handleStatus);

async function handleStatus2(req, res) {
  const method = req.method;
  console.log(RED + "[Lift2] RCS ถาม status มา (" + method + " /status2)" + RESET);
  try {
    const status = await readLift2Status();
    const liftInfo = {
      atFL1: status.atFL1,
      atFL2: status.atFL2,
      atFL3: status.atFL3,
      doorOpen: status.doorOpen,
      currentFloor: status.currentFloor
    };
    const data = buildRcsLift2Data(liftInfo, null, status);
    const body = rcsSuccess(data);
    console.log(GREEN + "[Lift2] Body ที่ตอบกลับไป (" + method + " /status2): " + JSON.stringify(rcsBodyForLog(body), null, 2) + RESET);
    res.json(body);
  } catch (err) {
    const isOffline = err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT" || err.code === "ENOTFOUND";
    const data = buildRcsLift2Data(null, isOffline ? DOOR_STATUS.OFFLINE : DOOR_STATUS.ABNORMAL);
    const body = rcsSuccess(data);
    console.log(GREEN + "[Lift2] Body ที่ตอบกลับไป (" + method + " /status2 error): " + JSON.stringify(rcsBodyForLog(body), null, 2) + RESET);
    res.json(body);
  }
}

router.get("/status2", handleStatus2);
router.post("/status2", handleStatus2);

// POST /api/lift/command
// ตัวอย่าง body:
//   { "command": "TO_FL1" }       — pulse แล้วเคลียร์ (ไม่ค้าง)
//   { "command": "TO_FL2" }       — pulse แล้วเคลียร์ (ไม่ค้าง)
//   { "command": "OPEN_DOOR" }    — ค้าง รอ AGV เข้า/ออก
//   { "command": "CLOSE_DOOR" }   — เคลียร์ output ทั้งหมด (ปิดประตู)
//   { "command": "MOVE_AND_OPEN", "floor": 1 } — ไปชั้น + เปิดประตู (ค้าง)
// รูปแบบที่ RCS ส่งมา: { targetFloor?, liftNum, status } หรือ { agvMode, liftNum, status } (ไม่มีชั้น = ปิดประตูอย่างเดียว)
// สถานะประตูที่ RCS สั่ง: 0=开门到位(เปิด), 1=非开门到位(ปิด), 5=异常, 6=离线
function mapRcsBodyToCommand(body) {
  const { targetFloor, status } = body;
  const st = Number(status);
  const hasTargetFloor = targetFloor !== undefined && targetFloor !== null && targetFloor !== "";
  // 0 = เปิดประตู
  if (st === DOOR_STATUS.OPEN) {
    if (targetFloor === 1 || targetFloor === "1") return { command: "MOVE_AND_OPEN", floor: 1 };
    if (targetFloor === 2 || targetFloor === "2") return { command: "MOVE_AND_OPEN", floor: 2 };
    return { command: "OPEN_DOOR", floor: null };
  }
  // 1 = ปิดประตู: มีชั้น = ปิดแล้วไปชั้นนั้น (AGV เข้าแล้ว), ไม่มีชั้น = ปิดทันที (AGV ออกแล้ว)
  if (st === DOOR_STATUS.CLOSED) {
    if (hasTargetFloor && (targetFloor === 1 || targetFloor === "1")) return { command: "CLOSE_AND_GO", floor: 1 };
    if (hasTargetFloor && (targetFloor === 2 || targetFloor === "2")) return { command: "CLOSE_AND_GO", floor: 2 };
    return { command: "CLOSE_DOOR_NOW", floor: null };
  }
  if (st === 2) {
    if (targetFloor === 1 || targetFloor === "1") return { command: "MOVE_AND_OPEN", floor: 1 };
    if (targetFloor === 2 || targetFloor === "2") return { command: "MOVE_AND_OPEN", floor: 2 };
    return { command: "OPEN_DOOR", floor: null };
  }
  if (st === 3) return { command: "CLOSE_DOOR_NOW", floor: null };
  if (st === 1 && (targetFloor === 1 || targetFloor === "1")) return { command: "MOVE_AND_OPEN", floor: 1 };
  if (st === 1 && (targetFloor === 2 || targetFloor === "2")) return { command: "MOVE_AND_OPEN", floor: 2 };
  if (targetFloor === 1 || targetFloor === "1") return { command: "TO_FL1", floor: 1 };
  if (targetFloor === 2 || targetFloor === "2") return { command: "TO_FL2", floor: 2 };
  return null;
}

function mapRcsBodyToCommand2(body) {
  const { targetFloor, status } = body;
  const st = Number(status);
  const hasTargetFloor = targetFloor !== undefined && targetFloor !== null && targetFloor !== "";
  if (st === DOOR_STATUS.OPEN) {
    if (targetFloor === 1 || targetFloor === "1") return { command: "MOVE_AND_OPEN", floor: 1 };
    if (targetFloor === 2 || targetFloor === "2") return { command: "MOVE_AND_OPEN", floor: 2 };
    if (targetFloor === 3 || targetFloor === "3") return { command: "MOVE_AND_OPEN", floor: 3 };
    return { command: "OPEN_DOOR", floor: null };
  }
  if (st === DOOR_STATUS.CLOSED) {
    if (hasTargetFloor && (targetFloor === 1 || targetFloor === "1")) return { command: "CLOSE_AND_GO", floor: 1 };
    if (hasTargetFloor && (targetFloor === 2 || targetFloor === "2")) return { command: "CLOSE_AND_GO", floor: 2 };
    if (hasTargetFloor && (targetFloor === 3 || targetFloor === "3")) return { command: "CLOSE_AND_GO", floor: 3 };
    return { command: "CLOSE_DOOR_NOW", floor: null };
  }
  if (targetFloor === 1 || targetFloor === "1") return { command: "TO_FL1", floor: 1 };
  if (targetFloor === 2 || targetFloor === "2") return { command: "TO_FL2", floor: 2 };
  if (targetFloor === 3 || targetFloor === "3") return { command: "TO_FL3", floor: 3 };
  return null;
}

router.post("/command", async (req, res) => {
  const body = req.body || {};
  let command = body.command ?? body.cmd;
  let floor = body.floor;
  console.log(RED + "[Lift] Body ที่รับมา (POST /command): " + JSON.stringify(body, null, 2) + RESET);
  if (body.command !== undefined || body.cmd !== undefined) {
    console.log(RED + "[Lift] command (POST /command): " + (body.command ?? body.cmd) + RESET);
  }
  if (body.status !== undefined) {
    console.log(RED + "[Lift] status (POST /command): " + body.status + RESET);
  }

  if ((command == null || command === "") && (body.targetFloor != null || body.status != null)) {
    const mapped = mapRcsBodyToCommand(body);
    if (mapped) {
      command = mapped.command;
      floor = mapped.floor;
    }
  }

  if (command == null || command === "") {
    return res.status(400).json(rcsError(1001, "Missing command. Send JSON: { \"command\": \"...\" } or RCS format: { \"targetFloor\": 1|2, \"liftNum\": \"DT01\", \"status\": 1 } (status 2=open door, 3=close door)"));
  }

  let toFloor = null;
  let openDoor = false;
  let pulseMs = null; // null = ไม่ pulse (ค้าง). ใช้กับ OPEN_DOOR / MOVE_AND_OPEN
  let doClearOnly = false;

  let closeNowOnly = false;   // ปิดประตูทันที (output = off) ไม่หน่วง
  let closeAndGo = false;    // ปิดประตูทันที แล้วไปชั้นที่สั่ง (AGV เข้าแล้ว)

  switch (String(command).toUpperCase()) {
    case "TO_FL1":
      toFloor = "FL1";
      pulseMs = FLOOR_PULSE_MS;
      break;
    case "TO_FL2":
      toFloor = "FL2";
      pulseMs = FLOOR_PULSE_MS;
      break;
    case "OPEN_DOOR":
      openDoor = true;
      break;
    case "CLOSE_DOOR":
      doClearOnly = true;
      break;
    case "CLOSE_DOOR_NOW":
      closeNowOnly = true;
      break;
    case "CLOSE_AND_GO": {
      closeAndGo = true;
      if (floor === 1 || floor === "FL1") toFloor = "FL1";
      else if (floor === 2 || floor === "FL2") toFloor = "FL2";
      pulseMs = FLOOR_PULSE_MS;
      break;
    }
    case "MOVE_AND_OPEN": {
      // เช็คสถานะก่อน: ถึงชั้นที่สั่งแล้วค่อยเปิดประตู ถ้ายังไม่ถึงให้ส่งแค่ไปชั้น (pulse)
      const current = await readLiftStatus();
      const targetIs1 = floor === 1 || floor === "FL1";
      const targetIs2 = floor === 2 || floor === "FL2";
      const alreadyAtTarget = (targetIs1 && current.atFL1) || (targetIs2 && current.atFL2);
      if (alreadyAtTarget) {
        openDoor = true;
      } else {
        if (targetIs1) {
          toFloor = "FL1";
          pulseMs = FLOOR_PULSE_MS;
        } else if (targetIs2) {
          toFloor = "FL2";
          pulseMs = FLOOR_PULSE_MS;
        }
      }
      break;
    }
    default: {
      return res.status(400).json(rcsError(1001, "Unknown command: " + command));
    }
  }

  try {
    if (closeNowOnly) {
      clearIdleCloseTimer();
      clearDelayedCloseTimer();
      await clearOutputs();
      console.log(GREEN + "[Lift] ปิดประตูทันที (output = off) — RCS ส่งมาไม่มีชั้น" + RESET);
    } else if (closeAndGo) {
      clearIdleCloseTimer();
      clearDelayedCloseTimer();
      await clearOutputs();
      await controlLift({ toFloor, openDoor: false, pulseMs: FLOOR_PULSE_MS });
      console.log(GREEN + "[Lift] ปิดประตูแล้วไปชั้น " + (toFloor || "") + " (AGV เข้าแล้ว)" + RESET);
    } else if (doClearOnly) {
      clearIdleCloseTimer();
      if (delayedCloseTimer) {
        console.log(RED + "[Lift] RCS สั่งปิดประตู (รอจบ 10 วินาทีเดิมอยู่แล้ว ไม่รีเซ็ต)" + RESET);
      } else {
        scheduleDelayedDoorClose();
        console.log(RED + "[Lift] RCS สั่งปิดประตู → หน่วง 10 วินาที แล้วค่อยปิด" + RESET);
      }
    } else {
      clearDelayedCloseTimer();
      const result = await controlLift({ toFloor, openDoor, pulseMs });
      if (openDoor) {
        scheduleIdleDoorClose();
      } else {
        clearIdleCloseTimer();
      }
    }
    const status = await readLiftStatus();
    const liftInfo = { atFL1: status.atFL1, atFL2: status.atFL2, doorOpen: status.doorOpen, currentFloor: status.currentFloor };
    const data = buildRcsLiftData(liftInfo, null, status);
    const responseBody = rcsSuccess(data);
    console.log(GREEN + "[Lift] Body ที่ตอบกลับไป (POST /command): " + JSON.stringify(rcsBodyForLog(responseBody), null, 2) + RESET);
    res.json(responseBody);
  } catch (err) {
    const isOffline = err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT" || err.code === "ENOTFOUND";
    const data = buildRcsLiftData(null, isOffline ? DOOR_STATUS.OFFLINE : DOOR_STATUS.ABNORMAL);
    const responseBody = rcsSuccess(data);
    console.log(GREEN + "[Lift] Body ที่ตอบกลับไป (POST /command error): " + JSON.stringify(rcsBodyForLog(responseBody), null, 2) + RESET);
    res.json(responseBody);
  }
});

router.post("/command2", async (req, res) => {
  const body = req.body || {};
  let command = body.command ?? body.cmd;
  let floor = body.floor;
  console.log(RED + "[Lift2] Body ที่รับมา (POST /command2): " + JSON.stringify(body, null, 2) + RESET);
  if (body.command !== undefined || body.cmd !== undefined) {
    console.log(RED + "[Lift2] command (POST /command2): " + (body.command ?? body.cmd) + RESET);
  }
  if (body.status !== undefined) {
    console.log(RED + "[Lift2] status (POST /command2): " + body.status + RESET);
  }

  if ((command == null || command === "") && (body.targetFloor != null || body.status != null)) {
    const mapped = mapRcsBodyToCommand2(body);
    if (mapped) {
      command = mapped.command;
      floor = mapped.floor;
    }
  }

  if (command == null || command === "") {
    return res.status(400).json(rcsError(1001, "Missing command. Send JSON: { \"command\": \"...\" } or RCS format: { \"targetFloor\": 1|2|3, \"liftNum\": \"DT02\", \"status\": 1 }"));
  }

  let toFloor = null;
  let openDoor = false;
  let pulseMs = null;
  let doClearOnly = false;
  let closeNowOnly = false;
  let closeAndGo = false;

  switch (String(command).toUpperCase()) {
    case "TO_FL1":
      toFloor = "FL1";
      pulseMs = FLOOR_PULSE_MS;
      break;
    case "TO_FL2":
      toFloor = "FL2";
      pulseMs = FLOOR_PULSE_MS;
      break;
    case "TO_FL3":
      toFloor = "FL3";
      pulseMs = FLOOR_PULSE_MS;
      break;
    case "OPEN_DOOR":
      openDoor = true;
      break;
    case "CLOSE_DOOR":
      doClearOnly = true;
      break;
    case "CLOSE_DOOR_NOW":
      closeNowOnly = true;
      break;
    case "CLOSE_AND_GO": {
      closeAndGo = true;
      if (floor === 1 || floor === "FL1") toFloor = "FL1";
      else if (floor === 2 || floor === "FL2") toFloor = "FL2";
      else if (floor === 3 || floor === "FL3") toFloor = "FL3";
      pulseMs = FLOOR_PULSE_MS;
      break;
    }
    case "MOVE_AND_OPEN": {
      const current = await readLift2Status();
      const targetIs1 = floor === 1 || floor === "FL1";
      const targetIs2 = floor === 2 || floor === "FL2";
      const targetIs3 = floor === 3 || floor === "FL3";
      const alreadyAtTarget = (targetIs1 && current.atFL1) || (targetIs2 && current.atFL2) || (targetIs3 && current.atFL3);
      if (alreadyAtTarget) {
        openDoor = true;
      } else {
        if (targetIs1) {
          toFloor = "FL1";
          pulseMs = FLOOR_PULSE_MS;
        } else if (targetIs2) {
          toFloor = "FL2";
          pulseMs = FLOOR_PULSE_MS;
        } else if (targetIs3) {
          toFloor = "FL3";
          pulseMs = FLOOR_PULSE_MS;
        }
      }
      break;
    }
    default:
      return res.status(400).json(rcsError(1001, "Unknown command: " + command));
  }

  try {
    if (closeNowOnly) {
      await clearOutputs2();
      console.log(GREEN + "[Lift2] ปิดประตูทันที (output = off)" + RESET);
    } else if (closeAndGo) {
      await clearOutputs2();
      await controlLift2({ toFloor, openDoor: false, pulseMs: FLOOR_PULSE_MS });
      console.log(GREEN + "[Lift2] ปิดประตูแล้วไปชั้น " + (toFloor || "") + RESET);
    } else if (doClearOnly) {
      await clearOutputs2();
      console.log(RED + "[Lift2] RCS สั่งปิดประตู (clear outputs)" + RESET);
    } else {
      await controlLift2({ toFloor, openDoor, pulseMs });
    }

    const status = await readLift2Status();
    const liftInfo = {
      atFL1: status.atFL1,
      atFL2: status.atFL2,
      atFL3: status.atFL3,
      doorOpen: status.doorOpen,
      currentFloor: status.currentFloor
    };
    const data = buildRcsLift2Data(liftInfo, null, status);
    const responseBody = rcsSuccess(data);
    console.log(GREEN + "[Lift2] Body ที่ตอบกลับไป (POST /command2): " + JSON.stringify(rcsBodyForLog(responseBody), null, 2) + RESET);
    res.json(responseBody);
  } catch (err) {
    const isOffline = err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT" || err.code === "ENOTFOUND";
    const data = buildRcsLift2Data(null, isOffline ? DOOR_STATUS.OFFLINE : DOOR_STATUS.ABNORMAL);
    const responseBody = rcsSuccess(data);
    console.log(GREEN + "[Lift2] Body ที่ตอบกลับไป (POST /command2 error): " + JSON.stringify(rcsBodyForLog(responseBody), null, 2) + RESET);
    res.json(responseBody);
  }
});

module.exports = router;

