'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CalendarEvent } from '@/lib/types';

interface UseEventsReturn {
  events: CalendarEvent[];
  lastSync: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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
        const raw = data.events as CalendarEvent[];
        // 同一IDの出現回数をカウントし、繰り返しイベントにフラグを付与
        const idCount = new Map<string, number>();
        raw.forEach(e => idCount.set(e.id, (idCount.get(e.id) ?? 0) + 1));
        const enriched = raw.map(e => ({
          ...e,
          isRecurring: (idCount.get(e.id) ?? 0) > 1,
        }));
        setEvents(enriched);
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

  return { events, lastSync, loading, error, refresh: fetchEvents };
}
