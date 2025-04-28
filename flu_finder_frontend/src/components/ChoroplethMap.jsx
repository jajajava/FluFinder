import React, { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { useLocation } from '../context/LocationContext';
import { Box, CircularProgress, Typography, useMediaQuery } from '@mui/material';

const ChoroplethMap = () => {
    const { selectedState, selectedCounty } = useLocation();
  const [fig, setFig] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef(null);
    const isMobile = useMediaQuery('(max-width:768px)');

    const fetchChoroplethData = async () => {
        setIsLoading(true);
        setError(null);

        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                const params = new URLSearchParams();
                if (selectedState) params.append('state', selectedState);
                if (selectedCounty) params.append('county', selectedCounty);

                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5020';
                // console.log(`Fetching choropleth data from ${backendUrl} with params:`, Object.fromEntries(params));

                const response = await fetch(`${backendUrl}/api/map/choropleth?${params}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseText = await response.text();
                // console.log('Raw response:', responseText);

                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    throw new Error(`Failed to parse response: ${responseText.substring(0, 100)}...`);
                }

                // console.log('Parsed data:', data);

                if (!data || !Array.isArray(data.data)) {
                    throw new Error('Invalid response format: missing data array');
                }

                // Process the data to ensure all traces have geo reference and handle county color
                let processedData;

                if (selectedCounty) {
                    // For county level, create a custom trace with explicit blue color
                    processedData = data.data.map(trace => {
                        // Use a direct color without relying on colorscale
                        return {
                            ...trace,
                            geo: 'geo',
                            showscale: false,
                            // Preserve original z values for data integrity
                            // z: Array(trace.locations.length).fill(1), // Removed to keep real data
                            colorscale: [[0, "#3a7bbf"], [1, "#3a7bbf"]], // Single color scale (blue)
                            marker: {
                                line: {
                                    color: "#FFD700",
                                    width: 2
                                }
                            },
                            colorbar: null,
                            // Remove coloraxis to prevent default pink selection
                            coloraxis: null,
                            // Keep all hover text intact
                            hoverinfo: trace.hoverinfo || "text"
                        };
                    });
                } else {
                    // For state/national level, keep original behavior
                    processedData = data.data.map(trace => ({
                        ...trace,
                        geo: 'geo'
                    }));
                }

                // Create layout with proper zoom handling
                const baseLayout = {
          ...data.layout,
          geo: {
                        ...data.layout.geo,
                        scope: 'usa',
            showland: true,
                        landcolor: '#2d2d2d',
                        countrycolor: '#666666',
            showlakes: true,
                        lakecolor: '#1e1e1e',
                        subunitcolor: '#666666',
                        projection: {
                            type: 'albers usa',
                            scale: selectedCounty ? 1.6 : 1.1 // Increased scale for state level from 0.8 to 1.3
                        },
                        bgcolor: '#1e1e1e',
                        domain: {
                            x: [0, 1],  // Use full width
                            y: [0, 1]   // Use full height
                        },
                        showframe: false
                    },
                    // Override selection color for all cases
                    selectioncolor: "#3a7bbf",
                    // Disable selection mode if we can
                    dragmode: selectedCounty ? "pan" : "zoom",
                    // Custom selection colors
                    selectdirection: 'any',
                    selectionrevision: Date.now(), // Force selection refresh
                    modebar: {
                        bgcolor: 'transparent',
                        color: '#ffffff',
                        activecolor: '#3a7bbf'
                    },
                    margin: {
                        l: isMobile ? 0 : 0,
                        r: isMobile ? 10 : 30,
                        t: isMobile ? 40 : 0,
                        b: isMobile ? 5 : 10,
                        pad: 4
                    },
                    autosize: true,
                    showlegend: true,
                    paper_bgcolor: '#1e1e1e',
                    plot_bgcolor: '#1e1e1e',
                    legend: {
                        x: 0,
                        y: 1,
                        bgcolor: 'rgba(30, 30, 30, 0.8)',
                        bordercolor: '#666666',
                        borderwidth: 1,
                        font: { color: '#ffffff' }
                    },
                    transition: {
                        duration: 1000,
                        easing: 'cubic-in-out'
                    },
                    title: !isMobile ? {
                        text: "Bird Flu Outbreaks",
            x: 0.5,
                        y: 0.97,
            xanchor: "center",
                        yanchor: "top",
            font: {
              color: "#f5f5f5",
                            size: 16
                        }
                    } : null
                };

                // Only add coloraxis if not at county level
                if (!selectedCounty) {
                    baseLayout.coloraxis = {
                        colorbar: {
                            x: -0.07,  // Place at left side
                            len: 0.9,
                            thickness: 15,
                            yanchor: 'middle',
                            y: 0.5,
                            title: {
                                text: 'Flock Size',
                                font: { color: '#ffffff' }
                            },
                            tickfont: { color: '#ffffff' },
                            bgcolor: 'rgba(30, 30, 30, 0.8)'
                        },
                        cmin: 0,
                        zmin: 0,
                        colorscale: [
                            [0.0, "#ffffff"],     // Pure white for 0 (unaffected)
                            [0.00001, "#4a90c2"], // Darker blue for smallest affected
                            [0.2, "#5a9bd4"],
                            [0.4, "#3a7bbf"],
                            [0.6, "#2b6ca3"],
                            [0.8, "#1f4e79"],
                            [1.0, "#0b2e59"]      // Very dark navy blue
                        ]
                    };
                } else {
                    // For county level, explicitly disable any color scales
                    baseLayout.showscale = false;
                    baseLayout.coloraxis = { showscale: false };
                }

                // Apply zoom bounds if provided by the backend
                if (data.bounds?.bounds) {
                    // For state view, adjust the projection to fill the container width

                    // Calculate aspect ratio based on lon/lat range
                    const lonDelta = data.bounds.bounds.max_lon - data.bounds.bounds.min_lon;
                    const latDelta = data.bounds.bounds.max_lat - data.bounds.bounds.min_lat;
                    const stateAspectRatio = lonDelta / latDelta;

                    // Apply wider view for states with small width-to-height ratio
                    const minLon = data.bounds.bounds.min_lon;
                    const maxLon = data.bounds.bounds.max_lon;
                    const minLat = data.bounds.bounds.min_lat;
                    const maxLat = data.bounds.bounds.max_lat;

                    // Adjust padding based on the size of the selected area
                    const lonPadding = selectedCounty ? 6.5 : 1.2; // Smaller padding for county view
                    const latPadding = selectedCounty ? 6.5 : 1.2;

                    // Check if the selected state is Hawaii or Alaska
                    const isHawaii = selectedState === 'HI';
                    const isAlaska = selectedState === 'AK';

                    // Calculate dynamic scale based on the area size
                    const areaWidth = maxLon - minLon;
                    const areaHeight = maxLat - minLat;
                    const dynamicScale = selectedCounty ?
                        Math.max(2, 6 / Math.max(areaWidth, areaHeight)) : // County view
                        Math.max(1, 4 / Math.max(areaWidth, areaHeight));  // State view

                    baseLayout.geo = {
                        ...baseLayout.geo,
                        scope: 'usa',
                        showland: true,
                        landcolor: '#2d2d2d',
                        center: {
                            lon: (minLon + maxLon) / 2,
                            lat: (minLat + maxLat) / 2
                        },
                        lonaxis: {
                            range: [minLon - lonPadding, maxLon + lonPadding]
                        },
                        lataxis: {
                            range: [minLat - latPadding, maxLat + latPadding]
                        },
                        projection: {
                            scale: selectedCounty ?
                                  (isAlaska ? dynamicScale * 0.8 : dynamicScale) :
                                  (isHawaii ? dynamicScale * 0.7 : dynamicScale),
                            type: 'albers usa'
                        },
                        domain: {
                            x: [0, 1],
                            y: [0, 1]
                        },
                        aspectmode: 'data',
                        aspectratio: {
                            x: stateAspectRatio > 1 ? stateAspectRatio : 1,
                            y: stateAspectRatio < 1 ? 1/stateAspectRatio : 1
                        },
                        showframe: false
                    };

                    // console.log('State view bounds:', {
                    //     lon: [minLon - lonPadding, maxLon + lonPadding],
                    //     lat: [minLat - latPadding, maxLat + latPadding],
                    //     aspect: stateAspectRatio
                    // });
                } else {
                    // Set a different center for mobile devices
                    let center
                    if (isMobile){
                        center = { lon: -100, lat: 37.5 }
                    } else {
                        center = { lon: -95, lat: 37.5 }
                    }

                    // Default view for USA
                    baseLayout.geo = {
                        ...baseLayout.geo,
                        center: center,
                        lonaxis: { range: [-125, -65] },
                        lataxis: { range: [23, 48] },
                        projection: {
                            scale: 0.93,
                            type: 'albers usa'
                        },
                        showframe: false
                    };
                }

                // Ensure layout has proper sizes and margins
                baseLayout.width = undefined; // Let it determine width automatically
                baseLayout.height = undefined; // Let it determine height automatically
                baseLayout.autosize = true;
                baseLayout.margin = { l: 0, r: 0, t: 0, b: 0, pad: 0 };

                // Create choropleth map
                setFig({
                    data: processedData,
                    layout: baseLayout,
                    config: {
                        displayModeBar: !isMobile,
                        scrollZoom: !isMobile,
                        responsive: true,
                        modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
                        displaylogo: false
                    }
                });

                setIsLoading(false);
                break;

            } catch (err) {
                console.error(`Error loading choropleth map (attempt ${retryCount + 1}/${maxRetries}):`, err);
                retryCount++;

                if (retryCount === maxRetries) {
                    setError(`Error loading choropleth map: ${err.message}. Please check if the backend server is running.`);
                    setIsLoading(false);
                } else {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                }
            }
        }
    };

    useEffect(() => {
        fetchChoroplethData();
    }, [selectedState, selectedCounty, isMobile]);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="25rem">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={2}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    if (!fig) {
        return (
            <Box p={2}>
                <Typography>No data available</Typography>
            </Box>
        );
    }

  return (
        <Box
            ref={containerRef}
            sx={{
                width: "100%",
                height: "100%",
                position: "relative",
                marginTop: isMobile ? "0.625rem" : 0,
                "& .js-plotly-plot": {
                    width: "100%",
                    height: "100%"
                },
                "& .plot-container": {
                    width: "100%",
                    height: "100%"
                },
                "& .main-svg": {
                    width: "100%",
                    height: "100%"
                },
                "& .geo": {
                    width: "100%"
                }
            }}
        >
    <Plot
      data={fig.data}
                layout={{
                    ...fig.layout,
                    autosize: true,
                    margin: { l: 0, r: 0, t: 30, b: 0, pad: 0 }
                }}
                config={{
                    ...fig.config,
                    responsive: true,
                    displayModeBar: true,
                    scrollZoom: true,
                    modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
                    displaylogo: false
                }}
                style={{
                    width: isMobile ? "100vw" : "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    margin: 0,
                    padding: 0
                }}
      useResizeHandler={true}
    />
        </Box>
  );
};

export default ChoroplethMap;