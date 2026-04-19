'use client';

import { useEffect, useRef } from 'react';
import { getAnalyser } from '@/lib/audio/engine';

// Frequency-domain histogram footer. ~44 bars across the width, each
// rendered as a vertical gold bar over a dim gold "ghost" track.
// Active state reads from the live AnalyserNode; idle state draws a
// slow breathing band so the strip never looks dead.
//
// Palette: shades of black + gold only. Taller bar = brighter gold.
export default function AudioHistogram({ active = false, height = 72, bars = 44 }) {
  const cvsRef = useRef(null);
  const frame = useRef(null);
  const smoothed = useRef(new Array(bars).fill(0));

  useEffect(() => {
    const cvs = cvsRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const analyser = active ? getAnalyser() : null;
    const buf = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    // Bar layout — computed once per resize. Each bar maps to a range
    // of frequency bins using a mild log curve so bass bars are wider
    // (more bins per bar) and treble bars are narrow. Matches how the
    // ear perceives frequency content.
    const binRanges = [];
    const buildBinRanges = () => {
      binRanges.length = 0;
      if (!analyser) return;
      const total = analyser.frequencyBinCount;
      // Log curve from bin 2 → bin ~512 (skip bin 0, the DC offset)
      const minBin = 2;
      const maxBin = Math.floor(total * 0.6); // ignore the very top end
      for (let i = 0; i < bars; i++) {
        const t0 = i / bars;
        const t1 = (i + 1) / bars;
        // pow(t, 1.8) pushes more bars into the lower-frequency range
        const lo = Math.floor(minBin + (maxBin - minBin) * Math.pow(t0, 1.8));
        const hi = Math.max(lo + 1, Math.floor(minBin + (maxBin - minBin) * Math.pow(t1, 1.8)));
        binRanges.push([lo, hi]);
      }
    };
    buildBinRanges();

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
        cvs.width = w * dpr; cvs.height = h * dpr; ctx.scale(dpr, dpr);
      }
      ctx.clearRect(0, 0, w, h);

      const gap = 2;
      const barW = Math.max(1.5, (w - gap * (bars - 1)) / bars);

      if (analyser && buf) {
        analyser.getByteFrequencyData(buf);
      }

      // Soft horizontal envelope so the strip fades at the edges —
      // keeps the footer feeling like a visual accent, not a banner.
      const envAt = (x) => Math.pow(Math.sin((x / w) * Math.PI), 0.5);

      // Wall-clock time in seconds — used as the phase for idle breathing
      // so the motion rate doesn't depend on frame cadence.
      const timeS = now / 1000;

      for (let i = 0; i < bars; i++) {
        let target;
        if (analyser && buf) {
          const [lo, hi] = binRanges[i];
          let peak = 0;
          for (let j = lo; j < hi; j++) if (buf[j] > peak) peak = buf[j];
          target = peak / 255;
        } else {
          // Idle animation — three overlapping waves at different speeds
          // so the baseline always feels alive. The 2.4 rad/s wave
          // completes one cycle ~2.6 s, the slower ones take 5–7 s, so
          // the row has a shifting, breathing pattern rather than a
          // uniform pulse.
          const t = (i / bars) * Math.PI * 2;
          const breath =
            Math.sin(t * 1.4 + timeS * 2.4) * 0.18 +
            Math.sin(t * 0.55 + timeS * 1.2) * 0.12 +
            Math.sin(t * 2.2 - timeS * 0.8) * 0.06 +
            0.22;
          target = Math.max(0, breath);
        }

        // Slew-limit upward so bars "punch" on beats without jitter,
        // and ease downward for a natural decay.
        const prev = smoothed.current[i];
        const next = target > prev ? prev + (target - prev) * 0.6 : prev + (target - prev) * 0.18;
        smoothed.current[i] = next;

        const x = i * (barW + gap);
        const env = envAt(x + barW / 2);
        const val = next * env;
        const barH = Math.max(1.2, val * h * 0.9);
        const y = h - barH;

        // Ghost track: very dim gold rail at full height so even silent
        // bars read as part of the row.
        ctx.fillStyle = 'rgba(212,172,84,0.06)';
        ctx.fillRect(x, 2, barW, h - 4);

        // Active bar gradient — darker at bottom, brighter at top.
        const grad = ctx.createLinearGradient(x, y, x, h);
        grad.addColorStop(0, `rgba(237, 232, 218, ${Math.min(0.95, 0.35 + val * 1.2)})`); // cream tip
        grad.addColorStop(0.35, `rgba(212, 172, 84, ${Math.min(0.9, 0.25 + val * 1.2)})`);  // gold core
        grad.addColorStop(1, 'rgba(143, 106, 36, 0.15)');                                   // deep gold base
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barW, barH);
      }

      if (!reducedMotion) frame.current = requestAnimationFrame(draw);
    };

    if (reducedMotion) draw(performance.now());
    else frame.current = requestAnimationFrame(draw);

    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [active, bars]);

  return (
    <canvas
      ref={cvsRef}
      aria-hidden="true"
      className="fixed bottom-0 left-0 right-0 z-[5] pointer-events-none"
      style={{ width: '100%', height }}
    />
  );
}
