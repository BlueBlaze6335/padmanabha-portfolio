import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const KEY = 'messages';
const MAX = 500;

export async function GET() {
  const raw = await kv.lrange(KEY, 0, -1);
  const items = raw.map((s) => (typeof s === 'string' ? JSON.parse(s) : s));
  return NextResponse.json(items);
}

export async function POST(request) {
  const data = await request.json();

  const name = data.name?.trim().slice(0, 80);
  const email = data.email?.trim().slice(0, 120);
  const body = data.message?.trim().slice(0, 2000);

  if (!name || !body) {
    return NextResponse.json({ error: 'Name and message are required' }, { status: 400 });
  }

  const message = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    email: email || null,
    message: body,
    date: new Date().toISOString(),
  };

  await kv.lpush(KEY, JSON.stringify(message));
  await kv.ltrim(KEY, 0, MAX - 1);

  return NextResponse.json({ id: message.id }, { status: 201 });
}
