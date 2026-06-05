const axios = require("axios");

// บอร์ดเปิด/ปิดประตู — โปรโตคอลเดียวกับ lift DT02
const IO_READ_URL = "http://192.168.1.103/1234/2/";
const IO_WRITE_URL = "http://192.168.1.103/1234/6/";
const READ_COMMAND = "s=----";
const OUTPUT_CHANNELS = [1, 2, 3, 4];
const IO_TIMEOUT_MS = 1000;

async function setOutputChannel(channel, isOn) {
  if (!OUTPUT_CHANNELS.includes(channel)) {
    throw new Error(`Invalid output channel: ${channel}`);
  }
  const d = `${isOn ? 1 : 0}${channel}`;
  await axios.get(`${IO_WRITE_URL}?d=${d}&`, { timeout: IO_TIMEOUT_MS });
  return d;
}

async function readRawBits() {
  const { data } = await axios.get(`${IO_READ_URL}?${READ_COMMAND}`, { timeout: IO_TIMEOUT_MS });
  const raw = data.toString().trim().replace(/\r\n/g, "").replace(/\s/g, "");
  return raw.slice(0, 8).padStart(8, "0");
}

function parseBits(bits) {
  const outputsBits = bits.slice(0, 4).split("").map((b) => b === "1");
  const inputsBits = bits.slice(4).split("").map((b) => b === "1");
  return { outputsBits, inputsBits };
}

async function readDoorBoardStatus() {
  const bits = await readRawBits();
  const parsed = parseBits(bits);
  return {
    rawBits: bits,
    outputs: parsed.outputsBits,
    inputs: parsed.inputsBits
  };
}

/** เปิด O1 เท่านั้น — ไม่แตะ O2/O3 (ทุกประตูอิสระต่อกัน) */
async function applyDoor1Pattern() {
  await setOutputChannel(1, true);
}

/** เปิด O2 เท่านั้น — ไม่แตะ O1/O3 */
async function applyDoor2Pattern() {
  await setOutputChannel(2, true);
}

/** เปิด O3 เท่านั้น — ไม่แตะ O1/O2 */
async function applyDoor3Pattern() {
  await setOutputChannel(3, true);
}

async function clearAllOutputs() {
  for (const ch of OUTPUT_CHANNELS) {
    await setOutputChannel(ch, false);
  }
}

module.exports = {
  setOutputChannel,
  readDoorBoardStatus,
  applyDoor1Pattern,
  applyDoor2Pattern,
  applyDoor3Pattern,
  clearAllOutputs,
  IO_READ_URL,
  READ_COMMAND
};
