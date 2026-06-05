import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import ScreenLayout from "../components/ScreenLayout.jsx";
import MitsubishiLogo from "../components/Amr-mtm-str.jsx";
import { cancelOrder, fetchHistory } from "../api/client.js";

function Cancel() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("ALL");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetchHistory({ status, q: query })
      .then((data) => setItems(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [status, query]);

  const handleCancel = async (orderId) => {
    await cancelOrder(orderId);
    loadData();
  };

  const cancellable = items.filter((item) =>
    ["QUEUED", "RUNNING", "SENDING", "ISSUED"].includes(item.status)
  );

  return (
    <ScreenLayout title="ยกเลิกงาน" onBack={() => navigate("/")} onHome={() => navigate("/")}>
      <MitsubishiLogo />
      <Box sx={{ display: "flex", width: "100%", gap: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="ค้นหา งาน / คำสั่ง"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select size="small" value={status} onChange={(e) => setStatus(e.target.value)}>
          <MenuItem value="ALL">ทั้งหมด</MenuItem>
          <MenuItem value="QUEUED">Queued</MenuItem>
          <MenuItem value="RUNNING">On Task</MenuItem>
        </Select>
      </Box>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
          {cancellable.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              ไม่มีรายการให้ยกเลิก
            </Typography>
          ) : (
            cancellable.map((item) => (
              <Box
                key={item.orderId}
                sx={{
                  width: "100%",
                  borderRadius: 2,
                  border: "2px solid #111",
                  p: 2,
                  bgcolor: item.status === "CANCELLED" ? "#f8d7da" : "#fff"
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Box>
                    <Typography variant="body2">หมายเลขคำสั่ง : {item.orderId}</Typography>
                    <Typography variant="body2">รายละเอียด : {item.pickup?.name} → {item.drop?.name}</Typography>
                    <Typography variant="body2">สถานะหุ่นยนต์ : {item.status}</Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => handleCancel(item.orderId)}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ))
          )}
        </Box>
      )}
    </ScreenLayout>
  );
}

export default Cancel;
