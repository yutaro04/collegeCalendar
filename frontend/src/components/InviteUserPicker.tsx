'use client';

import { useState, useMemo } from 'react';
import { MAILING_LISTS } from '@/lib/mailingLists';
import { useUserDirectory } from '@/hooks/useUserDirectory';
import { useInviteGroups } from '@/hooks/useInviteGroups';

interface InviteUserPickerProps {
  userId: string | null;
  selected: string[];
  onChange: (emails: string[]) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteUserPicker({ userId, selected, onChange }: InviteUserPickerProps) {
  const directory = useUserDirectory(true);
  const { groups, createGroup, deleteGroup } = useInviteGroups(userId);
  const [query, setQuery] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const userMatches = directory
      .filter(u => !selected.includes(u.email))
      .filter(u => u.display_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .map(u => ({ label: `${u.display_name}（${u.email}）`, email: u.email }));
    const listMatches = MAILING_LISTS
      .filter(m => !selected.includes(m.email))
      .filter(m => m.label.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
      .map(m => ({ label: `${m.label}（メーリングリスト）`, email: m.email }));
    return [...userMatches, ...listMatches].slice(0, 8);
  }, [query, directory, selected]);

  const trimmedQuery = query.trim();
  const canAddFreeText = EMAIL_RE.test(trimmedQuery) && !selected.includes(trimmedQuery);

  const addEmail = (email: string) => {
    if (selected.includes(email)) return;
    onChange([...selected, email]);
    setQuery('');
  };

  const removeEmail = (email: string) => {
    onChange(selected.filter(e => e !== email));
  };

  const addGroup = (emails: string[]) => {
    onChange(Array.from(new Set([...selected, ...emails])));
  };

  const handleSaveGroup = async () => {
    const name = groupName.trim();
    if (!name || selected.length === 0) return;
    await createGroup(name, selected);
    setGroupName('');
    setShowGroupForm(false);
  };

  return (
    <div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(email => (
            <span key={email} className="flex items-center gap-1 bg-gray-100 rounded-full pl-2.5 pr-1 py-1 text-[11px] text-gray-700">
              {email}
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="w-4 h-4 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          className="w-full px-3 py-2.5 rounded-lg border border-black/10 text-[14px] outline-none focus:border-[var(--color-primary)] bg-white"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="名前・メールアドレスで検索、または直接入力"
        />
        {(suggestions.length > 0 || canAddFreeText) && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-black/10 rounded-lg shadow-md max-h-48 overflow-y-auto">
            {suggestions.map(s => (
              <button
                key={s.email}
                type="button"
                onClick={() => addEmail(s.email)}
                className="w-full text-left px-3 py-2 text-[13px] text-gray-700 bg-transparent border-none cursor-pointer hover:bg-gray-50"
              >
                {s.label}
              </button>
            ))}
            {canAddFreeText && (
              <button
                type="button"
                onClick={() => addEmail(trimmedQuery)}
                className="w-full text-left px-3 py-2 text-[13px] text-[var(--color-primary)] bg-transparent border-none cursor-pointer hover:bg-gray-50"
              >
                「{trimmedQuery}」を追加
              </button>
            )}
          </div>
        )}
      </div>

      {userId && (
        <div className="mt-2.5">
          <div className="flex flex-wrap gap-1.5">
            {groups.map(g => (
              <span key={g.id} className="flex items-center gap-1 bg-[var(--color-primary-light)] rounded-full pl-2.5 pr-1 py-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => addGroup(g.emails)}
                  className="bg-transparent border-none cursor-pointer text-[var(--color-primary)] font-semibold"
                >
                  {g.name}（{g.emails.length}）
                </button>
                <button
                  type="button"
                  onClick={() => deleteGroup(g.id)}
                  className="w-4 h-4 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-[var(--color-primary)]/60 hover:text-[var(--color-primary)]"
                >
                  ×
                </button>
              </span>
            ))}
            {!showGroupForm && (
              <button
                type="button"
                onClick={() => setShowGroupForm(true)}
                disabled={selected.length === 0}
                className="text-[11px] text-gray-400 bg-transparent border border-dashed border-gray-300 rounded-full px-2.5 py-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:text-gray-600"
              >
                + 選択中をグループ保存
              </button>
            )}
          </div>
          {showGroupForm && (
            <div className="flex gap-1.5 mt-1.5">
              <input
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-black/10 text-[12px] outline-none focus:border-[var(--color-primary)]"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="グループ名"
                autoFocus
              />
              <button type="button" onClick={handleSaveGroup} className="text-[12px] px-2.5 py-1.5 rounded-lg bg-[var(--color-primary)] text-white border-none cursor-pointer">
                保存
              </button>
              <button
                type="button"
                onClick={() => { setShowGroupForm(false); setGroupName(''); }}
                className="text-[12px] px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-500 border-none cursor-pointer"
              >
                取消
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
