import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** ログイン直後、Supabaseセッションのprovider_refresh_tokenをサーバーに保存する。
 *  「プライベート」カレンダーへの投稿時に本人のGoogleカレンダーを操作するために使う。 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ success: false, error: 'ログインが必要です' }, { status: 401 });
  }

  let body: { refreshToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'リクエストが不正です' }, { status: 400 });
  }
  const refreshToken = (body.refreshToken ?? '').trim();
  if (!refreshToken) {
    return NextResponse.json({ success: false, error: 'refreshTokenが必要です' }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    return NextResponse.json({ success: false, error: 'セッションが無効です' }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from('google_oauth_tokens')
    .upsert({ user_id: userData.user.id, refresh_token: refreshToken, updated_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ success: false, error: '保存に失敗しました' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
