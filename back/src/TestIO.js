// io-demo.js
const axios = require('axios');

const IO_BASE_URL = 'http://10.178.236.92/1234/2/';
const READ_COMMAND = 's=-';      // อ่าน 8 บิต (4 outputs + 4 inputs)
const OUTPUT_PREFIX = 's=';       // สั่ง outputs เป็นสตริง 4 บิต เช่น s=0100

async function readIOStatus() {
  const { data } = await axios.get(`${IO_BASE_URL}?${READ_COMMAND}`);
  const bits = data.toString().padStart(8, '0');
  return {
    outputs: bits.slice(0, 4).split('').map(bit => bit === '1'),
    inputs: bits.slice(4).split('').map(bit => bit === '1'),
    raw: bits,
  };
}

async function setOutputs(state) {
  if (state.length !== 4) throw new Error('ต้องใส่ array 4 ช่องสำหรับ outputs');
  const command = state.map(v => (v ? '1' : '0')).join('');
  await axios.get(`${IO_BASE_URL}?${OUTPUT_PREFIX}${command}`);
  return command;
}

(async () => {
  try {
    // อ่านสถานะปัจจุบัน
    const status = await readIOStatus();
    console.log('Outputs:', status.outputs);
    console.log('Inputs :', status.inputs);

    // สั่งเปิด Output 2 (0100) ทิ้งไว้ 2 วิ แล้วปิด
    console.log('Trigger Output 2...');
    await setOutputs([false, true, false, false]);
    await new Promise(r => setTimeout(r, 2000));
    console.log('Reset outputs...');
    await setOutputs([false, false, false, false]);
  } catch (err) {
    console.error('I/O error:', err.message);
  }
})();