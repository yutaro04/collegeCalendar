'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CalendarEvent } from '@/lib/types';

export interface CalendarOption {
  key: string; // 'event' | 'house'
  name: string;
}
export interface RoomOption {
  label: string;
  email: string;
}
export interface PostConfig {
  calendars: CalendarOption[];
  rooms: RoomOption[];
}

export interface CreateEventInput {
  calendarKey: string;
  title: string;
  description: string;
  location: string;
  roomEmail: string;
  attendees: string[];
  isAllDay: boolean;
  dateKey: string; // yyyy-MM-dd
  startISO: string;
  endISO: string;
}

export function useAddEvent() {
  const [config, setConfig] = useState<PostConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/events/config')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d.success) setConfig(d.config as PostConfig);
        else setConfigError(d.error ?? '設定の取得に失敗しました');
      })
      .catch(() => { if (!cancelled) setConfigError('設定の取得に失敗しました'); });
    return () => { cancelled = true; };
  }, []);

  /** イベントを作成。成功時は作成されたイベント(楽観的表示用)を返す */
  const createEvent = useCallback(async (input: CreateEventInput): Promise<CalendarEvent> => {
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('ログインが必要です');

      const res = await fetch('/api/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'イベント作成に失敗しました');
      return data.event as CalendarEvent;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { config, configError, submitting, createEvent };
}
