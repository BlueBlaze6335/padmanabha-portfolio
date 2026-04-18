'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import SacredSymbol from '@/components/SacredSymbols';
import {
  resumeAudio, getAudioContext, playDrumHit, initDrumBuffers,
  playSynthNote, playBassNote, togglePad, isPadActive,
  updateDrone, Scheduler, SYNTH_PROFILES, BASS_PROFILES,
} from '@/lib/audio/engine';

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

export default function StudioPage() {
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

  const schedulerRef = useRef(null);
  const gridsRef = useRef({ drum: drumGrid, synth: synthGrid, bass: bassGrid });
  const volRef = useRef(volumes);
  const profileRef = useRef({ synth: synthProfile, bass: bassProfile });

  // Keep refs in sync
  useEffect(() => { gridsRef.current = { drum: drumGrid, synth: synthGrid, bass: bassGrid }; }, [drumGrid, synthGrid, bassGrid]);
  useEffect(() => { volRef.current = volumes; }, [volumes]);
  useEffect(() => { profileRef.current = { synth: synthProfile, bass: bassProfile }; }, [synthProfile, bassProfile]);

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
    <div className="min-h-screen px-3 py-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-center mb-2">
        <SacredSymbol id="signal" className="w-16 h-16" />
      </div>
      <div className="text-center mb-4">
        <h1 className="font-body text-xl text-cream">Send a Signal</h1>
        <p className="font-mono text-[9px] text-cream-dim/40 tracking-[4px] uppercase mt-1">Design something. Then hit play.</p>
      </div>

      {/* Navigation back */}
      <div className="flex justify-between items-center mb-3">
        <Link href="/" className="font-mono text-[9px] text-cream-dim/30 tracking-wider hover:text-[var(--gold)] transition-colors">← Back</Link>
        <Link href="/gallery" className="font-mono text-[9px] text-cream-dim/30 tracking-wider hover:text-[var(--gold)] transition-colors">Signal Archive →</Link>
      </div>

      {/* Transport */}
      <div className="flex items-center gap-2 mb-3 p-2 bg-surface rounded-lg border border-cream-ghost flex-wrap">
        <button onClick={handlePlay} className={`font-mono text-[10px] tracking-wider uppercase px-3 py-1.5 rounded border transition-all ${playing ? 'text-[var(--gold)] border-[var(--gold-dim)] bg-[var(--gold-ghost)]' : 'text-cream border-cream-ghost'}`}>Play</button>
        <button onClick={handleStop} className="font-mono text-[10px] tracking-wider uppercase px-3 py-1.5 rounded border border-cream-ghost text-cream">Stop</button>
        <button onClick={handleClear} className="font-mono text-[10px] tracking-wider uppercase px-3 py-1.5 rounded border border-cream-ghost text-cream">Clear</button>
        <div className="flex items-center gap-1 ml-auto">
          <span className="font-mono text-[9px] text-cream-dim tracking-wider">BPM</span>
          <input type="range" min="60" max="180" value={bpm} step="1" onChange={(e) => handleBpm(+e.target.value)} className="w-16 accent-[var(--gold)]" />
          <span className="font-mono text-[11px] text-[var(--gold)] min-w-[28px]">{bpm}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mb-1.5">
        {[
          { id: 'drums', label: 'DRUMS', color: '#D85A30' },
          { id: 'synth', label: 'SYNTH', color: '#d4ac54' },
          { id: 'bass', label: 'BASS', color: '#5DCAA5' },
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
                className={`font-mono text-[9px] px-2.5 py-0.5 rounded-full border transition-all ${synthProfile === p ? 'text-[var(--gold)] border-[var(--gold-dim)] bg-[var(--gold-ghost)]' : 'text-cream-dim/50 border-cream-ghost'}`}>
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
                className={`font-mono text-[9px] px-2.5 py-0.5 rounded-full border transition-all ${bassProfile === p ? 'text-[#5DCAA5] border-[#5DCAA580] bg-[#5DCAA508]' : 'text-cream-dim/50 border-cream-ghost'}`}>
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

      {/* Bottom bar — pad + faders */}
      <div className="flex items-center gap-3 mt-3 p-2 bg-surface rounded-lg border border-cream-ghost flex-wrap">
        <button onClick={handlePad} className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full border transition-all ${padActive ? 'bg-[#7F77DD] border-[#7F77DD]' : 'border-cream-ghost'}`} />
          <span className="font-mono text-[10px] text-cream-soft tracking-wider">PAD</span>
        </button>
        <div className="flex gap-2 ml-auto">
          {[
            { key: 'dr', label: 'DRM' },
            { key: 'sy', label: 'SYN' },
            { key: 'ba', label: 'BAS' },
            { key: 'pd', label: 'PAD' },
          ].map(f => (
            <div key={f.key} className="flex flex-col items-center gap-0.5">
              <input type="range" min="0" max="100" value={volumes[f.key]} step="1"
                onChange={(e) => setVolumes(prev => ({ ...prev, [f.key]: +e.target.value }))}
                className="w-11 accent-[var(--gold)]" />
              <span className="font-mono text-[8px] text-cream-dim/40 tracking-wider">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      {!saved ? (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
            className="flex-1 min-w-[120px] bg-cream/5 border border-cream-ghost rounded-md px-3 py-1.5 text-cream font-body text-[12px] outline-none" />
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

      {/* Social links */}
      <div className="flex justify-center gap-5 mt-6 mb-4">
        {[
          { label: 'GitHub', href: 'https://github.com/BlueBlaze6335' },
          { label: 'LinkedIn', href: '#' },
          { label: 'Scholar', href: '#' },
          { label: 'Email', href: 'mailto:pbanerjee0801@gmail.com' },
        ].map(l => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
            className="font-mono text-[10px] text-cream-dim tracking-wider uppercase hover:text-[var(--gold)] transition-colors">
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}


