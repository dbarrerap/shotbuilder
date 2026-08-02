import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';

const STORAGE_KEY = 'promptgen_api_keys';
const PREVIEW_MODEL_KEY = 'promptgen_preview_model';

export default function useApiKeys() {
  const [apiKeys, setApiKeys] = useState({});
  const [previewModel, setPreviewModelState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      localforage.getItem(STORAGE_KEY),
      localforage.getItem(PREVIEW_MODEL_KEY),
    ]).then(([keys, model]) => {
      if (keys) setApiKeys(keys);
      if (model) setPreviewModelState(model);
      setLoading(false);
    });
  }, []);

  const setPreviewModel = useCallback(async (model) => {
    setPreviewModelState(model);
    await localforage.setItem(PREVIEW_MODEL_KEY, model);
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

  const clearApiKeys = useCallback(async () => {
    setApiKeys({});
    setPreviewModelState(null);
    await Promise.all([
      localforage.removeItem(STORAGE_KEY),
      localforage.removeItem(PREVIEW_MODEL_KEY),
    ]);
  }, []);

  return { apiKeys, saveApiKey, deleteApiKey, clearApiKeys, previewModel, setPreviewModel, loading };
}
