'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Machine, MachineStatus, LaundryApiRow } from '@/lib/laundry';
import { parseApiRow, getDurationMin } from '@/lib/laundry';

interface UseLaundryReturn {
  machines: Machine[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateMachine: (id: string, patch: { status?: string; finishedAt?: string; comment?: string }) => void;
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
        setMachines((json.data as LaundryApiRow[]).map(parseApiRow));
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

  const updateMachine = useCallback((
    id: string,
    patch: { status?: string; finishedAt?: string; comment?: string },
  ) => {
    // 楽観的にローカルstateを即時更新
    setMachines(prev => prev.map(m => {
      if (m.id !== id) return m;

      const newStatus = (patch.status as MachineStatus | undefined) ?? m.status;
      let remainingMin = m.remainingMin;

      if (newStatus === 'active' && patch.finishedAt) {
        remainingMin = Math.max(0, Math.round((new Date(patch.finishedAt).getTime() - Date.now()) / 60000));
      } else if (newStatus === 'available') {
        remainingMin = undefined;
      }

      return {
        ...m,
        status: newStatus,
        remainingMin,
        comment: patch.comment !== undefined ? (patch.comment || undefined) : m.comment,
      };
    }));

    // バックグラウンドでAPI送信 → 完了後にサーバーデータで同期
    fetch('/api/laundry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    })
      .then(res => res.json())
      .then(() => fetchData())
      .catch(() => fetchData()); // 失敗時もサーバーから再取得して整合性を保つ
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { machines, loading, error, refresh: fetchData, updateMachine };
}
