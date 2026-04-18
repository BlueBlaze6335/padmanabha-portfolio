'use client';

import { useEffect, useRef, useState } from 'react';
import { getAnalyser, isDroneActive } from '@/lib/audio/engine';

// Desktop-only ambient signature. Fills the side real estate on ≥lg
// viewports with the portfolio's literal thesis: a live SNR readout.
// "Noise" = RMS of the audio (the drone is the noise floor), "Signal" =
// peak amplitude above it (pings, transition notes, drum hits).
export default function SNRMeter() {
  const [on, setOn] = useState(false);
  const [snr, setSnr] = useState(null); // dB
  const noiseRef = useRef(0);
  const peakRef = useRef(0);
  const noiseBar = useRef(null);
  const peakBar = useRef(null);
  const frame = useRef(null);

  useEffect(() => {
    // Poll drone state so the meter can appear/disappear without needing
    // to be hoisted into every page's audio toggle handler.
    const id = setInterval(() => setOn(isDroneActive()), 300);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!on) {
      if (frame.current) cancelAnimationFrame(frame.current);
      return;
    }
    const analyser = getAnalyser();
    const buf = new Uint8Array(analyser.fftSize);

    const tick = () => {
      analyser.getByteTimeDomainData(buf);
      // RMS over the window = noise floor metric
      let sumSq = 0, peak = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128; // normalise to [-1, 1]
        sumSq += v * v;
        const a = Math.abs(v);
        if (a > peak) peak = a;
      }
      const rms = Math.sqrt(sumSq / buf.length);

      // Smooth with trailing refs so the bars don't jitter
      noiseRef.current = noiseRef.current * 0.85 + rms * 0.15;
      peakRef.current = peakRef.current * 0.75 + peak * 0.25;

      if (noiseBar.current) noiseBar.current.style.height = `${Math.min(100, noiseRef.current * 260)}%`;
      if (peakBar.current) peakBar.current.style.height = `${Math.min(100, peakRef.current * 140)}%`;

      // SNR in dB, gently smoothed
      if (noiseRef.current > 0.0005) {
        const snrDb = 20 * Math.log10(peakRef.current / noiseRef.current);
        setSnr(Number.isFinite(snrDb) ? Math.round(snrDb) : null);
      } else {
        setSnr(null);
      }

      frame.current = requestAnimationFrame(tick);
    };
    tick();
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [on]);

  if (!on) return null;

  return (
    <div
      aria-hidden="true"
      className="hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-3 pointer-events-none select-none"
    >
      <span className="font-mono text-[8px] tracking-[4px] uppercase text-[var(--gold)]/50">SNR</span>
      <div className="flex items-end gap-1.5 h-28">
        <div className="relative w-[3px] h-full bg-cream-ghost rounded-full overflow-hidden">
          <div ref={noiseBar} className="absolute bottom-0 left-0 w-full bg-cream-dim/50 rounded-full transition-[height] duration-75" style={{ height: '0%' }} />
        </div>
        <div className="relative w-[3px] h-full bg-[var(--gold-ghost)] rounded-full overflow-hidden">
          <div ref={peakBar} className="absolute bottom-0 left-0 w-full bg-[var(--gold)] rounded-full transition-[height] duration-75" style={{ height: '0%' }} />
        </div>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-mono text-[10px] text-[var(--gold)] tracking-wider tabular-nums">
          {snr !== null ? `${snr >= 0 ? '+' : ''}${snr} dB` : '—'}
        </span>
        <span className="font-mono text-[7px] text-cream-dim/40 tracking-[3px] uppercase">signal</span>
      </div>
    </div>
  );
}
