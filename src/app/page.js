'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SacredSymbol from '@/components/SacredSymbols';
import AudioHistogram from '@/components/AudioHistogram';
import { Origin, Forge, Transmissions, Resonance, Archive, Frequencies, Wavelength } from '@/components/sections/Sections';
import {
  resumeAudio, startDrone, updateDrone, stopDrone, isDroneActive,
  playTransitionNote, playPing, getAudioContext,
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
  // i=0 → root, i=1 → +1 semitone, etc. 2^(1/12) per step. playPing
  // itself transposes the tone up into phone-speaker range; the frequency
  // math here still fixes the pings harmonically to the section's drone.
  const handlePing = useCallback((i) => {
    if (!audioOn) return;
    playPing(sec.freq * Math.pow(2, i / 12), 1.0);
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

  // On mount: honor `?s=N` (e.g. back-from-/studio lands on Wavelength)
  // and sync the UI with the actual drone state so the toggle is honest.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('s');
    const n = Number.parseInt(raw ?? '', 10);
    if (Number.isFinite(n) && n >= 0 && n < SECTIONS.length && n !== 0) {
      setIdx(n);
      if (isDroneActive()) updateDrone(n);
    }
    setAudioOn(isDroneActive());
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(idx + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(idx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, goTo]);

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
        className={`pill fixed top-3 right-3 z-50 ${audioOn ? 'pill-active' : ''}`}
      >
        {audioOn ? '♪ On' : '♪ Off'}
      </button>

      {/* Navigation arrows */}
      {idx > 0 && (
        <button onClick={() => goTo(idx - 1)} className="nav-arrow" style={{ left: '12px' }}>‹</button>
      )}
      {idx < SECTIONS.length - 1 && (
        <button onClick={() => goTo(idx + 1)} className="nav-arrow" style={{ right: '12px' }}>›</button>
      )}

      {/* Sacred symbol */}
      <div className="flex justify-center pt-8 lg:pt-14 relative z-10">
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
      <div className={`relative z-10 mt-6 lg:mt-10 pb-28 transition-all duration-200 ${fading ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
        {renderContent()}
      </div>

      {/* Hint */}
      <p className="fixed bottom-[82px] left-1/2 -translate-x-1/2 z-20 font-mono text-[9px] tracking-wider text-cream-dim/30">
        {idx === 0 ? '← swipe or arrow keys →' : `${idx + 1} / ${SECTIONS.length}`}
      </p>

      {/* Frequency-histogram footer — gold bars pulse from real audio
          when the drone is on, breathe gently when it's off. */}
      <AudioHistogram active={audioOn} />
    </div>
  );
}
