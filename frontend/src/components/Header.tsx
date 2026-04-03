'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import type { CalendarEvent } from '@/lib/types';
import { MONTH_NAMES_EN, DAY_NAMES_EN } from '@/lib/constants';
import { formatTimeUntil, isMandatoryEvent, extractBracketLabels } from '@/lib/utils';

interface HeaderProps {
  events: CalendarEvent[];
  favorites: Record<string, boolean>;
  onRefresh: () => void;
  refreshing: boolean;
}

const SIDE_SCALE = 0.88;
const SIDE_OPACITY = 0.5;
const PEEK_RATIO = 0.12; // 左右にどれだけ見せるか

export function Header({ events, favorites, onRefresh, refreshing }: HeaderProps) {
  const headerEvents = events
    .filter(e => isMandatoryEvent(e.title) || favorites[e.id])
    .filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i);

  const [activeIndex, setActiveIndex] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  const [detailOpenId, setDetailOpenId] = useState<string | null>(null);

  // ドラッグ状態
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchRef = useRef({ startX: 0, startY: 0, locked: false, lockedDir: '' as '' | 'h' | 'v' });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const count = headerEvents.length;
  const safeIndex = count > 0 ? ((activeIndex % count) + count) % count : 0;
  const current = headerEvents[safeIndex] ?? null;

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(count - 1, index));
    setActiveIndex(clamped);
    setDetailOpenId(null);
  }, [count]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, locked: false, lockedDir: '' };
    setIsDragging(true);
    setDragX(0);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - touchRef.current.startX;
    const dy = e.touches[0].clientY - touchRef.current.startY;

    if (!touchRef.current.locked) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        touchRef.current.locked = true;
        touchRef.current.lockedDir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      }
      return;
    }

    if (touchRef.current.lockedDir === 'v') return;

    e.preventDefault();

    // 端での抵抗感
    let clampedDx = dx;
    if ((safeIndex === 0 && dx > 0) || (safeIndex === count - 1 && dx < 0)) {
      clampedDx = dx * 0.3;
    }
    setDragX(clampedDx);
  }, [isDragging, count]);

  const onTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50;
    if (dragX < -threshold && safeIndex < count - 1) {
      goTo(safeIndex + 1);
    } else if (dragX > threshold && safeIndex > 0) {
      goTo(safeIndex - 1);
    }
    setDragX(0);
  }, [isDragging, dragX, count, goTo]);

  const alertText = (() => {
    if (!current || now === null) return '';
    const countdown = formatTimeUntil(new Date(current.startISO).getTime() - now);
    const labels = extractBracketLabels(current.title);
    const tag = labels ? labels.join(' / ') : (favorites[current.id] ? 'お気に入り' : '');
    return `${countdown}${tag ? ` — ${tag}` : ''}`;
  })();

  // カード位置・スケール計算
  const getCardStyle = (index: number): React.CSSProperties => {
    const containerWidth = containerRef.current?.offsetWidth ?? 360;
    const cardWidth = containerWidth * (1 - PEEK_RATIO * 2);
    const offset = index - safeIndex;
    const dragProgress = containerWidth > 0 ? dragX / containerWidth : 0;

    const x = (offset + dragProgress) * (cardWidth + 8);
    const absOffset = Math.abs(offset - dragProgress);
    const scale = 1 - (1 - SIDE_SCALE) * Math.min(absOffset, 1);
    const opacity = 1 - (1 - SIDE_OPACITY) * Math.min(absOffset, 1);

    return {
      transform: `translateX(${x}px) scale(${scale})`,
      opacity,
      zIndex: 10 - Math.abs(offset),
      transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.35s ease',
    };
  };

  // 表示範囲: active ± 2
  const visibleIndices = headerEvents
    .map((_, i) => i)
    .filter(i => Math.abs(i - safeIndex) <= 2);

  return (
    <header className="max-w-180 mx-auto bg-(--color-primary) text-white rounded-b-2xl overflow-hidden">
      {/* Alert strip */}
      {current && alertText && (
        <div className="bg-black/15 text-center py-1.5 px-4 text-[11px] font-semibold tracking-wide">
          {alertText}
        </div>
      )}

      {/* Expo Carousel */}
      {count > 0 ? (
        <>
          <div
            ref={containerRef}
            className="relative overflow-hidden"
            style={{ paddingLeft: `${PEEK_RATIO * 100}%`, paddingRight: `${PEEK_RATIO * 100}%` }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative h-35">
              {visibleIndices.map(i => {
                const event = headerEvents[i];
                const isActive = i === safeIndex;
                const cardKey = `${event.id}-${i}`;

                return (
                  <div
                    key={cardKey}
                    className="absolute inset-0 will-change-transform"
                    style={getCardStyle(i)}
                    onClick={() => { if (!isActive) goTo(i); }}
                  >
                    <div className={`h-full rounded-2xl bg-white/10 overflow-hidden ${isActive ? '' : 'cursor-pointer'}`}>
                      {isActive ? (
                        <FeaturedEvent event={event} />
                      ) : (
                        <PeekCard event={event} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expandable detail */}
          {current && current.description.trim().length > 0 && (() => {
            const key = `${current.id}-${safeIndex}`;
            const isOpen = detailOpenId === key;
            return (
              <div>
                <button
                  onClick={() => setDetailOpenId(prev => prev === key ? null : key)}
                  className="w-full flex justify-center py-1 bg-transparent border-none cursor-pointer"
                >
                  <svg
                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-transform duration-300 opacity-60 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-75 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 pb-3 text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                    {current.description}
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      ) : (
        <div className="px-5 py-6 text-center text-white/50 text-sm">
          注目イベントはありません
        </div>
      )}

      {/* Dots (center) + Sync */}
      <div className="flex items-center px-5 pb-2.5 pt-1">
        <div className="flex-1" />
        {count > 1 && (
          <div className="flex gap-1.5">
            {headerEvents.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === safeIndex ? 'bg-white w-4' : 'bg-white/30 w-1.5'
                }`}
              />
            ))}
          </div>
        )}
        <div className="flex-1 flex justify-end">
          <button
            onClick={onRefresh}
            className={`text-white/50 text-xs border-none bg-transparent cursor-pointer hover:text-white/80 transition-colors ${refreshing ? 'animate-spin' : ''}`}
          >
            ↻
          </button>
        </div>
      </div>
    </header>
  );
}

/** アクティブカード: 詳細表示あり */
function FeaturedEvent({ event }: { event: CalendarEvent }) {
  const d = new Date(event.startISO);
  const month = MONTH_NAMES_EN[d.getMonth()];
  const day = d.getDate();
  const dayName = DAY_NAMES_EN[d.getDay()];

  return (
    <div className="px-5 pt-4 pb-3 h-full flex flex-col justify-center">
      <h2 className="text-lg font-bold mb-1.5 leading-tight line-clamp-2">{event.title}</h2>
      <div className="flex flex-col gap-0.5 text-[13px] text-white/80">
        <span>{month} {day} ({dayName}) {event.isAllDay ? '終日' : `${event.startTime} - ${event.endTime}`}</span>
        {event.location && <span className="truncate">{event.location}</span>}
      </div>
    </div>
  );
}

/** サイドのプレビューカード */
function PeekCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="px-4 pt-4 pb-3 h-full flex flex-col justify-center">
      <div className="text-sm font-bold leading-snug line-clamp-2">{event.title}</div>
      <div className="text-[11px] text-white/60 mt-1">
        {event.isAllDay ? '終日' : `${event.startTime} - ${event.endTime}`}
      </div>
    </div>
  );
}
