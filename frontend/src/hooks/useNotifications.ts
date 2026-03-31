'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CalendarEvent } from '@/lib/types';

const NOTIFIED_KEY = 'cal_notified';

export function useNotifications(events: CalendarEvent[], favorites: Record<string, boolean>) {
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

  // 1時間前通知チェック
  useEffect(() => {
    if (!granted) return;

    const check = () => {
      const now = Date.now();
      events.forEach(e => {
        if (e.isAllDay || !favorites[e.id]) return;
        const diff = new Date(e.startISO).getTime() - now;
        if (diff > 55 * 60000 && diff < 65 * 60000 && !notifiedRef.current[e.id]) {
          new Notification(`まもなく: ${e.title}`, {
            body: `${e.startTime} - ${e.calendarName}`,
          });
          notifiedRef.current[e.id] = true;
          localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notifiedRef.current));
        }
      });
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [granted, events, favorites]);

  return { granted, requestPermission };
}
