'use client';

import type { NotificationSettings as Settings } from '@/hooks/useNotificationSettings';

interface NotificationSettingsProps {
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
  granted: boolean;
  onRequestPermission: () => Promise<boolean>;
}

const MINUTES_OPTIONS = [5, 10, 15, 30, 60, 120];

function formatMinutes(m: number): string {
  if (m >= 60) return `${m / 60}時間前`;
  return `${m}分前`;
}

export function NotificationSettings({ settings, onUpdate, granted, onRequestPermission }: NotificationSettingsProps) {
  const handleToggle = async () => {
    if (!settings.enabled) {
      // 有効化時にブラウザ権限も確認
      if (!granted) {
        const ok = await onRequestPermission();
        if (!ok) return;
      }
      onUpdate({ enabled: true });
    } else {
      onUpdate({ enabled: false });
    }
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 pt-5 md:px-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">通知設定</h2>

      {/* 通知トグル */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[15px] font-semibold text-gray-900">通知を有効にする</div>
            <div className="text-[12px] text-gray-400 mt-0.5">お気に入りの予定のみ通知します</div>
          </div>
          <button
            onClick={handleToggle}
            className={`relative w-12 h-7 rounded-full border-none cursor-pointer transition-colors duration-200 ${
              settings.enabled ? 'bg-[var(--color-primary)]' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                settings.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        {!granted && (
          <div className="text-[12px] text-amber-600 mt-2">
            ブラウザの通知権限が必要です
          </div>
        )}
      </div>

      {/* 通知タイミング */}
      <div className={`bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 transition-opacity duration-200 ${
        settings.enabled ? '' : 'opacity-40 pointer-events-none'
      }`}>
        <div className="text-[15px] font-semibold text-gray-900 mb-3">通知タイミング</div>
        <div className="grid grid-cols-3 gap-2">
          {MINUTES_OPTIONS.map(m => (
            <button
              key={m}
              onClick={() => onUpdate({ minutesBefore: m })}
              className={`py-2.5 rounded-xl text-[13px] font-medium border-none cursor-pointer transition-all duration-150 ${
                settings.minutesBefore === m
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {formatMinutes(m)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
