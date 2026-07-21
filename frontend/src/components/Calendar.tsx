'use client';

import { useState, useCallback, useEffect } from 'react';
import type { CalendarEvent } from '@/lib/types';
import { useEvents } from '@/hooks/useEvents';
import { useFavorites } from '@/hooks/useFavorites';
import { useMyCreatedEvents } from '@/hooks/useMyCreatedEvents';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useNotifications } from '@/hooks/useNotifications';
import { Header } from './Header';
import { TabBar, type TabType } from './TabBar';
import { Timeline } from './Timeline';
import { BottomNav, type NavItem } from './BottomNav';
import { SettingsView } from './SettingsView';
import { LaundryRoom } from './LaundryRoom';
import { BathroomView } from './BathroomView';
import { RecruitView } from './RecruitView';
import { LoginScreen } from './LoginScreen';
import { AddEventModal } from './AddEventModal';
import { Toast } from './Toast';
import { useAuth } from '@/hooks/useAuth';

export function Calendar() {
  const { user, signInWithGoogle, authError } = useAuth();
  const { events, loading, error, refresh, addLocalEvent } = useEvents();
  const { favorites, toggle, addFavorite, isFavorite } = useFavorites();
  const { myEventIds, addId: addMyEventId } = useMyCreatedEvents(user?.id ?? null);
  const { settings: notifSettings, update: updateNotifSettings } = useNotificationSettings();
  const { granted, requestPermission, scheduleLaundryNotification } = useNotifications(events, favorites, notifSettings);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [activeNav, setActiveNav] = useState<NavItem>('calendar');
  const [refreshing, setRefreshing] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (authError) setToast({ message: authError, visible: true });
  }, [authError]);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    showToast('同期完了');
  }, [refresh, showToast]);

  const handleEventCreated = useCallback((event: CalendarEvent) => {
    addLocalEvent(event);
    addMyEventId(event.id);
    addFavorite(event.id);
  }, [addLocalEvent, addMyEventId, addFavorite]);

  const isMine = useCallback((id: string) => myEventIds.has(id), [myEventIds]);

  const handleToggleFav = useCallback((id: string) => {
    const wasFav = isFavorite(id);
    toggle(id);
    showToast(wasFav ? 'お気に入り解除' : 'お気に入り追加');
  }, [toggle, isFavorite, showToast]);

  const handleNavSelect = useCallback((item: NavItem) => {
    setActiveNav(item);
    if (item === 'calendar') setActiveTab('all');
  }, []);

  const handleAddEventClick = useCallback(() => {
    if (!user) {
      showToast('ログインが必要です');
      signInWithGoogle();
      return;
    }
    setShowAddEvent(true);
  }, [user, signInWithGoogle, showToast]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 min-h-screen">
        <div className="w-7 h-7 border-2 border-gray-200 border-t-(--color-primary) rounded-full animate-spin" />
        <div className="text-sm text-gray-400">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-8 min-h-screen">
        <div className="text-sm text-red-500">{error}</div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-(--color-primary) text-white rounded-lg text-sm cursor-pointer border-none"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {activeNav === 'settings' ? (
        <SettingsView
          notifSettings={notifSettings}
          onUpdateNotif={updateNotifSettings}
          notifGranted={granted}
          onRequestPermission={requestPermission}
          onToast={showToast}
        />
      ) : activeNav === 'laundry' ? (
        <LaundryRoom onScheduleNotification={scheduleLaundryNotification} />
      ) : activeNav === 'bathroom' ? (
        <BathroomView />
      ) : activeNav === 'recruit' ? (
        user ? <RecruitView onToast={showToast} /> : <LoginScreen />
      ) : (
        <>
          <Header events={events} favorites={favorites} onRefresh={handleRefresh} refreshing={refreshing} />
          <main className="max-w-180 mx-auto px-4 pt-5 md:px-6">
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
            <Timeline events={events} tab={activeTab} isFavorite={isFavorite} onToggleFav={handleToggleFav} isMine={isMine} />
          </main>

          {/* イベント追加ボタン（FAB）: カレンダー画面のみ表示 */}
          <button
            onClick={handleAddEventClick}
            aria-label="イベントを追加"
            className="fixed bottom-24 right-4 md:right-[calc(50%-22rem)] z-40 w-14 h-14 rounded-full bg-[var(--color-primary)] text-white text-3xl leading-none flex items-center justify-center border-none cursor-pointer shadow-[0_4px_12px_rgba(203,27,59,0.4)] active:scale-95 transition-transform"
          >
            ＋
          </button>
        </>
      )}

      {showAddEvent && (
        <AddEventModal
          onClose={() => setShowAddEvent(false)}
          onCreated={handleEventCreated}
          onToast={showToast}
        />
      )}

      {/* 通知機能を非表示中のため、Settingsアイコンの通知インジケーターも無効化（復活時は notifSettings.enabled に戻す） */}
      <BottomNav active={activeNav} onSelect={handleNavSelect} notificationGranted={false} />
      <Toast message={toast.message} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />
    </div>
  );
}
