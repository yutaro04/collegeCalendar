'use client';

import { useState } from 'react';
import type { CalendarEvent } from '@/lib/types';
import { formatDateKey } from '@/lib/utils';
import { useAddEvent } from '@/hooks/useAddEvent';

interface AddEventModalProps {
  onClose: () => void;
  onCreated: (event: CalendarEvent) => void;
  onToast: (msg: string) => void;
}

/** yyyy-MM-dd + HH:mm(ローカル時刻) を UTC ISO 文字列へ変換 */
function toISO(dateKey: string, time: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).toISOString();
}

function defaultTimes(): { date: string; start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { date: formatDateKey(now), start: hhmm(start), end: hhmm(end) };
}

export function AddEventModal({ onClose, onCreated, onToast }: AddEventModalProps) {
  const { config, configError, submitting, createEvent } = useAddEvent();
  const def = defaultTimes();

  const [calendarKey, setCalendarKey] = useState('event');
  const [title, setTitle] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [date, setDate] = useState(def.date);
  const [startTime, setStartTime] = useState(def.start);
  const [endTime, setEndTime] = useState(def.end);
  const [roomEmail, setRoomEmail] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const calendars = config?.calendars ?? [
    { key: 'event', name: '000_イベントカレンダー' },
    { key: 'house', name: '001_ハウス/委員会' },
    { key: 'private', name: 'プライベート' },
  ];
  const rooms = config?.rooms ?? [];

  const canSubmit = title.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    setError(null);
    if (!isAllDay && toISO(date, endTime) <= toISO(date, startTime)) {
      setError('終了時刻は開始時刻より後にしてください');
      return;
    }
    try {
      const created = await createEvent({
        calendarKey,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        roomEmail,
        isAllDay,
        dateKey: date,
        startISO: isAllDay ? '' : toISO(date, startTime),
        endISO: isAllDay ? '' : toISO(date, endTime),
      });
      onCreated(created);
      onToast('イベントを追加しました');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'イベント作成に失敗しました');
    }
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-black/10 text-[14px] outline-none focus:border-[var(--color-primary)] bg-white';
  const labelCls = 'text-[12px] font-semibold text-gray-500 mb-1 block';

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-180 bg-white rounded-t-2xl p-5 pb-8 animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-[16px] font-bold text-gray-900">イベントを追加</div>
          <button onClick={onClose} className="text-gray-300 text-xl bg-transparent border-none cursor-pointer hover:text-gray-500">
            ×
          </button>
        </div>

        {configError && (
          <div className="mb-3 text-[12px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            設定を取得できませんでした（{configError}）。カレンダーは既定の選択肢で投稿できます。
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* カレンダー選択 */}
          <div>
            <span className={labelCls}>投稿先カレンダー</span>
            <div className="flex gap-2">
              {calendars.map(c => (
                <button
                  key={c.key}
                  onClick={() => setCalendarKey(c.key)}
                  className={`flex-1 py-2.5 px-2 rounded-lg text-[12px] font-semibold border cursor-pointer transition-colors
                    ${calendarKey === c.key
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'bg-white text-gray-500 border-black/10 hover:border-gray-300'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* タイトル */}
          <div>
            <span className={labelCls}>タイトル<span className="text-[var(--color-primary)]"> *</span></span>
            <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="例: ハウスミーティング" maxLength={100} />
          </div>

          {/* 終日トグル */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} className="w-4 h-4 accent-[var(--color-primary)]" />
            <span className="text-[13px] text-gray-600">終日</span>
          </label>

          {/* 日付・時刻 */}
          <div>
            <span className={labelCls}>日付</span>
            <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          {!isAllDay && (
            <div className="flex gap-3">
              <div className="flex-1">
                <span className={labelCls}>開始</span>
                <input type="time" className={inputCls} value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="flex-1">
                <span className={labelCls}>終了</span>
                <input type="time" className={inputCls} value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
          )}

          {/* ROOM 選択（設定がある場合のみ） */}
          {rooms.length > 0 && (
            <div>
              <span className={labelCls}>ROOM（任意）</span>
              <select className={inputCls} value={roomEmail} onChange={e => setRoomEmail(e.target.value)}>
                <option value="">指定なし</option>
                {rooms.map(r => (
                  <option key={r.email} value={r.email}>{r.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* 場所 */}
          <div>
            <span className={labelCls}>場所（任意）</span>
            <input className={inputCls} value={location} onChange={e => setLocation(e.target.value)} placeholder="ROOMを選ぶと自動入力されます" maxLength={100} />
          </div>

          {/* 説明 */}
          <div>
            <span className={labelCls}>説明（任意）</span>
            <textarea className={`${inputCls} resize-none h-20`} value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} />
          </div>

          {error && <div className="text-[12px] text-red-500">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3 rounded-lg text-white text-[14px] font-semibold border-none cursor-pointer transition-opacity
              bg-[var(--color-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? '追加中...' : '追加する'}
          </button>
        </div>
      </div>
    </div>
  );
}
