const fs = require("fs/promises");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");

async function ensureFile(fileName, fallback) {
  const filePath = path.join(dataDir, fileName);
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8");
  }
  return filePath;
}

async function readJson(fileName, fallback) {
  const filePath = await ensureFile(fileName, fallback);
  const raw = await fs.readFile(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(fileName, data) {
  const filePath = await ensureFile(fileName, data);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function getConfig() {
  return readJson("config.json", {});
}

async function saveConfig(config) {
  await writeJson("config.json", config);
}

async function getUsers() {
  return readJson("users.json", { users: [] });
}

async function getHistory() {
  return readJson("history.json", []);
}

async function saveHistory(history) {
  await writeJson("history.json", history);
}

module.exports = {
  getConfig,
  saveConfig,
  getUsers,
  getHistory,
  saveHistory
};
