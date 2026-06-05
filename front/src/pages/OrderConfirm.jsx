import React, { useState } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import ScreenLayout from "../components/ScreenLayout.jsx";
import MitsubishiLogo from "../components/Amr-mtm-str.jsx";
import { createOrder } from "../api/client.js";
import { useOrder } from "../context/OrderContext.jsx";

const FIXED_ROBOT = { id: "c040", name: "C40" };

function OrderConfirm() {
  const navigate = useNavigate();
  const { robot, pickup, drop } = useOrder();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!pickup || !drop) {
      setError("Missing order data");
      return;
    }
    const selectedRobot = robot || FIXED_ROBOT;
    setLoading(true);
    setError("");
    try {
      const res = await createOrder({
        robotId: selectedRobot.id,
        pickupSpotId: pickup.id,
        dropSpotId: drop.id
      });
      navigate("/order/success", { state: { orderId: res.orderId } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="สั่งงาน" onBack={() => navigate("/order/drop")} onHome={() => navigate("/")}>
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
        จุด/รายการ ที่ต้องการให้หุ่นยนต์มารับ
      </Box>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          borderRadius: 2,
          border: "2px solid #111",
          p: 2
        }}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
          <Typography sx={{ fontWeight: 600 }}>ROBOT</Typography>
          <Typography>{(robot || FIXED_ROBOT).name}</Typography>
          <Typography sx={{ fontWeight: 600 }}>PICK-UP LOC</Typography>
          <Typography>{pickup?.name || "-"}</Typography>
          <Typography sx={{ fontWeight: 600 }}>DROP LOC</Typography>
          <Typography>{drop?.name || "-"}</Typography>
        </Box>
      </Paper>
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
      <Button
        variant="contained"
        color="secondary"
        sx={{ borderRadius: 999, width: "70%", py: 1.3 }}
        onClick={handleConfirm}
        disabled={loading}
      >
        Confirm
      </Button>
    </ScreenLayout>
  );
}

export default OrderConfirm;
