import React from "react";
import { Box } from "@mui/material";
import ChoroplethMap from "../components/ChoroplethMap";

const Homepage = () => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: "60px",
        left: "270px",
        right: 0,
        bottom: 0,
        padding: "20px",
        overflow: "hidden"
      }}
    >
      <Box
        sx={{
          height: "100%",
          width: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid #ccc"
        }}
      >
        <ChoroplethMap />
      </Box>
    </Box>
  );
};

export default Homepage;
