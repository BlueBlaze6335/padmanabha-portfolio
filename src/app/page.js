'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SacredSymbol from '@/components/SacredSymbols';
import { Origin, Forge, Transmissions, Resonance, Archive, Frequencies, Wavelength } from '@/components/sections/Sections';
import {
  resumeAudio, startDrone, updateDrone, stopDrone, isDroneActive,
  playTransitionNote, playPing, getAudioContext, getAnalyser,
} from '@/lib/audio/engine';

const SECTIONS = [
  { id: 'origin',        freq: 65.41,  sub: 'Where signal begins' },
  { id: 'forge',         freq: 73.42,  sub: 'Domains · Stack · Knowledge' },
  { id: 'transmissions', freq: 82.41,  sub: 'What I ship' },
  { id: 'resonance',     freq: 87.31,  sub: 'Published work' },
  { id: 'archive',       freq: 98.0,   sub: 'Visual · Creative · Memory' },
  { id: 'frequencies',   freq: 110.0,  sub: 'What I listen to' },
  { id: 'wavelength',    freq: 123.47, sub: 'Writing · Thinking' },
  { id: 'signal',        freq: 130.81, sub: 'Make something' },
];


export default function HomePage() {
  const [idx, setIdx] = useState(0);
  const [audioOn, setAudioOn] = useState(false);
  const [fading, setFading] = useState(false);
  const router = useRouter();
  const touchStart = useRef({ x: 0, y: 0 });
  const waveRef = useRef(null);
  const wavePhase = useRef(0);
  const waveAnim = useRef(null);

  const sec = SECTIONS[idx];

  // Navigate to section
  const goTo = useCallback((newIdx) => {
    if (newIdx < 0 || newIdx >= SECTIONS.length || newIdx === idx || fading) return;

    // Section 8 = studio page — play the C3 transition and drop the drone
    // to section 8's level before navigating, so the AudioContext (which
    // outlives client-side nav) carries the note into /studio.
    if (newIdx === 7) {
      resumeAudio();
      if (!audioOn) {
        startDrone(newIdx);
        setAudioOn(true);
      } else {
        updateDrone(newIdx);
      }
      playTransitionNote(SECTIONS[newIdx].freq);
      router.push('/studio');
      return;
    }

    if (!audioOn) {
      resumeAudio();
      startDrone(newIdx);
      setAudioOn(true);
    }

    setFading(true);
    setTimeout(() => {
      setIdx(newIdx);
      setFading(false);
      updateDrone(newIdx);
      playTransitionNote(SECTIONS[newIdx].freq);
    }, 200);
  }, [idx, fading, audioOn, router]);

  // Ping for interactive elements — chromatic climb from the section's note.
  // i=0 → root, i=1 → +1 semitone, etc. 2^(1/12) per step.
  const handlePing = useCallback((i) => {
    if (!audioOn) return;
    playPing(sec.freq * Math.pow(2, i / 12), 0.35);
  }, [audioOn, sec.freq]);

  // Swipe handlers
  const onTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      dx > 0 ? goTo(idx - 1) : goTo(idx + 1);
    }
  };

  // Reflect the shared drone state on mount — if the visitor is returning
  // from /studio with audio running, the toggle should read "On".
  useEffect(() => { setAudioOn(isDroneActive()); }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(idx + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(idx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, goTo]);

  // Waveform canvas — fed by the live AnalyserNode when audio is on, so
  // what you see IS what's playing. The visual is literally signal in noise:
  // the drone is the noise floor, pings and transitions are the peaks.
  useEffect(() => {
    const cvs = waveRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const analyser = audioOn ? getAnalyser() : null;
    const buf = analyser ? new Uint8Array(analyser.fftSize) : null;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = cvs.clientWidth;
      const h = cvs.clientHeight;
      if (cvs.width !== w * dpr) { cvs.width = w * dpr; cvs.height = h * dpr; ctx.scale(dpr, dpr); }
      ctx.clearRect(0, 0, w, h);
      const mid = h / 2;

      if (analyser && buf) {
        analyser.getByteTimeDomainData(buf);
        // Peak amplitude in the window (for the glow intensity)
        let peak = 0;
        for (let i = 0; i < buf.length; i++) { const v = Math.abs(buf[i] - 128); if (v > peak) peak = v; }
        const intensity = Math.min(1, peak / 60);

        // Gold waveform (the signal)
        ctx.beginPath();
        ctx.strokeStyle = '#d4ac54';
        ctx.lineWidth = 1.2 + intensity * 1.5;
        ctx.globalAlpha = 0.3 + intensity * 0.6;
        const step = buf.length / w;
        for (let x = 0; x < w; x++) {
          const v = buf[Math.floor(x * step)] / 128 - 1;
          const env = Math.sin((x / w) * Math.PI);
          const y = mid + v * (h * 0.42) * env;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        // Idle: synthetic low-amplitude sine so the frame never looks dead
        wavePhase.current += 0.015;
        ctx.beginPath(); ctx.strokeStyle = '#d4ac54'; ctx.lineWidth = 0.6; ctx.globalAlpha = 0.12;
        for (let x = 0; x < w; x++) {
          const env = Math.sin((x / w) * Math.PI);
          const y = mid + Math.sin(x * 0.05 + wavePhase.current) * h * 0.07 * env;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.globalAlpha = 1;
      }
      waveAnim.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(waveAnim.current);
  }, [audioOn]);

  // Audio toggle
  const toggleAudio = () => {
    if (!audioOn) {
      resumeAudio();
      startDrone(idx);
      setAudioOn(true);
      playTransitionNote(sec.freq);
    } else {
      stopDrone();
      setAudioOn(false);
    }
  };

  // Render section content
  const renderContent = () => {
    switch (sec.id) {
      case 'origin': return <Origin />;
      case 'forge': return <Forge onPing={handlePing} />;
      case 'transmissions': return <Transmissions onPing={handlePing} />;
      case 'resonance': return <Resonance onPing={handlePing} />;
      case 'archive': return <Archive onPing={handlePing} />;
      case 'frequencies': return <Frequencies onPing={handlePing} />;
      case 'wavelength': return <Wavelength onPing={handlePing} />;
      default: return null;
    }
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="min-h-screen relative select-none"
    >
      {/* Audio toggle */}
      <button
        onClick={toggleAudio}
        className={`fixed top-3 right-3 z-50 font-mono text-[9px] tracking-wider uppercase px-3 py-1.5 rounded-full border transition-all ${
          audioOn ? 'text-[var(--gold)] border-[var(--gold-dim)]' : 'text-cream-dim border-cream-ghost'
        }`}
      >
        {audioOn ? '♪ On' : '♪ Off'}
      </button>

      {/* Navigation arrows */}
      {idx > 0 && (
        <button onClick={() => goTo(idx - 1)} className="fixed left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full border border-cream-ghost text-cream-dim hover:border-[var(--gold-dim)] hover:text-[var(--gold)] flex items-center justify-center transition-all">
          ‹
        </button>
      )}
      {idx < SECTIONS.length - 1 && (
        <button onClick={() => goTo(idx + 1)} className="fixed right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full border border-cream-ghost text-cream-dim hover:border-[var(--gold-dim)] hover:text-[var(--gold)] flex items-center justify-center transition-all">
          ›
        </button>
      )}

      {/* Sacred symbol */}
      <div className="flex justify-center pt-8 relative z-10">
        <SacredSymbol id={sec.id} className="w-[130px] h-[130px]" />
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-3 relative z-10">
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => i === 7 ? router.push('/studio') : goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === idx ? 'w-6 bg-[var(--gold)]' : 'w-2 bg-cream-ghost'
            }`}
          />
        ))}
      </div>

      {/* Section subtitle */}
      <p className="text-center mt-2 font-mono text-[9px] tracking-[5px] text-cream-dim uppercase relative z-10">
        {sec.sub}
      </p>

      {/* Content */}
      <div className={`relative z-10 mt-6 pb-28 transition-all duration-200 ${fading ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
        {renderContent()}
      </div>

      {/* Hint */}
      <p className="fixed bottom-[82px] left-1/2 -translate-x-1/2 z-20 font-mono text-[9px] tracking-wider text-cream-dim/30">
        {idx === 0 ? '← swipe or arrow keys →' : `${idx + 1} / ${SECTIONS.length}`}
      </p>

      {/* Waveform */}
      <canvas
        ref={waveRef}
        className="fixed bottom-0 left-0 right-0 z-5 pointer-events-none"
        style={{ width: '100%', height: 70 }}
      />
    </div>
  );
}
