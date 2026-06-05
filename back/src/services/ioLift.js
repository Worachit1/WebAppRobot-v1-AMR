const axios = require("axios");

// I/O Board DT01 for Lift
// Assumes same HTTP API pattern as demo in TestIO.js:
//   GET http://IP/1234/2/?s=-       -> read 4 output bits + 4 input bits
//   GET http://IP/1234/2/?s=XYZA    -> write 4 output bits
//
// Mapping for this project:
//   Inputs:
//     IN1 -> Status FL1
//     IN2 -> Status FL2
//     IN3 -> Door Already Open
//   Outputs:
//     OUT1 -> To FL1
//     OUT2 -> To FL2
//     OUT3 -> Open Door

const IO_BASE_URL = "http://192.168.1.100/1234/2/";
const READ_COMMAND = "s=-";
const OUTPUT_PREFIX = "s=";
const IO_TIMEOUT_MS = 1000;

async function readRawBits() {
  const { data } = await axios.get(`${IO_BASE_URL}?${READ_COMMAND}`, { timeout: IO_TIMEOUT_MS });
  const raw = data.toString().trim().replace(/\r\n/g, "").replace(/\s/g, "");
  const bits = raw.slice(0, 8).padStart(8, "0");
  return bits;
}

function parseBits(bits) {
  const outputsBits = bits.slice(0, 4).split("").map((b) => b === "1");
  const inputsBits = bits.slice(4).split("").map((b) => b === "1");

  const [in1, in2, in3] = inputsBits;

  return {
    outputsBits,
    inputsBits,
    liftStatus: {
      atFL1: !!in1,
      atFL2: !!in2,
      doorOpen: !!in3,
      currentFloor: in1 ? "FL1" : in2 ? "FL2" : null
    }
  };
}

async function readLiftStatus() {
  const bits = await readRawBits();
  const parsed = parseBits(bits);
  return {
    ...parsed.liftStatus,
    rawBits: bits,
    outputs: parsed.outputsBits,
    inputs: parsed.inputsBits
  };
}

async function setOutputs(state) {
  if (!Array.isArray(state) || state.length !== 4) {
    throw new Error("state must be an array of 4 booleans for outputs");
  }
  const command = state.map((v) => (v ? "1" : "0")).join("");
  await axios.get(`${IO_BASE_URL}?${OUTPUT_PREFIX}${command}`, { timeout: IO_TIMEOUT_MS });
  return command;
}

/**
 * เคลียร์ output ทั้งหมดบนบอร์ด (ส่ง 0000) — ใช้เมื่อปิดประตูหรือยกเลิกคำสั่งค้าง
 */
async function clearOutputs() {
  const command = await setOutputs([false, false, false, false]);
  return command;
}

const DEFAULT_PULSE_MS = 800;

/**
 * Control lift via I/O outputs.
 * options:
 *   - toFloor: 1 | 2 | "FL1" | "FL2"
 *   - openDoor: boolean
 *   - pulseMs: number | null — ถ้าระบุ (เช่น 800) จะสั่ง output แล้วเคลียร์ทั้งหมดหลัง pulseMs ms
 *     ไม่ระบุหรือ 0 = ไม่ pulse (ให้ output ค้าง สำหรับ OPEN_DOOR รอ AGV เข้า/ออก)
 */
async function controlLift(options) {
  const { toFloor, openDoor, pulseMs } = options || {};

  const outputs = [false, false, false, false];

  if (toFloor === 1 || toFloor === "FL1") {
    outputs[0] = true; // OUT1 -> To FL1
  } else if (toFloor === 2 || toFloor === "FL2") {
    outputs[1] = true; // OUT2 -> To FL2
  }

  if (openDoor) {
    outputs[2] = true; // OUT3 -> Open Door
  }

  const command = await setOutputs(outputs);
  const doPulse = typeof pulseMs === "number" && pulseMs > 0;

  if (doPulse) {
    await new Promise((r) => setTimeout(r, pulseMs));
    await clearOutputs();
  }

  return {
    command,
    outputs,
    clearedAfterPulse: doPulse
  };
}

module.exports = {
  readLiftStatus,
  controlLift,
  clearOutputs
};

