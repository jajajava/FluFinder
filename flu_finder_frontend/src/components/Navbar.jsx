import React, { useState } from "react";
import { Box, Typography, IconButton, Drawer, useMediaQuery } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import LocationSelector from "./LocationSelector";
import VisualizationToggle from "./VisualizationToggle";
import TimePeriodSelector from "./TimePeriodSelector";
import palette from "../theme/palette";

const Navbar = ({ view, onViewChange, chartType, onChartTypeChange }) => {
  const isMobile = useMediaQuery('(max-width:768px)');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLocationChange = async ({ state, county }) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      // If both state and county are selected, fetch specific county data
      if (state && county) {
        const response = await fetch(`${backendUrl}/api/state/${state}/county/${county}/data`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('County data:', data);

        // Here you would update your map view and data displays
        // This could involve dispatching to a Redux store or using context
        // For now, we'll just log the data
      }
      // If only state is selected, fetch state-level data
      else if (state) {
        const response = await fetch(`${backendUrl}/api/state/${state}/data`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('State data:', data);

        // Update state-level view
      }

      // Close the drawer after selection on mobile
      if (isMobile) {
        setDrawerOpen(false);
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
      // Here you might want to show an error message to the user
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box
      sx={{
        // height: isMobile ? "7.1%" : "3.75rem",
        height: "3.75rem",
        backgroundColor: palette.primary,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "center",
        padding: isMobile ? "0.5rem 1rem" : "0 1.25rem",
        width: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        justifyContent: isMobile ? "flex-start" : "flex-start",
        gap: isMobile ? "0.5rem" : "1.25rem",
        overflowX: "auto",
        boxSizing: "border-box",
        "&::-webkit-scrollbar": {
          height: "0.25rem",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderRadius: "0.25rem",
        },
      }}
    >
      <Box sx={{
        display: "flex",
        alignItems: "center",
        width: isMobile ? "100%" : "auto",
        justifyContent: isMobile ? "space-between" : "flex-start",
        paddingTop: isMobile ? '1%' : 0,
      }}>
        <Typography
          variant="h1"
          sx={{
            color: palette.textPrimary,
            fontWeight: "bold",
            fontSize: "1.3rem",
            whiteSpace: "nowrap",
            marginRight: isMobile ? "0" : "2.5rem",
          }}
        >
          FluFinder
        </Typography>

        {isMobile && (
          <IconButton
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
            sx={{ color: palette.textPrimary }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Box>

      {!isMobile ? (
        <Box sx={{
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          flexWrap: "nowrap",
          minWidth: "0",
          width: "auto",
          marginLeft: "2rem",
          marginRight: "auto",
        }}>
          <LocationSelector onLocationChange={handleLocationChange} />
          <VisualizationToggle
            view={view}
            onViewChange={onViewChange}
            chartType={chartType}
            onChartTypeChange={onChartTypeChange}
          />
          {view === "chart" && (
            <Box sx={{ 
              ml: 2,
              '& .MuiTextField-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '4px',
              }
            }}>
              <TimePeriodSelector view={view} />
            </Box>
          )}
        </Box>
      ) : (
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <Box
            sx={{
              width: "15rem",
              padding: "1.25rem",
              backgroundColor: palette.primary,
              height: "100%",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: palette.textPrimary,
                fontWeight: "bold",
                marginBottom: "1.25rem",
              }}
            >
              Menu
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center"}}>
              <LocationSelector onLocationChange={handleLocationChange} />
              <VisualizationToggle
                view={view}
                onViewChange={onViewChange}
                chartType={chartType}
                onChartTypeChange={onChartTypeChange}
                isMobile={true}
              />
              {view === "chart" && (
                <Box sx={{ 
                  '& .MuiTextField-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '4px',
                  }
                }}>
                  <TimePeriodSelector view={view} />
                </Box>
              )}
            </Box>
          </Box>
        </Drawer>
      )}
    </Box>
  );
};

export default Navbar;
