import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  MenuItem,
  Select
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import ScreenLayout from "../components/ScreenLayout.jsx";
import MitsubishiLogo from "../components/Amr-mtm-str.jsx";
import { fetchConfig } from "../api/client.js";
import { useOrder } from "../context/OrderContext.jsx";

function OrderDrop() {
  const navigate = useNavigate();
  const { drop, setDrop } = useOrder();
  const [config, setConfig] = useState(null);
  const [floorId, setFloorId] = useState("");
  const [spotId, setSpotId] = useState("");

  useEffect(() => {
    fetchConfig().then((data) => {
      setConfig(data);
      const list = data.dropFloors || data.floors || [];
      if (list.length) {
        setFloorId(list[0].id);
      }
    });
  }, []);

  const floors = config?.dropFloors || config?.floors || [];
  const floor = useMemo(() => {
    return floors.find((item) => item.id === floorId);
  }, [floors, floorId]);

  useEffect(() => {
    if (floor?.spots?.length) {
      setSpotId(floor.spots[0].id);
    }
  }, [floor]);

  const handleNext = () => {
    if (!floor || !spotId) return;
    const spot = floor.spots.find((item) => item.id === spotId);
    setDrop({ ...spot, floorId: floor.id, floorName: floor.name });
    navigate("/order/confirm");
  };

  return (
    <ScreenLayout title="สั่งงาน" onBack={() => navigate("/order/pickup")} onHome={() => navigate("/")}>
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
        เลือกจุดส่ง
      </Box>
      {!config ? (
        <CircularProgress />
      ) : (
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl fullWidth>
            <Select value={floorId} onChange={(e) => setFloorId(e.target.value)}>
              {floors.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <Select value={spotId} onChange={(e) => setSpotId(e.target.value)}>
              {floor?.spots?.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
      <Button
        variant="contained"
        color="secondary"
        sx={{ borderRadius: 999, width: "70%", py: 1.3 }}
        onClick={handleNext}
        disabled={!spotId}
      >
        Confirm
      </Button>
    </ScreenLayout>
  );
}

export default OrderDrop;
