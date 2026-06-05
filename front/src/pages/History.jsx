import React, { useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import ScreenLayout from "../components/ScreenLayout.jsx";
import MitsubishiLogo from "../components/Amr-mtm-str.jsx";
import { fetchHistory } from "../api/client.js";

import Pagination from "../components/Pagination.jsx";

const STATUS_COLORS = {
  COMPLETED: "success",
  CANCELLED: "error",
  RUNNING: "warning",
  QUEUED: "default",
  SEND_SUCCESS: "success",
  SEND_FAILED: "error",
  EXECUTION_FAILED: "error",
  SENDING: "warning",
};

function HistoryCard({ item }) {
  const chipColor = STATUS_COLORS[item.status] || "default";

  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: 2,
        border: "2px solid #111",
        p: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="body2">หมายเลขคำสั่ง : {item.orderId}</Typography>
        <Typography variant="body2">
          รายละเอียด : {item.pickup?.name} → {item.drop?.name}
        </Typography>
        <Typography variant="body2">
          เวลาดำเนินการ : {item.startedAt || "-"}
        </Typography>
        <Typography variant="body2">สถานะหุ่นยนต์ : {item.status}</Typography>
      </Box>
      <Chip label={item.status} color={chipColor} size="small" />
    </Box>
  );
}

function History() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("ALL");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const rowsPerPage = 4;

  useEffect(() => {
    setLoading(true);
    fetchHistory({ status, q: query })
      .then((data) => setItems(data))
      .finally(() => setLoading(false));
  }, [status, query]);

  const totalItems = items.length;
  const startIndex = (page - 1) * rowsPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [status, query]);

  return (
    <ScreenLayout
      title="ประวัติการสั่งงาน"
      onBack={() => navigate("/")}
      onHome={() => navigate("/")}
    >
      <MitsubishiLogo />
      <Box sx={{ display: "flex", width: "100%", gap: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="ค้นหา งาน / คำสั่ง"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <MenuItem value="ALL">ทั้งหมด</MenuItem>
          <MenuItem value="COMPLETED">Completed</MenuItem>
          <MenuItem value="CANCELLED">Cancel</MenuItem>
          <MenuItem value="RUNNING">On Task</MenuItem>
        </Select>
      </Box>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
          }}
        >
          {items.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              ไม่มีรายการ
            </Typography>
          ) : (
            <>
              {paginatedItems.map((item) => (
                <HistoryCard key={item.orderId} item={item} />
              ))}

              <Pagination
                page={page}
                totalItems={totalItems}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
              />
            </>
          )}
        </Box>
      )}
    </ScreenLayout>
  );
}

export default History;
