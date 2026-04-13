'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { useFavorites } from '@/hooks/useFavorites';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useNotifications } from '@/hooks/useNotifications';
import { Header } from './Header';
import { TabBar, type TabType } from './TabBar';
import { Timeline } from './Timeline';
import { BottomNav, type NavItem } from './BottomNav';
import { NotificationSettings } from './NotificationSettings';
import { LaundryRoom } from './LaundryRoom';
import { BathroomView } from './BathroomView';
import { Toast } from './Toast';

export function Calendar() {
  const { events, loading, error, refresh } = useEvents();
  const { favorites, toggle, isFavorite } = useFavorites();
  const { settings: notifSettings, update: updateNotifSettings } = useNotificationSettings();
  const { granted, requestPermission, scheduleLaundryNotification } = useNotifications(events, favorites, notifSettings);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [activeNav, setActiveNav] = useState<NavItem>('home');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    showToast('同期完了');
  }, [refresh, showToast]);

  const handleToggleFav = useCallback((id: string) => {
    const wasFav = isFavorite(id);
    toggle(id);
    showToast(wasFav ? 'お気に入り解除' : 'お気に入り追加');
  }, [toggle, isFavorite, showToast]);

  const handleNavSelect = useCallback((item: NavItem) => {
    setActiveNav(item);
    if (item === 'home') setActiveTab('all');
  }, []);

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
      {activeNav === 'notifications' ? (
        <NotificationSettings
          settings={notifSettings}
          onUpdate={updateNotifSettings}
          granted={granted}
          onRequestPermission={requestPermission}
        />
      ) : activeNav === 'laundry' ? (
        <LaundryRoom onScheduleNotification={scheduleLaundryNotification} />
      ) : activeNav === 'bathroom' ? (
        <BathroomView />
      ) : (
        <>
          <Header events={events} favorites={favorites} onRefresh={handleRefresh} refreshing={refreshing} />
          <main className="max-w-180 mx-auto px-4 pt-5 md:px-6">
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
            <Timeline events={events} tab={activeTab} isFavorite={isFavorite} onToggleFav={handleToggleFav} />
          </main>
        </>
      )}

      <BottomNav active={activeNav} onSelect={handleNavSelect} notificationGranted={notifSettings.enabled} />
      <Toast message={toast.message} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />
    </div>
  );
}
