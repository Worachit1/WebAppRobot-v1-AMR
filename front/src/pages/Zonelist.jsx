import { Box, Button, Typography, Dialog } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import taskAssignImg from "../../public/assets/images/location_task_assign.jpg";
import c060Img from "../../public/assets/images/C060.png";
import cartIcon from "../../public/assets/images/cartIcon.png";
import ScreenLayout from "../components/ScreenLayout";

import { fetchZonePick } from "../api/client";

const ZoneList = () => {
  const navigate = useNavigate();

  const [selectedCard, setSelectedCard] = useState(null);
  const [openSelect, setOpenSelect] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleSelectCard = (zone, group) => {
    setSelectedCard({
      zoneId: zone.id,
      zoneName: zone.name,
      groupId: group.id,
      groupName: group.name,
    });
    setOpenSelect(true);
  };
  useEffect(() => {
    setLoading(true);
    fetchZonePick()
      .then((res) => setItems(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScreenLayout onBack={() => navigate("/")} onHome={() => navigate("/")}>
      <Box
        sx={{
          width: "100%",
          minHeight: "80vh",
          p: 2,
        }}
      >
        <Box
          sx={{
            maxWidth: "420px",
            mx: "auto",
            backgroundColor: "#fff",
            p: 2,
            marginTop: "5px",
            padding: "12px",
          }}
        >
          <Typography
            sx={{
              textAlign: "center",
              color: "#0066c0",
              fontSize: "20px",
              fontWeight: 800,
              border: "2px solid #000",
              mb: 2,
              py: 0.5,
            }}
          >
            TASK ASSIGN
          </Typography>

          {items.map((zone, zoneIndex) => {
            const isFirstZone = zoneIndex === 0;

            return (
              <Box
                key={zone.id}
                sx={{
                  display: isFirstZone ? "grid" : "block",
                  gridTemplateColumns: isFirstZone ? "1fr 110px" : "1fr",
                  gap: 2,
                  mb: 2,
                  alignItems: "start",
                  minHeight: "120px"
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    p: 2,
                    pt: 3,
                    minHeight: isFirstZone ? "120px" : "auto",
                  }}
                >
                  <Typography
                    sx={{
                      position: "absolute",
                      top: "-12px",
                      left: "-2px",
                      minWidth: "150px",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: 800,
                      px: 1,
                      py: 0.3,
                      background:
                        "linear-gradient(90deg, #021024 0%, #003b8e 30%, #2f68ff 80%, rgba(106, 36, 218, 0.45) 90% , rgba(222, 222, 222, 0.3) 100%)",
                    }}
                  >
                    {zone.name}
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: isFirstZone
                        ? "1fr"
                        : "repeat(3, 1fr)",
                      gap: 2,
                      maxHeight: isFirstZone ? "85px" : "auto",
                      maxWidth: isFirstZone ? "85px" : "auto",
                    }}
                  >
                    {(zone.groups || []).map((group) => (
                      <Button
                        key={group.id}
                        variant="contained"
                        onClick={() => handleSelectCard(zone, group)}
                        sx={{
                          height: "85px",
                          backgroundColor: "#bdf8c7",
                          color: "#000",
                          borderRadius: "2px",
                          boxShadow: "4px 4px 6px rgba(0,0,0,0.25)",
                          display: "flex",
                          flexDirection: "column",
                          fontWeight: 800,
                          "&:hover": {
                            backgroundColor: "#a8efb5",
                          },
                        }}
                      >
                        <img
                          src={taskAssignImg}
                          alt="Task Assign"
                          style={{
                            width: "60px",
                            height: "30px",
                            objectFit: "contain",
                          }}
                        />

                        <Typography sx={{ fontSize: "16px", fontWeight: 800 }}>
                          {group.name}
                        </Typography>
                      </Button>
                    ))}
                  </Box>
                </Box>

                {isFirstZone && (
                  <Button
                    sx={{
                      height: "90px",
                      mt: 1,
                      bgcolor: "#a020a0",
                      color: "#fff",
                      borderRadius: "4px",
                      boxShadow: "4px 4px 6px rgba(0,0,0,0.35)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      fontWeight: 900,
                      "&:hover": {
                        bgcolor: "#8c168c",
                      },
                    }}
                  >
                    <Box sx={{ fontSize: "34px", lineHeight: 1 }}>
                      <i className="fa-solid fa-house"></i>
                    </Box>

                    <Typography sx={{ fontSize: "14px", fontWeight: 900 }}>
                      HOME
                    </Typography>
                  </Button>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
      <Dialog
        open={openSelect}
        onClose={() => setOpenSelect(false)}
        PaperProps={{
          sx: {
            width: "390px",
            borderRadius: "4px",
            border: "2px solid #000",
            boxShadow: "none",
            overflow: "hidden",
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(2px)",
          },
        }}
      >
        <Box>
          <Box
            sx={{
              height: "36px",
              bgcolor: "#5b9bd5",
              borderBottom: "2px solid #000",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pl: 1,
            }}
          >
            <Typography
              sx={{ fontSize: "16px", fontWeight: 900, color: "#000" }}
            >
              SELECT ASSIGN{" "}
              <i
                className="fa-solid fa-arrow-right-long c"
                style={{ color: "#d21919" }}
              ></i>{" "}
              <span style={{ color: "#e4d0d0" }}>
                {selectedCard?.groupName}
              </span>
            </Typography>

            <Box
              onClick={() => setOpenSelect(false)}
              sx={{
                width: "38px",
                height: "36px",
                borderLeft: "2px solid #000",
                position: "relative",
                cursor: "pointer",
                "&::before, &::after": {
                  content: '""',
                  position: "absolute",
                  top: "17px",
                  left: "4px",
                  width: "28px",
                  height: "2px",
                  bgcolor: "#000",
                },
                "&::before": {
                  transform: "rotate(45deg)",
                },
                "&::after": {
                  transform: "rotate(-45deg)",
                },
              }}
            />
          </Box>

          <Box
            sx={{
              bgcolor: "#fff",
              p: "28px 48px",
              display: "flex",
              flexDirection: "column",
              gap: "30px",
            }}
          >
            <Button
              onClick={() => {
                navigate(
                  `/task-assign/${encodeURIComponent(selectedCard?.zoneId)}?zoneName=${encodeURIComponent(selectedCard?.zoneName)}&groupId=${encodeURIComponent(selectedCard?.groupId)}&card=${encodeURIComponent(selectedCard?.groupName)}&type=CALL_AMR`,
                );
              }}
              sx={{
                height: "96px",
                bgcolor: "#d9d9d9",
                color: "#000",
                borderRadius: 0,
                boxShadow: "4px 4px 6px rgba(0,0,0,0.35)",
                display: "grid",
                gridTemplateColumns: "115px 1fr",
                gap: 2,
                px: 2,
                "&:hover": {
                  bgcolor: "#d0d0d0",
                },
              }}
            >
              <Box
                component="img"
                src={c060Img}
                alt="CALL AMR"
                sx={{
                  width: "100px",
                  height: "90px",
                  objectFit: "contain",
                }}
              />

              <Typography
                sx={{
                  fontSize: "22px",
                  fontWeight: 900,
                  lineHeight: 1.2,
                }}
              >
                CALL
                <br />
                AMR
              </Typography>
            </Button>

            <Button
              onClick={() => {
                navigate(
                  `/task-assign/${encodeURIComponent(selectedCard?.zoneId)}?zoneName=${encodeURIComponent(selectedCard?.zoneName)}&groupId=${encodeURIComponent(selectedCard?.groupId)}&card=${encodeURIComponent(selectedCard?.groupName)}&type=CART_STATION`,
                );
              }}
              sx={{
                mt: 3,
                height: "96px",
                bgcolor: "#d9d9d9",
                color: "#000",
                borderRadius: 0,
                boxShadow: "4px 4px 6px rgba(0,0,0,0.35)",
                display: "grid",
                gridTemplateColumns: "115px 1fr",
                gap: 2,
                px: 2,
                "&:hover": {
                  bgcolor: "#d0d0d0",
                },
              }}
            >
              <Box
                component="img"
                src={cartIcon}
                alt="CART STATION"
                sx={{
                  width: "100px",
                  height: "90px",
                  objectFit: "contain",
                }}
              />

              <Typography
                sx={{
                  fontSize: "22px",
                  fontWeight: 900,
                  lineHeight: 1.2,
                }}
              >
                CART
                <br />
                STATION
              </Typography>
            </Button>
          </Box>
        </Box>
      </Dialog>
    </ScreenLayout>
  );
};

export default ZoneList;
