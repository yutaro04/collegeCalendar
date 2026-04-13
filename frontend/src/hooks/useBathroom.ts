'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BathroomRoom, BathroomApiRow, BathroomStatus } from '@/lib/bathroom';
import { parseApiRow } from '@/lib/bathroom';

interface UseBathroomReturn {
  rooms: BathroomRoom[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateRoom: (id: number, patch: { status?: string; comment?: string }) => void;
}

export function useBathroom(): UseBathroomReturn {
  const [rooms, setRooms] = useState<BathroomRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  const fetchData = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bathroom');
      const json = await res.json();
      if (json.success) {
        setRooms((json.data as BathroomApiRow[]).map(parseApiRow));
      } else {
        setError(json.error ?? 'データ取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ネットワークエラー');
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, []);

  const updateRoom = useCallback((
    id: number,
    patch: { status?: string; comment?: string },
  ) => {
    // 楽観的更新
    setRooms(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: (patch.status as BathroomStatus | undefined) ?? r.status,
        comment: patch.comment !== undefined ? patch.comment : r.comment,
      };
    }));

    fetch('/api/bathroom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
      .then(res => res.json())
      .then(() => fetchData())
      .catch(() => fetchData());
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { rooms, loading, error, refresh: fetchData, updateRoom };
}
