'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'cal_notification_settings';

export interface NotificationSettings {
  enabled: boolean;
  minutesBefore: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  minutesBefore: 60,
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) }); } catch { /* ignore */ }
    }
  }, []);

  const update = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, update };
}
