import { NextResponse } from 'next/server';

const BATHROOM_API_URL = process.env.BATHROOM_API_URL ?? '';

export async function GET() {
  if (!BATHROOM_API_URL) {
    return NextResponse.json(
      { success: false, error: 'BATHROOM_API_URLが未設定です', data: [] },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(BATHROOM_API_URL, { next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `API取得失敗 (${res.status})`, data: [] },
        { status: 502 },
      );
    }
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err), data: [] },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!BATHROOM_API_URL) {
    return NextResponse.json(
      { success: false, message: 'BATHROOM_API_URLが未設定です' },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const res = await fetch(BATHROOM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 500 },
    );
  }
}
