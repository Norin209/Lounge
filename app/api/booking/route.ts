import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { message } = body;

  // ✅ SECURE: Read from .env.local again
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return NextResponse.json({ error: 'Missing Telegram Config' }, { status: 500 });
  }

  try {
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Telegram Error' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}