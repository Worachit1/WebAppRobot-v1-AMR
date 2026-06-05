import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

import ScreenLayout from "../components/ScreenLayout.jsx";
import MitsubishiLogo from "../components/Amr-mtm-str.jsx";
import { fetchLift2Status, sendLift2Command, clearAllTestOutputs } from "../api/client.js";

const REFRESH_INTERVAL_MS = 3000;
const ACTION_GRID_SX = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 118px), 1fr))",
  gap: 1.5,
  width: "100%",
  minWidth: 0
};

function LiftTest2() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commandLoading, setCommandLoading] = useState(false);
  const [clearBusy, setClearBusy] = useState(false);
  const [error, setError] = useState("");

  const data = status?.data ?? status;
  const lift = {
    currentFloor:
      data?.currentFloor === 1
        ? "FL1"
        : data?.currentFloor === 2
          ? "FL2"
          : data?.currentFloor === 3
            ? "FL3"
            : "-",
    atFL1: data?.currentFloor === 1,
    atFL2: data?.currentFloor === 2,
    atFL3: data?.currentFloor === 3,
    doorOpen: data?.status === 0
  };
  const io = { rawBits: data?.rawBits, outputs: data?.outputs, inputs: data?.inputs };

  const loadStatus = async () => {
    try {
      setError("");
      const res = await fetchLift2Status();
      setStatus(res);
    } catch (err) {
      setError(err.message || "ไม่สามารถอ่านสถานะลิฟต์ DT02 ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const timer = setInterval(() => {
      fetchLift2Status()
        .then((res) => setStatus(res))
        .catch(() => {});
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const handleClearAll = async () => {
    try {
      setClearBusy(true);
      setError("");
      await clearAllTestOutputs();
      await loadStatus();
    } catch (err) {
      setError(err.message || "เคลียร์ output ไม่สำเร็จ");
    } finally {
      setClearBusy(false);
    }
  };

  const handleCommand = async (payload) => {
    try {
      setCommandLoading(true);
      setError("");
      const res = await sendLift2Command(payload);
      setStatus(res);
    } catch (err) {
      setError(err.message || "สั่งงานลิฟต์ DT02 ไม่สำเร็จ");
    } finally {
      setCommandLoading(false);
    }
  };

  return (
    <ScreenLayout title="ทดสอบลิฟต์ DT02" onBack={() => navigate("/")} onHome={() => navigate("/")}>
      <MitsubishiLogo />
      <Button
        variant="outlined"
        color="warning"
        fullWidth
        sx={{ borderRadius: 999, py: 1.1, mb: 1 }}
        disabled={clearBusy || loading}
        onClick={handleClearAll}
      >
        {clearBusy ? <CircularProgress size={22} /> : "เคลียร์ output ทุกบอร์ด"}
      </Button>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}

          <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              สถานะลิฟต์ DT02 (อัปเดตทุก 3 วินาที)
            </Typography>
            <Typography variant="body2">ชั้นปัจจุบัน : {lift.currentFloor}</Typography>
            <Typography variant="body2">ที่ชั้น 1 (FL1) : {lift.atFL1 ? "YES" : "NO"}</Typography>
            <Typography variant="body2">ที่ชั้น 2 (FL2) : {lift.atFL2 ? "YES" : "NO"}</Typography>
            <Typography variant="body2">ที่ชั้น 3 (FL3) : {lift.atFL3 ? "YES" : "NO"}</Typography>
            <Typography variant="body2">ประตูเปิดแล้ว : {lift.doorOpen ? "YES" : "NO"}</Typography>
          </Paper>

          <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Raw I/O (จากบอร์ด DT02)
            </Typography>
            <Typography variant="body2">Raw bits : {io.rawBits || "-"}</Typography>
            <Typography variant="body2">
              Outputs (O1 O2 O3 O4) :{" "}
              {(io.outputs || [])
                .slice(0, 4)
                .map((v, idx) => `O${idx + 1}=${v ? 1 : 0}`)
                .join("  ")}
            </Typography>
            <Typography variant="body2">
              Inputs (I1 I2 I3 I4) :{" "}
              {(io.inputs || [])
                .slice(0, 4)
                .map((v, idx) => `I${idx + 1}=${v ? 1 : 0}`)
                .join("  ")}
            </Typography>
          </Paper>

          <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              ควบคุมลิฟต์ DT02
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              ไปชั้น 1/2/3 = ส่งสัญญาณแล้วเคลียร์อัตโนมัติ (ไม่ค้าง). เปิดประตู = ค้างจนกว่ากดปิดประตู.
            </Typography>
            <Box sx={ACTION_GRID_SX}>
              <Button variant="contained" color="primary" fullWidth disabled={commandLoading} onClick={() => handleCommand({ command: "TO_FL1" })}>
                ไปชั้น 1 (FL1)
              </Button>
              <Button variant="contained" color="primary" fullWidth disabled={commandLoading} onClick={() => handleCommand({ command: "TO_FL2" })}>
                ไปชั้น 2 (FL2)
              </Button>
              <Button variant="contained" color="primary" fullWidth disabled={commandLoading} onClick={() => handleCommand({ command: "TO_FL3" })}>
                ไปชั้น 3 (FL3)
              </Button>
              <Button variant="contained" color="secondary" fullWidth disabled={commandLoading} onClick={() => handleCommand({ command: "OPEN_DOOR" })}>
                เปิดประตู (ค้าง)
              </Button>
              <Button variant="outlined" color="secondary" fullWidth disabled={commandLoading} onClick={() => handleCommand({ command: "CLOSE_DOOR" })}>
                ปิดประตู (เคลียร์ output)
              </Button>
              <Button variant="outlined" fullWidth disabled={commandLoading} onClick={() => handleCommand({ command: "MOVE_AND_OPEN", floor: 1 })}>
                ไป FL1 + เปิดประตู
              </Button>
              <Button variant="outlined" fullWidth disabled={commandLoading} onClick={() => handleCommand({ command: "MOVE_AND_OPEN", floor: 2 })}>
                ไป FL2 + เปิดประตู
              </Button>
              <Button variant="outlined" fullWidth disabled={commandLoading} onClick={() => handleCommand({ command: "MOVE_AND_OPEN", floor: 3 })}>
                ไป FL3 + เปิดประตู
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </ScreenLayout>
  );
}

export default LiftTest2;
