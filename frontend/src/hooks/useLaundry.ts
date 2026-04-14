'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Machine, MachineStatus, LaundryApiRow } from '@/lib/laundry';
import { parseApiRow } from '@/lib/laundry';
import { supabase } from '@/lib/supabase';

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
      const { data, error: sbError } = await supabase.from('laundry').select('*');
      if (sbError) {
        setError(sbError.message);
      } else if (data) {
        const rows: LaundryApiRow[] = data.map((r: Record<string, string>) => ({
          id: r.id,
          status: r.status,
          finishedAt: r.finishedAt ?? r.finished_at ?? '',
          comment: r.comment ?? '',
        }));
        setMachines(rows.map(parseApiRow));
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
    // 楽観的更新
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

    // Supabaseに更新
    const updateData: Record<string, string> = {};
    if (patch.status !== undefined) updateData.status = patch.status;
    if (patch.finishedAt !== undefined) updateData.finishedAt = patch.finishedAt;
    if (patch.comment !== undefined) updateData.comment = patch.comment;

    supabase
      .from('laundry')
      .update(updateData)
      .eq('id', id)
      .then(() => fetchData(), () => fetchData());
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { machines, loading, error, refresh: fetchData, updateMachine };
}
