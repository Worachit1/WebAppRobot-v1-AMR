import React from "react";
import { Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

import ScreenLayout from "../components/ScreenLayout.jsx";
import MitsubishiLogo from "../components/Amr-mtm-str.jsx";

function Home() {
  const navigate = useNavigate();
  return (
    <ScreenLayout title="หน้าหลัก" onBack={() => {}} showBack={false} onHome={() => navigate("/")}>
      <MitsubishiLogo />
      <Box sx={{ display: "flex", gap: 2, width: "100%", justifyContent: "center" }}>
        <Button
          variant="contained"
          color="primary"
          sx={{ flex: 1, borderRadius: 999, py: 1.2 }}
          onClick={() => navigate("/order/robot")}
        >
          สั่งงาน
        </Button>
        <Button
          variant="contained"
          color="inherit"
          sx={{ flex: 1, borderRadius: 999, py: 1.2, bgcolor: "#c8c8c8" }}
          onClick={() => navigate("/cancel")}
        >
          ยกเลิกงาน
        </Button>
      </Box>
      <Button
        variant="contained"
        color="primary"
        sx={{ borderRadius: 999, width: "100%", py: 1.4 }}
        onClick={() => navigate("/history")}
      >
        ประวัติการสั่งงาน
      </Button>
      <Button
        variant="outlined"
        color="primary"
        sx={{ borderRadius: 999, width: "100%", py: 1.4 }}
        onClick={() => navigate("/status")}
      >
        สถานะหุ่นยนต์
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        sx={{ borderRadius: 999, width: "100%", py: 1.4 }}
        onClick={() => navigate("/lift-test")}
      >
        ทดสอบลิฟต์ DT01
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        sx={{ borderRadius: 999, width: "100%", py: 1.4 }}
        onClick={() => navigate("/lift-test2")}
      >
        ทดสอบลิฟต์ DT02
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        sx={{ borderRadius: 999, width: "100%", py: 1.4 }}
        onClick={() => navigate("/door-test")}
      >
        ทดสอบประตู (บอร์ด 103)
      </Button>
    </ScreenLayout>
  );
}

export default Home;
