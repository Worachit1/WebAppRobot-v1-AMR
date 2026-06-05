import { useEffect, useState } from "react";
import {
  Box,
  Pagination as MuiPagination,
  TextField,
  Typography,
} from "@mui/material";

function Pagination({ page, totalItems, rowsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const [pageInput, setPageInput] = useState(String(page));

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  if (totalPages <= 1) return null;

  const applyPageInput = () => {
    const value = Number(pageInput);

    if (!pageInput || Number.isNaN(value)) {
      setPageInput(String(page));
      return;
    }

    const nextPage = Math.min(Math.max(value, 1), totalPages);
    onPageChange(nextPage);
    setPageInput(String(nextPage));
  };

  return (
    <Box
      sx={{
        width: "100%",
        mt: 2,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <MuiPagination
        page={page}
        count={totalPages}
        color="primary"
        showFirstButton
        showLastButton
        siblingCount={1}
        boundaryCount={1}
        onChange={(_, value) => onPageChange(value)}
        sx={{
          "& .MuiPaginationItem-root": {
            fontSize: "0.8rem",
            minWidth: "28px",
            height: "28px",
          },
        }}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2">Go to</Typography>

        <TextField
          size="small"
          type="number"
          value={pageInput}
          sx={{ width: 80 }}
          inputProps={{
            min: 1,
            max: totalPages,
          }}
          onChange={(e) => {
            setPageInput(e.target.value);
          }}
          onBlur={applyPageInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              applyPageInput();
            }
          }}
        />

        <Typography variant="body2">/ {totalPages}</Typography>
      </Box>
    </Box>
  );
}

export default Pagination;
