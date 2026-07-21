'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'cal_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setFavorites(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const toggle = useCallback((id: string) => {
    setFavorites(prev => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => favorites[id], [favorites]);

  return { favorites, toggle, addFavorite, isFavorite };
}
