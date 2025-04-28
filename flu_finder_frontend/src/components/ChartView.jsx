import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import Plot from 'react-plotly.js';
import { useLocation } from '../context/LocationContext';
import { useTimePeriod } from '../context/TimePeriodContext';
import { format } from 'date-fns';

const ChartView = ({ chartType }) => {
    const { selectedState, selectedCounty } = useLocation();
    const { startDate, endDate } = useTimePeriod();
    const [fig, setFig] = useState(null);
    const [plotConfig, setPlotConfig] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchChartData = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                const params = new URLSearchParams();
                if (selectedState) params.append('selected_state', selectedState);
                if (selectedCounty) params.append('selected_county', selectedCounty);
                if (startDate) params.append('start', format(startDate, 'MM/dd/yyyy'));
                if (endDate) params.append('end', format(endDate, 'MM/dd/yyyy'));
                params.append('type', chartType);
                
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5020';
                const response = await fetch(`${backendUrl}/api/chart?${params}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                // setFig(data);
                setFig(data.figure);
                setPlotConfig(data.config);
            } catch (error) {
                console.error('Error fetching chart data:', error);
                setError('Failed to load chart data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchChartData();
    }, [selectedState, selectedCounty, startDate, endDate, chartType]);

    if (isLoading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%' 
            }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%' 
            }}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', width: '100%' }}>
            {fig && (
                <Plot
                    data={fig.data}
                    layout={{
                        ...fig.layout,
                        autosize: true,
                        margin: { l: 50, r: 50, t: 50, b: 50 },
                    }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler={true}
                    config={plotConfig}
                />
            )}
        </Box>
    );
};

export default ChartView; 