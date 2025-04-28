// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  Typography,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import MapIcon from "@mui/icons-material/Room";
import BarChartIcon from "@mui/icons-material/BarChart";
import palette from "../theme/palette";

const Sidebar = () => {
  const [status, setStatus] = useState("Fetching data...");
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetch(`${backendUrl}/api/cdc/data`)
      .then((response) => response.json())
      .then((data) => setStatus(data.status))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <Box
      sx={{
        width: "200px",
        height: "calc(100vh - 60px)",
        backgroundColor: palette.sidebar,
        color: palette.textPrimary,
        padding: "20px",
        position: "fixed",
        top: "60px",
        left: 0,
      }}
    >
      <Typography variant="h6" fontWeight="bold">
        Flu Finder Frontend
      </Typography>
      <Typography variant="body1">Backend Response: {status}</Typography>
      <h2>Quick Access</h2>
      <List>
        <ListItem button>
          <ListItemIcon>
            <HomeIcon sx={{ color: palette.textPrimary }} />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <MapIcon sx={{ color: palette.textPrimary }} />
          </ListItemIcon>
          <ListItemText primary="Interactive Map" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Domestic Poultry" />
          <Switch defaultChecked color="primary" />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <BarChartIcon sx={{ color: palette.textPrimary }} />
          </ListItemIcon>
          <ListItemText primary="Charts" />
        </ListItem>
      </List>
    </Box>
  );
};

export default Sidebar;
