'use client';

import { useEffect, useRef } from 'react';
import { getAnalyser } from '@/lib/audio/engine';

// Live audio spectrum analyzer. X = frequency, Y = magnitude.
// Pure getByteFrequencyData read — bars only move when actual audio
// is flowing through the AnalyserNode. No synthetic idle.
//
// Features:
// - 72 thin bars on a log frequency curve (more bars in the bass)
// - Peak-hold markers that linger above each bar and decay slowly
// - Shades of gold on dark — cream tip → gold body → deep gold base
export default function AudioHistogram({ height = 72, bars = 72 }) {
  const cvsRef = useRef(null);
  const frame = useRef(null);
  const smoothed = useRef(new Array(bars).fill(0));
  const peakHold = useRef(new Array(bars).fill(0));

  useEffect(() => {
    const cvs = cvsRef.current;
    if (!cvs) return;
    const ctx2d = cvs.getContext('2d');
    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const analyser = getAnalyser();
    const buf = new Uint8Array(analyser.frequencyBinCount);

    // Log-frequency bucketing — bass bins spread across more bars so
    // the drone's fundamentals are visible on the left third, and the
    // treble tail is compressed on the right.
    const binRanges = [];
    const minBin = 1;                                       // skip DC
    const maxBin = Math.floor(analyser.frequencyBinCount * 0.55);
    for (let i = 0; i < bars; i++) {
      const t0 = i / bars;
      const t1 = (i + 1) / bars;
      const lo = Math.floor(minBin + (maxBin - minBin) * Math.pow(t0, 2.0));
      const hi = Math.max(lo + 1, Math.floor(minBin + (maxBin - minBin) * Math.pow(t1, 2.0)));
      binRanges.push([lo, hi]);
    }

    let lastDrawAt = 0;
    const minFrameMs = 33; // ~30 Hz

    const draw = (now) => {
      if (now - lastDrawAt < minFrameMs) {
        if (!reducedMotion) frame.current = requestAnimationFrame(draw);
        return;
      }
      const dt = now - lastDrawAt;
      lastDrawAt = now;

      const dpr = window.devicePixelRatio || 1;
      const w = cvs.clientWidth;
      const h = cvs.clientHeight;
      if (cvs.width !== w * dpr) {
        cvs.width = w * dpr; cvs.height = h * dpr; ctx2d.scale(dpr, dpr);
      }
      ctx2d.clearRect(0, 0, w, h);

      analyser.getByteFrequencyData(buf);

      const gap = 1;
      const barW = Math.max(1, (w - gap * (bars - 1)) / bars);
      // Peak-hold decay rate — pixels per second. Slower = peaks linger longer.
      const peakDecay = 55;

      for (let i = 0; i < bars; i++) {
        const [lo, hi] = binRanges[i];
        let peak = 0;
        for (let j = lo; j < hi; j++) if (buf[j] > peak) peak = buf[j];
        const target = peak / 255;

        // Bar smoothing — fast attack, slow release.
        const prev = smoothed.current[i];
        const next = target > prev
          ? prev + (target - prev) * 0.7
          : prev + (target - prev) * 0.18;
        smoothed.current[i] = next;

        // Peak-hold: follows bar up instantly, drops slowly.
        const peakPrev = peakHold.current[i];
        peakHold.current[i] = Math.max(next, peakPrev - (peakDecay / 1000) * (dt / 1));

        const x = i * (barW + gap);
        const val = next;
        const barH = val > 0.001 ? Math.max(1, val * h * 0.95) : 0;
        const y = h - barH;

        // Dim gold ghost rail behind each bar so the row always has
        // visible structure even when all bars are silent.
        ctx2d.fillStyle = 'rgba(212,172,84,0.04)';
        ctx2d.fillRect(x, 1, barW, h - 2);

        // Active bar gradient.
        if (barH > 0) {
          const grad = ctx2d.createLinearGradient(x, y, x, h);
          grad.addColorStop(0,   `rgba(237, 232, 218, ${Math.min(0.95, 0.4 + val * 1.0)})`);
          grad.addColorStop(0.4, `rgba(212, 172, 84, ${Math.min(0.9, 0.35 + val * 1.0)})`);
          grad.addColorStop(1,   'rgba(143, 106, 36, 0.25)');
          ctx2d.fillStyle = grad;
          ctx2d.fillRect(x, y, barW, barH);
        }

        // Peak-hold marker — thin cream line hovering above the bar.
        const peakVal = peakHold.current[i];
        if (peakVal > 0.02) {
          const py = h - Math.max(2, peakVal * h * 0.95);
          ctx2d.fillStyle = `rgba(237, 232, 218, ${Math.min(0.9, 0.3 + peakVal * 1.0)})`;
          ctx2d.fillRect(x, py - 1, barW, 1.2);
        }
      }

      if (!reducedMotion) frame.current = requestAnimationFrame(draw);
    };

    if (reducedMotion) draw(performance.now());
    else frame.current = requestAnimationFrame(draw);

    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [bars]);

  return (
    <canvas
      ref={cvsRef}
      aria-hidden="true"
      className="fixed bottom-0 left-0 right-0 z-[5] pointer-events-none"
      style={{ width: '100%', height }}
    />
  );
}
