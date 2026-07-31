import { createContext, useContext } from 'react';
import { useData } from '../hooks/useData';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  return <DataContext.Provider value={useData()}>{children}</DataContext.Provider>;
}

export function useDataContext() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useDataContext must be used within DataProvider');
  return ctx;
}
