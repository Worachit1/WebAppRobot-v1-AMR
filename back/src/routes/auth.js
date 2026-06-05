const express = require("express");
const { getUsers } = require("../services/store");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  const data = await getUsers();
  const user = data.users?.find(
    (item) => item.username === username && item.password === password
  );
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({ ok: true, username: user.username });
});

module.exports = router;
