const axios = require("axios");

async function sendTaskOrder(baseUrl, payload) {
  const url = `${baseUrl}/ics/taskOrder/addTask`;
  console.log("[RCS] POST URL:", url);
  console.log("[RCS] POST BODY:", JSON.stringify(payload, null, 2));
  const res = await axios.post(url, payload);
  console.log("[RCS] POST RESPONSE:", JSON.stringify(res.data, null, 2));
  return res.data;
}

async function getTaskOrderStatus(baseUrl, orderId) {
  const res = await axios.post(`${baseUrl}/ics/out/task/getTaskOrderStatus`, {
    orderId
  });
  return res.data;
}

/**
 * Get AGV status list from RCS (IRAYPLE API 4.1.2.1) for one area.
 * Body: areaId, deviceType (0), deviceCode (optional fuzzy filter).
 */
async function getDeviceListByArea(baseUrl, areaId, deviceCode) {
  const body = {
    areaId: String(areaId),
    deviceType: 0
  };
  if (deviceCode) body.deviceCode = deviceCode;
  const res = await axios.post(`${baseUrl}/ics/out/device/list/deviceInfo`, body);
  return res.data;
}

/**
 * Query all given areas and return the first device matching deviceNum/deviceName.
 * Use when the robot can be on any floor.
 */
async function getDeviceStatusFromAllAreas(baseUrl, deviceKeys, areaIds) {
  const ids = Array.isArray(areaIds) && areaIds.length ? areaIds : ["0", "1", "2"];
  const keys = (Array.isArray(deviceKeys) ? deviceKeys : [deviceKeys])
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  for (const areaId of ids) {
    try {
      // Try filtered queries first (deviceNum, robot name, aliases).
      for (const key of keys) {
        const res = await getDeviceListByArea(baseUrl, areaId, key);
        if (res.code === 1000 && Array.isArray(res.data) && res.data.length) {
          const device =
            res.data.find(
              (d) =>
                keys.some((k) => String(d.deviceCode || "") === k || String(d.deviceName || "") === k) ||
                keys.some((k) => String(d.deviceCode || "").includes(k) || String(d.deviceName || "").includes(k))
            ) || res.data[0];
          return { ...res, data: device, areaId };
        }
      }

      // Fallback: query whole area and match locally.
      const allRes = await getDeviceListByArea(baseUrl, areaId);
      if (allRes.code === 1000 && Array.isArray(allRes.data) && allRes.data.length) {
        const device = allRes.data.find(
          (d) =>
            keys.some((k) => String(d.deviceCode || "") === k || String(d.deviceName || "") === k) ||
            keys.some((k) => String(d.deviceCode || "").includes(k) || String(d.deviceName || "").includes(k))
        );
        if (device) return { ...allRes, data: device, areaId };
      }
    } catch {
      continue;
    }
  }
  return { code: 1001, data: null, desc: "Device not found in any area" };
}

module.exports = {
  sendTaskOrder,
  getTaskOrderStatus,
  getDeviceListByArea,
  getDeviceStatusFromAllAreas
};
