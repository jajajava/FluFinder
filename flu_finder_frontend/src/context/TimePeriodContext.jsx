import React, { createContext, useContext, useState, useCallback } from 'react';

const TimePeriodContext = createContext();

export const useTimePeriod = () => {
  const context = useContext(TimePeriodContext);
  if (!context) {
    throw new Error('useTimePeriod must be used within a TimePeriodProvider');
  }
  return context;
};

export const TimePeriodProvider = ({ children }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleStartDateChange = useCallback((date) => {
    setStartDate(date);
  }, []);

  const handleEndDateChange = useCallback((date) => {
    setEndDate(date);
  }, []);

  const clearDateRange = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
  }, []);

  const value = {
    startDate,
    endDate,
    handleStartDateChange,
    handleEndDateChange,
    clearDateRange,
  };

  return (
    <TimePeriodContext.Provider value={value}>
      {children}
    </TimePeriodContext.Provider>
  );
}; 