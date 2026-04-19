'use client';

import { useEffect, useRef } from 'react';
import { getAnalyser, getAudioContext } from '@/lib/audio/engine';

// Real-time spectrum analyser footer: X = frequency, Y = magnitude.
// Shades of black and gold only.
//
// Two modes, auto-switched by signal energy:
// 1) WHEN ANYTHING IS PLAYING (drone / DAW / pings) — draws the live
//    FFT from the AnalyserNode. What you see is what's playing.
// 2) WHEN SILENT — draws a synthetic spectrum keyed to `note` (the
//    section's parent frequency): a fundamental peak plus harmonics.
//    So Origin (C2) idles with a low-left peak, Studio (C3) peaks
//    slightly rightward. Gentle shimmer so it never feels static.
export default function AudioHistogram({ note = 130.81, height = 72, bars = 44 }) {
  const cvsRef = useRef(null);
  const frame = useRef(null);
  const smoothed = useRef(new Array(bars).fill(0));

  useEffect(() => {
    const cvs = cvsRef.current;
    if (!cvs) return;
    const ctx2d = cvs.getContext('2d');
    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Always tap the analyser. If the AudioContext doesn't exist yet,
    // getAnalyser will create it in suspended state — analyser still
    // returns zero bytes until the first user gesture, which flows
    // naturally through our energy-threshold switch to the idle mode.
    const analyser = getAnalyser();
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const sampleRate = (() => {
      try { return getAudioContext().sampleRate; } catch { return 48000; }
    })();

    // Map each bar to a range of frequency bins using a mild log curve
    // so low frequencies get more bars — matches perception and puts
    // the drone fundamentals (60–260 Hz) on the left third of the
    // display instead of crammed into bin 1.
    const binRanges = [];
    const binCenterHz = [];
    const minBin = 1;                                      // skip DC (bin 0)
    const maxBin = Math.floor(analyser.frequencyBinCount * 0.55);
    for (let i = 0; i < bars; i++) {
      const t0 = i / bars;
      const t1 = (i + 1) / bars;
      const lo = Math.floor(minBin + (maxBin - minBin) * Math.pow(t0, 1.9));
      const hi = Math.max(lo + 1, Math.floor(minBin + (maxBin - minBin) * Math.pow(t1, 1.9)));
      binRanges.push([lo, hi]);
      const centerBin = (lo + hi) / 2;
      binCenterHz.push(centerBin * sampleRate / analyser.fftSize);
    }

    // Note profile: gaussian weights per bar around the fundamental,
    // octave, perfect fifth, and fifth-above-octave. This is what the
    // spectrum "would look like" when only the section's drone plays
    // at a whisper — we use it as the idle baseline.
    const noteProfile = (() => {
      const peaks = [
        { hz: note,           amp: 0.95 },
        { hz: note * 2,       amp: 0.60 },
        { hz: note * 1.49831, amp: 0.35 }, // perfect 5th
        { hz: note * 3,       amp: 0.28 },
        { hz: note * 4,       amp: 0.18 },
      ];
      return binCenterHz.map((cf) => {
        let w = 0;
        for (const p of peaks) {
          const bandwidth = Math.max(18, p.hz * 0.18);
          const d = (cf - p.hz) / bandwidth;
          w = Math.max(w, p.amp * Math.exp(-d * d));
        }
        return w;
      });
    })();

    let lastDrawAt = 0;
    const minFrameMs = 33; // ~30 Hz

    const draw = (now) => {
      if (now - lastDrawAt < minFrameMs) {
        if (!reducedMotion) frame.current = requestAnimationFrame(draw);
        return;
      }
      lastDrawAt = now;

      const dpr = window.devicePixelRatio || 1;
      const w = cvs.clientWidth;
      const h = cvs.clientHeight;
      if (cvs.width !== w * dpr) {
        cvs.width = w * dpr; cvs.height = h * dpr; ctx2d.scale(dpr, dpr);
      }
      ctx2d.clearRect(0, 0, w, h);

      analyser.getByteFrequencyData(buf);

      // Crossfade between real-FFT and idle note-profile based on how
      // much energy is actually hitting the analyser. Below -60 dBFS
      // → full idle; above -36 dBFS → full live.
      let totalEnergy = 0;
      for (let i = 2; i < 64; i++) totalEnergy += buf[i]; // low/mid band is enough to detect
      const liveMix = Math.min(1, Math.max(0, (totalEnergy - 120) / 900));

      const timeS = now / 1000;
      const gap = 2;
      const barW = Math.max(1.5, (w - gap * (bars - 1)) / bars);
      const envAt = (x) => Math.pow(Math.sin((x / w) * Math.PI), 0.55);

      for (let i = 0; i < bars; i++) {
        // Real FFT value for this bar
        const [lo, hi] = binRanges[i];
        let peak = 0;
        for (let j = lo; j < hi; j++) if (buf[j] > peak) peak = buf[j];
        const live = peak / 255;

        // Idle note-keyed value with subtle shimmer — 3 waves so the
        // fundamental peak gently breathes instead of sitting still.
        const shimmer =
          1
          + Math.sin(timeS * 1.8 + i * 0.22) * 0.18
          + Math.sin(timeS * 0.9 - i * 0.11) * 0.12;
        const idle = noteProfile[i] * shimmer * 0.32;

        const target = live * liveMix + idle * (1 - liveMix);

        const prev = smoothed.current[i];
        const next = target > prev
          ? prev + (target - prev) * 0.6   // fast attack
          : prev + (target - prev) * 0.18; // slow release
        smoothed.current[i] = next;

        const x = i * (barW + gap);
        const env = envAt(x + barW / 2);
        const val = next * env;
        const barH = Math.max(1.2, val * h * 0.92);
        const y = h - barH;

        // Ghost rail at full height so every bar reads even when silent.
        ctx2d.fillStyle = 'rgba(212,172,84,0.06)';
        ctx2d.fillRect(x, 2, barW, h - 4);

        // Active bar: cream tip → gold → deep gold base gradient.
        const grad = ctx2d.createLinearGradient(x, y, x, h);
        grad.addColorStop(0,    `rgba(237, 232, 218, ${Math.min(0.95, 0.3 + val * 1.1)})`);
        grad.addColorStop(0.4,  `rgba(212, 172, 84, ${Math.min(0.9, 0.25 + val * 1.1)})`);
        grad.addColorStop(1,    'rgba(143, 106, 36, 0.15)');
        ctx2d.fillStyle = grad;
        ctx2d.fillRect(x, y, barW, barH);
      }

      if (!reducedMotion) frame.current = requestAnimationFrame(draw);
    };

    if (reducedMotion) draw(performance.now());
    else frame.current = requestAnimationFrame(draw);

    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [note, bars]);

  return (
    <canvas
      ref={cvsRef}
      aria-hidden="true"
      className="fixed bottom-0 left-0 right-0 z-[5] pointer-events-none"
      style={{ width: '100%', height }}
    />
  );
}
