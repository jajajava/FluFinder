import React, { createContext, useContext, useState, useCallback } from 'react';
import { stateCountyMap } from '../data/locationData';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const states = Object.keys(stateCountyMap);
  const counties = selectedState ? stateCountyMap[selectedState] : [];

  const handleStateChange = useCallback((state) => {
    setSelectedState(state);
    setSelectedCounty(''); // Reset county when state changes
  }, []);

  const handleCountyChange = useCallback((county) => {
    setSelectedCounty(county);
  }, []);

  const clearLocation = useCallback(() => {
    setSelectedState('');
    setSelectedCounty('');
  }, []);

  const value = {
    selectedState,
    selectedCounty,
    states,
    counties,
    loading,
    error,
    setLoading,
    setError,
    handleStateChange,
    handleCountyChange,
    clearLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}; 