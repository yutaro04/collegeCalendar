'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Machine, LaundryApiRow } from '@/lib/laundry';
import { parseApiRow } from '@/lib/laundry';

interface UseLaundryReturn {
  machines: Machine[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateMachine: (id: string, patch: { status?: string; finishedAt?: string; comment?: string }) => Promise<boolean>;
}

export function useLaundry(): UseLaundryReturn {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialLoadDone = useRef(false);

  const fetchData = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/laundry');
      const json = await res.json();
      if (json.success) {
        const parsed = (json.data as LaundryApiRow[]).map(parseApiRow);
        setMachines(parsed);
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

  const updateMachine = useCallback(async (
    id: string,
    patch: { status?: string; finishedAt?: string; comment?: string }
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/laundry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      const json = await res.json();
      if (json.result === 'success') {
        await fetchData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { machines, loading, error, refresh: fetchData, updateMachine };
}
