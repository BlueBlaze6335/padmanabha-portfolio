'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

// Client-side "exit" behaviors for a blog post page:
// 1. A prominent fixed back control that always goes to /blog, so the
//    exit route is deterministic regardless of how the visitor arrived.
// 2. Swipe-right on the body → /blog.
// Without this, arriving via a Wavelength card and hitting browser-back
// landed visitors on the homepage Origin section, which felt wrong.
export default function BlogPostNav({ children }) {
  const router = useRouter();
  const touchStart = useRef({ x: 0, y: 0, blocked: false });

  const onTouchStart = (e) => {
    const t = e.target;
    const interactive = t.closest && t.closest('input, textarea, button, a, [data-no-swipe]');
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, blocked: !!interactive };
  };
  const onTouchEnd = (e) => {
    if (touchStart.current.blocked) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && dx > 60) router.push('/blog');
  };

  // Wavelength card navigation + Hello-World was occasionally producing
  // weird history entries on some mobile browsers. Ensure Escape also
  // routes cleanly for keyboard users.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') router.push('/blog'); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="min-h-screen relative select-text"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Fixed, visible exit to /blog — deterministic no matter how you
          arrived. Matches journey's back-arrow styling. */}
      <Link
        href="/blog"
        aria-label="Back to all posts"
        className="pill fixed top-3 left-3 z-50"
      >
        <span aria-hidden="true">‹</span>
        <span>All posts</span>
      </Link>
      {children}
    </div>
  );
}
