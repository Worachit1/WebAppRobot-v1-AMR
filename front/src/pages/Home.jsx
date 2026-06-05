import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import ScreenLayout from "../components/ScreenLayout.jsx";
import MitsubishiLogo from "../components/Amr-mtm-str.jsx";

import taskAssignImg from "../../public/assets/images/location_task_assign.jpg";

const TEST_PASSWORD = "AMECAMR26";

function Home() {
  const navigate = useNavigate();
  const [pendingPath, setPendingPath] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const openPasswordDialog = (path) => {
    setPendingPath(path);
    setPassword("");
    setError("");
  };

  const closeDialog = () => {
    setPendingPath(null);
    setPassword("");
    setError("");
  };

  const submitPassword = () => {
    if (password === TEST_PASSWORD) {
      const target = pendingPath;
      closeDialog();
      navigate(target);
    } else {
      setError("รหัสผ่านไม่ถูกต้อง");
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") submitPassword();
  };

  return (
    <ScreenLayout
      title="Home"
      onBack={() => {}}
      showBack={false}
      onHome={() => navigate("/")}
    >
      <MitsubishiLogo />

      <Box
        sx={{
          display: "flex",
          gap: 2,
          width: "100%",
          justifyContent: "center",
        }}
      >
        <Button
          variant="contained"
          onClick={() => navigate("/zone-list")}
          sx={{
            flex: 1,
            minHeight: 180,
            borderRadius: "4px",
            backgroundColor: "#f5f5f5",
            color: "#0066c0",
            fontSize: "18px",
            fontWeight: 800,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "2px",
            boxShadow: "4px 4px 8px rgba(0,0,0,0.25)",
            "&:hover": {
              backgroundColor: "#ececec",
              boxShadow: "6px 6px 12px rgba(0,0,0,0.3)",
            },
          }}
        >
          <span>TASK ASSIGN</span>

          <img
            src={taskAssignImg}
            alt="Task Assign"
            style={{
              width: "150px",
              height: "100px",
              objectFit: "contain",
            }}
          />
        </Button>
        <Button
          variant="contained"
          color="inherit"
          sx={{
            flex: 1,
            minHeight: 180,
            borderRadius: "4px",
            backgroundColor: "#f5f5f5",
            color: "#0066c0",
            fontSize: "18px",
            fontWeight: 800,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "2px",
            boxShadow: "4px 4px 8px rgba(0,0,0,0.25)",
            "&:hover": {
              backgroundColor: "#ececec",
              boxShadow: "6px 6px 12px rgba(0,0,0,0.3)",
            },
          }}
          onClick={() => navigate("/status")}
        >
          <span>TASK STATUS</span>
          <Box sx={{ fontSize: "56px", color: "#000" }}>
            <i className="fa-solid fa-chart-pie"></i>
          </Box>
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          width: "100%",
          justifyContent: "center",
        }}
      >
        <Button
          variant="contained"
          color="inherit"
          sx={{
            flex: 1,
            minHeight: 180,
            borderRadius: "4px",
            backgroundColor: "#f5f5f5",
            color: "#0066c0",
            fontSize: "18px",
            fontWeight: 800,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "2px",
            boxShadow: "4px 4px 8px rgba(0,0,0,0.25)",
            "&:hover": {
              backgroundColor: "#ececec",
              boxShadow: "6px 6px 12px rgba(0,0,0,0.3)",
            },
          }}
          onClick={() => navigate("/cancel")}
        >
          <span>TASK HISTORY</span>
          <Box
            sx={{
              fontSize: "56px",
              position: "relative",
              width: "70px",
              height: "90px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#000",
            }}
          >
            <i className="fa-regular fa-file-lines"></i>

            <i
              className="fa-solid fa-clock"
              style={{
                position: "absolute",
                right: "0",
                bottom: "4px",
                fontSize: "24px",
                backgroundColor: "#f5f5f5",
                borderRadius: "50%",
                padding: "2px",
                height: "32px",
              }}
            />
          </Box>
        </Button>
        <Button
          variant="contained"
          color="inherit"
          sx={{
            flex: 1,
            minHeight: 180,
            borderRadius: "4px",
            backgroundColor: "#f5f5f5",
            color: "#0066c0",
            fontSize: "18px",
            fontWeight: 800,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "2px",
            boxShadow: "4px 4px 8px rgba(0,0,0,0.25)",
            "&:hover": {
              backgroundColor: "#ececec",
              boxShadow: "6px 6px 12px rgba(0,0,0,0.3)",
            },
          }}
          onClick={() => navigate("/cancel")}
        >
          <span>UTILIZATION</span>
          <Box
            sx={{
              fontSize: "56px",
              position: "relative",
              width: "80px",
              height: "90px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#000",
            }}
          >
            <i className="fa-solid fa-chart-column"></i>

            <i
              className="fa-solid fa-clock"
              style={{
                position: "absolute",
                left: "0",
                bottom: "0",
                fontSize: "24px",
                backgroundColor: "#f5f5f5",
                borderRadius: "50%",
                padding: "2px",
                height: "35px",
              }}
            />
          </Box>
        </Button>
      </Box>

      {/* <Button
        variant="contained"
        color="primary"
        sx={{ borderRadius: "10px", width: "100%", py: 1.4 }}
        onClick={() => navigate("/history")}
      >
        ประวัติการสั่งงาน
      </Button>
      <Button
        variant="outlined"
        color="primary"
        sx={{ borderRadius: "10px", width: "100%", py: 1.4 }}
        onClick={() => navigate("/status")}
      >
        สถานะหุ่นยนต์
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        sx={{ borderRadius: "10px", width: "100%", py: 1.4 }}
        onClick={() => openPasswordDialog("/lift-test")}
      >
        ทดสอบลิฟต์ DT01
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        sx={{ borderRadius: "10px", width: "100%", py: 1.4 }}
        onClick={() => openPasswordDialog("/lift-test2")}
      >
        ทดสอบลิฟต์ DT02
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        sx={{ borderRadius: "10px", width: "100%", py: 1.4 }}
        onClick={() => openPasswordDialog("/door-test")}
      >
        ทดสอบประตู (บอร์ด 103)
      </Button> */}

      <Dialog
        open={Boolean(pendingPath)}
        onClose={closeDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>กรอกรหัสผ่านเพื่อเข้าหน้าทดสอบ</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="รหัสผ่าน"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={onKeyDown}
            sx={{ mt: 1 }}
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>ยกเลิก</Button>
          <Button variant="contained" onClick={submitPassword}>
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>
    </ScreenLayout>
  );
}

export default Home;
