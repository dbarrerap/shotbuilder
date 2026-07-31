import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';

const STORAGE_KEY = 'promptgen_api_keys';

export default function useApiKeys() {
  const [apiKeys, setApiKeys] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localforage.getItem(STORAGE_KEY).then(saved => {
      if (saved) setApiKeys(saved);
      setLoading(false);
    });
  }, []);

  const saveApiKey = useCallback(async (service, key) => {
    const next = { ...apiKeys, [service]: key };
    setApiKeys(next);
    await localforage.setItem(STORAGE_KEY, next);
  }, [apiKeys]);

  const deleteApiKey = useCallback(async (service) => {
    const next = { ...apiKeys };
    delete next[service];
    setApiKeys(next);
    await localforage.setItem(STORAGE_KEY, next);
  }, [apiKeys]);

  return { apiKeys, saveApiKey, deleteApiKey, loading };
}
