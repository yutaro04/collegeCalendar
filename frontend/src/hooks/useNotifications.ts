'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CalendarEvent } from '@/lib/types';
import type { NotificationSettings } from './useNotificationSettings';

const NOTIFIED_KEY = 'cal_notified';
const LAUNDRY_SCHEDULE_KEY = 'laundry_notif_schedule';

interface LaundrySchedule {
  id: string;
  label: string;
  finishedAt: number; // timestamp
  notified?: boolean;
}

function getLaundrySchedules(): LaundrySchedule[] {
  try {
    const stored = localStorage.getItem(LAUNDRY_SCHEDULE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveLaundrySchedules(schedules: LaundrySchedule[]) {
  localStorage.setItem(LAUNDRY_SCHEDULE_KEY, JSON.stringify(schedules));
}

async function showNotification(title: string, body: string) {
  // Service Worker経由で通知（iOS PWA対応）
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: '/app.png',
      badge: '/app.png',
    });
    return;
  }
  // フォールバック（デスクトップ等）
  if ('Notification' in window) {
    new Notification(title, { body, icon: '/app.png' });
  }
}

export function useNotifications(
  events: CalendarEvent[],
  favorites: Record<string, boolean>,
  settings: NotificationSettings,
) {
  const [granted, setGranted] = useState(false);
  const notifiedRef = useRef<Record<string, boolean>>({});

  // Service Worker登録 & 権限チェック
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if ('Notification' in window) {
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

  // カレンダー通知チェック
  useEffect(() => {
    if (!granted || !settings.enabled) return;

    const check = () => {
      const now = Date.now();
      const windowMs = settings.minutesBefore * 60000;
      events.forEach(e => {
        if (e.isAllDay || !favorites[e.id]) return;
        const notifKey = `${e.id}_${e.dateKey}`;
        const diff = new Date(e.startISO).getTime() - now;
        if (diff > 0 && diff < windowMs && diff > windowMs - 5 * 60000 && !notifiedRef.current[notifKey]) {
          showNotification(
            'COLLEGE APP',
            `${settings.minutesBefore}分後に ${e.title}が開催されます`,
          );
          notifiedRef.current[notifKey] = true;
          localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notifiedRef.current));
        }
      });
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [granted, events, favorites, settings]);

  // ランドリー通知チェック
  useEffect(() => {
    if (!granted) return;

    const check = () => {
      const now = Date.now();
      const schedules = getLaundrySchedules();
      let changed = false;
      for (const s of schedules) {
        if (!s.notified && now >= s.finishedAt) {
          showNotification('COLLEGE APP', `${s.label}が完了しました`);
          s.notified = true;
          changed = true;
        }
      }
      if (changed) {
        // 通知済みかつ1時間以上経過したものを削除
        const cleaned = schedules.filter(s => !s.notified || now - s.finishedAt < 3600000);
        saveLaundrySchedules(cleaned);
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [granted]);

  const scheduleLaundryNotification = useCallback((id: string, label: string, finishedAt: string) => {
    const schedules = getLaundrySchedules();
    // 同じマシンの既存スケジュールを上書き
    const filtered = schedules.filter(s => s.id !== id);
    filtered.push({ id, label, finishedAt: new Date(finishedAt).getTime() });
    saveLaundrySchedules(filtered);
  }, []);

  return { granted, requestPermission, scheduleLaundryNotification };
}
