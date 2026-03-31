'use client';

import { useRef, useEffect } from 'react';
import { DAY_NAMES, DISPLAY_DAYS } from '@/lib/constants';
import { formatDateKey } from '@/lib/utils';
import type { CalendarEvent } from '@/lib/types';

interface DateStripProps {
  selectedDate: string;
  onSelect: (dateKey: string) => void;
  events: CalendarEvent[];
}

export function DateStrip({ selectedDate, onSelect, events }: DateStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = formatDateKey(new Date());

  const dates: string[] = [];
  for (let i = 0; i < DISPLAY_DAYS; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(formatDateKey(d));
  }

  const eventDates = new Set(events.map(e => e.dateKey));

  // 選択された日付にスクロール
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const selected = container.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedDate]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
    >
      {dates.map(dateKey => {
        const d = new Date(dateKey + 'T00:00:00');
        const isSelected = dateKey === selectedDate;
        const isToday = dateKey === today;
        const hasEvents = eventDates.has(dateKey);

        return (
          <button
            key={dateKey}
            data-selected={isSelected}
            onClick={() => onSelect(dateKey)}
            className={`
              flex-shrink-0 flex flex-col items-center min-w-[52px] px-3 py-1.5
              rounded-[10px] transition-all duration-200 border-none cursor-pointer
              ${isSelected
                ? 'bg-white text-indigo-600 shadow-md'
                : 'bg-white/15 text-white/85 hover:bg-white/25'
              }
              ${isToday && !isSelected ? 'ring-1.5 ring-white/60' : ''}
            `}
          >
            <span className="text-[10px]">{DAY_NAMES[d.getDay()]}</span>
            <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
            {hasEvents ? (
              <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-indigo-600' : 'bg-white/50'}`} />
            ) : (
              <span className="h-1" />
            )}
          </button>
        );
      })}
    </div>
  );
}
