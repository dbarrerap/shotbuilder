import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import { CATEGORIES, DEFAULT_DATA } from '../data/categories';

const STORAGE_KEY = 'promptgen_data';

function migrateData(saved) {
  return Object.fromEntries(
    CATEGORIES.map(cat => {
      const items = saved[cat.id] || [];
      if (typeof items[0] === 'string') {
        return [cat.id, items.map((text, i) => ({
          id: cat.baseId + i + 1,
          text,
        }))];
      }
      return [cat.id, items];
    })
  );
}

function getNextId(items, baseId) {
  if (items.length === 0) return baseId + 1;
  return Math.max(...items.map(i => i.id)) + 1;
}

export function useData() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [lastPrompt, setLastPrompt] = useState('');
  const [lastPromptId, setLastPromptId] = useState('');
  const [lastPicks, setLastPicks] = useState([]);
  const [promptHistory, setPromptHistory] = useState([]);
  const [usageStats, setUsageStats] = useState({});

  useEffect(() => {
    localforage.getItem(STORAGE_KEY).then(saved => {
      if (saved) {
        setData(migrateData(saved));
        setPromptHistory(saved.promptHistory || []);
        setUsageStats(saved.usageStats || {});
      }
      setLoading(false);
    });
  }, []);

  const persistState = useCallback(async (nextData, nextPromptHistory, nextUsageStats) => {
    await localforage.setItem(STORAGE_KEY, {
      ...nextData,
      promptHistory: nextPromptHistory,
      usageStats: nextUsageStats,
    });
  }, []);

  const addIngredient = useCallback(async (category, text) => {
    const items = data[category];
    const baseId = CATEGORIES.find(c => c.id === category).baseId;
    const nextData = {
      ...data,
      [category]: [...items, { id: getNextId(items, baseId), text }],
    };
    setData(nextData);
    await persistState(nextData, promptHistory, usageStats);
  }, [data, promptHistory, usageStats, persistState]);

  const addIngredients = useCallback(async (category, texts) => {
    const items = data[category];
    const baseId = CATEGORIES.find(c => c.id === category).baseId;
    let nextId = getNextId(items, baseId);
    const added = texts.map(text => ({ id: nextId++, text }));
    const nextData = {
      ...data,
      [category]: [...items, ...added],
    };
    setData(nextData);
    await persistState(nextData, promptHistory, usageStats);
    return added;
  }, [data, promptHistory, usageStats, persistState]);

  const deleteIngredients = useCallback(async (category, ids) => {
    const idSet = new Set(ids);
    const nextData = {
      ...data,
      [category]: data[category].filter(item => !idSet.has(item.id)),
    };
    setData(nextData);
    await persistState(nextData, promptHistory, usageStats);
  }, [data, promptHistory, usageStats, persistState]);

  const deleteIngredient = useCallback(async (category, id) => {
    const nextData = {
      ...data,
      [category]: data[category].filter(item => item.id !== id),
    };
    setData(nextData);
    await persistState(nextData, promptHistory, usageStats);
  }, [data, promptHistory, usageStats, persistState]);

  const editIngredient = useCallback(async (category, id, newText) => {
    const nextData = {
      ...data,
      [category]: data[category].map(item =>
        item.id === id ? { ...item, text: newText } : item
      ),
    };
    setData(nextData);
    await persistState(nextData, promptHistory, usageStats);
  }, [data, promptHistory, usageStats, persistState]);

  const importIngredients = useCallback(async (newData) => {
    setData(newData);
    await persistState(newData, promptHistory, usageStats);
  }, [promptHistory, usageStats, persistState]);

  const generatePrompt = useCallback((pinnedIds = {}) => {
    const empty = CATEGORIES.find(c => data[c.id].length === 0);
    if (empty) return null;

    const pick = (items, pinnedId) => {
      if (pinnedId != null) {
        const pinned = items.find(i => i.id === pinnedId);
        if (pinned) return pinned;
      }
      const weights = items.map(item => 1 / ((usageStats[String(item.id)] || 0) + 1));
      const total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r <= 0) return items[i];
      }
      return items[items.length - 1];
    };

    const picks = CATEGORIES.map(c => ({ cat: c.id, item: pick(data[c.id], pinnedIds[c.id]) }));
    setLastPicks(picks);
    const prompt = picks.map(p => `${CATEGORIES.find(c => c.id === p.cat).label}: ${p.item.text}`).join('\n');
    const promptId = picks.map(p => p.item.id).join('-');

    setLastPrompt(prompt);
    setLastPromptId(promptId);

    return prompt;
  }, [data, usageStats]);

  const confirmPromptUse = useCallback(async () => {
    if (!lastPicks.length) return;

    const promptId = lastPicks.map(p => p.item.id).join('-');
    const usedIds = Object.fromEntries(lastPicks.map(p => [p.cat, p.item.id]));
    const nextHistory = [...promptHistory, { id: promptId, usedIds, timestamp: Date.now() }];
    const nextUsageStats = { ...usageStats };
    Object.values(usedIds).forEach(id => {
      nextUsageStats[String(id)] = (nextUsageStats[String(id)] || 0) + 1;
    });

    setPromptHistory(nextHistory);
    setUsageStats(nextUsageStats);
    await persistState(data, nextHistory, nextUsageStats);
  }, [lastPicks, promptHistory, usageStats, data, persistState]);

  const resetPrompt = useCallback(() => {
    setLastPrompt('');
    setLastPromptId('');
    setLastPicks([]);
  }, []);

  const hasEmptyCategory = CATEGORIES.some(c => data[c.id].length === 0);

  return {
    data, loading, lastPrompt, lastPromptId, lastPicks,
    addIngredient, addIngredients, deleteIngredient, deleteIngredients, editIngredient, importIngredients, generatePrompt, confirmPromptUse, resetPrompt,
    hasEmptyCategory, promptHistory, usageStats,
  };
}
