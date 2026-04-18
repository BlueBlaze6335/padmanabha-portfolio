'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SacredSymbol from '@/components/SacredSymbols';
import { resumeAudio, getAudioContext, playDrumHit, initDrumBuffers, playSynthNote, playBassNote, Scheduler } from '@/lib/audio/engine';

const DOTS = 9; // 7 journey sections + studio + gallery

const SYNTH_FREQ = {C3:130.81,'C#3':138.59,D3:146.83,'D#3':155.56,E3:164.81,F3:174.61,'F#3':185,G3:196,'G#3':207.65,A3:220,'A#3':233.08,B3:246.94,C4:261.63};
const BASS_FREQ = {C2:65.41,'C#2':69.3,D2:73.42,'D#2':77.78,E2:82.41,F2:87.31,'F#2':92.5,G2:98,'G#2':103.83,A2:110,'A#2':116.54,B2:123.47,C3:130.81};
const DR = ['crash','hh','snare','kick'];
const SYNTH_NOTES = ['C4','B3','A#3','A3','G#3','G3','F#3','F3','E3','D#3','D3','C#3','C3'];
const BASS_NOTES = ['C3','B2','A#2','A2','G#2','G2','F#2','F2','E2','D#2','D2','C#2','C2'];

const DOT_COLORS = { kick: '#D85A30', snare: '#d4ac54', hh: '#5DCAA5', crash: '#ED93B1' };

function getUsedLayers(comp) {
  const layers = [];
  const hasDrums = DR.some(d => comp.drums?.[d]?.some(v => v));
  const hasSynth = SYNTH_NOTES.some(n => comp.synth?.[n]?.some(v => v));
  const hasBass = BASS_NOTES.some(n => comp.bass?.[n]?.some(v => v));
  if (hasDrums) layers.push('Drums');
  if (hasSynth) layers.push('Synth');
  if (hasBass) layers.push('Bass');
  if (comp.padActive) layers.push('Pad');
  return layers.join(' + ') || 'Empty';
}

function BeatDots({ comp }) {
  // Show kick pattern as colored dots
  const pattern = comp.drums?.kick || new Array(16).fill(0);
  const snare = comp.drums?.snare || new Array(16).fill(0);
  const hh = comp.drums?.hh || new Array(16).fill(0);
  return (
    <div className="flex gap-[3px] shrink-0">
      {pattern.map((v, i) => {
        let color = 'rgba(138,132,116,0.08)';
        if (v) color = DOT_COLORS.kick;
        else if (snare[i]) color = DOT_COLORS.snare;
        else if (hh[i]) color = DOT_COLORS.hh;
        return <div key={i} className="w-1 h-4 rounded-sm" style={{ background: color }} />;
      })}
    </div>
  );
}

export default function GalleryPage() {
  const [compositions, setCompositions] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const schedulerRef = useRef(null);
  const router = useRouter();
  const touchStart = useRef({ x: 0, y: 0 });

  const onTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    // Right swipe → studio (back). No forward — gallery is the last section.
    if (Math.abs(dx) > Math.abs(dy) && dx > 50) router.push('/studio');
  };

  useEffect(() => {
    fetch('/api/compositions').then(r => r.json()).then(setCompositions).catch(() => {
      // Demo fallback
      setCompositions([
        { id: '1', name: 'Demo Visitor', bpm: 120, date: new Date().toISOString(), drums: { kick: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hh: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], crash: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] }, synth: {}, bass: {}, synthProfile: 'warm', bassProfile: 'crunch', padActive: false },
      ]);
    });
  }, []);

  const playComposition = (comp) => {
    if (playingId === comp.id) {
      schedulerRef.current?.stop();
      setPlayingId(null);
      return;
    }
    resumeAudio();
    initDrumBuffers();
    if (schedulerRef.current) schedulerRef.current.stop();
    const sched = new Scheduler();
    sched.setBpm(comp.bpm || 120);
    sched.onStep = (step, time) => {
      DR.forEach(d => { if (comp.drums?.[d]?.[step]) playDrumHit(d, time, 0.8); });
      SYNTH_NOTES.forEach(n => { if (comp.synth?.[n]?.[step]) playSynthNote(SYNTH_FREQ[n], time, 0.7, comp.synthProfile || 'warm'); });
      BASS_NOTES.forEach(n => { if (comp.bass?.[n]?.[step]) playBassNote(BASS_FREQ[n], time, 0.75, comp.bassProfile || 'crunch'); });
    };
    sched.start();
    schedulerRef.current = sched;
    setPlayingId(comp.id);
  };

  useEffect(() => {
    return () => schedulerRef.current?.stop();
  }, []);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="min-h-screen relative select-none"
    >
      {/* Left arrow → studio */}
      <button onClick={() => router.push('/studio')} className="fixed left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full border border-cream-ghost text-cream-dim hover:border-[var(--gold-dim)] hover:text-[var(--gold)] flex items-center justify-center transition-all">
        ‹
      </button>

      {/* Sacred symbol — journey size */}
      <div className="flex justify-center pt-8 relative z-10">
        <SacredSymbol id="signal" className="w-[130px] h-[130px]" />
      </div>

      {/* Dots — gallery is section 9 (last) */}
      <div className="flex justify-center gap-2 mt-3 relative z-10">
        {Array.from({ length: DOTS }, (_, i) => (
          <button
            key={i}
            onClick={() => { if (i === 7) router.push('/studio'); else if (i < 7) router.push('/'); }}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === 8 ? 'w-6 bg-[var(--gold)]' : 'w-2 bg-cream-ghost'
            }`}
          />
        ))}
      </div>

      <h1 className="section-title text-center mt-4 relative z-10">Signal Archive</h1>
      <p className="text-center mt-2 font-mono text-[9px] tracking-[5px] text-cream-dim uppercase relative z-10">
        What visitors left behind
      </p>
      <div className="flex justify-center mt-3 relative z-10">
        <span className="font-mono text-[9px] text-cream-dim/30 tracking-wider uppercase border border-cream-ghost rounded-full px-3 py-1">
          No background audio — listen to them
        </span>
      </div>

      <div className="relative z-10 mt-6 pb-28 px-4 max-w-xl mx-auto">

      {compositions.length === 0 ? (
        <p className="text-center font-body text-cream-dim py-12">No signals yet. Be the first.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {compositions.map((comp) => (
            <div key={comp.id} onClick={() => playComposition(comp)}
              className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                playingId === comp.id ? 'border-[var(--gold-dim)] bg-surface' : 'border-cream-ghost hover:border-cream-ghost/30 hover:bg-surface/50'
              }`}>
              {/* Play button */}
              <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                playingId === comp.id ? 'border-[var(--gold)] bg-[var(--gold-ghost)]' : 'border-[var(--gold-dim)]'
              }`}>
                {playingId === comp.id ? (
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-3 bg-[var(--gold)] rounded-sm" />
                    <div className="w-0.5 h-3 bg-[var(--gold)] rounded-sm" />
                  </div>
                ) : (
                  <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 ml-0.5"><polygon points="3,1 12,7 3,13" fill="#d4ac54" /></svg>
                )}
              </div>

              {/* Meta */}
              <div className="flex-1 min-w-0">
                <div className="font-body text-[15px] text-cream">{comp.name}</div>
                <div className="font-mono text-[9px] text-cream-dim/35 tracking-wider">
                  {new Date(comp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="font-mono text-[10px] text-cream-dim/30 flex gap-2 mt-0.5">
                  <span>{comp.bpm} BPM</span>
                  <span>{getUsedLayers(comp)}</span>
                </div>
              </div>

              {/* Beat dots */}
              <BeatDots comp={comp} />
            </div>
          ))}
        </div>
      )}

      <p className="text-center font-mono text-[9px] text-cream-dim/20 tracking-wider mt-8">
        {compositions.length} SIGNAL{compositions.length !== 1 ? 'S' : ''} ARCHIVED
      </p>
      </div>

      <p className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 font-mono text-[9px] tracking-wider text-cream-dim/30">
        9 / 9 · <Link href="/" className="hover:text-[var(--gold)]">← journey</Link>
      </p>
    </div>
  );
}
