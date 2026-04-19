'use client';

import { useEffect, useState } from 'react';

// Global tap-ripple layer. On every pointerdown anywhere on the page,
// spawns an expanding gold ring centred on the tap point. Rings self-
// expire after ~600 ms. Pointer-events: none so it never intercepts
// any existing handlers — it's pure visual feedback.
//
// Keeps the site feeling responsive even when interactions don't
// otherwise produce a strong visual affordance (section cards,
// symbols, text links, empty space).
export default function TapRipple() {
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    let rid = 0;
    const onTap = (e) => {
      // Ignore non-primary pointers (right-click, middle mouse, etc.)
      if (e.button !== undefined && e.button !== 0) return;
      const x = e.clientX;
      const y = e.clientY;
      if (x == null || y == null) return;
      const id = ++rid;
      setRipples((rs) => [...rs, { id, x, y }]);
      // Remove after the animation finishes.
      setTimeout(() => {
        setRipples((rs) => rs.filter((r) => r.id !== id));
      }, 650);
    };
    window.addEventListener('pointerdown', onTap, { passive: true });
    return () => window.removeEventListener('pointerdown', onTap);
  }, []);

  return (
    <div aria-hidden="true" className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden">
      {ripples.map((r) => (
        <span
          key={r.id}
          className="tap-ripple"
          style={{ left: r.x, top: r.y }}
        />
      ))}
    </div>
  );
}
