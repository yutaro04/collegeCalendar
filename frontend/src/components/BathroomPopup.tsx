'use client';

import { useState } from 'react';
import type { BathroomRoom } from '@/lib/bathroom';
import { TYPE_LABEL } from '@/lib/bathroom';

type View = 'main' | 'comment' | 'status';

interface BathroomPopupProps {
  room: BathroomRoom;
  onClose: () => void;
  onUpdate: (id: number, patch: { status?: string; comment?: string }) => void;
}

export function BathroomPopup({ room, onClose, onUpdate }: BathroomPopupProps) {
  const [view, setView] = useState<View>('main');
  const [comment, setComment] = useState(room.comment ?? '');

  const doUpdate = (patch: { status?: string; comment?: string }) => {
    onUpdate(room.id, patch);
    onClose();
  };

  const label = `${room.floor}F ${TYPE_LABEL[room.type]} ${room.no}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-180 bg-white rounded-t-2xl p-5 pb-8 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[15px] font-bold text-gray-900">{label}</div>
            <div className="text-[12px] text-gray-400">ID: {room.id}</div>
          </div>
          <button onClick={onClose} className="text-gray-300 text-xl bg-transparent border-none cursor-pointer hover:text-gray-500">
            ×
          </button>
        </div>

        {view === 'main' && (
          <div className="flex flex-col gap-2">
            {room.status === 'available' && (
              <PopupButton onClick={() => doUpdate({ status: 'active' })}>
                使用開始
              </PopupButton>
            )}
            {room.status === 'active' && (
              <PopupButton onClick={() => doUpdate({ status: 'available', comment: '' })}>
                使用終了
              </PopupButton>
            )}
            <PopupButton onClick={() => setView('comment')}>
              コメント{room.comment ? '編集' : '追加'}
            </PopupButton>
            <PopupButton onClick={() => setView('status')}>
              ステータス変更
            </PopupButton>
          </div>
        )}

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
                onClick={() => doUpdate({ comment })}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-primary)] text-white border-none cursor-pointer"
              >
                保存
              </button>
            </div>
          </div>
        )}

        {view === 'status' && (
          <div className="flex flex-col gap-2">
            <PopupButton onClick={() => doUpdate({ status: 'active' })}>
              <span className="w-3 h-3 rounded-full bg-blue-400 inline-block mr-2" />
              使用中
            </PopupButton>
            <PopupButton onClick={() => doUpdate({ status: 'outOfOrder' })}>
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block mr-2" />
              使用不可
            </PopupButton>
            <PopupButton onClick={() => doUpdate({ status: 'available', comment: '' })}>
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

        {room.comment && view === 'main' && (
          <div className="mt-3 bg-gray-50 rounded-xl p-3 text-[12px] text-gray-500">
            {room.comment}
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
