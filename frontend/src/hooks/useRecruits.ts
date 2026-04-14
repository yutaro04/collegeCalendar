'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface RecruitParticipant {
  user_id: string;
  display_name: string;
  created_at: string;
}

export interface Recruit {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  body: string;
  deadline: string | null;
  created_at: string;
  is_kohicha: boolean;
  max_participants: number | null;
  hide_participants: boolean;
  participants_count: number;
  participants: RecruitParticipant[];
}

export interface CreateRecruitInput {
  title: string;
  body: string;
  deadline: string | null;
  isKohicha: boolean;
  maxParticipants: number | null;
  hideParticipants: boolean;
}

interface RecruitRow {
  id: string;
  author_id: string;
  title: string;
  body: string;
  deadline: string | null;
  created_at: string;
  is_kohicha: boolean;
  max_participants: number | null;
  hide_participants: boolean;
  participants_count: number;
  profiles: { display_name: string } | null;
  recruit_participants: Array<{
    user_id: string;
    created_at: string;
    profiles: { display_name: string } | null;
  }>;
}

async function showLocalNotification(title: string, body: string) {
  if (typeof window === 'undefined') return;
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, { body, icon: '/app.png', badge: '/app.png' });
      return;
    } catch { /* fallthrough */ }
  }
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/app.png' });
  }
}

export function useRecruits() {
  const { user } = useAuth();
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recruitsRef = useRef<Recruit[]>([]);

  useEffect(() => { recruitsRef.current = recruits; }, [recruits]);

  const fetchRecruits = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from('recruits')
      .select(`
        id, author_id, title, body, deadline, created_at,
        is_kohicha, max_participants, hide_participants, participants_count,
        profiles!recruits_author_profile_fkey ( display_name ),
        recruit_participants (
          user_id, created_at,
          profiles!recruit_participants_user_profile_fkey ( display_name )
        )
      `)
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as unknown as RecruitRow[];
    const parsed: Recruit[] = rows.map(r => ({
      id: r.id,
      author_id: r.author_id,
      author_name: r.profiles?.display_name ?? '名無し',
      title: r.title,
      body: r.body,
      deadline: r.deadline,
      created_at: r.created_at,
      is_kohicha: r.is_kohicha,
      max_participants: r.max_participants,
      hide_participants: r.hide_participants,
      participants_count: r.participants_count,
      participants: (r.recruit_participants ?? []).map(p => ({
        user_id: p.user_id,
        display_name: p.profiles?.display_name ?? '名無し',
        created_at: p.created_at,
      })),
    }));
    setRecruits(parsed);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchRecruits();
  }, [user, fetchRecruits]);

  // Realtime: 参加者追加を購読し、自分の投稿であれば通知
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('recruit_participants_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'recruit_participants' },
        async (payload) => {
          const row = payload.new as { recruit_id: string; user_id: string };
          const recruit = recruitsRef.current.find(r => r.id === row.recruit_id);
          if (recruit && recruit.author_id === user.id && row.user_id !== user.id) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', row.user_id)
              .maybeSingle();
            const name = (prof as { display_name: string } | null)?.display_name ?? '誰か';
            showLocalNotification('ゆる募', `${name}さんが「${recruit.title}」に参加しました`);
          }
          fetchRecruits();
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'recruit_participants' },
        () => fetchRecruits(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recruits' },
        () => fetchRecruits(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchRecruits]);

  const createRecruit = useCallback(async (input: CreateRecruitInput) => {
    if (!user) return;
    const max = input.isKohicha ? 1 : input.maxParticipants;
    const { error: err } = await supabase.from('recruits').insert({
      author_id: user.id,
      title: input.title.trim(),
      body: input.body.trim(),
      deadline: input.deadline,
      is_kohicha: input.isKohicha,
      max_participants: max,
      hide_participants: input.hideParticipants,
    });
    if (err) throw err;
    await fetchRecruits();
  }, [user, fetchRecruits]);

  const deleteRecruit = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('recruits').delete().eq('id', id);
    if (err) throw err;
    await fetchRecruits();
  }, [fetchRecruits]);

  const joinRecruit = useCallback(async (recruitId: string) => {
    if (!user) return;
    const { error: err } = await supabase
      .from('recruit_participants')
      .insert({ recruit_id: recruitId, user_id: user.id });
    if (err) {
      if (err.message.includes('duplicate')) {
        // 既に参加済み
      } else if (err.message.includes('RECRUIT_FULL')) {
        throw new Error('定員に達しています');
      } else {
        throw err;
      }
    }
    await fetchRecruits();
  }, [user, fetchRecruits]);

  const leaveRecruit = useCallback(async (recruitId: string) => {
    if (!user) return;
    const { error: err } = await supabase
      .from('recruit_participants')
      .delete()
      .eq('recruit_id', recruitId)
      .eq('user_id', user.id);
    if (err) throw err;
    await fetchRecruits();
  }, [user, fetchRecruits]);

  return {
    recruits,
    loading,
    error,
    refresh: fetchRecruits,
    createRecruit,
    deleteRecruit,
    joinRecruit,
    leaveRecruit,
  };
}
