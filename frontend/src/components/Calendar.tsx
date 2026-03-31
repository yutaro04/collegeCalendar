'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { useFavorites } from '@/hooks/useFavorites';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDateKey } from '@/lib/utils';
import { Header } from './Header';
import { FavAlert } from './FavAlert';
import { Timeline } from './Timeline';
import { Toast } from './Toast';

export function Calendar() {
  const { events, lastSync, loading, error, refresh } = useEvents();
  const { favorites, toggle, isFavorite } = useFavorites();
  const { granted, requestPermission } = useNotifications(events, favorites);

  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  const [favFilter, setFavFilter] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  // Swipe navigation
  const touchRef = useRef({ x: 0, y: 0 });

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    showToast('同期が完了しました');
  }, [refresh, showToast]);

  const handleRequestNotification = useCallback(async () => {
    const ok = await requestPermission();
    showToast(ok ? '通知を有効にしました' : '通知が許可されませんでした');
  }, [requestPermission, showToast]);

  const handleToggleFav = useCallback((id: string) => {
    const wasFav = isFavorite(id);
    toggle(id);
    showToast(wasFav ? 'お気に入りを解除しました' : 'お気に入りに追加しました');
  }, [toggle, isFavorite, showToast]);

  // Date navigation helper
  const navigateDay = useCallback((offset: number) => {
    setSelectedDate(prev => {
      const d = new Date(prev + 'T00:00:00');
      d.setDate(d.getDate() + offset);
      return formatDateKey(d);
    });
  }, []);

  // Swipe
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      touchRef.current = { x: e.changedTouches[0].screenX, y: e.changedTouches[0].screenY };
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].screenX - touchRef.current.x;
      const dy = e.changedTouches[0].screenY - touchRef.current.y;
      if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2) {
        navigateDay(dx < 0 ? 1 : -1);
      }
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
    };
  }, [navigateDay]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigateDay(-1);
      if (e.key === 'ArrowRight') navigateDay(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigateDay]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
        <div className="text-sm text-gray-500">予定を読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-8">
        <div className="text-4xl">⚠️</div>
        <div className="text-sm text-red-500">{error}</div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm cursor-pointer border-none"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <>
      <Header
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        events={events}
        favFilter={favFilter}
        onToggleFavFilter={() => setFavFilter(f => !f)}
        notificationGranted={granted}
        onRequestNotification={handleRequestNotification}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        lastSync={lastSync}
      />

      <main className="max-w-[720px] mx-auto p-4 md:p-6 md:max-w-[800px]">
        <FavAlert events={events} favorites={favorites} />
        <Timeline
          events={events}
          selectedDate={selectedDate}
          favFilter={favFilter}
          isFavorite={isFavorite}
          onToggleFav={handleToggleFav}
        />
      </main>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />
    </>
  );
}
