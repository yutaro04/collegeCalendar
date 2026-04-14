'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BathroomRoom, BathroomStatus, BathroomApiRow } from '@/lib/bathroom';
import { parseApiRow } from '@/lib/bathroom';
import { supabase } from '@/lib/supabase';

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
      const { data, error: sbError } = await supabase.from('bathroom').select('*');
      if (sbError) {
        setError(sbError.message);
      } else if (data) {
        setRooms((data as BathroomApiRow[]).map(parseApiRow));
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

    const updateData: Record<string, string> = {};
    if (patch.status !== undefined) updateData.status = patch.status;
    if (patch.comment !== undefined) updateData.comment = patch.comment;

    supabase
      .from('bathroom')
      .update(updateData)
      .eq('id', id)
      .then(() => fetchData(), () => fetchData());
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { rooms, loading, error, refresh: fetchData, updateRoom };
}
