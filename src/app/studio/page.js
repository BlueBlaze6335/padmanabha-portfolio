'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SacredSymbol from '@/components/SacredSymbols';
import AudioHistogram from '@/components/AudioHistogram';
import { getVisitorProgression } from '@/lib/visitor';
import {
  resumeAudio, getAudioContext, playDrumHit, initDrumBuffers,
  playSynthNote, playBassNote, togglePad, isPadActive,
  startDrone, updateDrone, stopDrone, isDroneActive,
  Scheduler, SYNTH_PROFILES, BASS_PROFILES,
} from '@/lib/audio/engine';

const STUDIO_FREQ = 130.81; // C3 — matches section 8 in the main journey
const DOTS = 8; // 7 journey sections + studio

const STEPS = 16;
const DR = ['crash', 'hh', 'snare', 'kick'];
const DR_COLORS = { kick: 'cell-kick', snare: 'cell-snare', hh: 'cell-hh', crash: 'cell-crash' };
const SYNTH_NOTES = ['C4','B3','A#3','A3','G#3','G3','F#3','F3','E3','D#3','D3','C#3','C3'];
const SYNTH_FREQ = {C3:130.81,'C#3':138.59,D3:146.83,'D#3':155.56,E3:164.81,F3:174.61,'F#3':185,G3:196,'G#3':207.65,A3:220,'A#3':233.08,B3:246.94,C4:261.63};
const BASS_NOTES = ['C3','B2','A#2','A2','G#2','G2','F#2','F2','E2','D#2','D2','C#2','C2'];
const BASS_FREQ = {C2:65.41,'C#2':69.3,D2:73.42,'D#2':77.78,E2:82.41,F2:87.31,'F#2':92.5,G2:98,'G#2':103.83,A2:110,'A#2':116.54,B2:123.47,C3:130.81};

function emptyGrid(keys) {
  const g = {};
  keys.forEach(k => { g[k] = new Array(STEPS).fill(0); });
  return g;
}

function presetDrums(g) {
  g.kick[0]=1;g.kick[4]=1;g.kick[8]=1;g.kick[12]=1;
  g.snare[4]=1;g.snare[12]=1;
  g.hh[0]=1;g.hh[2]=1;g.hh[4]=1;g.hh[6]=1;g.hh[8]=1;g.hh[10]=1;g.hh[12]=1;g.hh[14]=1;
  return g;
}

// Seed the synth grid with the visitor's personal chord progression,
// rooted on C3 (the studio's parent note). One chord per bar of 4
// steps: chord[0] plays at step 0, chord[1] at step 1, chord[2] at 2.
// Visitors hear "their key" the moment they hit Play.
function presetSynthFromProgression(grid, progression) {
  const ROOT_MIDI = 48; // C3
  // Map a semitone count from ROOT_MIDI to one of the SYNTH_NOTES keys
  // (C3..C4 = 0..12 semitones). Anything above C4 wraps down an octave.
  const keyForSemi = (semi) => {
    const s = ((semi % 12) + 12) % 12;
    return SYNTH_NOTES_ASCENDING[s];
  };
  progression.chords.forEach((chord, chordIdx) => {
    const baseStep = chordIdx * 4;
    chord.forEach((semi, toneIdx) => {
      const step = baseStep + toneIdx;
      if (step >= STEPS) return;
      const k = keyForSemi(semi);
      if (k && grid[k]) grid[k][step] = 1;
    });
  });
  return grid;
}
// Ascending C3..B3 mapped by semitone — used to translate a semitone
// offset into the top-down SYNTH_NOTES grid key.
const SYNTH_NOTES_ASCENDING = ['C3','C#3','D3','D#3','E3','F3','F#3','G3','G#3','A3','A#3','B3'];

export default function StudioPage() {
  // Read visitor progression client-side only (localStorage access); on
  // the server render pass the state starts from an empty synth grid
  // and the visitor's seed is applied in a mount effect below.
  const [progression, setProgression] = useState(null);
  const [drumGrid, setDrumGrid] = useState(() => presetDrums(emptyGrid(DR)));
  const [synthGrid, setSynthGrid] = useState(() => emptyGrid(SYNTH_NOTES));
  const [bassGrid, setBassGrid] = useState(() => emptyGrid(BASS_NOTES));
  const [curTab, setCurTab] = useState('drums');
  const [playing, setPlaying] = useState(false);
  const [curStep, setCurStep] = useState(-1);
  const [bpm, setBpm] = useState(120);
  const [synthProfile, setSynthProfile] = useState('warm');
  const [bassProfile, setBassProfile] = useState('crunch');
  const [padActive, setPadActive] = useState(false);
  const [volumes, setVolumes] = useState({ dr: 80, sy: 70, ba: 75, pd: 40 });
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [msgName, setMsgName] = useState('');
  const [msgEmail, setMsgEmail] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [msgError, setMsgError] = useState('');

  const router = useRouter();
  const schedulerRef = useRef(null);
  const gridsRef = useRef({ drum: drumGrid, synth: synthGrid, bass: bassGrid });
  const volRef = useRef(volumes);
  const profileRef = useRef({ synth: synthProfile, bass: bassProfile });
  const touchStart = useRef({ x: 0, y: 0 });

  // Keep refs in sync
  useEffect(() => { gridsRef.current = { drum: drumGrid, synth: synthGrid, bass: bassGrid }; }, [drumGrid, synthGrid, bassGrid]);
  useEffect(() => { volRef.current = volumes; }, [volumes]);
  useEffect(() => { profileRef.current = { synth: synthProfile, bass: bassProfile }; }, [synthProfile, bassProfile]);

  // Reflect the journey's drone state. Landing here with the drone running
  // means audio is "on"; the toggle lets the user kill it if they want to
  // focus on their own composition.
  useEffect(() => { setAudioOn(isDroneActive()); }, []);

  // Resolve the visitor's musical identity once on mount. The synth
  // grid is seeded with their first chord progression so hitting Play
  // reveals it straight away.
  useEffect(() => {
    const prog = getVisitorProgression();
    setProgression(prog);
    setSynthGrid((g) => presetSynthFromProgression(g, prog));
  }, []);

  // Swipe handlers — ignore if the touch started on an interactive element
  // (inputs, sliders, grid cells, buttons). Otherwise sliding a BPM knob or
  // programming a drum pattern would trigger a nav.
  const onTouchStart = (e) => {
    const t = e.target;
    const interactive = t.closest && t.closest('input, textarea, button, [role="slider"], .cell-off, .cell-head, .cell-step, [data-no-swipe]');
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, blocked: !!interactive };
  };
  const onTouchEnd = (e) => {
    if (touchStart.current.blocked) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      // Back to journey = land on Wavelength (section 7, idx 6), the
      // section immediately before Signal — NOT Origin. The query param
      // tells page.js where to start.
      if (dx > 0) router.push('/?s=6');      // swipe-from-left / back
      else router.push('/gallery');          // swipe-from-right / forward
    }
  };

  const toggleAudio = () => {
    if (audioOn) { stopDrone(); setAudioOn(false); }
    else { resumeAudio(); startDrone(7); setAudioOn(true); }
  };

  // Init scheduler once
  useEffect(() => {
    const sched = new Scheduler();
    sched.onStep = (step, time) => {
      const g = gridsRef.current;
      const v = volRef.current;
      const p = profileRef.current;
      // Drums
      DR.forEach(d => { if (g.drum[d]?.[step]) playDrumHit(d, time, v.dr / 100); });
      // Synth
      SYNTH_NOTES.forEach(n => { if (g.synth[n]?.[step]) playSynthNote(SYNTH_FREQ[n], time, v.sy / 100, p.synth); });
      // Bass
      BASS_NOTES.forEach(n => { if (g.bass[n]?.[step]) playBassNote(BASS_FREQ[n], time, v.ba / 100, p.bass); });
    };
    sched.onVisualStep = (step) => setCurStep(step);
    schedulerRef.current = sched;
    return () => sched.stop();
  }, []);

  const handlePlay = () => {
    if (playing) return;
    resumeAudio();
    initDrumBuffers();
    schedulerRef.current.setBpm(bpm);
    schedulerRef.current.start();
    setPlaying(true);
  };

  const handleStop = () => {
    schedulerRef.current?.stop();
    setPlaying(false);
    setCurStep(-1);
  };

  const handleBpm = (v) => {
    setBpm(v);
    if (schedulerRef.current) schedulerRef.current.setBpm(v);
  };

  const handleClear = () => {
    setDrumGrid(emptyGrid(DR));
    setSynthGrid(emptyGrid(SYNTH_NOTES));
    setBassGrid(emptyGrid(BASS_NOTES));
  };

  const toggleDrum = (d, s) => {
    setDrumGrid(prev => {
      const next = { ...prev, [d]: [...prev[d]] };
      next[d][s] = next[d][s] ? 0 : 1;
      if (next[d][s]) { resumeAudio(); initDrumBuffers(); playDrumHit(d, getAudioContext().currentTime, volumes.dr / 100); }
      return next;
    });
  };

  const toggleSynthCell = (n, s) => {
    setSynthGrid(prev => {
      const next = { ...prev, [n]: [...prev[n]] };
      next[n][s] = next[n][s] ? 0 : 1;
      if (next[n][s]) { resumeAudio(); playSynthNote(SYNTH_FREQ[n], getAudioContext().currentTime, volumes.sy / 100, synthProfile); }
      return next;
    });
  };

  const toggleBassCell = (n, s) => {
    setBassGrid(prev => {
      const next = { ...prev, [n]: [...prev[n]] };
      next[n][s] = next[n][s] ? 0 : 1;
      if (next[n][s]) { resumeAudio(); playBassNote(BASS_FREQ[n], getAudioContext().currentTime, volumes.ba / 100, bassProfile); }
      return next;
    });
  };

  const handlePad = () => {
    resumeAudio();
    const active = togglePad(volumes.pd);
    setPadActive(active);
  };

  const handleSendMessage = async () => {
    if (msgSending) return;
    if (!msgName.trim() || !msgBody.trim()) {
      setMsgError('Name and message are required.');
      return;
    }
    setMsgSending(true);
    setMsgError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: msgName, email: msgEmail, message: msgBody }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setMsgSent(true);
    } catch (e) {
      setMsgError("Couldn't send. Try again in a moment.");
    } finally {
      setMsgSending(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await fetch('/api/compositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          bpm,
          drums: drumGrid,
          synth: synthGrid,
          bass: bassGrid,
          synthProfile,
          bassProfile,
          padActive,
          date: new Date().toISOString(),
        }),
      });
      setSaved(true);
    } catch (e) {
      setSaved(true); // Still show success in demo mode
    }
  };

  // Grid renderer
  const renderGrid = () => {
    let rows, grid, toggleFn, cellClass;
    if (curTab === 'drums') {
      rows = DR;
      grid = drumGrid;
      toggleFn = toggleDrum;
    } else if (curTab === 'synth') {
      rows = SYNTH_NOTES;
      grid = synthGrid;
      toggleFn = toggleSynthCell;
      cellClass = 'cell-synth';
    } else {
      rows = BASS_NOTES;
      grid = bassGrid;
      toggleFn = toggleBassCell;
      cellClass = 'cell-bass';
    }

    return (
      <div className="grid gap-px" style={{ gridTemplateColumns: `42px repeat(${STEPS}, 1fr)` }}>
        {rows.map(row => (
          <div key={row} className="contents">
            <div className="font-mono text-[9px] text-cream-dim/50 flex items-center justify-end pr-1.5 h-[18px]">
              {row.toUpperCase?.() || row}
            </div>
            {Array.from({ length: STEPS }, (_, s) => {
              const on = grid[row]?.[s];
              const isHead = s === curStep && !on;
              const beatBorder = s % 4 === 0;
              let cls = 'w-full h-[18px] rounded-sm cursor-pointer transition-colors duration-75 ';
              if (on) {
                cls += curTab === 'drums' ? DR_COLORS[row] : cellClass;
              } else if (isHead) {
                cls += 'cell-head';
              } else {
                cls += 'cell-off';
              }
              if (beatBorder) cls += ' cell-beat';
              return (
                <div key={s} className={cls} onClick={() => toggleFn(row, s)} />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="min-h-screen relative select-none"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Audio toggle — matches main journey */}
      <button
        onClick={toggleAudio}
        className={`pill fixed top-3 right-3 z-50 ${audioOn ? 'pill-active' : ''}`}
      >
        {audioOn ? '♪ On' : '♪ Off'}
      </button>

      {/* Left arrow → back to Wavelength (the section you'd naturally
          come from on the journey). */}
      <button onClick={() => router.push('/?s=6')} className="nav-arrow" style={{ left: '12px' }}>‹</button>
      {/* Right arrow → gallery */}
      <button onClick={() => router.push('/gallery')} className="nav-arrow" style={{ right: '12px' }}>›</button>

      {/* Sacred symbol — journey size */}
      <div className="flex justify-center pt-8 lg:pt-14 relative z-10">
        <SacredSymbol id="signal" className="w-[130px] h-[130px]" />
      </div>

      {/* Dots — position indicator only. Nav is by swipe / arrows /
          in-page links; tiny clickable dots on a scrollable surface were
          a mis-tap hazard. */}
      <div className="flex justify-center gap-2 mt-3 relative z-10" aria-hidden="true">
        {Array.from({ length: DOTS }, (_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === 7 ? 'w-6 bg-[var(--gold)]' : 'w-2 bg-cream-ghost'
            }`}
          />
        ))}
      </div>

      {/* Section title + subtitle */}
      <h1 className="section-title text-center mt-4 relative z-10">Send a Signal</h1>
      <p className="sub-label text-center mt-2 relative z-10">
        Make something
      </p>
      {progression && (
        <p className="text-center mt-2 relative z-10 font-mono text-[9px] tracking-[3px] uppercase text-[var(--gold)]/55">
          your key · {progression.key} · {progression.mood}
        </p>
      )}

      <div className="relative z-10 mt-6 lg:mt-10 pb-28 px-3 max-w-2xl mx-auto">

      {/* Transport — buttons + BPM split into two rows so the slider
          has room to breathe on narrow phones. */}
      <div className="surface mb-3 p-2">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={handlePlay} className={`font-mono text-[10px] tracking-wider uppercase px-4 py-2 rounded border transition-all ${playing ? 'text-[var(--gold)] border-[var(--gold-dim)] bg-[var(--gold-ghost)]' : 'text-cream border-cream-ghost'}`}>Play</button>
          <button onClick={handleStop} className="font-mono text-[10px] tracking-wider uppercase px-4 py-2 rounded border border-cream-ghost text-cream">Stop</button>
          <button onClick={handleClear} className="font-mono text-[10px] tracking-wider uppercase px-4 py-2 rounded border border-cream-ghost text-cream">Clear</button>
        </div>
        <div className="flex items-center gap-3 px-1">
          <span className="font-mono text-[9px] text-cream-dim tracking-[3px] uppercase shrink-0">BPM</span>
          <input type="range" min="60" max="180" value={bpm} step="1" onChange={(e) => handleBpm(+e.target.value)} className="slider flex-1 min-w-0" />
          <span className="font-mono text-[13px] text-[var(--gold)] min-w-[32px] text-right tabular-nums">{bpm}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mb-1.5">
        {[
          { id: 'drums', label: 'DRUMS', color: '#8f6a24' }, // deep gold
          { id: 'synth', label: 'SYNTH', color: '#d4ac54' }, // gold anchor
          { id: 'bass',  label: 'BASS',  color: '#c9c2ae' }, // cream-soft
        ].map(t => (
          <button key={t.id} onClick={() => setCurTab(t.id)}
            className={`font-mono text-[10px] tracking-wider px-3 py-1.5 rounded-t border-b-0 transition-all ${curTab === t.id ? 'bg-surface border border-cream-ghost' : 'border border-transparent'}`}
            style={{ color: t.color, background: curTab === t.id ? undefined : `${t.color}08` }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Roll area */}
      <div className="bg-surface rounded-b-lg rounded-tr-lg border border-cream-ghost p-2 min-h-[200px]">
        {/* Sound profiles */}
        {curTab === 'synth' && (
          <div className="flex items-center gap-1 mb-2">
            <span className="font-mono text-[8px] text-cream-dim/35 tracking-wider uppercase mr-1">Sound</span>
            {Object.keys(SYNTH_PROFILES).map(p => (
              <button key={p} onClick={() => setSynthProfile(p)}
                className={`chip ${synthProfile === p ? 'chip-active' : ''}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        )}
        {curTab === 'bass' && (
          <div className="flex items-center gap-1 mb-2">
            <span className="font-mono text-[8px] text-cream-dim/35 tracking-wider uppercase mr-1">Sound</span>
            {Object.keys(BASS_PROFILES).map(p => (
              <button key={p} onClick={() => setBassProfile(p)}
                className={`chip ${bassProfile === p ? 'chip-active' : ''}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Step numbers */}
        <div className="flex gap-px pl-[42px] mb-0.5">
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={`flex-1 text-center font-mono text-[8px] ${i % 4 === 0 ? 'text-cream-dim/45' : 'text-cream-dim/25'}`}>{i + 1}</span>
          ))}
        </div>

        {renderGrid()}
      </div>

      {/* Mix — pad toggle above, four faders in a row with room to drag. */}
      <div className="surface mt-3 p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[9px] text-cream-dim/50 tracking-[3px] uppercase">Mix</span>
          <button onClick={handlePad} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full border transition-all ${padActive ? 'bg-[var(--gold)] border-[var(--gold)] shadow-[0_0_10px_var(--gold-dim)]' : 'border-cream-ghost'}`} />
            <span className="font-mono text-[10px] text-cream-soft tracking-wider">PAD</span>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: 'dr', label: 'DRUMS' },
            { key: 'sy', label: 'SYNTH' },
            { key: 'ba', label: 'BASS' },
            { key: 'pd', label: 'PAD' },
          ].map(f => (
            <div key={f.key} className="flex flex-col items-center gap-1.5 min-w-0">
              <input type="range" min="0" max="100" value={volumes[f.key]} step="1"
                onChange={(e) => setVolumes(prev => ({ ...prev, [f.key]: +e.target.value }))}
                className="slider w-full" />
              <div className="flex flex-col items-center gap-0">
                <span className="font-mono text-[10px] text-[var(--gold)]/70 tabular-nums">{volumes[f.key]}</span>
                <span className="font-mono text-[8px] text-cream-dim/40 tracking-[2px] uppercase">{f.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      {!saved ? (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
            className="field flex-1 min-w-[120px]" />
          <button onClick={handleSave}
            className="font-mono text-[9px] tracking-wider uppercase px-4 py-1.5 rounded-md border border-[var(--gold-dim)] text-[var(--gold)] bg-[var(--gold-ghost)] hover:bg-[var(--gold)]/10 transition-all">
            Save to gallery
          </button>
        </div>
      ) : (
        <div className="mt-3 p-4 rounded-lg border border-[var(--gold-dim)] bg-[var(--gold-ghost)] text-center">
          <p className="font-body text-[15px] text-[var(--gold)]">Signal saved.</p>
          <p className="font-body text-[12px] text-cream-dim mt-1">{name}'s composition is in the gallery.</p>
        </div>
      )}

      {/* Or just say hi — low-friction message form for visitors who
          don't want to make music. Persists to KV at /api/messages. */}
      <div className="surface mt-6 p-4">
        <p className="font-mono text-[9px] text-cream-dim/60 tracking-[4px] uppercase mb-1">Or just say hi</p>
        <p className="font-body text-[12px] text-cream-dim/60 leading-[1.6] mb-3">
          Not in the mood to jam? Send a note instead — a thought, a question, a reason you're here.
        </p>
        {!msgSent ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 flex-wrap">
              <input type="text" value={msgName} onChange={(e) => setMsgName(e.target.value)} placeholder="Name"
                className="field flex-1 min-w-[120px]" />
              <input type="email" value={msgEmail} onChange={(e) => setMsgEmail(e.target.value)} placeholder="Email (optional)"
                className="field flex-1 min-w-[140px]" />
            </div>
            <textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} placeholder="Your message"
              rows={3}
              className="field field-area" />
            {msgError && <p className="font-mono text-[10px] text-red-300/70 tracking-wider">{msgError}</p>}
            <button onClick={handleSendMessage} disabled={msgSending}
              className="self-end font-mono text-[9px] tracking-wider uppercase px-4 py-1.5 rounded-md border border-[var(--gold-dim)] text-[var(--gold)] bg-[var(--gold-ghost)] hover:bg-[var(--gold)]/10 transition-all disabled:opacity-50">
              {msgSending ? 'Sending…' : 'Send signal'}
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-md border border-[var(--gold-dim)] bg-[var(--gold-ghost)] text-center">
            <p className="font-body text-[13px] text-[var(--gold)]">Signal received.</p>
            <p className="font-body text-[11px] text-cream-dim mt-1">Thanks, {msgName}. I'll read it.</p>
          </div>
        )}
      </div>

      {/* Social links */}
      <div className="flex justify-center gap-5 mt-6 mb-4">
        {[
          { label: 'GitHub', href: 'https://github.com/BlueBlaze6335' },
          { label: 'LinkedIn', href: 'https://www.linkedin.com/in/padmanabha-banerjee-b16800171/' },
          { label: 'Scholar', href: 'https://scholar.google.com/citations?user=Ow9aqPcAAAAJ&hl=en' },
          { label: 'Email', href: 'mailto:pbanerjee0801@gmail.com' },
        ].map(l => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
            className="font-mono text-[10px] text-cream-dim tracking-wider uppercase hover:text-[var(--gold)] transition-colors">
            {l.label}
          </a>
        ))}
      </div>

      </div>

      {/* Hint + link to gallery */}
      <p className="fixed bottom-[82px] left-1/2 -translate-x-1/2 z-20 font-mono text-[9px] tracking-wider text-cream-dim/30">
        8 / 9 · swipe or <Link href="/gallery" className="hover:text-[var(--gold)]">archive →</Link>
      </p>

      {/* Live audio spectrum analyzer — pure FFT of everything the
          DAW and drone produce. Silent when nothing plays. */}
      <AudioHistogram />
    </div>
  );
}


