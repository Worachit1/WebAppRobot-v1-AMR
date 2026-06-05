import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import ScreenLayout from "../components/ScreenLayout.jsx";
import MitsubishiLogo from "../components/Amr-mtm-str.jsx";
import { fetchConfig } from "../api/client.js";
import { useOrder } from "../context/OrderContext.jsx";

function RobotCard({ robot, selected, onSelect }) {
  return (
    <Box
      onClick={() => onSelect(robot)}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        cursor: "pointer"
      }}
    >
      <Box
        sx={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          border: `4px solid ${selected ? "#1bb650" : "#222"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f6f6f6",
          overflow: "hidden"
        }}
      >
        {robot.imageUrl ? (
          <Box
            component="img"
            src={robot.imageUrl}
            alt={robot.name}
            sx={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {robot.name}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          px: 2,
          py: 0.5,
          borderRadius: 999,
          border: "2px solid #111",
          bgcolor: selected ? "#1bb650" : "#fff",
          color: selected ? "#fff" : "#111"
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {robot.name}
        </Typography>
      </Box>
    </Box>
  );
}

function OrderSelectRobot() {
  const navigate = useNavigate();
  const { robot, setRobot, reset } = useOrder();
  const [robots, setRobots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reset();
    fetchConfig()
      .then((config) => setRobots(config.robots || []))
      .finally(() => setLoading(false));
  }, [reset]);

  return (
    <ScreenLayout title="หน้าหลัก" onBack={() => navigate("/")} onHome={() => navigate("/")}>
      <MitsubishiLogo />
      <Box
        sx={{
          width: "100%",
          bgcolor: "#0b4dbb",
          color: "#fff",
          py: 1.2,
          px: 2,
          borderRadius: 999,
          textAlign: "center"
        }}
      >
        เลือกหุ่นยนต์ที่ต้องการสั่งงาน
      </Box>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          {robots.map((item) => (
            <RobotCard
              key={item.id}
              robot={item}
              selected={robot?.id === item.id}
              onSelect={setRobot}
            />
          ))}
        </Box>
      )}
      <Button
        variant="contained"
        color="secondary"
        sx={{ borderRadius: 999, width: "70%", py: 1.3, mt: 2 }}
        onClick={() => navigate("/order/pickup")}
        disabled={!robot}
      >
        Confirm
      </Button>
    </ScreenLayout>
  );
}

export default OrderSelectRobot;
