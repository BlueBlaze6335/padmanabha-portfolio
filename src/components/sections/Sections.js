'use client';

import { useState } from 'react';
import Link from 'next/link';

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
      <p className="font-body text-[clamp(14px,2.5vw,18px)] text-cream-dim/50 italic mb-7">
        Signal in the noise
      </p>
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
const PAPERS = [
  { title: 'Voice Conversion Using Feature Specific Loss Function Based Self-Attentive GAN', venue: 'ICASSP 2023 · Rhodes, Greece', color: '#d4ac54', doi: 'https://doi.org/10.1109/ICASSP49357.2023.10095069' },
  { title: 'FID-RPRGAN-VC: Fréchet Inception Distance Loss based Region-wise Position Normalized Relativistic GAN for Non-Parallel Voice Conversion', venue: 'APSIPA ASC 2023 · Taipei, Taiwan', color: '#5DCAA5', doi: 'https://doi.org/10.1109/APSIPAASC58517.2023.10317438' },
  { title: 'Region Normalized Capsule Network Based GAN for Non-Parallel Voice Conversion', venue: 'SPECOM 2023', color: '#ED93B1', doi: 'https://doi.org/10.1007/978-3-031-48309-7-20' },
  { title: 'An Analysis of Performance Evaluation Metrics for Voice Conversion Models', venue: 'INDICON 2022 · Kochi, India', color: '#8a8474', doi: 'https://doi.org/10.1109/INDICON56171.2022.10040000' },
];

export function Resonance({ onPing }) {
  return (
    <div className="max-w-[520px] mx-auto px-4">
      <h2 className="section-title mb-1">Resonance</h2>
      <p className="mono-label text-cream-dim/40 mb-5">Published work</p>
      <p className="font-body text-[14px] text-cream-dim leading-[1.8] mb-4">
        Papers in voice conversion and speech processing. All with code.
      </p>
      <p className="mono-label text-[var(--gold)]/40 mb-3">Publications</p>
      {PAPERS.map((p, i) => (
        <a key={i} href={p.doi} target="_blank" rel="noopener noreferrer" onClick={() => onPing?.(i)}
          className="block py-3 border-b border-cream-ghost hover:pl-2 transition-all group">
          <div className="font-body text-[13px] text-cream-soft leading-[1.55] group-hover:text-cream transition-colors">{p.title}</div>
          <span className="font-mono text-[9px] tracking-wider mt-1 inline-block" style={{ color: `${p.color}60` }}>{p.venue}</span>
        </a>
      ))}
      <div className="mt-7">
        <p className="mono-label text-[#7c6adb]/50 mb-2">Reading list</p>
        <div className="p-4 rounded-lg border border-[#7F77DD]/10 bg-[#7F77DD]/[0.02]">
          <p className="font-body text-[13px] text-cream-dim leading-[1.7]">
            Papers that shaped my research — each with a note on why it matters. Updated when something hits.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Section 5: Archive ─────────────────────────────────────────
const FILTERS = ['All', 'Painting', 'Photography', 'Digital'];

export function Archive({ onPing }) {
  const [filter, setFilter] = useState('All');
  return (
    <div className="max-w-[560px] mx-auto px-4">
      <h2 className="section-title mb-1">Archive</h2>
      <p className="mono-label text-cream-dim/40 mb-5">Visual · Creative · Memory</p>
      <p className="font-body text-[14px] text-cream-dim leading-[1.8] mb-4">Paintings, photographs, and experiments. Click to expand.</p>
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`font-mono text-[9px] tracking-wider uppercase px-3 py-1 rounded-full border transition-all ${filter === f ? 'text-[var(--gold)] border-[var(--gold-dim)] bg-[var(--gold-ghost)]' : 'text-cream-dim/40 border-cream-ghost hover:text-cream-dim'}`}>{f}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[180,240,160,220,170,200].map((h,i) => (
          <div key={i} onClick={() => onPing?.(i)} className="rounded-md border border-cream-ghost cursor-pointer hover:border-[var(--gold-dim)] hover:scale-[1.02] transition-all overflow-hidden relative group" style={{ height: h, background: `linear-gradient(${120+i*35}deg, rgba(58,45,126,0.15), rgba(212,172,84,0.05))` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#07070dcc] to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <div>
                <p className="font-body text-[12px] text-cream">Untitled {['I','II','III','IV','V','VI'][i]}</p>
                <p className="font-mono text-[8px] text-[var(--gold)]/50 mt-0.5">Your image here</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section 6: Frequencies ─────────────────────────────────────
const PLAYLISTS = [
  { name: 'The Prog Spiral', genre: 'Progressive Rock', artists: 'Tool, Opeth, King Crimson, Porcupine Tree, Dream Theater, Steven Wilson', color: '#d4ac54' },
  { name: 'Raga to Fusion', genre: 'Indian Classical / Fusion', artists: 'Pt. Ravi Shankar, Shakti, Indian Ocean, Zakir Hussain, John McLaughlin', color: '#ED93B1' },
  { name: "Drummer's Bible", genre: 'Various', artists: 'Bonham, Danny Carey, Gavin Harrison, Mike Portnoy, Eloy Casagrande, Mario Duplantier', color: '#D85A30' },
  { name: 'Late Night Jazz', genre: 'Jazz', artists: 'John Coltrane, Miles Davis, Thelonious Monk, Duke Ellington, Buddy Rich', color: '#5DCAA5' },
  { name: 'Bangla Roots', genre: 'Bengali', artists: 'Mohiner Ghoraguli, Warfaze, Fossils, Cactus, Miles, Ashes', color: '#EF9F27' },
  { name: 'Mosh Pit Therapy', genre: 'Metal', artists: 'Gojira, Meshuggah, Lamb of God, Sepultura, Pantera, Slipknot', color: '#E24B4A' },
  { name: 'Guitar Gods', genre: 'Various', artists: 'Jeff Beck, Santana, Joe Satriani, Steve Vai, SRV, Eric Clapton, Slash', color: '#7F77DD' },
  { name: 'Qawwali & Ghazal', genre: 'Devotional', artists: 'Nusrat Fateh Ali Khan, Ghulam Ali, Bhimsen Joshi, Debabrata Biswas', color: '#c9c2ae' },
];

export function Frequencies({ onPing }) {
  return (
    <div className="max-w-[520px] mx-auto px-4">
      <h2 className="section-title mb-1">Frequencies</h2>
      <p className="mono-label text-cream-dim/40 mb-5">What I listen to</p>
      <p className="font-body text-[14px] text-cream-dim leading-[1.8] mb-4">The fuel. What's playing while the models train.</p>
      <div className="flex flex-col gap-1.5">
        {PLAYLISTS.map((p, i) => (
          <button key={i} onClick={() => onPing?.(i)} className="relative text-left rounded-lg border border-cream-ghost px-4 py-3 overflow-hidden transition-all hover:border-[var(--gold-dim)] group">
            <div className="absolute top-0 left-0 right-0 h-[2px] opacity-30 group-hover:opacity-70 transition-opacity" style={{ background: p.color }} />
            <div className="font-body text-[16px] text-cream">{p.name}</div>
            <div className="font-mono text-[9px] tracking-wider uppercase mt-0.5" style={{ color: `${p.color}60` }}>{p.genre}</div>
            <div className="font-body text-[12px] text-cream-dim/45 mt-1 leading-[1.5]">{p.artists}</div>
          </button>
        ))}
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
