import { NextResponse } from 'next/server';
import type { CalendarEvent } from '@/lib/types';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID ?? '';
const SHEET_NAME = process.env.SHEET_NAME ?? 'EventCache';

export async function GET() {
  if (!SPREADSHEET_ID) {
    return NextResponse.json(
      { success: false, error: 'SPREADSHEET_IDが未設定です', events: [] },
      { status: 500 }
    );
  }

  try {
    // Google SheetsのCSV公開URLから直接取得（認証不要）
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `スプレッドシート取得失敗 (${res.status})。共有設定を「リンクを知っている全員が閲覧可」にしてください。`,
          events: [],
        },
        { status: 502 }
      );
    }

    const csv = await res.text();
    const events = parseCsv(csv);

    // 今日以降のイベントのみ
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const filtered = events
      .filter(e => new Date(e.startISO) >= now)
      .sort((a, b) => a.startISO.localeCompare(b.startISO));

    return NextResponse.json({
      success: true,
      events: filtered,
      lastSync: '',
    });
  } catch (err) {
    console.error('Spreadsheet fetch error:', err);
    return NextResponse.json(
      { success: false, error: String(err), events: [] },
      { status: 500 }
    );
  }
}

/** CSV文字列をパースしてCalendarEvent配列に変換 */
function parseCsv(csv: string): CalendarEvent[] {
  const lines = parseCsvLines(csv);
  if (lines.length < 2) return [];

  // 1行目はヘッダー、2行目以降がデータ
  return lines.slice(1).map(cols => ({
    id: cols[0] ?? '',
    calendarName: cols[1] ?? '',
    title: cols[2] ?? '',
    description: cols[3] ?? '',
    location: cols[4] ?? '',
    startISO: cols[5] ?? '',
    endISO: cols[6] ?? '',
    dateKey: cols[7] ?? '',
    startTime: cols[8] ?? '',
    endTime: cols[9] ?? '',
    displayDate: cols[10] ?? '',
    isAllDay: cols[11] === 'TRUE',
    color: cols[12] ?? '',
    isRecurring: false,
  }));
}

/** CSVをパース（ダブルクォート囲み・改行対応） */
function parseCsvLines(csv: string): string[][] {
  const results: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];

    if (inQuotes) {
      if (ch === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field);
        field = '';
      } else if (ch === '\n' || (ch === '\r' && csv[i + 1] === '\n')) {
        current.push(field);
        field = '';
        if (current.some(c => c !== '')) results.push(current);
        current = [];
        if (ch === '\r') i++;
      } else {
        field += ch;
      }
    }
  }

  // 最終行
  if (field || current.length > 0) {
    current.push(field);
    if (current.some(c => c !== '')) results.push(current);
  }

  return results;
}
