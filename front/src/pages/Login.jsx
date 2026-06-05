import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import MitsubishiLogo from "../components/Amr-mtm-str.jsx";
import { login } from "../api/client.js";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(username, password);
      localStorage.setItem("authUser", res.username);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 2
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 360 }}>
        <MitsubishiLogo />
        <Typography variant="subtitle1" align="center" sx={{ mb: 2 }}>
          ล็อคอินเข้าสู่ระบบ
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="รหัสผ่าน"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, borderRadius: 999 }}
            disabled={loading}
          >
            เข้าสู่ระบบ
          </Button>
        </form>
      </Box>
    </Box>
  );
}

export default Login;
