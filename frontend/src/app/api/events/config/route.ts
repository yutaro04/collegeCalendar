import { NextResponse } from 'next/server';

const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL ?? '';
const GAS_POST_SECRET = process.env.GAS_POST_SECRET ?? '';

/** 投稿フォーム用の設定（カレンダー選択肢とROOM一覧）を GAS から取得して返す */
export async function GET() {
  if (!GAS_WEBAPP_URL || !GAS_POST_SECRET) {
    return NextResponse.json(
      { success: false, error: 'サーバー設定が不足しています', config: null },
      { status: 500 }
    );
  }

  try {
    const url = `${GAS_WEBAPP_URL}?action=config&secret=${encodeURIComponent(GAS_POST_SECRET)}`;
    const res = await fetch(url, { redirect: 'follow' });
    const data = await res.json();
    if (!data.success) {
      return NextResponse.json({ success: false, error: data.error ?? '設定取得に失敗しました', config: null }, { status: 502 });
    }
    // 「プライベート」はGASを介さず本人のGoogleカレンダーに直接作成するため、GAS側の設定とは別にここで追加
    const calendars = [...data.config.calendars, { key: 'private', name: 'プライベート' }];
    return NextResponse.json({ success: true, config: { ...data.config, calendars } });
  } catch (err) {
    console.error('GAS config error:', err);
    return NextResponse.json({ success: false, error: '設定の取得に失敗しました', config: null }, { status: 502 });
  }
}
