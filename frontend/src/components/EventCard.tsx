'use client';

import type { CalendarEvent } from '@/lib/types';
import { formatDuration } from '@/lib/utils';

interface EventCardProps {
  event: CalendarEvent;
  isFavorite: boolean;
  onToggleFav: () => void;
}

export function EventCard({ event, isFavorite, onToggleFav }: EventCardProps) {
  const durationMin = event.isAllDay
    ? 0
    : Math.round((new Date(event.endISO).getTime() - new Date(event.startISO).getTime()) / 60000);

  return (
    <div
      className="bg-white rounded-xl p-3.5 px-4 mb-2 shadow-sm flex gap-3 relative overflow-hidden
                 transition-all duration-150 active:scale-[0.98] md:p-4 md:px-5 md:gap-4 md:hover:shadow-lg md:hover:-translate-y-0.5"
      style={{ borderLeft: `4px solid ${event.color}` }}
    >
      {/* Time Column */}
      <div className="flex flex-col items-center min-w-[48px] pt-0.5 md:min-w-[56px]">
        {event.isAllDay ? (
          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            終日
          </span>
        ) : (
          <>
            <span className="text-base font-bold leading-tight md:text-lg">{event.startTime}</span>
            <span className="w-px h-2 bg-gray-200 my-0.5" />
            <span className="text-xs text-gray-500">{event.endTime}</span>
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold leading-snug mb-1 break-words md:text-base">
          {event.title}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 truncate max-w-[160px]">
            {event.calendarName}
          </span>
          {event.location && (
            <span className="text-[11px] text-gray-500 truncate max-w-[160px]">
              📍 {event.location}
            </span>
          )}
          {!event.isAllDay && (
            <span className="text-[11px] text-gray-500">{formatDuration(durationMin)}</span>
          )}
        </div>
      </div>

      {/* Fav Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        className={`
          self-start bg-transparent border-none text-xl cursor-pointer p-1 leading-none
          transition-all duration-200
          ${isFavorite ? 'opacity-100 text-amber-400 hover:scale-110' : 'opacity-30 hover:opacity-60'}
        `}
      >
        {isFavorite ? '★' : '☆'}
      </button>
    </div>
  );
}
