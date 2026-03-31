'use client';

import type { CalendarEvent } from '@/lib/types';
import { formatDateKey } from '@/lib/utils';
import { DAY_NAMES } from '@/lib/constants';
import { EventCard } from './EventCard';

interface TimelineProps {
  events: CalendarEvent[];
  selectedDate: string;
  favFilter: boolean;
  isFavorite: (id: string) => boolean;
  onToggleFav: (id: string) => void;
}

export function Timeline({ events, selectedDate, favFilter, isFavorite, onToggleFav }: TimelineProps) {
  let filtered = events.filter(e => e.dateKey === selectedDate);
  if (favFilter) {
    filtered = filtered.filter(e => isFavorite(e.id));
  }

  // Section header
  const d = new Date(selectedDate + 'T00:00:00');
  const todayKey = formatDateKey(new Date());
  const dateLabel = `${d.getMonth() + 1}/${d.getDate()} (${DAY_NAMES[d.getDay()]})`;
  const label = selectedDate === todayKey ? `今日 - ${dateLabel}` : dateLabel;

  // Group
  const allDay = filtered.filter(e => e.isAllDay);
  const timed = filtered.filter(e => !e.isAllDay);
  const hourGroups: Record<string, CalendarEvent[]> = {};
  timed.forEach(e => {
    const hour = e.startTime.split(':')[0];
    if (!hourGroups[hour]) hourGroups[hour] = [];
    hourGroups[hour].push(e);
  });

  const now = new Date();
  const nowHour = now.getHours();
  const isToday = selectedDate === todayKey;

  return (
    <div>
      {/* Section Header */}
      <div className="text-sm font-bold text-gray-500 px-1 py-2 flex items-center gap-1.5 md:text-base">
        {label}
        {filtered.length > 0 && (
          <span className="bg-indigo-50 text-indigo-600 text-[11px] px-2 py-px rounded-full font-semibold">
            {filtered.length}件
          </span>
        )}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">{favFilter ? '☆' : '📅'}</div>
          <p className="text-sm">
            {favFilter ? 'お気に入りの予定はありません' : 'この日の予定はありません'}
          </p>
        </div>
      )}

      {/* All Day Events */}
      {allDay.length > 0 && (
        <div className="mb-1">
          <TimeLabel label="終日" />
          {allDay.map(e => (
            <EventCard key={e.id} event={e} isFavorite={isFavorite(e.id)} onToggleFav={() => onToggleFav(e.id)} />
          ))}
        </div>
      )}

      {/* Timed Events */}
      {(() => {
        let nowInserted = false;
        return Object.keys(hourGroups).sort().map(hour => {
          const h = parseInt(hour);
          const showNow = isToday && !nowInserted && h >= nowHour;
          if (showNow) nowInserted = true;

          return (
            <div key={hour} className="mb-1">
              {showNow && <NowIndicator />}
              <TimeLabel label={`${hour}:00`} />
              {hourGroups[hour].map(e => (
                <EventCard key={e.id} event={e} isFavorite={isFavorite(e.id)} onToggleFav={() => onToggleFav(e.id)} />
              ))}
            </div>
          );
        });
      })()}
    </div>
  );
}

function TimeLabel({ label }: { label: string }) {
  return (
    <div className="text-xs font-semibold text-gray-500 px-1 py-1.5 flex items-center gap-2">
      {label}
      <span className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function NowIndicator() {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return (
    <div className="flex items-center gap-2 py-1 my-1">
      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
      <span className="flex-1 h-0.5 bg-red-500 opacity-40" />
      <span className="text-[11px] text-red-500 font-semibold shrink-0">{time}</span>
    </div>
  );
}
