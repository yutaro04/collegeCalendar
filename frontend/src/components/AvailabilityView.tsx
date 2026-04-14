'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAvailability, type AvailabilityEntry } from '@/hooks/useAvailability';

interface Props {
  onToast: (msg: string) => void;
}

export function AvailabilityView({ onToast }: Props) {
  const { user } = useAuth();
  const {
    entries, myEntry, invites, loading, error,
    postAvailability, clearAvailability, invite,
  } = useAvailability({
    onInviteReceived: (name, message) => {
      onToast(message ? `${name}さん: ${message}` : `${name}さんが誘っています`);
    },
  });
  const [editing, setEditing] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<AvailabilityEntry | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-7 h-7 border-2 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
        <div className="text-sm text-gray-400">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-sm text-red-500 py-10">{error}</div>;
  }

  const others = entries.filter(e => e.user_id !== user?.id);

  return (
    <div>
      {/* 自分のステータス */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 mb-4">
        <div className="text-[12px] text-gray-400 mb-2">あなたのステータス</div>
        {myEntry ? (
          <>
            <div className="text-[14px] text-gray-800 whitespace-pre-wrap break-words mb-1">
              {myEntry.message || '暇です'}
            </div>
            <div className="text-[11px] text-gray-400 mb-3">
              有効期限: {formatDateTime(myEntry.expires_at)} ({formatRelativeFuture(myEntry.expires_at)})
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-[12px] font-semibold border-none cursor-pointer"
              >
                編集
              </button>
              <button
                onClick={async () => {
                  try { await clearAvailability(); onToast('ステータスを取り下げました'); }
                  catch { onToast('失敗しました'); }
                }}
                className="flex-1 py-2 bg-gray-100 text-red-500 rounded-lg text-[12px] font-semibold border-none cursor-pointer"
              >
                取り下げ
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="w-full py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-[13px] font-semibold border-none cursor-pointer"
          >
            ＋ 暇を表明する
          </button>
        )}
      </div>

      {/* 受信した誘い */}
      {invites.length > 0 && (
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 mb-4">
          <div className="text-[12px] text-gray-400 mb-2">あなたへの誘い ({invites.length})</div>
          <ul className="flex flex-col gap-2">
            {invites.map(inv => (
              <li key={inv.id} className="border-l-2 border-[var(--color-primary)] pl-3 py-1">
                <div className="text-[12px] font-semibold text-gray-800">{inv.inviter_name}</div>
                {inv.message && (
                  <div className="text-[13px] text-gray-700 whitespace-pre-wrap break-words">{inv.message}</div>
                )}
                <div className="text-[10px] text-gray-400 mt-0.5">{formatRelative(inv.created_at)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 他のユーザー一覧 */}
      <div className="text-[12px] text-gray-400 mb-2 px-1">暇な人たち</div>
      {others.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-10">いまは誰もいません</div>
      ) : (
        <div className="flex flex-col gap-3">
          {others.map(e => (
            <div key={e.user_id} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-[14px] font-semibold text-gray-900">{e.display_name}</div>
                <button
                  onClick={() => setInviteTarget(e)}
                  className="px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-full text-[11px] font-semibold border-none cursor-pointer"
                >
                  誘う
                </button>
              </div>
              {e.message && (
                <div className="text-[13px] text-gray-700 whitespace-pre-wrap break-words mb-2">{e.message}</div>
              )}
              <div className="text-[11px] text-gray-400">
                〜{formatDateTime(e.expires_at)} ({formatRelativeFuture(e.expires_at)})
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          initialMessage={myEntry?.message ?? ''}
          initialExpiresAt={myEntry?.expires_at ?? null}
          onClose={() => setEditing(false)}
          onSubmit={async (message, expiresAt) => {
            try {
              await postAvailability(message, expiresAt);
              setEditing(false);
              onToast('ステータスを登録しました');
            } catch {
              onToast('登録に失敗しました');
            }
          }}
        />
      )}

      {inviteTarget && (
        <InviteModal
          target={inviteTarget}
          onClose={() => setInviteTarget(null)}
          onSubmit={async (message) => {
            try {
              await invite(inviteTarget.user_id, message);
              setInviteTarget(null);
              onToast('誘いを送りました');
            } catch {
              onToast('送信に失敗しました');
            }
          }}
        />
      )}
    </div>
  );
}

function EditModal({
  initialMessage,
  initialExpiresAt,
  onClose,
  onSubmit,
}: {
  initialMessage: string;
  initialExpiresAt: string | null;
  onClose: () => void;
  onSubmit: (message: string, expiresAtIso: string) => void;
}) {
  const [message, setMessage] = useState(initialMessage);
  const [expiresLocal, setExpiresLocal] = useState(() => {
    if (initialExpiresAt) return toLocalInputValue(new Date(initialExpiresAt));
    const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
    return toLocalInputValue(d);
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!expiresLocal) return;
    const iso = new Date(expiresLocal).toISOString();
    if (new Date(iso).getTime() <= Date.now()) return;
    setSubmitting(true);
    await onSubmit(message, iso);
    setSubmitting(false);
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="text-[15px] font-bold text-gray-900 mb-4">暇を表明</div>
      <textarea
        placeholder="一言 (例: お茶しませんか？)"
        value={message}
        onChange={e => setMessage(e.target.value)}
        maxLength={200}
        rows={3}
        className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg outline-none focus:border-[var(--color-primary)] resize-none mb-3"
      />
      <label className="block text-[12px] text-gray-400 mb-1">有効期限</label>
      <input
        type="datetime-local"
        value={expiresLocal}
        onChange={e => setExpiresLocal(e.target.value)}
        className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg outline-none focus:border-[var(--color-primary)] mb-4"
      />
      <ModalButtons
        onCancel={onClose}
        onSubmit={handleSubmit}
        disabled={!expiresLocal || submitting}
        submitLabel={submitting ? '登録中...' : '登録'}
      />
    </ModalShell>
  );
}

function InviteModal({
  target,
  onClose,
  onSubmit,
}: {
  target: AvailabilityEntry;
  onClose: () => void;
  onSubmit: (message: string) => void;
}) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    await onSubmit(message);
    setSubmitting(false);
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="text-[15px] font-bold text-gray-900 mb-1">{target.display_name}さんを誘う</div>
      {target.message && (
        <div className="text-[12px] text-gray-500 mb-3 whitespace-pre-wrap break-words">「{target.message}」</div>
      )}
      <textarea
        placeholder="一言 (例: カフェ行きません？)"
        value={message}
        onChange={e => setMessage(e.target.value)}
        maxLength={200}
        rows={3}
        className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg outline-none focus:border-[var(--color-primary)] resize-none mb-4"
      />
      <ModalButtons
        onCancel={onClose}
        onSubmit={handleSubmit}
        disabled={!message.trim() || submitting}
        submitLabel={submitting ? '送信中...' : '送る'}
      />
    </ModalShell>
  );
}

function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-[60] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalButtons({
  onCancel, onSubmit, disabled, submitLabel,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  disabled: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onCancel}
        className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-semibold border-none cursor-pointer"
      >
        キャンセル
      </button>
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="flex-1 py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-[13px] font-semibold border-none cursor-pointer disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'たった今';
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  return `${day}日前`;
}

function formatRelativeFuture(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return '期限切れ';
  const min = Math.floor(diff / 60000);
  if (min < 60) return `あと${min}分`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `あと${hr}時間`;
  const day = Math.floor(hr / 24);
  return `あと${day}日`;
}
