const express = require("express");
const {
  enqueueLift1Command,
  enqueueLift2Command,
  getLift1Cache,
  getLift2Cache
} = require("../services/liftWorker");

const router = express.Router();
const LIFT_NUM = "DT01";
const LIFT2_NUM = "DT02";

// สีใน console: แดง = สิ่งที่ RCS ส่งมา/ถามมา, เขียว = สิ่งที่เราตอบกลับ
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

// สถานะประตูที่ RCS ใช้: 0=开门到位(เปิด到位), 1=非开门到位(ปิด), 5=异常(ผิดปกติ), 6=离线(ออฟไลน์)
const DOOR_STATUS = { OPEN: 0, CLOSED: 1, ABNORMAL: 5, OFFLINE: 6 };

function buildRcsLiftData(liftStatus, doorStatusOverride = null, ioStatus = null) {
  let status = doorStatusOverride;
  let currentFloor = 0;
  if (status == null && liftStatus) {
    const doorOpen = !!liftStatus.doorOpen;
    status = doorOpen ? DOOR_STATUS.OPEN : DOOR_STATUS.CLOSED;
    if (liftStatus.atFL1) currentFloor = 1;
    else if (liftStatus.atFL2) currentFloor = 2;
  }
  if (status == null) status = DOOR_STATUS.OFFLINE;
  const data = { liftNum: LIFT_NUM, status, currentFloor, agvModel: 0 };
  if (ioStatus) {
    data.rawBits = ioStatus.rawBits;
    data.outputs = ioStatus.outputs;
    data.inputs = ioStatus.inputs;
  }
  return data;
}

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
  if (status == null) status = DOOR_STATUS.OFFLINE;
  const data = { liftNum: LIFT2_NUM, status, currentFloor, agvModel: 0 };
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

// รูปแบบที่ RCS ส่งมา: { targetFloor?, liftNum, status } หรือ { agvMode, liftNum, status }
// สถานะประตูที่ RCS สั่ง: 0=开门到位(เปิด), 1=非开门到位(ปิด), 5=异常, 6=离线
function mapRcsBodyToCommand(body) {
  const { targetFloor, status } = body;
  const st = Number(status);
  const hasTargetFloor = targetFloor !== undefined && targetFloor !== null && targetFloor !== "";
  if (st === DOOR_STATUS.OPEN) {
    if (targetFloor === 1 || targetFloor === "1") return { command: "MOVE_AND_OPEN", floor: 1 };
    if (targetFloor === 2 || targetFloor === "2") return { command: "MOVE_AND_OPEN", floor: 2 };
    return { command: "OPEN_DOOR", floor: null };
  }
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

// ─── สร้าง response body ทันทีจาก cache ──────────────────────────────
function buildLift1ResponseFromCache() {
  const status = getLift1Cache();
  const liftInfo = status
    ? { atFL1: status.atFL1, atFL2: status.atFL2, doorOpen: status.doorOpen, currentFloor: status.currentFloor }
    : null;
  const data = buildRcsLiftData(liftInfo, status ? null : DOOR_STATUS.OFFLINE, status);
  return rcsSuccess(data);
}

function buildLift2ResponseFromCache() {
  const status = getLift2Cache();
  const liftInfo = status
    ? { atFL1: status.atFL1, atFL2: status.atFL2, atFL3: status.atFL3, doorOpen: status.doorOpen, currentFloor: status.currentFloor }
    : null;
  const data = buildRcsLift2Data(liftInfo, status ? null : DOOR_STATUS.OFFLINE, status);
  return rcsSuccess(data);
}

// ─── status handlers — ตอบ cache ทันที ไม่แตะ I/O ────────────────────
function handleStatus(req, res) {
  const method = req.method;
  console.log(RED + "[Lift] RCS ถาม status มา (" + method + " /status)" + RESET);
  const body = buildLift1ResponseFromCache();
  console.log(GREEN + "[Lift] Body ที่ตอบกลับไป (" + method + " /status): " + JSON.stringify(rcsBodyForLog(body), null, 2) + RESET);
  res.json(body);
}
router.get("/status", handleStatus);
router.post("/status", handleStatus);

function handleStatus2(req, res) {
  const method = req.method;
  console.log(RED + "[Lift2] RCS ถาม status มา (" + method + " /status2)" + RESET);
  const body = buildLift2ResponseFromCache();
  console.log(GREEN + "[Lift2] Body ที่ตอบกลับไป (" + method + " /status2): " + JSON.stringify(rcsBodyForLog(body), null, 2) + RESET);
  res.json(body);
}
router.get("/status2", handleStatus2);
router.post("/status2", handleStatus2);

// ─── command handlers — enqueue พื้นหลัง + ตอบ cache ทันที ───────────
// body ที่รองรับ:
//   { command: "TO_FL1|TO_FL2|OPEN_DOOR|CLOSE_DOOR|CLOSE_DOOR_NOW|CLOSE_AND_GO|MOVE_AND_OPEN", floor? }
//   หรือ RCS format: { targetFloor?, liftNum, status }
router.post("/command", (req, res) => {
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

  enqueueLift1Command({ command, floor });

  const responseBody = buildLift1ResponseFromCache();
  console.log(GREEN + "[Lift] Body ที่ตอบกลับไป (POST /command): " + JSON.stringify(rcsBodyForLog(responseBody), null, 2) + RESET);
  res.json(responseBody);
});

router.post("/command2", (req, res) => {
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

  enqueueLift2Command({ command, floor });

  const responseBody = buildLift2ResponseFromCache();
  console.log(GREEN + "[Lift2] Body ที่ตอบกลับไป (POST /command2): " + JSON.stringify(rcsBodyForLog(responseBody), null, 2) + RESET);
  res.json(responseBody);
});

module.exports = router;
