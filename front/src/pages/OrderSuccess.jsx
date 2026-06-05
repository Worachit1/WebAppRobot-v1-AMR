import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

import ScreenLayout from "../components/ScreenLayout.jsx";
import MitsubishiLogo from "../components/Amr-mtm-str.jsx";
import { useOrder } from "../context/OrderContext.jsx";

function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pickup, drop, reset } = useOrder();
  const orderId = location.state?.orderId;

  const handleBackHome = () => {
    reset();
    navigate("/");
  };

  return (
    <ScreenLayout title="สั่งงาน" onBack={() => navigate("/")} onHome={handleBackHome}>
      <MitsubishiLogo />
      <Box
        sx={{
          width: "100%",
          bgcolor: "#78d058",
          color: "#fff",
          py: 3,
          px: 2,
          borderRadius: 3,
          textAlign: "center",
          border: "3px solid #111"
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          สั่งงานเสร็จสิ้นแล้ว
        </Typography>
        {orderId && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            หมายเลขคำสั่ง : {orderId}
          </Typography>
        )}
        <Typography variant="subtitle2" sx={{ mt: 1 }}>
          {pickup?.name || "-"} &gt; {drop?.name || "-"}
        </Typography>
      </Box>
      <Button
        variant="contained"
        color="secondary"
        sx={{ borderRadius: 999, width: "70%", py: 1.3 }}
        onClick={handleBackHome}
      >
        กลับหน้าหลัก
      </Button>
    </ScreenLayout>
  );
}

export default OrderSuccess;
