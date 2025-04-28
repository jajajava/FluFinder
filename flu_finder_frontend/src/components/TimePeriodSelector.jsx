import React from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTimePeriod } from '../context/TimePeriodContext';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const TimePeriodSelector = ({ view }) => {
  const { startDate, endDate, handleStartDateChange, handleEndDateChange } = useTimePeriod();
  const isMobile = useMediaQuery('(max-width:768px)');
  const isDisabled = view !== "chart";

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ 
        display: 'flex', 
        gap: 2,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'opacity 0.2s ease-in-out',
        pointerEvents: isDisabled ? 'none' : 'auto',
        '& .MuiTextField-root': {
          backgroundColor: isDisabled ? 'rgba(255, 255, 255)' : 'rgba(255, 255, 255)',
          borderRadius: '4px',
          width: isMobile ? '90%' : '11vw',
        },
        '& .MuiInputLabel-root': {
          color: isDisabled ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.7)',
          backgroundColor: "rgba(255, 255, 255)",
          borderRadius: '2px',
          paddingInline: '8px',
          marginInline: isMobile ? '-2%' : '-3%',
          '&:selected':{
            backgroundColor: "red",
          }
        },
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: isDisabled ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.23)',
          },
          '&:hover fieldset': {
            borderColor: isDisabled ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.5)',
          },
        },
      }}>
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={handleStartDateChange}
          maxDate={endDate || undefined}
          disabled={isDisabled}
          slotProps={{
            textField: {
              size: "small",
              error: false,
            },
          }}
        />

        <DatePicker
          label="End Date"
          value={endDate}
          onChange={handleEndDateChange}
          minDate={startDate || undefined}
          maxDate={new Date()}
          disabled={isDisabled}
          slotProps={{
            textField: {
              size: "small",
              error: false,
            },
          }}
        />
        {!isMobile ? <DeleteOutlineIcon style={{cursor: "pointer"}}
                      onClick={()=> {handleStartDateChange(null), handleEndDateChange(null)}}/> 
        : <button onClick={()=> {handleStartDateChange(null), handleEndDateChange(null)}}>Clear range</button>}
      </Box>
    </LocalizationProvider>
  );
};

export default TimePeriodSelector; 