'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const login = async () => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass }),
    });
    if (res.ok) setAuthed(true);
    else setError('Wrong password');
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-xs w-full">
          <h1 className="font-body text-2xl text-cream mb-6 text-center">Admin</h1>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="Password" className="w-full bg-cream/5 border border-cream-ghost rounded-lg px-4 py-3 text-cream font-body outline-none mb-3" />
          {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}
          <button onClick={login} className="w-full font-mono text-[10px] tracking-wider uppercase py-3 rounded-lg border border-[var(--gold-dim)] text-[var(--gold)] bg-[var(--gold-ghost)] hover:bg-[var(--gold)]/10 transition-all">
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8 max-w-2xl mx-auto">
      <h1 className="font-body text-2xl text-cream mb-2">Dashboard</h1>
      <p className="font-mono text-[9px] text-cream-dim/40 tracking-wider uppercase mb-8">padmanabha.ai admin</p>

      <div className="grid gap-4">
        <AdminCard title="Gallery" desc="Upload images to public/gallery/ and edit content/gallery/items.json" />
        <AdminCard title="Blog" desc="Add .md files to content/blog/ with frontmatter (title, date, tags, excerpt)" />
        <AdminCard title="Research" desc="Edit content/research/papers.json — myPapers + recommended sections" />
        <AdminCard title="Playlists" desc="Edit content/playlists/playlists.json — add Spotify/YouTube URLs" />
        <AdminCard title="Compositions" desc="Visitor compositions are stored via API. View at /gallery" />
      </div>

      <div className="mt-8 p-4 rounded-lg border border-cream-ghost bg-surface">
        <p className="font-mono text-[9px] text-cream-dim tracking-wider uppercase mb-2">How to update content</p>
        <ol className="font-body text-[13px] text-cream-dim leading-relaxed list-decimal list-inside space-y-1">
          <li>Edit the relevant JSON or markdown file in your repo</li>
          <li>Git push to main branch</li>
          <li>Vercel auto-deploys in ~30 seconds</li>
        </ol>
      </div>

      <div className="mt-8 p-4 rounded-lg border border-[var(--gold-ghost)] bg-[var(--gold-ghost)]">
        <p className="font-mono text-[9px] text-[var(--gold)] tracking-wider uppercase mb-2">Upgrade path</p>
        <p className="font-body text-[13px] text-cream-dim leading-relaxed">
          For a full CMS with image upload UI, connect Vercel Blob storage and build upload endpoints.
          Current setup: git-based content management — edit files, push, deployed.
        </p>
      </div>
    </div>
  );
}

function AdminCard({ title, desc }) {
  return (
    <div className="p-4 rounded-lg border border-cream-ghost bg-surface">
      <h3 className="font-body text-lg text-cream mb-1">{title}</h3>
      <p className="font-body text-[13px] text-cream-dim leading-relaxed">{desc}</p>
    </div>
  );
}
