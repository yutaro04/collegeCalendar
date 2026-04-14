'use client';

import { NotificationSettings } from './NotificationSettings';
import { ProfileView } from './ProfileView';
import { LoginScreen } from './LoginScreen';
import { useAuth } from '@/hooks/useAuth';
import type { NotificationSettings as Settings } from '@/hooks/useNotificationSettings';

interface SettingsViewProps {
  notifSettings: Settings;
  onUpdateNotif: (patch: Partial<Settings>) => void;
  notifGranted: boolean;
  onRequestPermission: () => Promise<boolean>;
  onToast: (msg: string) => void;
}

export function SettingsView({
  notifSettings, onUpdateNotif, notifGranted, onRequestPermission, onToast,
}: SettingsViewProps) {
  const { user } = useAuth();

  return (
    <div className="pb-4">
      <NotificationSettings
        settings={notifSettings}
        onUpdate={onUpdateNotif}
        granted={notifGranted}
        onRequestPermission={onRequestPermission}
      />
      <div className="h-4" />
      {user ? <ProfileView onToast={onToast} /> : <LoginScreen />}
    </div>
  );
}
