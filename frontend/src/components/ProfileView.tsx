'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ProfileViewProps {
  onToast: (msg: string) => void;
}

export function ProfileView({ onToast }: ProfileViewProps) {
  const { user, profile, updateDisplayName, signOut } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile?.display_name ?? '');
  }, [profile?.display_name]);

  const handleSave = async () => {
    if (!name.trim() || name.trim() === profile?.display_name) return;
    setSaving(true);
    try {
      await updateDisplayName(name);
      onToast('名前を変更しました');
    } catch {
      onToast('変更に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 pt-5 md:px-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">プロフィール</h2>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 mb-3">
        <div className="text-[12px] text-gray-400 mb-1">メールアドレス</div>
        <div className="text-[14px] text-gray-700 break-all">{user?.email ?? '-'}</div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 mb-3">
        <label className="block text-[12px] text-gray-400 mb-2">ユーザー名</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={40}
          className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg outline-none focus:border-[var(--color-primary)]"
          placeholder="ユーザー名"
        />
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || name.trim() === profile?.display_name}
          className="mt-3 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-[13px] font-semibold border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      <button
        onClick={signOut}
        className="w-full mt-4 py-3 bg-white border border-gray-200 rounded-2xl text-[13px] font-semibold text-red-500 cursor-pointer hover:bg-red-50"
      >
        ログアウト
      </button>
    </div>
  );
}
