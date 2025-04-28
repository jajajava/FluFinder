import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, useMediaQuery } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useLocation } from '../context/LocationContext';

const LocationSelector = () => {
  const {
    selectedState,
    selectedCounty,
    states,
    counties,
    handleStateChange,
    handleCountyChange,
    clearLocation
  } = useLocation();

  const isMobile = useMediaQuery('(max-width:768px)');

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '0.75rem' : 2,
      minWidth: isMobile ? 'auto' : 400,
      width: '100%'
    }}>
      <FormControl
        fullWidth
        size={isMobile ? "small" : "medium"}
        sx={{ minWidth: isMobile ? "auto" : "9.5rem" }}
      >
        <InputLabel
          id="state-select-label"
          sx={{
            backgroundColor: isMobile ? 'transparent' : '#fff',
            px: 1,
            '&.Mui-focused': {
              marginTop: '0',
              top: 0,
              backgroundColor: isMobile ? 'transparent' : '#fff',
              alignSelf: "center",
              color: isMobile ? '#fff' : '#1e1e1e'
            },
            marginTop: !selectedState && !isMobile ? '-2px' : selectedState && !isMobile ? '0' : !selectedState && isMobile ? '5px' : '0',
            position: 'absolute',
            top: selectedState ? '0' : '-6px',
            marginInline: '-2.5%',
            borderRadius: '2px',
            color: isMobile ? '#fff' : 'black',
            fontSize: isMobile ? '0.75rem' : '1rem',
            '&.MuiInputLabel-shrink': {
              backgroundColor: isMobile ? 'transparent' : '#fff',
              padding: '0 8px',
            }
          }}
        >
          State
        </InputLabel>
        <Select
          labelId="state-select-label"
          id="state-select"
          value={selectedState}
          label="State"
          onChange={(e) => handleStateChange(e.target.value)}
          sx={{
            backgroundColor: isMobile ? 'rgba(255, 255, 255, 0.1)' : '#fff',
            fontSize: isMobile ? '0.75rem' : '1rem',
            color: isMobile ? '#fff' : '#000',
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: isMobile ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.23)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isMobile ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.5)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: isMobile ? '#fff' : '#000',
            },
            '.MuiSvgIcon-root': {
              color: isMobile ? '#fff' : '#000',
            },
            '.MuiSelect-select': {
              padding: isMobile ? '0.5rem' : '0.5rem 0.875rem',
            }
          }}
          size={isMobile ? "small" : "medium"}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 300,
                width: 'auto',
              },
            },
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            style: { zIndex: 9999 }
          }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {states.map((state) => (
            <MenuItem key={state} value={state}>
              {state}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl
        fullWidth
        disabled={!selectedState}
        size={isMobile ? "small" : "medium"}
        sx={{ minWidth: isMobile ? "auto" : "9.5rem" }}
      >
        <InputLabel
          id="county-select-label"
          sx={{
            backgroundColor: isMobile ? 'transparent' : '#fff',
            px: 1,
            '&.Mui-focused': {
              marginTop: '0',
              top: 0,
              backgroundColor: isMobile ? 'transparent' : '#fff',
              color: isMobile ? '#fff' : '#1e1e1e'
            },
            marginTop: !selectedCounty && !isMobile ? '-2px' : selectedCounty && !isMobile ? '0' : !selectedCounty && isMobile ? '5px' : '0',
            position: 'absolute',
            top: selectedCounty ? '0' : '-6px',
            marginInline: '-2.5%',
            borderRadius: '2px',
            color: isMobile ? '#fff' : 'black',
            fontSize: isMobile ? '0.75rem' : '1rem',
            '&.MuiInputLabel-shrink': {
              backgroundColor: isMobile ? 'transparent' : '#fff',
              padding: '0 8px',
            }
          }}
        >
          County
        </InputLabel>
        <Select
          labelId="county-select-label"
          id="county-select"
          value={selectedCounty}
          label="County"
          onChange={(e) => handleCountyChange(e.target.value)}
          sx={{
            backgroundColor: isMobile ? 'rgba(255, 255, 255, 0.1)' : '#fff',
            fontSize: isMobile ? '0.75rem' : '1rem',
            color: isMobile ? '#fff' : '#000',
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: isMobile ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.23)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isMobile ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.5)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: isMobile ? '#fff' : '#000',
            },
            '.MuiSvgIcon-root': {
              color: isMobile ? '#fff' : '#000',
            },
            '.MuiSelect-select': {
              padding: isMobile ? '0.5rem' : '0.5rem 0.875rem',
            }
          }}
          size={isMobile ? "small" : "medium"}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 300,
                width: 'auto',
              },
            },
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            style: { zIndex: 9999 }
          }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {counties.map((county) => (
            <MenuItem key={county} value={county}>
              {county}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {!isMobile ? <DeleteOutlineIcon style={{cursor: "pointer"}} onClick={()=> clearLocation()} />
      : <button onClick={()=> clearLocation()}>Clear location</button>}
    </Box>
  );
};

export default LocationSelector;