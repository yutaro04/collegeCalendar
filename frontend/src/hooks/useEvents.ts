'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CalendarEvent } from '@/lib/types';

interface UseEventsReturn {
  events: CalendarEvent[];
  lastSync: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addLocalEvent: (event: CalendarEvent) => void;
}

export function useEvents(): UseEventsReturn {
  const [csvEvents, setCsvEvents] = useState<CalendarEvent[]>([]);
  // 投稿直後にCSV(EventCache)へ反映されるまでの間、楽観的に表示するイベント
  const [localAdded, setLocalAdded] = useState<CalendarEvent[]>([]);
  const [lastSync, setLastSync] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Next.js API Routeを経由（CORS回避）
      const res = await fetch('/api/events');
      const data = await res.json();

      if (data.success) {
        setCsvEvents(data.events as CalendarEvent[]);
        setLastSync(data.lastSync ?? '');
      } else {
        setError(data.error ?? 'データ取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ネットワークエラー');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addLocalEvent = useCallback((event: CalendarEvent) => {
    setLocalAdded(prev => (prev.some(e => e.id === event.id) ? prev : [...prev, event]));
  }, []);

  // CSVイベント + まだCSVに載っていないローカル追加分をマージし、繰り返しフラグを付与
  const events = useMemo(() => {
    const csvIds = new Set(csvEvents.map(e => e.id));
    const pendingLocal = localAdded.filter(e => !csvIds.has(e.id));
    const merged = [...pendingLocal, ...csvEvents];

    const idCount = new Map<string, number>();
    merged.forEach(e => idCount.set(e.id, (idCount.get(e.id) ?? 0) + 1));
    return merged.map(e => ({
      ...e,
      isRecurring: (idCount.get(e.id) ?? 0) > 1,
    }));
  }, [csvEvents, localAdded]);

  return { events, lastSync, loading, error, refresh: fetchEvents, addLocalEvent };
}
