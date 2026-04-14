'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRecruits, type Recruit, type CreateRecruitInput } from '@/hooks/useRecruits';
import { AvailabilityView } from './AvailabilityView';

interface RecruitViewProps {
  onToast: (msg: string) => void;
}

type SubTab = 'recruit' | 'availability';

export function RecruitView({ onToast }: RecruitViewProps) {
  const [subTab, setSubTab] = useState<SubTab>('recruit');

  return (
    <div className="max-w-[720px] mx-auto px-4 pt-5 md:px-6">
      <h2 className="text-lg font-bold text-gray-900 mb-3">ゆる募</h2>
      <div className="flex bg-[var(--color-surface-container)] rounded-xl p-1 mb-4">
        <SubTabButton active={subTab === 'recruit'} onClick={() => setSubTab('recruit')}>募集</SubTabButton>
        <SubTabButton active={subTab === 'availability'} onClick={() => setSubTab('availability')}>ひま</SubTabButton>
      </div>
      {subTab === 'recruit' ? (
        <RecruitList onToast={onToast} />
      ) : (
        <AvailabilityView onToast={onToast} />
      )}
    </div>
  );
}

function SubTabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-[12px] font-semibold rounded-lg border-none cursor-pointer transition-all duration-200
        ${active
          ? 'bg-white text-[var(--color-primary)] shadow-sm'
          : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
    >
      {children}
    </button>
  );
}

function RecruitList({ onToast }: { onToast: (msg: string) => void }) {
  const { user } = useAuth();
  const { recruits, loading, error, createRecruit, deleteRecruit, joinRecruit, leaveRecruit } = useRecruits();
  const [composing, setComposing] = useState(false);

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

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setComposing(true)}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-full text-[13px] font-semibold border-none cursor-pointer"
        >
          + 投稿
        </button>
      </div>

      {recruits.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-12">まだ投稿がありません</div>
      ) : (
        <div className="flex flex-col gap-3">
          {recruits.map(r => (
            <RecruitCard
              key={r.id}
              recruit={r}
              currentUserId={user?.id ?? null}
              onJoin={async () => {
                try { await joinRecruit(r.id); onToast('参加しました'); }
                catch (e) { onToast(e instanceof Error ? e.message : '参加できませんでした'); }
              }}
              onLeave={async () => {
                try { await leaveRecruit(r.id); onToast('参加を取り消しました'); }
                catch { onToast('失敗しました'); }
              }}
              onDelete={async () => {
                if (!confirm('この投稿を削除しますか？')) return;
                try { await deleteRecruit(r.id); onToast('削除しました'); }
                catch { onToast('削除に失敗しました'); }
              }}
            />
          ))}
        </div>
      )}

      {composing && (
        <ComposeModal
          onClose={() => setComposing(false)}
          onSubmit={async (input) => {
            try {
              await createRecruit(input);
              setComposing(false);
              onToast('投稿しました');
            } catch {
              onToast('投稿に失敗しました');
            }
          }}
        />
      )}
    </div>
  );
}

function RecruitCard({
  recruit,
  currentUserId,
  onJoin,
  onLeave,
  onDelete,
}: {
  recruit: Recruit;
  currentUserId: string | null;
  onJoin: () => void;
  onLeave: () => void;
  onDelete: () => void;
}) {
  const joined = recruit.participants.some(p => p.user_id === currentUserId);
  const isAuthor = recruit.author_id === currentUserId;
  const canSeeList = !recruit.hide_participants || isAuthor || joined;
  const full = recruit.max_participants != null && recruit.participants_count >= recruit.max_participants;
  const countLabel = recruit.max_participants != null
    ? `${recruit.participants_count} / ${recruit.max_participants}人`
    : `${recruit.participants_count}人`;
  const [showList, setShowList] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            {recruit.is_kohicha && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold tracking-wide">
                ☕ コヒチャ
              </span>
            )}
            {recruit.hide_participants && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold">
                🔒 非公開
              </span>
            )}
          </div>
          <div className="text-[15px] font-semibold text-gray-900 break-words">{recruit.title}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            {recruit.author_name} ・ {formatRelative(recruit.created_at)}
          </div>
        </div>
        {isAuthor && (
          <button
            onClick={onDelete}
            className="text-[11px] text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer"
          >
            削除
          </button>
        )}
      </div>

      {recruit.body && (
        <div className="text-[13px] text-gray-700 whitespace-pre-wrap break-words mb-3">{recruit.body}</div>
      )}

      {recruit.deadline && (
        <div className="text-[11px] text-amber-600 mb-3">締切: {formatDateTime(recruit.deadline)}</div>
      )}

      <div className="flex items-center justify-between gap-3">
        {canSeeList ? (
          <button
            onClick={() => setShowList(s => !s)}
            className="text-[12px] text-gray-500 bg-transparent border-none cursor-pointer p-0"
          >
            参加者 {countLabel} {showList ? '▲' : '▼'}
          </button>
        ) : (
          <span className="text-[12px] text-gray-400">参加者 {countLabel}（非公開）</span>
        )}
        {!isAuthor && (
          joined ? (
            <button
              onClick={onLeave}
              className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-[12px] font-semibold border-none cursor-pointer"
            >
              参加中（取消）
            </button>
          ) : full ? (
            <span className="px-4 py-1.5 bg-gray-100 text-gray-400 rounded-full text-[12px] font-semibold">
              満員
            </span>
          ) : (
            <button
              onClick={onJoin}
              className="px-4 py-1.5 bg-[var(--color-primary)] text-white rounded-full text-[12px] font-semibold border-none cursor-pointer"
            >
              参加したい
            </button>
          )
        )}
      </div>

      {canSeeList && showList && recruit.participants.length > 0 && (
        <ul className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1">
          {recruit.participants.map(p => (
            <li key={p.user_id} className="text-[12px] text-gray-600">・{p.display_name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ComposeModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: CreateRecruitInput) => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isKohicha, setIsKohicha] = useState(false);
  const [maxInput, setMaxInput] = useState('');
  const [hideParticipants, setHideParticipants] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const iso = deadline ? new Date(deadline).toISOString() : null;
    const parsed = Number.parseInt(maxInput, 10);
    const maxParticipants = Number.isFinite(parsed) && parsed >= 1 ? parsed : null;
    await onSubmit({
      title, body, deadline: iso,
      isKohicha,
      maxParticipants,
      hideParticipants,
    });
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[60] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-[15px] font-bold text-gray-900 mb-4">ゆる募を投稿</div>
        <input
          type="text"
          placeholder="今からOOしてくれる人募集！"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={80}
          className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg outline-none focus:border-[var(--color-primary)] mb-3"
        />
        <textarea
          placeholder="詳細 (任意)"
          value={body}
          onChange={e => setBody(e.target.value)}
          maxLength={500}
          rows={4}
          className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg outline-none focus:border-[var(--color-primary)] resize-none mb-3"
        />
        <label className="block text-[12px] text-gray-400 mb-1">締切 (任意)</label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg outline-none focus:border-[var(--color-primary)] mb-4"
        />

        <label className="flex items-center justify-between py-2 cursor-pointer mb-1">
          <div>
            <div className="text-[13px] font-semibold text-gray-800">☕ コヒチャ</div>
            <div className="text-[11px] text-gray-400">コーヒーチャット（先着1名）</div>
          </div>
          <input
            type="checkbox"
            checked={isKohicha}
            onChange={e => setIsKohicha(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-primary)]"
          />
        </label>

        {!isKohicha && (
          <div className="mb-1">
            <label className="block text-[12px] text-gray-400 mb-1">募集人数 (任意、空欄で無制限)</label>
            <input
              type="number"
              min={1}
              value={maxInput}
              onChange={e => setMaxInput(e.target.value)}
              placeholder="例: 3"
              className="w-full px-3 py-2 text-[14px] border border-gray-200 rounded-lg outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        )}

        <label className="flex items-center justify-between py-2 cursor-pointer mb-4">
          <div>
            <div className="text-[13px] font-semibold text-gray-800">🔒 参加者を非公開にする</div>
            <div className="text-[11px] text-gray-400">投稿者と参加者のみが参加者を確認できます</div>
          </div>
          <input
            type="checkbox"
            checked={hideParticipants}
            onChange={e => setHideParticipants(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-primary)]"
          />
        </label>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-semibold border-none cursor-pointer"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className="flex-1 py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-[13px] font-semibold border-none cursor-pointer disabled:opacity-40"
          >
            {submitting ? '投稿中...' : '投稿'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'たった今';
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}日前`;
  return new Date(iso).toLocaleDateString('ja-JP');
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
