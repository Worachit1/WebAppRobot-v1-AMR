import React, { useState } from "react";
import { Box, Button, CircularProgress, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

import ScreenLayout from "../components/ScreenLayout.jsx";
import MitsubishiLogo from "../components/Amr-mtm-str.jsx";
import {
  postDoor1,
  postDoor2,
  postDoor3,
  fetchDoorStatus1,
  fetchDoorStatus2,
  fetchDoorStatus3,
  clearAllTestOutputs
} from "../api/client.js";

function DoorTest() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [clearBusy, setClearBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastDoor1, setLastDoor1] = useState(null);
  const [lastDoor2, setLastDoor2] = useState(null);
  const [lastDoor3, setLastDoor3] = useState(null);
  const [lastStatus1, setLastStatus1] = useState(null);
  const [lastStatus2, setLastStatus2] = useState(null);
  const [lastStatus3, setLastStatus3] = useState(null);
  const [lastClear, setLastClear] = useState(null);

  const runClear = async () => {
    try {
      setClearBusy(true);
      setError("");
      const res = await clearAllTestOutputs();
      setLastClear(res);
    } catch (err) {
      setError(err.message || "เคลียร์ไม่สำเร็จ");
    } finally {
      setClearBusy(false);
    }
  };

  /** status RCS ตาม manual 3.2.3: 1=ขอเปิด, 2=ขอปิด */
  const hitDoor1 = async (status) => {
    try {
      setBusy(true);
      setError("");
      const r = await postDoor1(status);
      setLastDoor1(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const hitDoor2 = async (status) => {
    try {
      setBusy(true);
      setError("");
      const r = await postDoor2(status);
      setLastDoor2(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const hitDoor3 = async (status) => {
    try {
      setBusy(true);
      setError("");
      const r = await postDoor3(status);
      setLastDoor3(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const refreshStatus = async () => {
    try {
      setBusy(true);
      setError("");
      const [s1, s2, s3] = await Promise.all([
        fetchDoorStatus1(),
        fetchDoorStatus2(),
        fetchDoorStatus3()
      ]);
      setLastStatus1(s1);
      setLastStatus2(s2);
      setLastStatus3(s3);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenLayout title="ทดสอบประตู" onBack={() => navigate("/")} onHome={() => navigate("/")}>
      <MitsubishiLogo />

      <Button
        variant="outlined"
        color="warning"
        fullWidth
        sx={{ borderRadius: 999, py: 1.2, mb: 1 }}
        disabled={clearBusy}
        onClick={runClear}
      >
        {clearBusy ? <CircularProgress size={22} /> : "เคลียร์ output ทุกบอร์ด (100/102/103)"}
      </Button>
      {lastClear && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          เคลียร์ล่าสุด: {JSON.stringify(lastClear)}
        </Typography>
      )}

      <Paper elevation={3} sx={{ p: 2, borderRadius: 2, width: "100%" }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          บอร์ดประตู 192.168.1.103
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          POST body ใช้ status ตาม manual 3.2.3: 1 → ขอเปิด, 2 → ขอปิด · คำสั่งซ้ำสถานะเดิมไม่ยิง I/O ซ้ำ · ไม่มีเรียก 10 วิ → ปิด output อัตโนมัติ
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          Door1: O1 · Door2: O2 · Door3: O3 · GET/POST /door/getstatus1|2|3 คืน 1=เปิดสุด 2=ปิดสุด (manual 3.2.4)
        </Typography>

        <Button variant="outlined" fullWidth sx={{ mb: 2 }} disabled={busy} onClick={refreshStatus}>
          อ่าน GET /door/getstatus1 + getstatus2 + getstatus3
        </Button>
        {(lastStatus1 || lastStatus2 || lastStatus3) && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            s1: {lastStatus1 ? JSON.stringify(lastStatus1.data) : "-"} | s2:{" "}
            {lastStatus2 ? JSON.stringify(lastStatus2.data) : "-"} | s3:{" "}
            {lastStatus3 ? JSON.stringify(lastStatus3.data) : "-"}
          </Typography>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" color="primary" fullWidth disabled={busy} onClick={() => hitDoor1(1)}>
              door1 เปิด (status 1)
            </Button>
            <Button variant="outlined" color="primary" fullWidth disabled={busy} onClick={() => hitDoor1(2)}>
              door1 ปิด (status 2)
            </Button>
          </Box>
          {lastDoor1 && (
            <Typography variant="body2">
              controldoor1 ล่าสุด: HTTP {lastDoor1.status} — {JSON.stringify(lastDoor1.data)}
            </Typography>
          )}

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" color="secondary" fullWidth disabled={busy} onClick={() => hitDoor2(1)}>
              door2 เปิด (status 1)
            </Button>
            <Button variant="outlined" color="secondary" fullWidth disabled={busy} onClick={() => hitDoor2(2)}>
              door2 ปิด (status 2)
            </Button>
          </Box>
          {lastDoor2 && (
            <Typography variant="body2">
              controldoor2 ล่าสุด: HTTP {lastDoor2.status} — {JSON.stringify(lastDoor2.data)}
            </Typography>
          )}

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" color="success" fullWidth disabled={busy} onClick={() => hitDoor3(1)}>
              door3 เปิด (status 1)
            </Button>
            <Button variant="outlined" color="success" fullWidth disabled={busy} onClick={() => hitDoor3(2)}>
              door3 ปิด (status 2)
            </Button>
          </Box>
          {lastDoor3 && (
            <Typography variant="body2">
              controldoor3 ล่าสุด: HTTP {lastDoor3.status} — {JSON.stringify(lastDoor3.data)}
            </Typography>
          )}
        </Box>
      </Paper>

      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
    </ScreenLayout>
  );
}

export default DoorTest;
