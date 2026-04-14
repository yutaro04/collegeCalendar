'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface AvailabilityEntry {
  user_id: string;
  display_name: string;
  message: string;
  expires_at: string;
  created_at: string;
}

export interface AvailabilityInvite {
  id: string;
  inviter_id: string;
  inviter_name: string;
  message: string;
  created_at: string;
}

interface AvailabilityRow {
  user_id: string;
  message: string;
  expires_at: string;
  created_at: string;
  profiles: { display_name: string } | null;
}

interface InviteRow {
  id: string;
  inviter_id: string;
  message: string;
  created_at: string;
  profiles: { display_name: string } | null;
}

async function showLocalNotification(title: string, body: string) {
  if (typeof window === 'undefined') return;
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, { body, icon: '/app.png', badge: '/app.png' });
      return;
    } catch { /* fall through */ }
  }
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/app.png' });
  }
}

interface UseAvailabilityOptions {
  onInviteReceived?: (inviterName: string, message: string) => void;
}

export function useAvailability(opts: UseAvailabilityOptions = {}) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AvailabilityEntry[]>([]);
  const [myEntry, setMyEntry] = useState<AvailabilityEntry | null>(null);
  const [invites, setInvites] = useState<AvailabilityInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const onInviteRef = useRef(opts.onInviteReceived);

  useEffect(() => { userIdRef.current = user?.id ?? null; }, [user]);
  useEffect(() => { onInviteRef.current = opts.onInviteReceived; }, [opts.onInviteReceived]);

  const fetchEntries = useCallback(async () => {
    setError(null);
    const nowIso = new Date().toISOString();
    const { data, error: err } = await supabase
      .from('availability')
      .select(`
        user_id, message, expires_at, created_at,
        profiles!availability_user_id_fkey ( display_name )
      `)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as unknown as AvailabilityRow[];
    const parsed: AvailabilityEntry[] = rows.map(r => ({
      user_id: r.user_id,
      display_name: r.profiles?.display_name ?? '名無し',
      message: r.message,
      expires_at: r.expires_at,
      created_at: r.created_at,
    }));
    setEntries(parsed);
    setMyEntry(parsed.find(e => e.user_id === userIdRef.current) ?? null);
    setLoading(false);
  }, []);

  const fetchInvites = useCallback(async () => {
    if (!userIdRef.current) return;
    const { data, error: err } = await supabase
      .from('availability_invites')
      .select(`
        id, inviter_id, message, created_at,
        profiles!availability_invites_inviter_id_fkey ( display_name )
      `)
      .eq('availability_user_id', userIdRef.current)
      .order('created_at', { ascending: false })
      .limit(50);
    if (err) return;
    const rows = (data ?? []) as unknown as InviteRow[];
    setInvites(rows.map(r => ({
      id: r.id,
      inviter_id: r.inviter_id,
      inviter_name: r.profiles?.display_name ?? '名無し',
      message: r.message,
      created_at: r.created_at,
    })));
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchEntries();
    fetchInvites();
  }, [user, fetchEntries, fetchInvites]);

  // Realtime: 誘いが来たら通知
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('availability_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'availability_invites' },
        async (payload) => {
          const row = payload.new as { id: string; availability_user_id: string; inviter_id: string; message: string };
          if (row.availability_user_id !== userIdRef.current) return;
          const { data: prof } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', row.inviter_id)
            .maybeSingle();
          const name = (prof as { display_name: string } | null)?.display_name ?? '誰か';
          const body = row.message ? `${name}さん: ${row.message}` : `${name}さんが誘っています`;
          showLocalNotification('ゆる募 / ひま', body);
          onInviteRef.current?.(name, row.message);
          fetchInvites();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'availability' },
        () => fetchEntries(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchEntries, fetchInvites]);

  // 期限切れ反映 & 誘いの新着検知のため定期再取得
  const lastInviteIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user) return;
    lastInviteIdRef.current = invites[0]?.id ?? null;
  }, [user, invites]);

  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      fetchEntries();
      const prevTop = lastInviteIdRef.current;
      const { data } = await supabase
        .from('availability_invites')
        .select(`
          id, inviter_id, message, created_at,
          profiles!availability_invites_inviter_id_fkey ( display_name )
        `)
        .eq('availability_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      const rows = (data ?? []) as unknown as InviteRow[];
      if (rows.length > 0 && prevTop && rows[0].id !== prevTop) {
        // 新着を検出
        const newOnes = [];
        for (const r of rows) {
          if (r.id === prevTop) break;
          newOnes.push(r);
        }
        for (const r of newOnes) {
          const name = r.profiles?.display_name ?? '誰か';
          const body = r.message ? `${name}さん: ${r.message}` : `${name}さんが誘っています`;
          showLocalNotification('ゆる募 / ひま', body);
          onInviteRef.current?.(name, r.message);
        }
      }
      setInvites(rows.map(r => ({
        id: r.id,
        inviter_id: r.inviter_id,
        inviter_name: r.profiles?.display_name ?? '名無し',
        message: r.message,
        created_at: r.created_at,
      })));
    };
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [user, fetchEntries]);

  const postAvailability = useCallback(async (message: string, expiresAt: string) => {
    if (!user) return;
    const { error: err } = await supabase
      .from('availability')
      .upsert({
        user_id: user.id,
        message: message.trim(),
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    if (err) throw err;
    await fetchEntries();
  }, [user, fetchEntries]);

  const clearAvailability = useCallback(async () => {
    if (!user) return;
    const { error: err } = await supabase
      .from('availability')
      .delete()
      .eq('user_id', user.id);
    if (err) throw err;
    await fetchEntries();
  }, [user, fetchEntries]);

  const invite = useCallback(async (targetUserId: string, message: string) => {
    if (!user) return;
    const { error: err } = await supabase
      .from('availability_invites')
      .insert({
        availability_user_id: targetUserId,
        inviter_id: user.id,
        message: message.trim(),
      });
    if (err) throw err;
  }, [user]);

  return {
    entries,
    myEntry,
    invites,
    loading,
    error,
    refresh: fetchEntries,
    postAvailability,
    clearAvailability,
    invite,
  };
}
