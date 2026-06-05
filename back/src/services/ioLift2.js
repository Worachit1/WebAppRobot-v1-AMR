const axios = require("axios");

// I/O Board DT02 for Lift (3 floors)
// Read status: same pattern as DT01 board
//   GET http://192.168.1.101/1234/2/?s=----
// Write outputs: channel command style
//   GET http://192.168.1.101/1234/6/?d=<0|1><channel>&
// Example:
//   d=12  => Output2 ON
//   d=02  => Output2 OFF

const IO_READ_URL = "http://192.168.1.101/1234/2/";
const IO_WRITE_URL = "http://192.168.1.101/1234/6/";

const READ_COMMAND = "s=----";
const OUTPUT_CHANNELS = [1, 2, 3, 4];
const IO_TIMEOUT_MS = 1000;

async function readRawBits() {
  const { data } = await axios.get(`${IO_READ_URL}?${READ_COMMAND}`, { timeout: IO_TIMEOUT_MS });
  const raw = data.toString().trim().replace(/\r\n/g, "").replace(/\s/g, "");
  const bits = raw.slice(0, 8).padStart(8, "0");
  return bits;
}

function parseBits(bits) {
  const outputsBits = bits.slice(0, 4).split("").map((b) => b === "1");
  const inputsBits = bits.slice(4).split("").map((b) => b === "1");

  const [in1, in2, in3, in4] = inputsBits;

  return {
    outputsBits,
    inputsBits,
    liftStatus: {
      atFL1: !!in1,
      atFL2: !!in2,
      atFL3: !!in3,
      doorOpen: !!in4,
      currentFloor: in1 ? "FL1" : in2 ? "FL2" : in3 ? "FL3" : null
    }
  };
}

async function readLift2Status() {
  const bits = await readRawBits();
  const parsed = parseBits(bits);
  return {
    ...parsed.liftStatus,
    rawBits: bits,
    outputs: parsed.outputsBits,
    inputs: parsed.inputsBits
  };
}

async function setOutputChannel(channel, isOn) {
  if (!OUTPUT_CHANNELS.includes(channel)) {
    throw new Error(`Invalid output channel: ${channel}`);
  }
  const d = `${isOn ? 1 : 0}${channel}`;
  await axios.get(`${IO_WRITE_URL}?d=${d}&`, { timeout: IO_TIMEOUT_MS });
  return d;
}

async function clearOutputs2() {
  for (const ch of OUTPUT_CHANNELS) {
    await setOutputChannel(ch, false);
  }
}

const DEFAULT_PULSE_MS = 800;

/**
 * options:
 * - toFloor: 1|2|3|"FL1"|"FL2"|"FL3"
 * - openDoor: boolean
 * - pulseMs: number|null
 */
async function controlLift2(options) {
  const { toFloor, openDoor, pulseMs } = options || {};

  let channelToOn = null;
  if (toFloor === 1 || toFloor === "FL1") channelToOn = 1;
  else if (toFloor === 2 || toFloor === "FL2") channelToOn = 2;
  else if (toFloor === 3 || toFloor === "FL3") channelToOn = 3;
  else if (openDoor) channelToOn = 4;

  if (!channelToOn) {
    return { command: null, channel: null, clearedAfterPulse: false };
  }

  await clearOutputs2();
  const command = await setOutputChannel(channelToOn, true);

  const doPulse = typeof pulseMs === "number" && pulseMs > 0;
  if (doPulse) {
    await new Promise((r) => setTimeout(r, pulseMs || DEFAULT_PULSE_MS));
    await clearOutputs2();
  }

  return {
    command,
    channel: channelToOn,
    clearedAfterPulse: doPulse
  };
}

module.exports = {
  readLift2Status,
  controlLift2,
  clearOutputs2
};
