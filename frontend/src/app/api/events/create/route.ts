import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { refreshGoogleAccessToken, createPrimaryCalendarEvent, jstHHmm } from '@/lib/googleCalendar';

const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL ?? '';
const GAS_POST_SECRET = process.env.GAS_POST_SECRET ?? '';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// GAS/フロントの ALLOWED_DOMAIN と揃える
const ALLOWED_DOMAIN = 'hlab.college';

const PRIVATE_COLOR = '#4285F4';

interface CreateBody {
  calendarKey?: string;
  title?: string;
  description?: string;
  location?: string;
  roomEmail?: string;
  isAllDay?: boolean;
  dateKey?: string;
  startISO?: string;
  endISO?: string;
}

export async function POST(req: Request) {
  // ---- ログイン検証（全ログインユーザーが投稿可能）----
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ success: false, error: 'ログインが必要です' }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    return NextResponse.json({ success: false, error: 'セッションが無効です。再ログインしてください' }, { status: 401 });
  }
  if (!userData.user.email?.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
    return NextResponse.json({ success: false, error: `${ALLOWED_DOMAIN} のアカウントのみ投稿できます` }, { status: 403 });
  }

  // ---- 入力バリデーション ----
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ success: false, error: 'リクエストが不正です' }, { status: 400 });
  }

  const title = (body.title ?? '').trim();
  if (!title) {
    return NextResponse.json({ success: false, error: 'タイトルは必須です' }, { status: 400 });
  }
  if (body.calendarKey !== 'event' && body.calendarKey !== 'house' && body.calendarKey !== 'private') {
    return NextResponse.json({ success: false, error: 'カレンダーの選択が不正です' }, { status: 400 });
  }
  if (body.isAllDay) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dateKey ?? '')) {
      return NextResponse.json({ success: false, error: '日付が不正です' }, { status: 400 });
    }
  } else {
    const start = new Date(body.startISO ?? '');
    const end = new Date(body.endISO ?? '');
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return NextResponse.json({ success: false, error: '開始/終了時刻が不正です' }, { status: 400 });
    }
  }

  // ---- プライベート: 本人のGoogleカレンダーに直接作成（GASを介さない）----
  if (body.calendarKey === 'private') {
    try {
      const admin = createSupabaseAdmin();
      const { data: tokenRow } = await admin
        .from('google_oauth_tokens')
        .select('refresh_token')
        .eq('user_id', userData.user.id)
        .maybeSingle();
      if (!tokenRow?.refresh_token) {
        return NextResponse.json(
          { success: false, error: 'Googleカレンダーとの連携が必要です。一度ログアウトして再ログインしてください' },
          { status: 400 }
        );
      }

      const accessToken = await refreshGoogleAccessToken(tokenRow.refresh_token);
      const description = (body.description ?? '').trim();
      const location = (body.location ?? '').trim();
      const isAllDay = !!body.isAllDay;
      const dateKey = body.dateKey ?? '';
      const startISO = body.startISO ?? '';
      const endISO = body.endISO ?? '';

      const gEvent = await createPrimaryCalendarEvent(accessToken, {
        title,
        description,
        location,
        roomEmail: (body.roomEmail ?? '').trim(),
        isAllDay,
        dateKey,
        startISO,
        endISO,
      });

      const [, m, d] = dateKey.split('-');
      return NextResponse.json({
        success: true,
        event: {
          id: String(gEvent.id),
          calendarName: 'プライベート',
          title,
          description,
          location,
          startISO: isAllDay ? '' : startISO,
          endISO: isAllDay ? '' : endISO,
          dateKey,
          startTime: isAllDay ? '' : jstHHmm(startISO),
          endTime: isAllDay ? '' : jstHHmm(endISO),
          displayDate: m && d ? `${Number(m)}/${Number(d)}` : '',
          isAllDay,
          color: PRIVATE_COLOR,
        },
      });
    } catch (err) {
      console.error('Private calendar create error:', err);
      return NextResponse.json(
        { success: false, error: err instanceof Error ? err.message : 'イベント作成に失敗しました' },
        { status: 502 }
      );
    }
  }

  if (!GAS_WEBAPP_URL || !GAS_POST_SECRET) {
    return NextResponse.json(
      { success: false, error: 'サーバー設定が不足しています (GAS_WEBAPP_URL / GAS_POST_SECRET)' },
      { status: 500 }
    );
  }

  // ---- GAS へ転送（シークレットはサーバー側でのみ付与）----
  try {
    const res = await fetch(GAS_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: GAS_POST_SECRET,
        calendarKey: body.calendarKey,
        title,
        description: (body.description ?? '').trim(),
        location: (body.location ?? '').trim(),
        roomEmail: (body.roomEmail ?? '').trim(),
        isAllDay: !!body.isAllDay,
        dateKey: body.dateKey ?? '',
        startISO: body.startISO ?? '',
        endISO: body.endISO ?? '',
      }),
      // GAS Web App は /exec でリダイレクトを挟むため follow が必要
      redirect: 'follow',
    });

    const data = await res.json();
    if (!data.success) {
      return NextResponse.json({ success: false, error: data.error ?? 'イベント作成に失敗しました' }, { status: 502 });
    }
    return NextResponse.json({ success: true, event: data.event });
  } catch (err) {
    console.error('GAS create error:', err);
    return NextResponse.json({ success: false, error: 'カレンダーサービスへの接続に失敗しました' }, { status: 502 });
  }
}
