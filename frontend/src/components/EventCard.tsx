'use client';

import { useState } from 'react';
import type { CalendarEvent } from '@/lib/types';
import { MONTH_NAMES_EN, DAY_NAMES_EN } from '@/lib/constants';

interface EventCardProps {
  event: CalendarEvent;
  isFavorite: boolean;
  onToggleFav: () => void;
}

export function EventCard({ event, isFavorite, onToggleFav }: EventCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const d = new Date(event.startISO);
  const month = MONTH_NAMES_EN[d.getMonth()];
  const day = d.getDate();
  const dayName = DAY_NAMES_EN[d.getDay()];

  const badge = getBadge(event);
  const hasDescription = event.description.trim().length > 0;

  return (
    <div className="bg-white rounded-2xl p-4 mb-3 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-150 active:scale-[0.98]">
      <div className="flex gap-4">
        {/* Date Badge */}
        <div
          className="flex flex-col items-center justify-center min-w-[52px] text-white rounded-xl py-2.5 px-1"
          style={{ backgroundColor: event.color || 'var(--color-primary)' }}
        >
          <span className="text-[10px] font-semibold tracking-wider leading-none">{month}</span>
          <span className="text-xl font-bold leading-tight">{day}</span>
          <span className="text-[10px] font-medium tracking-wide leading-none">{dayName}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 py-0.5">
          <div className="text-[12px] text-gray-400 mb-0.5">
            {event.isAllDay ? '終日' : `${event.startTime} - ${event.endTime}`}
          </div>
          <div className="text-[15px] font-semibold leading-snug mb-1.5 break-words text-gray-900">
            {event.title}
          </div>
          <div className="flex flex-col gap-0.5 text-[12px] text-gray-400">
            {event.location && <span className="truncate">{event.location}</span>}
            <span>Host: {event.calendarName}</span>
          </div>
        </div>

        {/* Right: badge + fav */}
        <div className="flex flex-col items-end justify-between shrink-0">
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-md ${badge.className}`}>
              {badge.label}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
            className={`bg-transparent border-none text-lg cursor-pointer p-1 leading-none transition-all duration-200
              ${isFavorite ? 'text-[var(--color-primary)]' : 'text-gray-200 hover:text-gray-400'}`}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
      </div>

      {/* Expandable detail */}
      {hasDescription && (
        <>
          <button
            onClick={() => setDetailOpen(v => !v)}
            className="w-full flex justify-center pt-1 bg-transparent border-none cursor-pointer"
          >
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-300 text-gray-300 ${detailOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ease-out ${detailOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="pt-2 text-[13px] text-gray-500 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getBadge(event: CalendarEvent): { label: string; className: string } | null {
  const desc = (event.description + ' ' + event.title).toLowerCase();
  if (desc.includes('mandatory') || desc.includes('必須')) {
    return { label: '必須', className: 'bg-[var(--color-primary)] text-white' };
  }
  if (desc.includes('registration') || desc.includes('登録')) {
    return { label: 'REGISTRATION OPEN', className: 'bg-emerald-500 text-white' };
  }
  return null;
}
