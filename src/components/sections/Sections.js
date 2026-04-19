'use client';

import { useState } from 'react';
import Link from 'next/link';
import papersData from '../../../content/research/papers.json';
import playlistsData from '../../../content/playlists/playlists.json';
import galleryItems from '../../../content/gallery/items.json';

// ─── Section 1: Origin ──────────────────────────────────────────
export function Origin() {
  return (
    <div className="text-center px-4 max-w-xl mx-auto">
      <p className="font-mono text-[9px] tracking-[5px] uppercase text-cream-dim/40 mb-4">
        AI/ML Researcher · Builder · Musician
      </p>
      <h1 className="font-body text-[clamp(48px,9vw,80px)] font-normal text-cream tracking-[-2px] leading-none mb-2">
        Padmanabha
      </h1>
      <p className="font-body text-[clamp(14px,2.5vw,18px)] text-cream-dim/50 italic mb-3">
        Signal in the noise
      </p>
      <div className="inline-flex items-center gap-2 mb-7 font-mono text-[9px] tracking-[4px] uppercase text-[var(--gold)]/60">
        <span className="h-px w-6 bg-[var(--gold)]/30" />
        <span>High SNR</span>
        <span className="h-px w-6 bg-[var(--gold)]/30" />
      </div>
      <p className="font-body text-[15px] text-cream-soft leading-[1.9] mb-4 max-w-[460px] mx-auto">
        I build systems that perceive, understand, and generate — voice, video, language, music.
        When I'm not writing code, I'm behind a drum kit, mixing psytrance, painting, or building FPV drones.
      </p>
      <p className="font-body text-[13px] text-cream-dim leading-[1.85] max-w-[440px] mx-auto mb-4">
        Bengali. Tabla player since childhood. Prog rock kid turned researcher.
        Impressionism over abstraction. Bonham over technique.
        Four papers in speech and signal processing. Six deployed systems,
        and a persistent need to build things from scratch.
      </p>
      <p className="font-body text-[11px] text-cream-dim/30 max-w-[380px] mx-auto leading-[1.7]">
        B.Tech ECE · TOEFL 113/120 · NVIDIA Hackathon Finalist ·
        College band vocalist & drummer · Classically trained percussionist
      </p>
    </div>
  );
}

// ─── Section 2: The Forge ───────────────────────────────────────
const DOMAINS = [
  { name: 'Voice conversion & speech synthesis', w: 92, c: '#d4ac54' },
  { name: 'Multimodal video AI & RAG', w: 85, c: '#d4ac54' },
  { name: 'Multi-agent system design', w: 88, c: '#d4ac54' },
  { name: 'Real-time signal processing', w: 78, c: '#5e3ec0' },
  { name: 'Generative models — diffusion, GANs, flow matching', w: 82, c: '#5e3ec0' },
  { name: 'Computer vision & remote sensing', w: 70, c: '#5e3ec0' },
];

const STACK = ['Python','PyTorch','CUDA','TensorFlow','Torchaudio','Librosa','OpenCV','ChromaDB','Docker','GCP','Next.js','Streamlit','C/C++','Embedded C'];

export function Forge({ onPing }) {
  return (
    <div className="max-w-[520px] mx-auto px-4">
      <h2 className="section-title mb-1">The Forge</h2>
      <p className="mono-label text-cream-dim/40 mb-5">Domains · Stack · Knowledge</p>
      <p className="font-body text-[14px] text-cream-dim leading-[1.8] mb-5">
        Where my attention goes, and the tools I shape ideas with.
      </p>
      <p className="mono-label text-[var(--gold)]/50 mb-3">Knowledge domains</p>
      {DOMAINS.map((d, i) => (
        <button key={i} onClick={() => onPing?.(i)} className="relative w-full text-left rounded-md border border-cream-ghost mb-1 px-3 py-2.5 overflow-hidden transition-all hover:border-[var(--gold-dim)] hover:bg-[var(--gold-ghost)] group">
          <div className="absolute left-0 top-0 bottom-0 rounded-l-md opacity-[0.08] group-hover:opacity-[0.15] transition-opacity" style={{ width: `${d.w}%`, background: d.c }} />
          <span className="relative font-body text-[14px] text-cream-soft">{d.name}</span>
        </button>
      ))}
      <p className="mono-label text-cream-dim/35 mt-6 mb-2">Stack</p>
      <div className="flex flex-wrap gap-1.5">
        {STACK.map((s, i) => (
          <button key={s} onClick={() => onPing?.(i)} className="font-mono text-[11px] text-cream-dim px-3 py-1 rounded-full border border-cream-ghost hover:bg-[var(--gold-ghost)] hover:border-[var(--gold-dim)] hover:text-cream-soft transition-all">
            {s}
          </button>
        ))}
      </div>
      <p className="mono-label text-cream-dim/35 mt-6 mb-2">Hardware — The Forge</p>
      <div className="flex flex-wrap gap-2">
        {['i9 14th Gen','64GB DDR5','A6000 48GB','Ubuntu'].map(h => (
          <span key={h} className="font-mono text-[11px] text-[var(--gold)]/40 px-3 py-1 rounded-full border border-[var(--gold-ghost)] bg-[var(--gold-ghost)]">{h}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Section 3: Transmissions ───────────────────────────────────
const PROJECTS = [
  { name: 'ShowGPT', desc: 'Search inside an entire TV show library like you search the web. Multimodal RAG that watches video, indexes every scene, and answers questions with timestamps.', tag: 'Video AI · Deployed', color: '#d4ac54' },
  { name: 'VocosVC', desc: 'Voice that transforms — take one person\'s speech and make it sound like someone else, in real-time, at 48kHz.', tag: 'Voice AI · Active R&D', color: '#D85A30' },
  { name: 'HelixGraph', desc: '22 AI agents collaborating to write full screenplays. Each character carries a 5-dimensional emotional state that evolves across the narrative.', tag: 'Narrative AI', color: '#5DCAA5' },
  { name: 'Convergence', desc: 'A mathematical DJ that uses graph theory to find the optimal path through a set — matching tempo, key, and energy.', tag: 'Music AI', color: '#7F77DD' },
  { name: 'ReelGen', desc: 'Automated crime documentary production — 8 agents handle research, scripting, narration, editing. End to end, in Hinglish.', tag: 'Production AI', color: '#EF9F27' },
];

export function Transmissions({ onPing }) {
  return (
    <div className="max-w-[520px] mx-auto px-4">
      <h2 className="section-title mb-1">Transmissions</h2>
      <p className="mono-label text-cream-dim/40 mb-5">What I ship</p>
      <p className="font-body text-[14px] text-cream-dim leading-[1.8] mb-5">
        Systems I've built and deployed. What they do — not how they work.
      </p>
      {PROJECTS.map((p, i) => (
        <button key={i} onClick={() => onPing?.(i)} className="relative w-full text-left rounded-lg border border-cream-ghost mb-1.5 px-4 py-3.5 overflow-hidden transition-all hover:border-[var(--gold-dim)] hover:bg-[var(--gold-ghost)] group">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg opacity-40 group-hover:opacity-100 transition-opacity" style={{ background: p.color }} />
          <div className="font-body text-[18px] text-cream mb-0.5">{p.name}</div>
          <div className="font-body text-[13px] text-cream-dim leading-[1.6]">{p.desc}</div>
          <span className="font-mono text-[9px] tracking-wider mt-1.5 inline-block px-2 py-0.5 rounded-full" style={{ color: `${p.color}60`, background: `${p.color}08` }}>{p.tag}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Section 4: Resonance ───────────────────────────────────────
// Paper venue hues ladder through the gold family, not random hues, so
// the section reads with the rest of the portfolio.
const PAPER_HUES = ['#d4ac54', '#c9a049', '#b8933f', '#8f6a24'];

// Filter out the seed "Add your recommended papers here" placeholder so
// editing content/research/papers.json with real entries just works,
// and the section degrades gracefully to an empty state otherwise.
const recommendedPapers = (papersData.recommended || []).filter(
  (p) => p && p.title && !/add your recommended papers/i.test(p.title)
);

export function Resonance({ onPing }) {
  const authored = papersData.myPapers || [];
  return (
    <div className="max-w-[520px] mx-auto px-4">
      <h2 className="section-title mb-1">Resonance</h2>
      <p className="mono-label text-cream-dim/40 mb-5">Published work</p>
      <p className="font-body text-[14px] text-cream-dim leading-[1.8] mb-4">
        Papers in voice conversion and speech processing. All with code.
      </p>

      <p className="mono-label text-[var(--gold)]/40 mb-3">Publications</p>
      {authored.map((p, i) => {
        const hue = PAPER_HUES[i % PAPER_HUES.length];
        const venue = [p.venue, p.location].filter(Boolean).join(' · ');
        return (
          <a key={i} href={p.doi || '#'} target="_blank" rel="noopener noreferrer" onClick={() => onPing?.(i)}
            className="block py-3 border-b border-cream-ghost hover:pl-2 transition-all group">
            <div className="font-body text-[13px] text-cream-soft leading-[1.55] group-hover:text-cream transition-colors">{p.title}</div>
            {p.authors && (
              <div className="font-mono text-[9px] text-cream-dim/45 tracking-wider mt-1">{p.authors}</div>
            )}
            <span className="font-mono text-[9px] tracking-wider mt-1 inline-block" style={{ color: `${hue}99` }}>{venue}</span>
          </a>
        );
      })}

      <div className="mt-7">
        <p className="mono-label text-[var(--gold)]/40 mb-3">Reading list</p>
        {recommendedPapers.length > 0 ? (
          <div className="flex flex-col gap-0">
            {recommendedPapers.map((p, i) => (
              <a key={i} href={p.link || '#'} target="_blank" rel="noopener noreferrer" onClick={() => onPing?.(authored.length + i)}
                className="block py-3 border-b border-cream-ghost hover:pl-2 transition-all group">
                <div className="font-body text-[13px] text-cream-soft leading-[1.55] group-hover:text-cream transition-colors">{p.title}</div>
                {p.authors && (
                  <div className="font-mono text-[9px] text-cream-dim/45 tracking-wider mt-1">{p.authors}{p.year ? ` · ${p.year}` : ''}{p.field ? ` · ${p.field}` : ''}</div>
                )}
                {p.why && (
                  <p className="font-body text-[12px] text-cream-dim/70 italic leading-[1.55] mt-1.5">"{p.why}"</p>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-cream-ghost bg-surface">
            <p className="font-body text-[13px] text-cream-dim/70 leading-[1.7]">
              Papers that shaped my thinking — curated slowly, linked out when something hits. Coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section 5: Archive ─────────────────────────────────────────
const CATEGORY_FILTERS = ['All', 'painting', 'photography', 'digital'];

// Treat single-placeholder items.json as empty.
const realGalleryItems = (galleryItems || []).filter(
  (it) => it && it.src && !/placeholder\.jpg$/i.test(it.src) && !/^your/i.test(it.title || '')
);

export function Archive({ onPing }) {
  const [filter, setFilter] = useState('All');
  const visible = filter === 'All'
    ? realGalleryItems
    : realGalleryItems.filter((it) => (it.category || '').toLowerCase() === filter);
  const heights = [180, 240, 160, 220, 170, 200];

  return (
    <div className="max-w-[560px] mx-auto px-4">
      <h2 className="section-title mb-1">Archive</h2>
      <p className="mono-label text-cream-dim/40 mb-5">Visual · Creative · Memory</p>
      <p className="font-body text-[14px] text-cream-dim leading-[1.8] mb-4">Paintings, photographs, and experiments. Click to expand.</p>
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {CATEGORY_FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? 'chip-active' : ''}`}>{f}</button>
        ))}
      </div>
      {visible.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {visible.map((it, i) => (
            <a
              key={it.id || i}
              href={it.src}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onPing?.(i)}
              className="rounded-md border border-cream-ghost cursor-pointer hover:border-[var(--gold-dim)] hover:scale-[1.02] transition-all overflow-hidden relative group block"
              style={{ height: heights[i % heights.length], backgroundImage: `url(${it.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#07070dcc] to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <div>
                  <p className="font-body text-[12px] text-cream">{it.title}</p>
                  <p className="font-mono text-[8px] text-[var(--gold)]/60 mt-0.5">{[it.medium, it.year].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        // Empty state mirrors the grid's visual rhythm so the section
        // doesn't collapse when items.json hasn't been populated yet.
        <div className="grid grid-cols-3 gap-1.5">
          {heights.map((h, i) => (
            <div key={i} onClick={() => onPing?.(i)} className="rounded-md border border-cream-ghost/60 cursor-pointer hover:border-[var(--gold-dim)] transition-all overflow-hidden relative group" style={{ height: h, background: `linear-gradient(${120+i*35}deg, rgba(58,45,126,0.08), rgba(212,172,84,0.04))` }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-[8px] text-[var(--gold)]/30 tracking-[3px] uppercase">Soon</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {realGalleryItems.length === 0 && (
        <p className="mt-3 font-mono text-[9px] text-cream-dim/30 tracking-wider uppercase text-center">
          Images being curated
        </p>
      )}
    </div>
  );
}

// ─── Section 6: Frequencies ─────────────────────────────────────
// Cycle a gold-family ladder so playlist accents stay on-palette.
const PLAYLIST_HUES = ['#d4ac54', '#c9a049', '#b8933f', '#a07e2e', '#8f6a24', '#c9c2ae', '#ede8da', '#8a8474'];

export function Frequencies({ onPing }) {
  const playlists = playlistsData || [];
  return (
    <div className="max-w-[520px] mx-auto px-4">
      <h2 className="section-title mb-1">Frequencies</h2>
      <p className="mono-label text-cream-dim/40 mb-5">What I listen to</p>
      <p className="font-body text-[14px] text-cream-dim leading-[1.8] mb-4">The fuel. What's playing while the models train.</p>
      <div className="flex flex-col gap-1.5">
        {playlists.map((p, i) => {
          const hue = PLAYLIST_HUES[i % PLAYLIST_HUES.length];
          const hasLink = p.link && p.link !== '#';
          const handleClick = (e) => {
            onPing?.(i);
            // If no real link, suppress the <a> default so we don't nav to "#"
            if (!hasLink) e.preventDefault();
          };
          const inner = (
            <>
              <div className="absolute top-0 left-0 right-0 h-[2px] opacity-30 group-hover:opacity-70 transition-opacity" style={{ background: hue }} />
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-body text-[16px] text-cream">{p.title || p.name}</div>
                {hasLink && (
                  <span className="font-mono text-[8px] tracking-wider uppercase text-[var(--gold)]/50 shrink-0">Open ↗</span>
                )}
              </div>
              <div className="font-mono text-[9px] tracking-wider uppercase mt-0.5" style={{ color: `${hue}99` }}>{p.genre}</div>
              <div className="font-body text-[12px] text-cream-dim/45 mt-1 leading-[1.5]">{p.artists}</div>
            </>
          );
          return (
            <a
              key={i}
              href={hasLink ? p.link : '#'}
              target={hasLink ? '_blank' : undefined}
              rel={hasLink ? 'noopener noreferrer' : undefined}
              onClick={handleClick}
              className="relative block rounded-lg border border-cream-ghost px-4 py-3 overflow-hidden transition-all hover:border-[var(--gold-dim)] group"
            >
              {inner}
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section 7: Wavelength ──────────────────────────────────────
const POSTS = [
  { title: 'Hello, World', date: 'April 2026', preview: 'First post. Why this site exists, what I plan to write about, and what "signal in the noise" means to me.', tags: ['meta'], slug: 'hello-world' },
  { title: 'On building things that listen', date: 'Coming soon', preview: 'What voice conversion taught me about perception, identity, and the gap between hearing and understanding.', tags: ['AI', 'philosophy'] },
  { title: "The drummer's approach to system design", date: 'Coming soon', preview: 'Polyrhythms, groove, and why the best architectures feel like a Bonham fill.', tags: ['music', 'engineering'] },
  { title: 'Why Van Gogh understood neural networks', date: 'Coming soon', preview: 'Expressionism as a compression algorithm.', tags: ['art', 'AI'] },
];

export function Wavelength({ onPing }) {
  return (
    <div className="max-w-[520px] mx-auto px-4">
      <h2 className="section-title mb-1">Wavelength</h2>
      <p className="mono-label text-cream-dim/40 mb-5">Writing · Thinking</p>
      <p className="font-body text-[14px] text-cream-dim leading-[1.8] mb-3">
        Technical deep-dives, philosophical tangents, and whatever else needs writing down.
      </p>
      {POSTS.map((p, i) => {
        const inner = (
          <>
            <span className="mono-label text-cream-dim/35">{p.date}</span>
            <h3 className="font-body text-[20px] font-normal text-cream my-1 group-hover:text-[var(--gold)] transition-colors">{p.title}</h3>
            {p.preview && <p className="font-body text-[13px] text-cream-dim leading-[1.6]">{p.preview}</p>}
            <div className="mt-1.5 flex gap-1">
              {p.tags.map(t => (
                <span key={t} className="font-mono text-[8px] tracking-wider uppercase text-[var(--gold)]/30 px-2 py-0.5 rounded-full bg-[var(--gold-ghost)]">{t}</span>
              ))}
            </div>
          </>
        );
        return p.slug ? (
          <Link key={i} href={`/blog/${p.slug}`} onClick={() => onPing?.(i)} className="block py-4 border-b border-cream-ghost hover:pl-2 transition-all group">
            {inner}
          </Link>
        ) : (
          <div key={i} onClick={() => onPing?.(i)} className="py-4 border-b border-cream-ghost cursor-pointer group">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
