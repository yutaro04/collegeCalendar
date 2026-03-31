'use client';

import { useState, useEffect } from 'react';
import type { CalendarEvent } from '@/lib/types';
import { formatCountdown } from '@/lib/utils';

interface FavAlertProps {
  events: CalendarEvent[];
  favorites: Record<string, boolean>;
}

export function FavAlert({ events, favorites }: FavAlertProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const upcoming = events
    .filter(e => favorites[e.id] && !e.isAllDay && new Date(e.startISO).getTime() > now)
    .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime())
    .slice(0, 5);

  if (upcoming.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl p-3.5 px-4 mb-4 shadow-sm">
      <div className="text-[13px] font-bold text-amber-800 mb-2">☆ お気に入りの予定</div>
      {upcoming.map(e => {
        const diff = new Date(e.startISO).getTime() - now;
        const isSoon = diff < 3600000;
        return (
          <div
            key={e.id}
            className="flex items-center gap-2 py-1.5 text-[13px] text-amber-900
                       border-t first:border-t-0 border-amber-800/10"
          >
            <span
              className={`
                text-[11px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap
                ${isSoon ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}
              `}
            >
              {formatCountdown(diff)}
            </span>
            <span className="truncate">{e.title} ({e.startTime})</span>
          </div>
        );
      })}
    </div>
  );
}
