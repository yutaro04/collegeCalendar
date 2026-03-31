'use client';

import { DateStrip } from './DateStrip';
import type { CalendarEvent } from '@/lib/types';

interface HeaderProps {
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  events: CalendarEvent[];
  favFilter: boolean;
  onToggleFavFilter: () => void;
  notificationGranted: boolean;
  onRequestNotification: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  lastSync: string;
}

export function Header({
  selectedDate,
  onSelectDate,
  events,
  favFilter,
  onToggleFavFilter,
  notificationGranted,
  onRequestNotification,
  onRefresh,
  refreshing,
  lastSync,
}: HeaderProps) {
  const syncTime = lastSync
    ? (() => {
        const d = new Date(lastSync);
        return `最終同期: ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      })()
    : '';

  return (
    <header className="bg-indigo-600 text-white sticky top-0 z-50 shadow-lg px-5 pt-4 pb-3 md:px-8 md:pt-5">
      {/* Top Row */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold tracking-wide md:text-[22px]">College Calendar</h1>
        <div className="flex gap-2">
          <IconButton
            onClick={onRefresh}
            title="データを再同期"
            className={refreshing ? 'animate-spin' : ''}
          >
            ↻
          </IconButton>
          <IconButton
            onClick={onToggleFavFilter}
            title="お気に入りのみ表示"
            active={favFilter}
          >
            {favFilter ? '★' : '☆'}
          </IconButton>
          <IconButton
            onClick={onRequestNotification}
            title="通知を有効にする"
            active={notificationGranted}
          >
            🔔
          </IconButton>
        </div>
      </div>

      {/* Sync Status */}
      {syncTime && (
        <div className="text-[10px] text-white/60 text-right pb-1.5">{syncTime}</div>
      )}

      {/* Date Strip */}
      <DateStrip selectedDate={selectedDate} onSelect={onSelectDate} events={events} />
    </header>
  );
}

function IconButton({
  children,
  onClick,
  title,
  active,
  className = '',
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        w-9 h-9 rounded-full border-none cursor-pointer text-base
        flex items-center justify-center text-white transition-colors duration-200
        ${active ? 'bg-white/50' : 'bg-white/20 hover:bg-white/35'}
        md:w-10 md:h-10 md:text-lg
        ${className}
      `}
    >
      {children}
    </button>
  );
}
