'use client';

import { useState } from 'react';
import type { BathroomRoom, BathroomStatus, BathroomType } from '@/lib/bathroom';
import { STATUS_LABEL, TYPE_LABEL, groupByFloor } from '@/lib/bathroom';
import { useBathroom } from '@/hooks/useBathroom';
import { BathroomPopup } from './BathroomPopup';

type Gender = 'men' | 'women';

export function BathroomView() {
  const { rooms, loading, error, refresh, updateRoom } = useBathroom();
  const [gender, setGender] = useState<Gender>('men');
  const [selectedRoom, setSelectedRoom] = useState<BathroomRoom | null>(null);
  const [commentPopup, setCommentPopup] = useState<string | null>(null);

  const floors = groupByFloor(rooms, gender);

  return (
    <div className="max-w-180 mx-auto px-4 pt-5 md:px-6">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8" />
        <h2 className="text-lg font-bold text-gray-900">Bathroom</h2>
        <button
          onClick={refresh}
          className="w-8 h-8 flex items-center justify-center text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-600 transition-colors"
        >
          ↻
        </button>
      </div>

      {/* Gender toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        <button
          onClick={() => setGender('men')}
          className={`flex-1 py-2.5 text-[12px] font-semibold tracking-wide rounded-lg border-none cursor-pointer transition-all duration-200
            ${gender === 'men' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
        >
          男子
        </button>
        <button
          onClick={() => setGender('women')}
          className={`flex-1 py-2.5 text-[12px] font-semibold tracking-wide rounded-lg border-none cursor-pointer transition-all duration-200
            ${gender === 'women' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
        >
          女子
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <div className="text-sm text-red-500 mb-3">{error}</div>
          <button onClick={refresh} className="text-sm text-[var(--color-primary)] bg-transparent border-none cursor-pointer">
            再試行
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {floors.map(({ floor, rooms: floorRooms }) => (
            <FloorCard
              key={floor}
              floor={floor}
              rooms={floorRooms}
              onSelect={setSelectedRoom}
              onShowComment={setCommentPopup}
            />
          ))}
        </div>
      )}

      {selectedRoom && (
        <BathroomPopup
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onUpdate={updateRoom}
        />
      )}

      {commentPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setCommentPopup(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-2xl p-5 mx-6 max-w-sm w-full animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] font-bold text-gray-700">コメント</div>
              <button onClick={() => setCommentPopup(null)} className="text-gray-300 text-xl bg-transparent border-none cursor-pointer hover:text-gray-500">×</button>
            </div>
            <div className="text-sm text-gray-600 whitespace-pre-wrap">{commentPopup}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function FloorCard({ floor, rooms, onSelect, onShowComment }: {
  floor: number;
  rooms: BathroomRoom[];
  onSelect: (r: BathroomRoom) => void;
  onShowComment: (comment: string) => void;
}) {
  const showers = rooms.filter(r => r.type === 'shower');
  const baths = rooms.filter(r => r.type === 'bath');

  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
      <div className="text-[13px] font-bold text-gray-800 mb-3">{floor}F</div>
      <div className="flex flex-col gap-2">
        {showers.map(r => (
          <RoomCell key={r.id} room={r} onSelect={onSelect} onShowComment={onShowComment} />
        ))}
        {baths.map(r => (
          <RoomCell key={r.id} room={r} onSelect={onSelect} onShowComment={onShowComment} />
        ))}
      </div>
    </div>
  );
}

function RoomCell({ room, onSelect, onShowComment }: {
  room: BathroomRoom;
  onSelect: (r: BathroomRoom) => void;
  onShowComment: (comment: string) => void;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer ${statusBg(room.status)}`}
      onClick={() => onSelect(room)}
    >
      <StatusIcon status={room.status} type={room.type} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-gray-700">
          {TYPE_LABEL[room.type]} {room.no}
        </div>
        <div className={`text-[10px] ${statusTextColor(room.status)}`}>
          {STATUS_LABEL[room.status]}
        </div>
      </div>
      {room.comment && (
        <button
          className="shrink-0 w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600"
          onClick={(e) => { e.stopPropagation(); onShowComment(room.comment); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
    </div>
  );
}

function StatusIcon({ status, type }: { status: BathroomStatus; type: BathroomType }) {
  const base = 'w-8 h-8 rounded-full flex items-center justify-center shrink-0';

  if (status === 'available') {
    return (
      <div className={`${base} bg-white border border-gray-200`}>
        <TypeIcon type={type} color="#aaa" />
      </div>
    );
  }
  if (status === 'active') {
    return (
      <div className={`${base} bg-blue-400`}>
        <TypeIcon type={type} color="white" />
      </div>
    );
  }
  // outOfOrder
  return (
    <div className={`${base} bg-red-500`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    </div>
  );
}

function TypeIcon({ type, color }: { type: BathroomType; color: string }) {
  if (type === 'bath') {
    // bathtub icon
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z" />
        <path d="M6 12V5a2 2 0 0 1 2-2h3v2.25" />
      </svg>
    );
  }
  // shower icon
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M5 8v8" />
      <path d="M8 12h4" />
      <path d="M12 10v8" />
      <path d="M10 20h4" />
      <path d="M15 6l2 2" />
      <path d="M15 10l2-2" />
    </svg>
  );
}

function statusBg(s: BathroomStatus): string {
  switch (s) {
    case 'available': return 'bg-gray-50';
    case 'active': return 'bg-blue-50';
    case 'outOfOrder': return 'bg-red-50';
  }
}

function statusTextColor(s: BathroomStatus): string {
  switch (s) {
    case 'available': return 'text-gray-400';
    case 'active': return 'text-blue-500';
    case 'outOfOrder': return 'text-red-500';
  }
}
