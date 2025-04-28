import React, { useState } from "react";
import { Box, CircularProgress, Alert, Snackbar, useMediaQuery } from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Navbar from "./components/Navbar";
import LatestInfections from "./components/LatestInfections";
import ChoroplethMap from "./components/ChoroplethMap";
import ChartView from "./components/ChartView";
import BirdFluResources from "./components/BirdFluResources";
import { LocationProvider, useLocation } from "./context/LocationContext";
import { TimePeriodProvider } from "./context/TimePeriodContext";
import TimePeriodSelector from "./components/TimePeriodSelector";

const MainContent = () => {
  const { loading, error } = useLocation();
  const [view, setView] = useState("map");
  const [cachedMap, setCachedMap] = useState(null);
  const [chartType, setChartType] = useState("vbar"); // Default to outbreaks over time
  const isMobile = useMediaQuery('(max-width:768px)');

  const handleViewChange = (newView) => {
    if (newView === "chart" && view === "map") {
      // Cache the map when switching to chart view
      const mapElement = document.querySelector('.map-container');
      if (mapElement) {
        setCachedMap(mapElement.innerHTML);
      }
    }
    setView(newView);
  };

  const handleChartTypeChange = (newType) => {
    setChartType(newType);
  };

  return (
    <>
      <Navbar
        view={view}
        onViewChange={handleViewChange}
        chartType={chartType}
        onChartTypeChange={handleChartTypeChange}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? "1.5rem" : "2.5rem",
          padding: isMobile ? "0" : "1.25rem",
          backgroundColor: "#1e1e1e",
          maxWidth: "100%",
          width: "100%",
          margin: "0",
          marginTop: isMobile ? "3.75rem" : "3.75rem",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1000,
              borderRadius: "0.5rem",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Visualization Section */}
        <Box
          sx={{
            height: isMobile ? "50vh" : "calc((100vh - 8.75rem) * 0.7)",
            border: isMobile ? "none" : "1px solid #ccc",
            borderRadius: isMobile ? "0" : "0.5rem",
            padding: isMobile ? "0" : "0.9375rem",
            boxShadow: isMobile ? "none" : "0 0.25rem 0.5rem rgba(0, 0, 0, 0.2)",
            backgroundColor: "#1e1e1e",
            overflow: "hidden",
            marginTop: "0",
            "& .map-container": {
              width: "100%",
              height: "100%",
              position: "relative"
            }
          }}
        >
          {view === "map" ? (
            <div className="map-container">
              <ChoroplethMap />
            </div>
          ) : (
            <ChartView chartType={chartType} />
          )}
        </Box>

        {/* Bottom Section Container */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? "1rem" : "1.875rem",
            padding: isMobile ? "0 0.625rem 0.625rem" : "0",
            maxWidth: "100%",
            boxSizing: "border-box",
            alignItems: "start",
          }}
        >
          {/* Latest Infections Section */}
          <Box
            sx={{
              border: "1px solid #ccc",
              borderRadius: "0.5rem",
              padding: "0.9375rem",
              boxShadow: "0 0.25rem 0.5rem rgba(0, 0, 0, 0.2)",
              backgroundColor: "#1e1e1e",
              height: "fit-content",
              width: "100%",
              boxSizing: "border-box",
              overflowX: "hidden",
            }}
          >
            <LatestInfections />
          </Box>

          {/* Bird Flu Resources Section */}
          <Box
            sx={{
              border: "1px solid #ccc",
              borderRadius: "0.5rem",
              boxShadow: "0 0.25rem 0.5rem rgba(0, 0, 0, 0.2)",
              backgroundColor: "#1e1e1e",
              height: "fit-content",
              width: "100%",
              boxSizing: "border-box",
              overflowX: "hidden",
            }}
          >
            <BirdFluResources />
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

const App = () => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <LocationProvider>
        <TimePeriodProvider>
          <MainContent />
        </TimePeriodProvider>
      </LocationProvider>
    </LocalizationProvider>
  );
};

export default App;
