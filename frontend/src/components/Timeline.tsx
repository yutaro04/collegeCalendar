'use client';

import type {CalendarEvent} from '@/lib/types';
import {formatDateKey} from '@/lib/utils';
import {DAY_NAMES} from '@/lib/constants';
import type {TabType} from './TabBar';
import {EventCard} from './EventCard';

interface TimelineProps {
  events: CalendarEvent[];
  tab: TabType;
  isFavorite: (id: string) => boolean;
  onToggleFav: (id: string) => void;
  isMine: (id: string) => boolean;
}

export function Timeline({events, tab, isFavorite, onToggleFav, isMine}: TimelineProps) {
  const now = new Date();
  const nowMs = now.getTime();
  const todayKey = formatDateKey(now);

  // 終了時刻が現在より後のイベントのみ（終日イベントは当日中なら表示）
  const upcoming = events.filter(e => {
    if (e.isAllDay) return e.dateKey >= todayKey;
    return new Date(e.endISO).getTime() > nowMs;
  });

  // タブフィルタ
  let filtered = upcoming;
  if (tab === 'myCreated') {
    filtered = upcoming.filter(e => isMine(e.id));
  } else if (tab === 'myEvents') {
    filtered = upcoming.filter(e => isFavorite(e.id));
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">
          {tab === 'myEvents' ? 'お気に入りの予定はありません' : tab === 'myCreated' ? '作成した予定はありません' : '予定はありません'}
        </p>
      </div>
    );
  }

  // 日付ごとにグループ化し、日→時刻の順で時系列に並べる
  const groups = groupByDate(filtered);

  return (
    <div>
      {groups.map(({dateKey, events: dayEvents}) => (
        <section key={dateKey}>
          <DateHeader dateKey={dateKey} todayKey={todayKey} />
          {dayEvents.map(e => (
            <EventCard
              key={`${e.id}-${e.dateKey}`}
              event={e}
              isFavorite={isFavorite(e.id)}
              onToggleFav={() => onToggleFav(e.id)}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

/** 日付ヘッダー（スクロール時は上部に固定） */
function DateHeader({dateKey, todayKey}: {dateKey: string; todayKey: string}) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  const relative = getRelativeLabel(dateKey, todayKey);

  // 日曜=赤・土曜=青で曜日を色分け
  const dowColor = dow === 0 ? 'text-[var(--color-primary)]' : dow === 6 ? 'text-blue-500' : 'text-gray-400';

  return (
    <div className="sticky top-0 z-10 -mx-4 px-4 py-2 mb-2 flex items-center gap-2 bg-[var(--color-surface)]/90 backdrop-blur-sm">
      <span className="text-sm font-bold text-gray-700 tabular-nums">{m}/{d}</span>
      <span className={`text-xs font-medium ${dowColor}`}>（{DAY_NAMES[dow]}）</span>
      {relative && (
        <span className="text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2 py-0.5 rounded-full">
          {relative}
        </span>
      )}
      <div className="flex-1 h-px bg-black/5" />
    </div>
  );
}

/** 今日/明日 の相対ラベルを返す（それ以外は null） */
function getRelativeLabel(dateKey: string, todayKey: string): string | null {
  if (dateKey === todayKey) return '今日';
  const [y, m, d] = todayKey.split('-').map(Number);
  const tomorrow = new Date(y, m - 1, d + 1);
  if (dateKey === formatDateKey(tomorrow)) return '明日';
  return null;
}

/** イベントを日付ごとにグループ化し、日付昇順・各日内は開始時刻昇順で返す */
function groupByDate(events: CalendarEvent[]): {dateKey: string; events: CalendarEvent[]}[] {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const arr = map.get(e.dateKey);
    if (arr) arr.push(e);
    else map.set(e.dateKey, [e]);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dateKey, evs]) => ({
      dateKey,
      events: evs.sort((x, y) => x.startISO.localeCompare(y.startISO)),
    }));
}
