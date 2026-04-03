'use client';

import { useState } from 'react';
import type { Machine } from '@/lib/laundry';
import { getDurationMin } from '@/lib/laundry';

type View = 'main' | 'comment' | 'status' | 'confirm-pickup';

interface MachinePopupProps {
  machine: Machine;
  onClose: () => void;
  onUpdate: (id: string, patch: { status?: string; finishedAt?: string; comment?: string }) => void;
  onScheduleNotification: (id: string, label: string, finishedAt: string) => void;
}

export function MachinePopup({ machine, onClose, onUpdate, onScheduleNotification }: MachinePopupProps) {
  const [view, setView] = useState<View>(machine.status === 'finished' ? 'confirm-pickup' : 'main');
  const [comment, setComment] = useState(machine.comment ?? '');

  const doUpdate = (patch: { status?: string; finishedAt?: string; comment?: string }) => {
    onUpdate(machine.id, patch);
    onClose();
  };

  const handleStart = () => {
    const min = getDurationMin(machine.type);
    const finishedAt = new Date(Date.now() + min * 60000);
    const formatted = `${finishedAt.getFullYear()}/${String(finishedAt.getMonth() + 1).padStart(2, '0')}/${String(finishedAt.getDate()).padStart(2, '0')} ${String(finishedAt.getHours()).padStart(2, '0')}:${String(finishedAt.getMinutes()).padStart(2, '0')}`;
    onScheduleNotification(machine.id, machine.label, formatted);
    doUpdate({ status: 'active', finishedAt: formatted });
  };

  const handleSaveComment = () => doUpdate({ comment });

  const handleStatusChange = (status: string) => {
    if (status === 'available') {
      doUpdate({ status: 'available', finishedAt: '', comment: '' });
    } else {
      doUpdate({ status });
    }
  };

  const handlePickup = () => doUpdate({ status: 'available', finishedAt: '', comment: '' });

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-180 bg-white rounded-t-2xl p-5 pb-8 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[15px] font-bold text-gray-900">{machine.label}</div>
            <div className="text-[12px] text-gray-400">{machine.id}</div>
          </div>
          <button onClick={onClose} className="text-gray-300 text-xl bg-transparent border-none cursor-pointer hover:text-gray-500">
            ×
          </button>
        </div>

        {/* Main menu */}
        {view === 'main' && (
          <div className="flex flex-col gap-2">
            {machine.status === 'available' && (
              <PopupButton onClick={handleStart}>
                開始（{getDurationMin(machine.type)}分）
              </PopupButton>
            )}
            <PopupButton onClick={() => setView('comment')}>
              コメント{machine.comment ? '編集' : '追加'}
            </PopupButton>
            <PopupButton onClick={() => setView('status')}>
              ステータス変更
            </PopupButton>
          </div>
        )}

        {/* Comment editor */}
        {view === 'comment' && (
          <div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="コメントを入力..."
              className="w-full h-24 rounded-xl border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:border-[var(--color-primary)]"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setView('main')}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 border-none cursor-pointer"
              >
                戻る
              </button>
              <button
                onClick={handleSaveComment}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-primary)] text-white border-none cursor-pointer"
              >
                保存
              </button>
            </div>
          </div>
        )}

        {/* Status change */}
        {view === 'status' && (
          <div className="flex flex-col gap-2">
            <PopupButton onClick={() => handleStatusChange('error')}>
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block mr-2" />
              エラー
            </PopupButton>
            <PopupButton onClick={() => handleStatusChange('outOfOrder')}>
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block mr-2" />
              使用不可
            </PopupButton>
            <PopupButton onClick={() => handleStatusChange('available')}>
              <span className="w-3 h-3 rounded-full bg-gray-300 inline-block mr-2" />
              利用可能
            </PopupButton>
            <button
              onClick={() => setView('main')}
              className="py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 border-none cursor-pointer mt-1"
            >
              戻る
            </button>
          </div>
        )}

        {/* Confirm pickup (finished) */}
        {view === 'confirm-pickup' && (
          <div className="text-center">
            <div className="text-[15px] text-gray-700 mb-4">洗濯物を取り出しましたか？</div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 border-none cursor-pointer"
              >
                いいえ
              </button>
              <button
                onClick={handlePickup}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-primary)] text-white border-none cursor-pointer"
              >
                はい
              </button>
            </div>
          </div>
        )}

        {/* Current comment display */}
        {machine.comment && view === 'main' && (
          <div className="mt-3 bg-gray-50 rounded-xl p-3 text-[12px] text-gray-500">
            {machine.comment}
          </div>
        )}
      </div>
    </div>
  );
}

function PopupButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 border-none cursor-pointer hover:bg-gray-100 transition-colors text-left px-4 flex items-center"
    >
      {children}
    </button>
  );
}
