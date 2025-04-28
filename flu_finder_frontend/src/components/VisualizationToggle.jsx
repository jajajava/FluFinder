import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Menu, MenuItem, IconButton } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import BarChartIcon from '@mui/icons-material/BarChart';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const VisualizationToggle = ({ view, onViewChange, chartType, onChartTypeChange }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleChartMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleChartMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChartTypeSelect = (type) => {
    onChartTypeChange(type);
    handleChartMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, paddingLeft: "1%" }}>
      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={(e, newView) => {
          if (newView !== null) {
            onViewChange(newView);
          }
        }}
        aria-label="visualization type"
        size="small"
        sx={{
          backgroundColor: '#fff',
          '& .MuiToggleButton-root': {
            border: 'none',
            padding: '6px 12px',
            '&.Mui-selected': {
              backgroundColor: '#1976d2',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#1565c0',
              },
            },
          },
        }}
      >
        <ToggleButton value="map" aria-label="map view">
          <MapIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} />
          Map
        </ToggleButton>
        <ToggleButton value="chart" aria-label="chart view">
          <BarChartIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} />
          Charts
        </ToggleButton>
      </ToggleButtonGroup>

      {view === 'chart' && (
        <>
          <IconButton
            onClick={handleChartMenuClick}
            size="small"
            sx={{ 
              backgroundColor: '#fff',
              padding: '6px',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleChartMenuClose}
            PaperProps={{
              sx: {
                backgroundColor: '#fff',
                '& .MuiMenuItem-root': {
                  fontSize: '0.875rem',
                  padding: '8px 16px',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                },
              },
            }}
          >
            <MenuItem 
              selected={chartType === 'hbar_sizes'}
              onClick={() => handleChartTypeSelect('hbar_sizes')}
            >
              Flock Size Comparison
            </MenuItem>
            <MenuItem 
              selected={chartType === 'hbar_freqs'}
              onClick={() => handleChartTypeSelect('hbar_freqs')}
            >
              Outbreak Frequency
            </MenuItem>
            <MenuItem 
              selected={chartType === 'hbar_types'}
              onClick={() => handleChartTypeSelect('hbar_types')}
            >
              Flock Type Distribution
            </MenuItem>
            <MenuItem 
              selected={chartType === 'pie_sizes'}
              onClick={() => handleChartTypeSelect('pie_sizes')}
            >
              Flock Size Pie Chart
            </MenuItem>
            <MenuItem 
              selected={chartType === 'pie_freqs'}
              onClick={() => handleChartTypeSelect('pie_freqs')}
            >
              Outbreak Frequency Pie
            </MenuItem>
            <MenuItem 
              selected={chartType === 'pie_types'}
              onClick={() => handleChartTypeSelect('pie_types')}
            >
              Flock Type Pie Chart
            </MenuItem>
            <MenuItem 
              selected={chartType === 'vbar'}
              onClick={() => handleChartTypeSelect('vbar')}
            >
              Outbreak History
            </MenuItem>
          </Menu>
        </>
      )}
    </Box>
  );
};

export default VisualizationToggle; 