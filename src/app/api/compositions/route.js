import { NextResponse } from 'next/server';

// In production, use Vercel KV: import { kv } from '@vercel/kv';
// For now, in-memory store (resets on deploy — replace with KV)
let compositions = [];

export async function GET() {
  // Production: const compositions = await kv.lrange('compositions', 0, -1);
  return NextResponse.json(compositions.slice().reverse());
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

  compositions.push(composition);

  // Keep only last 200 compositions
  if (compositions.length > 200) compositions = compositions.slice(-200);

  // Production: await kv.lpush('compositions', JSON.stringify(composition));
  return NextResponse.json(composition, { status: 201 });
}
