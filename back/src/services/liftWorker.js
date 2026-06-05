// Worker แยก I/O ออกจาก HTTP handler ที่ RCS เรียกเข้ามา
// - RCS ถาม status / ส่ง command → ตอบจาก cache ทันที
// - คำสั่งที่ RCS ส่งมาเก็บเป็น pendingJob (latest-wins) ให้ worker ยิง I/O พื้นหลัง
// - Poll status ทุก 3 วิ มี in-flight guard กันรีเควสต์ซ้อนตอน WiFi หลุด

const { readLiftStatus, controlLift, clearOutputs } = require("./ioLift");
const { readLift2Status, controlLift2, clearOutputs2 } = require("./ioLift2");

const POLL_INTERVAL_MS = 3000;
const FLOOR_PULSE_MS = 800;
const IDLE_DOOR_CLOSE_MS = 20000;
const DELAYED_DOOR_CLOSE_MS = 10000;
// ภายในช่วงนี้ ถ้า RCS ส่ง effective-command เดิมซ้ำ จะไม่ยิง I/O ซ้ำ
const DEDUPE_WINDOW_MS = 3000;

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

// ─── state: DT01 ─────────────────────────────────────────────────────
const lift1 = {
  cache: null,
  pollInFlight: false,
  pendingJob: null,
  processing: false,
  pendingAutoOpenFloor: null,
  moveAndOpenDispatched: false,
  idleCloseTimer: null,
  delayedCloseTimer: null,
  lastExecutedKey: null,
  lastExecutedAt: 0
};

// ─── state: DT02 ─────────────────────────────────────────────────────
const lift2 = {
  cache: null,
  pollInFlight: false,
  pendingJob: null,
  processing: false,
  pendingAutoOpenFloor: null,
  moveAndOpenDispatched: false,
  lastExecutedKey: null,
  lastExecutedAt: 0
};

function atTargetLift1(status, floor) {
  if (!status || !floor) return false;
  return (floor === "FL1" && status.atFL1) || (floor === "FL2" && status.atFL2);
}

function atTargetLift2(status, floor) {
  if (!status || !floor) return false;
  return (
    (floor === "FL1" && status.atFL1) ||
    (floor === "FL2" && status.atFL2) ||
    (floor === "FL3" && status.atFL3)
  );
}

// ─── timers: DT01 ────────────────────────────────────────────────────
function clearIdleCloseTimer1() {
  if (lift1.idleCloseTimer) {
    clearTimeout(lift1.idleCloseTimer);
    lift1.idleCloseTimer = null;
  }
}
function clearDelayedCloseTimer1() {
  if (lift1.delayedCloseTimer) {
    clearTimeout(lift1.delayedCloseTimer);
    lift1.delayedCloseTimer = null;
  }
}
function scheduleIdleDoorClose1() {
  clearIdleCloseTimer1();
  lift1.idleCloseTimer = setTimeout(async () => {
    try {
      await clearOutputs();
      console.log("[Lift] Auto close door: no RCS command for " + (IDLE_DOOR_CLOSE_MS / 1000) + "s");
    } catch (err) {
      console.log("[Lift] Auto close door error:", err.message);
    }
    lift1.idleCloseTimer = null;
  }, IDLE_DOOR_CLOSE_MS);
}
function scheduleDelayedDoorClose1() {
  clearDelayedCloseTimer1();
  lift1.delayedCloseTimer = setTimeout(async () => {
    try {
      await clearOutputs();
      console.log(GREEN + "[Lift] ปิดประตูแล้ว (หน่วง 10 วินาที)" + RESET);
    } catch (err) {
      console.log("[Lift] Delayed close error:", err.message);
    }
    lift1.delayedCloseTimer = null;
  }, DELAYED_DOOR_CLOSE_MS);
}

// ─── poll loop ───────────────────────────────────────────────────────
async function pollLift1() {
  if (lift1.pollInFlight) return;
  lift1.pollInFlight = true;
  try {
    const status = await readLiftStatus();
    lift1.cache = status;
    await checkAutoOpen1(status);
  } catch (err) {
    console.error("[Lift] poll error:", err.message);
    // ไม่ทับ cache เดิม — ให้ RCS ได้ state ล่าสุดที่อ่านได้
  } finally {
    lift1.pollInFlight = false;
  }
}

async function pollLift2() {
  if (lift2.pollInFlight) return;
  lift2.pollInFlight = true;
  try {
    const status = await readLift2Status();
    lift2.cache = status;
    await checkAutoOpen2(status);
  } catch (err) {
    console.error("[Lift2] poll error:", err.message);
  } finally {
    lift2.pollInFlight = false;
  }
}

async function checkAutoOpen1(status) {
  if (!lift1.pendingAutoOpenFloor) return;
  if (!atTargetLift1(status, lift1.pendingAutoOpenFloor)) return;
  lift1.pendingAutoOpenFloor = null;
  lift1.moveAndOpenDispatched = false;
  try {
    clearDelayedCloseTimer1();
    await controlLift({ toFloor: null, openDoor: true, pulseMs: null });
    scheduleIdleDoorClose1();
    try {
      lift1.cache = await readLiftStatus();
    } catch {}
    console.log(GREEN + "[Lift] auto-open on target floor" + RESET);
  } catch (err) {
    console.log("[Lift] auto-open error:", err.message);
  }
}

async function checkAutoOpen2(status) {
  if (!lift2.pendingAutoOpenFloor) return;
  if (!atTargetLift2(status, lift2.pendingAutoOpenFloor)) return;
  lift2.pendingAutoOpenFloor = null;
  lift2.moveAndOpenDispatched = false;
  try {
    await controlLift2({ toFloor: null, openDoor: true, pulseMs: null });
    try {
      lift2.cache = await readLift2Status();
    } catch {}
    console.log(GREEN + "[Lift2] auto-open on target floor" + RESET);
  } catch (err) {
    console.log("[Lift2] auto-open error:", err.message);
  }
}

// ─── queue + worker: DT01 ────────────────────────────────────────────
function enqueueLift1Command(job) {
  lift1.pendingJob = job; // latest-wins: คำสั่งใหม่ทับคำสั่งเก่าที่ยังไม่ถูก process
  processLift1Queue();
}

async function processLift1Queue() {
  if (lift1.processing) return;
  lift1.processing = true;
  try {
    while (lift1.pendingJob) {
      const job = lift1.pendingJob;
      lift1.pendingJob = null;
      try {
        await executeLift1Job(job);
      } catch (err) {
        console.error("[Lift] worker error:", err.message);
      }
    }
  } finally {
    lift1.processing = false;
  }
}

async function executeLift1Job(job) {
  const cmd = String(job.command || "").toUpperCase();
  const floor = job.floor;

  let toFloor = null;
  let openDoor = false;
  let pulseMs = null;
  let doClearOnly = false;
  let closeNowOnly = false;
  let closeAndGo = false;
  let isMoveAndOpen = false;

  switch (cmd) {
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
      lift1.pendingAutoOpenFloor = null;
      lift1.moveAndOpenDispatched = false;
      break;
    case "CLOSE_DOOR_NOW":
      closeNowOnly = true;
      lift1.pendingAutoOpenFloor = null;
      lift1.moveAndOpenDispatched = false;
      break;
    case "CLOSE_AND_GO":
      closeAndGo = true;
      if (floor === 1 || floor === "FL1") toFloor = "FL1";
      else if (floor === 2 || floor === "FL2") toFloor = "FL2";
      pulseMs = FLOOR_PULSE_MS;
      break;
    case "MOVE_AND_OPEN":
      isMoveAndOpen = true;
      if (floor === 1 || floor === "FL1") {
        toFloor = "FL1";
        lift1.pendingAutoOpenFloor = "FL1";
      } else if (floor === 2 || floor === "FL2") {
        toFloor = "FL2";
        lift1.pendingAutoOpenFloor = "FL2";
      }
      pulseMs = FLOOR_PULSE_MS;
      break;
    default:
      console.log(RED + "[Lift] unknown command: " + cmd + RESET);
      return;
  }

  const currentStatus = lift1.cache;

  // ถ้าอยู่ชั้นเป้าหมายแล้ว: อย่ายิง pulse ซ้ำ ให้ค้างเปิดประตูแทน
  if (currentStatus && isMoveAndOpen &&
      ((toFloor === "FL1" && currentStatus.atFL1) || (toFloor === "FL2" && currentStatus.atFL2))) {
    toFloor = null;
    pulseMs = null;
    openDoor = true;
    lift1.pendingAutoOpenFloor = null;
    lift1.moveAndOpenDispatched = false;
  }

  let forceSkipIo = false;
  if (currentStatus && (openDoor || isMoveAndOpen) && currentStatus.doorOpen) {
    forceSkipIo = true;
    lift1.pendingAutoOpenFloor = null;
    lift1.moveAndOpenDispatched = false;
    scheduleIdleDoorClose1();
  }

  const effectiveKey = JSON.stringify({ cmd, toFloor, openDoor, doClearOnly, closeNowOnly, closeAndGo, pulseMs });
  const now = Date.now();
  const sameAsLast = effectiveKey === lift1.lastExecutedKey;
  const withinWindow = now - lift1.lastExecutedAt < DEDUPE_WINDOW_MS;
  let shouldSendIo = !sameAsLast || !withinWindow;

  if (isMoveAndOpen && lift1.moveAndOpenDispatched) shouldSendIo = false;
  if (forceSkipIo) shouldSendIo = false;

  if (!shouldSendIo) {
    console.log(RED + "[Lift] duplicate command ignored (not sending I/O)" + RESET);
    return;
  }

  lift1.lastExecutedKey = effectiveKey;
  lift1.lastExecutedAt = now;

  try {
    if (closeNowOnly) {
      clearIdleCloseTimer1();
      clearDelayedCloseTimer1();
      await clearOutputs();
      console.log(GREEN + "[Lift] ปิดประตูทันที (output = off)" + RESET);
    } else if (closeAndGo) {
      clearIdleCloseTimer1();
      clearDelayedCloseTimer1();
      await clearOutputs();
      await controlLift({ toFloor, openDoor: false, pulseMs: FLOOR_PULSE_MS });
      console.log(GREEN + "[Lift] ปิดประตูแล้วไปชั้น " + (toFloor || "") + " (AGV เข้าแล้ว)" + RESET);
    } else if (doClearOnly) {
      clearIdleCloseTimer1();
      lift1.pendingAutoOpenFloor = null;
      if (lift1.delayedCloseTimer) {
        console.log(RED + "[Lift] RCS สั่งปิดประตู (รอจบ 10 วินาทีเดิมอยู่แล้ว ไม่รีเซ็ต)" + RESET);
      } else {
        scheduleDelayedDoorClose1();
        console.log(RED + "[Lift] RCS สั่งปิดประตู → หน่วง 10 วินาที แล้วค่อยปิด" + RESET);
      }
    } else {
      clearDelayedCloseTimer1();
      await controlLift({ toFloor, openDoor, pulseMs });
      if (isMoveAndOpen && toFloor) lift1.moveAndOpenDispatched = true;
      if (openDoor) scheduleIdleDoorClose1();
      else clearIdleCloseTimer1();
    }

    try {
      lift1.cache = await readLiftStatus();
    } catch {}
  } catch (err) {
    console.error("[Lift] execute error:", err.message);
  }
}

// ─── queue + worker: DT02 ────────────────────────────────────────────
function enqueueLift2Command(job) {
  lift2.pendingJob = job;
  processLift2Queue();
}

async function processLift2Queue() {
  if (lift2.processing) return;
  lift2.processing = true;
  try {
    while (lift2.pendingJob) {
      const job = lift2.pendingJob;
      lift2.pendingJob = null;
      try {
        await executeLift2Job(job);
      } catch (err) {
        console.error("[Lift2] worker error:", err.message);
      }
    }
  } finally {
    lift2.processing = false;
  }
}

async function executeLift2Job(job) {
  const cmd = String(job.command || "").toUpperCase();
  const floor = job.floor;

  let toFloor = null;
  let openDoor = false;
  let pulseMs = null;
  let doClearOnly = false;
  let closeNowOnly = false;
  let closeAndGo = false;
  let isMoveAndOpen = false;

  switch (cmd) {
    case "TO_FL1": toFloor = "FL1"; pulseMs = FLOOR_PULSE_MS; break;
    case "TO_FL2": toFloor = "FL2"; pulseMs = FLOOR_PULSE_MS; break;
    case "TO_FL3": toFloor = "FL3"; pulseMs = FLOOR_PULSE_MS; break;
    case "OPEN_DOOR": openDoor = true; break;
    case "CLOSE_DOOR":
      doClearOnly = true;
      lift2.pendingAutoOpenFloor = null;
      lift2.moveAndOpenDispatched = false;
      break;
    case "CLOSE_DOOR_NOW":
      closeNowOnly = true;
      lift2.pendingAutoOpenFloor = null;
      lift2.moveAndOpenDispatched = false;
      break;
    case "CLOSE_AND_GO":
      closeAndGo = true;
      if (floor === 1 || floor === "FL1") toFloor = "FL1";
      else if (floor === 2 || floor === "FL2") toFloor = "FL2";
      else if (floor === 3 || floor === "FL3") toFloor = "FL3";
      pulseMs = FLOOR_PULSE_MS;
      break;
    case "MOVE_AND_OPEN":
      isMoveAndOpen = true;
      if (floor === 1 || floor === "FL1") { toFloor = "FL1"; lift2.pendingAutoOpenFloor = "FL1"; }
      else if (floor === 2 || floor === "FL2") { toFloor = "FL2"; lift2.pendingAutoOpenFloor = "FL2"; }
      else if (floor === 3 || floor === "FL3") { toFloor = "FL3"; lift2.pendingAutoOpenFloor = "FL3"; }
      pulseMs = FLOOR_PULSE_MS;
      break;
    default:
      console.log(RED + "[Lift2] unknown command: " + cmd + RESET);
      return;
  }

  const currentStatus = lift2.cache;

  if (currentStatus && isMoveAndOpen &&
      ((toFloor === "FL1" && currentStatus.atFL1) ||
        (toFloor === "FL2" && currentStatus.atFL2) ||
        (toFloor === "FL3" && currentStatus.atFL3))) {
    toFloor = null;
    pulseMs = null;
    openDoor = true;
    lift2.pendingAutoOpenFloor = null;
    lift2.moveAndOpenDispatched = false;
  }

  let forceSkipIo = false;
  if (currentStatus && (openDoor || isMoveAndOpen) && currentStatus.doorOpen) {
    forceSkipIo = true;
    lift2.pendingAutoOpenFloor = null;
    lift2.moveAndOpenDispatched = false;
  }

  const effectiveKey = JSON.stringify({ cmd, toFloor, openDoor, doClearOnly, closeNowOnly, closeAndGo, pulseMs });
  const now = Date.now();
  const sameAsLast = effectiveKey === lift2.lastExecutedKey;
  const withinWindow = now - lift2.lastExecutedAt < DEDUPE_WINDOW_MS;
  let shouldSendIo = !sameAsLast || !withinWindow;

  if (isMoveAndOpen && lift2.moveAndOpenDispatched) shouldSendIo = false;
  if (forceSkipIo) shouldSendIo = false;

  if (!shouldSendIo) {
    console.log(RED + "[Lift2] duplicate command ignored (not sending I/O)" + RESET);
    return;
  }

  lift2.lastExecutedKey = effectiveKey;
  lift2.lastExecutedAt = now;

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
      if (isMoveAndOpen && toFloor) lift2.moveAndOpenDispatched = true;
    }

    try {
      lift2.cache = await readLift2Status();
    } catch {}
  } catch (err) {
    console.error("[Lift2] execute error:", err.message);
  }
}

// ─── cache accessors ────────────────────────────────────────────────
function getLift1Cache() { return lift1.cache; }
function getLift2Cache() { return lift2.cache; }

// ─── start poll loops ───────────────────────────────────────────────
setInterval(pollLift1, POLL_INTERVAL_MS);
setInterval(pollLift2, POLL_INTERVAL_MS);
pollLift1();
pollLift2();

module.exports = {
  enqueueLift1Command,
  enqueueLift2Command,
  getLift1Cache,
  getLift2Cache
};
