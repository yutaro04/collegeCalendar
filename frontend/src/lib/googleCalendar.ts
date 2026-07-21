const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';

/** 保存済みのrefresh_tokenから、Calendar APIを呼ぶためのaccess_tokenを取得 */
export async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description ?? 'Googleアクセストークンの更新に失敗しました');
  }
  return data.access_token as string;
}

export interface PrivateEventInput {
  title: string;
  description: string;
  location: string;
  roomEmail: string;
  attendees: string[];
  isAllDay: boolean;
  dateKey: string; // yyyy-MM-dd
  startISO: string;
  endISO: string;
}

/** ユーザー本人のprimaryカレンダーにイベントを作成 */
export async function createPrimaryCalendarEvent(accessToken: string, input: PrivateEventInput) {
  const body: Record<string, unknown> = { summary: input.title };
  if (input.description) body.description = input.description;
  if (input.location) body.location = input.location;

  if (input.isAllDay) {
    body.start = { date: input.dateKey };
    body.end = { date: addDays(input.dateKey, 1) }; // Calendar APIの終日イベントは終了日が排他的
  } else {
    body.start = { dateTime: input.startISO };
    body.end = { dateTime: input.endISO };
  }

  const guestEmails = Array.from(new Set([...input.attendees, input.roomEmail].filter(Boolean)));
  if (guestEmails.length > 0) {
    body.attendees = guestEmails.map(email => ({ email }));
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message ?? 'Googleカレンダーへのイベント作成に失敗しました');
  }
  return data;
}

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

/** UTC ISO文字列をAsia/TokyoのHH:mmに変換（フロントのAddEventModalと同じくJST入力前提） */
export function jstHHmm(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}
