'use client';

import { useEffect } from 'react';
import { resumeAudio } from '@/lib/audio/engine';

// Listens for the first user interaction on any page and unlocks the
// AudioContext. resumeAudio() also starts the inaudible ambient source,
// which gives the spectrum analyser continuous signal to render even
// when the visitor hasn't actively turned on the drone. Fires once,
// then detaches.
export default function AudioUnlock() {
  useEffect(() => {
    let done = false;
    const unlock = () => {
      if (done) return;
      done = true;
      try { resumeAudio(); } catch (e) {}
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('touchstart', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('touchstart', unlock, true);
    window.addEventListener('keydown', unlock, true);
    return () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('touchstart', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
  }, []);
  return null;
}
