import { createContext, useContext } from 'react';
import useApiKeys from '../hooks/useApiKeys';

const ApiKeysContext = createContext(null);

export function ApiKeysProvider({ children }) {
  return <ApiKeysContext.Provider value={useApiKeys()}>{children}</ApiKeysContext.Provider>;
}

export function useApiKeysContext() {
  const ctx = useContext(ApiKeysContext);
  if (!ctx) throw new Error('useApiKeysContext must be used within ApiKeysProvider');
  return ctx;
}
