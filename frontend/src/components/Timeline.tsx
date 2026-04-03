'use client';

import type {CalendarEvent} from '@/lib/types';
import {formatDateKey} from '@/lib/utils';
import type {TabType} from './TabBar';
import {EventCard} from './EventCard';

interface TimelineProps {
  events: CalendarEvent[];
  tab: TabType;
  isFavorite: (id: string) => boolean;
  onToggleFav: (id: string) => void;
}

export function Timeline({events, tab, isFavorite, onToggleFav}: TimelineProps) {
  const now = new Date();
  const nowMs = now.getTime();

  // 終了時刻が現在より後のイベントのみ（終日イベントは当日中なら表示）
  const upcoming = events.filter(e => {
    if (e.isAllDay) return e.dateKey >= formatDateKey(now);
    return new Date(e.endISO).getTime() > nowMs;
  });

  // 開始時刻が現在に近い順にソート
  const sorted = [...upcoming].sort((a, b) => {
    const diffA = Math.abs(new Date(a.startISO).getTime() - nowMs);
    const diffB = Math.abs(new Date(b.startISO).getTime() - nowMs);
    return diffA - diffB;
  });

  // タブフィルタ
  let filtered = sorted;
  if (tab === 'thisWeek') {
    const weekEnd = new Date();
    weekEnd.setDate(now.getDate() + (7 - now.getDay()));
    const weekEndKey = formatDateKey(weekEnd);
    const todayKey = formatDateKey(now);
    filtered = sorted.filter(e => e.dateKey >= todayKey && e.dateKey <= weekEndKey);
  } else if (tab === 'myEvents') {
    filtered = sorted.filter(e => isFavorite(e.id));
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">
          {tab === 'myEvents' ? 'お気に入りの予定はありません' : '予定はありません'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {filtered.map((e) => (
        <EventCard
          key={`${e.id}-${e.dateKey}`}
          event={e}
          isFavorite={isFavorite(e.id)}
          onToggleFav={() => onToggleFav(e.id)}
        />
      ))}
    </div>
  );
}
