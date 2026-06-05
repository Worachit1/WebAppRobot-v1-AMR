import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Typography,
  CircularProgress,
} from "@mui/material";
import ScreenLayout from "../components/ScreenLayout.jsx";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { fetchZonePick, fetchZoneDrop } from "../api/client.js";
import cartT2Img from "../../public/assets/images/cart/Cart T2.png";
import cartT3Img from "../../public/assets/images/cart/Cart T3.png";
import cartT6Img from "../../public/assets/images/cart/Cart T6.png";

import { dropRules } from "../config/dropRules.js";

const cartTypes = [
  { id: 1, img: cartT2Img },
  { id: 2, img: cartT3Img },
  { id: 3, img: cartT6Img },
];

const formatSpotName = (name = "") => {
  return String(name).replace(/_/g, " ");
};

function TaskAssign() {
  const navigate = useNavigate();

  const { zoneId } = useParams();
  const [searchParams] = useSearchParams();

  const groupId = searchParams.get("groupId");
  const card = searchParams.get("card");
  const type = searchParams.get("type");

  const [loading, setLoading] = useState(true);

  const [pickup, setPickup] = useState("");
  const [dropOff, setDropOff] = useState("");

  const [pickupStations, setPickupStations] = useState([]);
  const [dropStations, setDropStations] = useState([]);

  const [cartType, setCartType] = useState("");
  const canSelectCart = Boolean(pickup && dropOff);

  useEffect(() => {
    setLoading(true);

    Promise.all([fetchZonePick(), fetchZoneDrop()])
      .then(([pickRes, dropRes]) => {
        const pickZones = pickRes?.data || [];
        const dropZones = dropRes?.data || [];

        const selectedGroup = pickZones
          .flatMap((zone) => zone.groups || [])
          .find((group) => group.id === groupId);

        const allDropSpots = dropZones.flatMap((zone) =>
          (zone.groups || []).flatMap((group) => group.spots || []),
        );

        setPickupStations(selectedGroup?.spots || []);
        setDropStations(allDropSpots);
      })
      .finally(() => setLoading(false));
  }, [groupId]);

  const dropOptions = useMemo(() => {
  if (!pickup) return dropStations;

  const allowedDropIds = dropRules[pickup];

  if (!allowedDropIds) return dropStations;

  return dropStations.filter((station) =>
    allowedDropIds.includes(station.id),
  );
}, [pickup, dropStations]);

const selectedDropStation = useMemo(() => {
  return dropStations.find((station) => station.id === dropOff);
}, [dropStations, dropOff]);

const dropStatus = selectedDropStation?.statusClass || "";

  const handlePickupChange = (value) => {
    setPickup(value);
    setCartType("");

    const allowedDropIds = dropRules[value];

    const nextDropOptions = allowedDropIds
      ? dropStations.filter((station) => allowedDropIds.includes(station.id))
      : dropStations;

    if (!nextDropOptions.some((station) => station.id === dropOff)) {
      setDropOff("");
    }
  };
  if (loading) {
    return (
      <ScreenLayout
        onBack={() => navigate("/zone-list")}
        onHome={() => navigate("/")}
      >
        <CircularProgress />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      onBack={() => navigate("/zone-list")}
      onHome={() => navigate("/")}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 460,
          mx: "auto",
          p: 2,
          bgcolor: "#fff",
        }}
      >
        <Typography
          sx={{
            textAlign: "center",
            color: "#0066c0",
            fontSize: 24,
            fontWeight: 900,
            border: "2px solid #000",
            mb: 2,
          }}
        >
          TASK ASSIGN
        </Typography>

        <Typography
          sx={{
            textAlign: "center",
            bgcolor: "#dff5d8",
            border: "1px solid #000",
            fontSize: 22,
            fontWeight: 900,
            py: 1,
            mb: 3,
          }}
        >
          {card}
        </Typography>

        <Typography sx={{ fontSize: 22, fontWeight: 900, mb: 1 }}>
          PICKUP
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <Select
            value={pickup}
            displayEmpty
            onChange={(e) => handlePickupChange(e.target.value)}
            sx={{
              height: 64,
              fontSize: 20,
              borderRadius: "4px",
              bgcolor: "#fff",
              "& .MuiSelect-icon": {
                bgcolor: "#9fe3ff",
                height: "100%",
                width: 72,
                top: 0,
                right: 0,
              },
            }}
          >
            <MenuItem value="" disabled>
              ---Select Pickup Station---
            </MenuItem>
            {pickupStations.map((station) => (
              <MenuItem key={station.id} value={station.id}>
                {formatSpotName(station.name)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography sx={{ fontSize: 22, fontWeight: 900, mb: 1 }}>
          DROP OFF
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <Select
            value={dropOff}
            displayEmpty
            disabled={!pickup}
            onChange={(e) => {
              setDropOff(e.target.value);
              setCartType("");
            }}
            sx={{
              height: 64,
              fontSize: 20,
              borderRadius: "4px",
              bgcolor: "#fff",
              "& .MuiSelect-icon": {
                bgcolor: "#9fe3ff",
                height: "100%",
                width: 72,
                top: 0,
                right: 0,
              },
            }}
          >
            <MenuItem value="" disabled>
              ---Select Drop Off Station---
            </MenuItem>
            {dropOptions.map((station) => (
              <MenuItem key={station.id} value={station.id}>
                {formatSpotName(station.name)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography sx={{ fontSize: 22, fontWeight: 900, mb: 1 }}>
          CART TYPE
        </Typography>

        <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
          {cartTypes.map((cart) => {
            const isSelected = cartType === cart.id;

            return (
              <Button
                key={cart.id}
                disabled={!canSelectCart}
                onClick={() => setCartType(cart.id)}
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: "4px",
                  border: isSelected ? "4px solid #000" : "2px solid #333",
                  bgcolor: "#fff",
                  color: "#000",
                  p: 0.5,
                  opacity: canSelectCart ? 1 : 0.45,
                  cursor: canSelectCart ? "pointer" : "not-allowed",
                  "&:hover": {
                    bgcolor: "#fff",
                  },
                  "&.Mui-disabled": {
                    bgcolor: "#fff",
                  },
                }}
              >
                <Box
                  component="img"
                  src={cart.img}
                  alt={`Cart type ${cart.id}`}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    filter: isSelected ? "none" : "grayscale(100%)",
                  }}
                />
              </Button>
            );
          })}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 4,
          }}
        >
          <Typography sx={{ fontSize: 22, fontWeight: 900 }}>
            DROP OFF STATUS :
          </Typography>

          <Button
            disabled
            sx={{
              minWidth: 120,
              height: 48,
              borderRadius: "4px",
              bgcolor: dropStatus === "full" ? "#ed6c2f" : "#2e7d32",
              color: "#fff !important",
              fontSize: 18,
              fontWeight: 900,
              "&.Mui-disabled": {
                bgcolor: dropStatus === "full" ? "#ed6c2f" : "#2e7d32",
                color: "#fff",
                opacity: 1,
              },
            }}
          >
            {dropStatus ? dropStatus.toUpperCase() : "-"}
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            onClick={() => navigate(-1)}
            sx={{
              color: "#000",
              fontSize: 24,
              fontWeight: 800,
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            disabled={!pickup || !dropOff || !cartType}
            variant="contained"
            sx={{
              minWidth: 170,
              height: 64,
              fontSize: 28,
              fontWeight: 900,
              borderRadius: "4px",
              textTransform: "none",
            }}
          >
            Confirm
          </Button>
        </Box>
      </Box>
    </ScreenLayout>
  );
}

export default TaskAssign;
