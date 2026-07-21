'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface InviteGroup {
  id: string;
  name: string;
  emails: string[];
}

/** イベント招待用の個人専用ユーザーグループ（自分だけが閲覧・編集可） */
export function useInviteGroups(userId: string | null) {
  const [groups, setGroups] = useState<InviteGroup[]>([]);

  const refresh = useCallback(async () => {
    if (!userId) {
      setGroups([]);
      return;
    }
    const { data } = await supabase
      .from('invite_groups')
      .select('id, name, emails')
      .order('created_at', { ascending: true });
    setGroups((data ?? []) as InviteGroup[]);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createGroup = useCallback(async (name: string, emails: string[]) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('invite_groups')
      .insert({ owner_id: userId, name, emails })
      .select('id, name, emails')
      .single();
    if (error) throw error;
    setGroups(prev => [...prev, data as InviteGroup]);
  }, [userId]);

  const deleteGroup = useCallback(async (id: string) => {
    const { error } = await supabase.from('invite_groups').delete().eq('id', id);
    if (error) throw error;
    setGroups(prev => prev.filter(g => g.id !== id));
  }, []);

  return { groups, createGroup, deleteGroup, refresh };
}
