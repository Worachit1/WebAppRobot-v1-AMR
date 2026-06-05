import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import ScreenLayout from "../components/ScreenLayout.jsx";
import MitsubishiLogo from "../components/Amr-mtm-str.jsx";
import { fetchConfig } from "../api/client.js";
import { useOrder } from "../context/OrderContext.jsx";

function OrderPickup() {
  const navigate = useNavigate();
  const { pickup, setPickup } = useOrder();
  const [config, setConfig] = useState(null);
  const [floorId, setFloorId] = useState("");
  const [spotId, setSpotId] = useState("");

  useEffect(() => {
    fetchConfig().then((data) => {
      setConfig(data);
      const list = data.pickupFloors || data.floors || [];
      if (list.length) {
        setFloorId(list[0].id);
      }
    });
  }, []);

  const floors = config?.pickupFloors || config?.floors || [];
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
    setPickup({ ...spot, floorId: floor.id, floorName: floor.name });
    navigate("/order/drop");
  };

  return (
    <ScreenLayout title="สั่งงาน" onBack={() => navigate("/order/robot")} onHome={() => navigate("/")}>
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
          {pickup && (
            <Typography variant="body2" color="text.secondary">
              Selected: {pickup.name}
            </Typography>
          )}
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

export default OrderPickup;
