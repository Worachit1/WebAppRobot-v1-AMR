// ใช้ host เดียวกับหน้าที่เปิดอยู่ — เปิดจาก 192.168.1.10 จะยิง API ไป 192.168.1.10:4000 (ไม่ติด localhost)
const getApiBase = () => {
  if (typeof window === "undefined") return import.meta.env.VITE_API_BASE_URL || "http://192.168.1.80:4000/api";
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.includes("localhost") && window.location.hostname !== "localhost") {
    return `${window.location.protocol}//${window.location.hostname}:4000/api`;
  }
  if (envUrl) return envUrl;
  return `${window.location.protocol}//${window.location.hostname}:4000/api`;
};
const API_BASE = getApiBase();

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || "Request failed";
    throw new Error(message);
  }
  return data;
}

export function login(username, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

// zone pick
export function fetchZonePick(params= {}) {
  return apiRequest("/zones/get/groups")
}
// zone drop
export function fetchZoneDrop(params= {}) {
  return apiRequest("/zones/get/drops")
}
// get robots
export function fetchCart(params = {}) {
  return apiRequest("/robots/get")
}
// get cart
export function fetchCart(params = {}) {
  return apiRequest("/robots/get/carts")
}
// ----------- ของเก่าเอาค้างไว้ก่อน ------------------
export function fetchConfig() {
  return apiRequest("/config");
}

export function updateConfig(config) {
  return apiRequest("/config", {
    method: "PUT",
    body: JSON.stringify(config)
  });
}

export function createOrder(payload) {
  return apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function fetchHistory(params = {}) {
  const search = new URLSearchParams(params);
  const suffix = search.toString() ? `?${search}` : "";
  return apiRequest(`/orders/history${suffix}`);
}

export function cancelOrder(orderId) {
  return apiRequest(`/orders/${orderId}/cancel`, { method: "POST" });
}

export function fetchRobotStatus(robotId) {
  return apiRequest(`/status/${robotId}`);
}

// Lift DT01 APIs
export function fetchLiftStatus() {
  return apiRequest("/lift/status");
}

export function sendLiftCommand(payload) {
  return apiRequest("/lift/command", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// Lift DT02 APIs
export function fetchLift2Status() {
  return apiRequest("/lift/status2");
}

export function sendLift2Command(payload) {
  return apiRequest("/lift/command2", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

/** Origin ของ backend (ไม่มี /api) — สำหรับ POST /door/... และ GET /door/... */
function backendOrigin() {
  let b = API_BASE.replace(/\/$/, "");
  if (b.endsWith("/api")) return b.slice(0, -4);
  return b;
}

/** RCS-style body ตาม manual 3.2.3: status 1=ขอเปิด, 2=ขอปิด */
const rcsDoorPayload = (doorCode, status) =>
  JSON.stringify({
    deviceNum: "test",
    doorCode,
    payLoad: "0",
    qrName: "test",
    orderId: 0,
    deviceCode: "TEST",
    status
  });

function doorPostBody(payload, doorCode) {
  if (payload === null || payload === undefined) {
    return rcsDoorPayload(doorCode, 1);
  }
  if (typeof payload === "object") {
    return JSON.stringify(payload);
  }
  if (typeof payload === "number") {
    return rcsDoorPayload(doorCode, payload);
  }
  return rcsDoorPayload(doorCode, 1);
}

/** POST /door/controldoor1 — คืน HTTP + body (ไม่ throw) */
export async function postDoor1(payload) {
  const res = await fetch(`${backendOrigin()}/door/controldoor1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: doorPostBody(payload, "MJ01")
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function postDoor2(payload) {
  const res = await fetch(`${backendOrigin()}/door/controldoor2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: doorPostBody(payload, "MJ02")
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function postDoor3(payload) {
  const res = await fetch(`${backendOrigin()}/door/controldoor3`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: doorPostBody(payload, "MJ03")
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function fetchDoorStatus1() {
  const res = await fetch(`${backendOrigin()}/door/getstatus1`);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function fetchDoorStatus2() {
  const res = await fetch(`${backendOrigin()}/door/getstatus2`);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function fetchDoorStatus3() {
  const res = await fetch(`${backendOrigin()}/door/getstatus3`);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

/** เคลียร์ output ทุกช่องบนบอร์ด lift1 + lift2 + ประตู */
export function clearAllTestOutputs() {
  return apiRequest("/test/clear-all-outputs", {
    method: "POST",
    body: "{}"
  });
}
