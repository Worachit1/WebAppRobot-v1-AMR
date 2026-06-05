import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0b4dbb"
    },
    secondary: {
      main: "#21b14b"
    }
  },
  shape: {
    borderRadius: 18
  },
  typography: {
    fontFamily: ["Segoe UI", "Roboto", "Arial", "sans-serif"].join(",")
  }
});

export default theme;
