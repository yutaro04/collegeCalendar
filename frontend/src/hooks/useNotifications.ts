'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CalendarEvent } from '@/lib/types';
import type { NotificationSettings } from './useNotificationSettings';

const NOTIFIED_KEY = 'cal_notified';

export function useNotifications(
  events: CalendarEvent[],
  favorites: Record<string, boolean>,
  settings: NotificationSettings,
) {
  const [granted, setGranted] = useState(false);
  const notifiedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setGranted(Notification.permission === 'granted');
    }
    const stored = localStorage.getItem(NOTIFIED_KEY);
    if (stored) {
      try { notifiedRef.current = JSON.parse(stored); } catch { /* ignore */ }
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') {
      setGranted(true);
      return true;
    }
    const perm = await Notification.requestPermission();
    const ok = perm === 'granted';
    setGranted(ok);
    return ok;
  }, []);

  // 設定に基づいた通知チェック
  useEffect(() => {
    if (!granted || !settings.enabled) return;

    const check = () => {
      const now = Date.now();
      const windowMs = settings.minutesBefore * 60000;
      events.forEach(e => {
        if (e.isAllDay || !favorites[e.id]) return;
        const diff = new Date(e.startISO).getTime() - now;
        // minutesBefore の前後5分の範囲で通知
        if (diff > 0 && diff < windowMs && diff > windowMs - 5 * 60000 && !notifiedRef.current[e.id]) {
          new Notification(`${settings.minutesBefore}分後に ${e.title}が開催されます`);
          notifiedRef.current[e.id] = true;
          localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notifiedRef.current));
        }
      });
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [granted, events, favorites, settings]);

  return { granted, requestPermission };
}
