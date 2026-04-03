'use client';

import { useState } from 'react';
import type { Machine, MachineStatus } from '@/lib/laundry';
import { STATUS_LABEL, getLeftWall, getRightWall } from '@/lib/laundry';
import { useLaundry } from '@/hooks/useLaundry';
import { MachinePopup } from './MachinePopup';

type Gender = 'male' | 'female';

interface LaundryRoomProps {
  onScheduleNotification: (id: string, label: string, finishedAt: string) => void;
}

export function LaundryRoom({ onScheduleNotification }: LaundryRoomProps) {
  const { machines, loading, error, refresh, updateMachine } = useLaundry();
  const [gender, setGender] = useState<Gender>('male');
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [commentPopup, setCommentPopup] = useState<string | null>(null);

  const leftWall = getLeftWall(machines, gender);
  const rightWall = getRightWall(machines, gender);

  return (
    <div className="max-w-180 mx-auto px-4 pt-5 md:px-6">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8" />
        <h2 className="text-lg font-bold text-gray-900">Laundry Room</h2>
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
          onClick={() => setGender('male')}
          className={`flex-1 py-2.5 text-[12px] font-semibold tracking-wide rounded-lg border-none cursor-pointer transition-all duration-200
            ${gender === 'male' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
        >
          男子
        </button>
        <button
          onClick={() => setGender('female')}
          className={`flex-1 py-2.5 text-[12px] font-semibold tracking-wide rounded-lg border-none cursor-pointer transition-all duration-200
            ${gender === 'female' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
        >
          女子
        </button>
      </div>

      {/* Content */}
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
        <FloorPlan leftWall={leftWall} rightWall={rightWall} onSelect={setSelectedMachine} onShowComment={setCommentPopup} />
      )}

      {selectedMachine && (
        <MachinePopup
          machine={selectedMachine}
          onClose={() => setSelectedMachine(null)}
          onUpdate={updateMachine}
          onScheduleNotification={onScheduleNotification}
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

function FloorPlan({ leftWall, rightWall, onSelect, onShowComment }: {
  leftWall: { position: 'left' | 'right'; machine: Machine }[];
  rightWall: Machine[];
  onSelect: (m: Machine) => void;
  onShowComment: (comment: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-3 pb-4">
      <div className="flex gap-3">
        {/* Left wall */}
        <div className="flex-1">
          <div className="flex flex-col gap-1.5">
            {leftWall.map(slot => (
              <div
                key={slot.machine.id}
                className={`flex ${slot.position === 'left' ? 'justify-start' : 'justify-end'}`}
              >
                <div className="w-[85%]">
                  <MachineCell machine={slot.machine} onSelect={onSelect} onShowComment={onShowComment} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aisle */}
        <div className="w-8 flex flex-col items-center justify-between py-2 shrink-0">
          <div className="w-px flex-1 bg-gray-100" />
          <div className="text-[9px] text-gray-300 py-2 [writing-mode:vertical-lr] tracking-widest">通路</div>
          <div className="w-px flex-1 bg-gray-100" />
        </div>

        {/* Right wall */}
        <div className="flex-1">
          <div className="flex flex-col gap-1.5">
            {rightWall.map(m => (
              <MachineCell key={m.id} machine={m} onSelect={onSelect} onShowComment={onShowComment} />
            ))}
          </div>
        </div>
      </div>

      {/* Door */}
      <div className="flex justify-center mt-3">
        <div className="flex items-center gap-2">
          <div className="w-12 h-px bg-gray-300" />
          <span className="text-[10px] text-gray-300">入口</span>
          <div className="w-12 h-px bg-gray-300" />
        </div>
      </div>
    </div>
  );
}

function MachineCell({ machine, onSelect, onShowComment }: { machine: Machine; onSelect: (m: Machine) => void; onShowComment: (comment: string) => void }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer ${statusBg(machine.status)}`}
      onClick={() => onSelect(machine)}
    >
      <StatusIcon status={machine.status} />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-gray-700 leading-tight">{machine.label}</div>
        {machine.status === 'active' && machine.remainingMin != null ? (
          <div className="text-[10px] text-blue-500 font-medium">残り {machine.remainingMin}分</div>
        ) : (
          <div className={`text-[10px] ${statusTextColor(machine.status)}`}>
            {STATUS_LABEL[machine.status]}
          </div>
        )}
      </div>
      {machine.comment && (
        <button
          className="shrink-0 w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600"
          onClick={(e) => { e.stopPropagation(); onShowComment(machine.comment!); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: MachineStatus }) {
  const base = 'w-8 h-8 rounded-full flex items-center justify-center shrink-0';

  if (status === 'available') {
    return (
      <div className={`${base} bg-white border border-gray-200`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5,3 19,12 5,21" />
        </svg>
      </div>
    );
  }
  if (status === 'active') {
    return (
      <div className={`${base} bg-blue-400`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
          <path d="M12 2a10 10 0 0 1 10 10" /><path d="M12 6a6 6 0 0 1 6 6" />
        </svg>
      </div>
    );
  }
  if (status === 'finished') {
    return (
      <div className={`${base} bg-green-500`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  if (status === 'outOfOrder') {
    return (
      <div className={`${base} bg-red-500`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      </div>
    );
  }
  // error
  return (
    <div className={`${base} bg-amber-400`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    </div>
  );
}

function statusBg(s: MachineStatus): string {
  switch (s) {
    case 'available': return 'bg-gray-50';
    case 'active': return 'bg-blue-50';
    case 'finished': return 'bg-green-50';
    case 'error': return 'bg-amber-50';
    case 'outOfOrder': return 'bg-red-50';
  }
}

function statusTextColor(s: MachineStatus): string {
  switch (s) {
    case 'available': return 'text-gray-400';
    case 'active': return 'text-blue-500';
    case 'finished': return 'text-green-500';
    case 'error': return 'text-amber-500';
    case 'outOfOrder': return 'text-red-500';
  }
}
