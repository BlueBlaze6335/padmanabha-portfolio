import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const KEY = 'compositions';
const MAX = 200;

export async function GET() {
  const raw = await kv.lrange(KEY, 0, -1);
  const items = raw.map((s) => (typeof s === 'string' ? JSON.parse(s) : s));
  return NextResponse.json(items);
}

export async function POST(request) {
  const data = await request.json();

  if (!data.name?.trim()) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 });
  }

  const composition = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: data.name.trim().slice(0, 50),
    bpm: Math.max(60, Math.min(180, data.bpm || 120)),
    drums: data.drums || {},
    synth: data.synth || {},
    bass: data.bass || {},
    synthProfile: data.synthProfile || 'warm',
    bassProfile: data.bassProfile || 'crunch',
    padActive: !!data.padActive,
    date: new Date().toISOString(),
  };

  await kv.lpush(KEY, JSON.stringify(composition));
  await kv.ltrim(KEY, 0, MAX - 1);

  return NextResponse.json(composition, { status: 201 });
}
