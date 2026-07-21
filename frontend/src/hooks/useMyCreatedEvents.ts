'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/** MY EVENTタブ用: 自分が作成したイベントのID一覧 */
export function useMyCreatedEvents(userId: string | null) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!userId) {
      setIds(new Set());
      return;
    }
    const { data } = await supabase
      .from('created_events')
      .select('event_id')
      .eq('user_id', userId);
    setIds(new Set((data ?? []).map(r => r.event_id as string)));
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addId = useCallback((id: string) => {
    setIds(prev => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  return { myEventIds: ids, refresh, addId };
}
