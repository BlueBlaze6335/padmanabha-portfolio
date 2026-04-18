# padmanabha.ai

An interactive musical portfolio. Nine sections, persistent audio drone, visitor music studio, community gallery.

Built with Next.js 14, Tailwind CSS, Framer Motion, Web Audio API.

## Quick Start

```bash
npm install
cp .env.local.example .env.local  # edit ADMIN_PASSWORD
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Enable audio (♪ button, top right).

## Deploy to Vercel

1. Push to GitHub: `github.com/BlueBlaze6335/padmanabha-portfolio`
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Add environment variable: `ADMIN_PASSWORD` = your password
4. Deploy

### Custom Domain (padmanabha.ai)

1. Buy `padmanabha.ai` from any registrar (Namecheap, Cloudflare, Google)
2. In Vercel → Settings → Domains → Add `padmanabha.ai`
3. Update DNS as instructed (usually 2 records: A + CNAME)
4. SSL is automatic

### Persistent Compositions (Vercel KV)

The visitor gallery uses in-memory storage by default (resets on redeploy). For persistence:

1. In Vercel dashboard → Storage → Create KV Database
2. Connect it to your project (auto-adds env vars)
3. Update `src/app/api/compositions/route.js` — uncomment the KV lines, remove in-memory array

## Architecture

### The Musical Journey (9 sections)

| # | Section | Note | Drone Volume | Content |
|---|---------|------|-------------|---------|
| 1 | Origin | C2 | 100% | Identity, story |
| 2 | The Forge | D2 | 82% | Domains, stack |
| 3 | Transmissions | E2 | 67% | Projects |
| 4 | Resonance | F2 | 55% | Research |
| 5 | Archive | G2 | 44% | Gallery |
| 6 | Frequencies | A2 | 36% | Playlists |
| 7 | Wavelength | B2 | 28% | Blog |
| 8 | Send a Signal | C3 | 15% | Visitor DAW studio |
| 9 | Signal Archive | — | 0% | Visitor gallery |

### Audio Engine (`src/lib/audio/engine.js`)

**Zero-lag architecture:**
- **Look-ahead scheduler**: Schedules notes ~100ms ahead using `audioContext.currentTime`, not `setInterval`. The audio thread handles timing; JS just needs to stay roughly on track.
- **Pre-baked drum buffers**: Kick, snare, hi-hat, crash generated once at init as AudioBuffers. Each hit creates a lightweight `BufferSource` pointing to the shared buffer.
- **Voice pooling**: Max 6 synth voices, 4 bass voices. Oldest voice stolen when cap is hit. No unbounded node creation.
- **Shared distortion curves**: Generated once per distortion amount, cached.

**Sound profiles:**
- Synth: Glass (triangle, bright), Warm (sawtooth, medium), Grit (sawtooth, heavy distortion)
- Bass: Sub (sine, clean), Crunch (sawtooth, crunchy), Fuzz (square, maximum overdrive)

### Pages

- `/` — Main journey (sections 1-7, swipeable)
- `/studio` — Visitor music studio (section 8)
- `/gallery` — Visitor compositions (section 9)
- `/blog` — Blog listing
- `/blog/[slug]` — Individual post
- `/admin` — Password-protected dashboard

## Content Management

All content is file-based. Edit and push — Vercel auto-deploys.

### Blog Posts (`content/blog/`)

```markdown
---
title: "Post Title"
date: "2026-04-20"
tags: ["AI", "music"]
excerpt: "One-line preview."
---

Content in markdown.
```

### Gallery (`content/gallery/items.json` + `public/gallery/`)

```json
{
  "id": 1,
  "src": "/gallery/my-painting.jpg",
  "title": "Painting Title",
  "medium": "Oil on canvas",
  "year": "2024",
  "category": "painting"
}
```

Categories: `painting`, `digital`, `photo`

### Research (`content/research/papers.json`)

Two sections: `myPapers` (your publications) and `recommended` (papers you love).

### Playlists (`content/playlists/playlists.json`)

Replace `"link": "#"` with Spotify/YouTube/Apple Music URLs.

## What to customize

### Your Info
- `src/app/layout.js` → metadata, OG tags, domain
- `src/components/sections/Sections.js` → all section content
- `src/app/studio/page.js` → social links at bottom
- `content/` → all your content files

### Images to add
- `public/gallery/` → your paintings, photos, digital art
- `public/og-image.jpg` → social sharing image (1200×630)
- `public/favicon.ico` → your favicon
- `public/resume.pdf` → downloadable resume

### Links to update
- LinkedIn URL (search for `href: '#'` in section files)
- Google Scholar URL
- Playlist URLs in `content/playlists/playlists.json`

## File Structure

```
content/                  ← Your content (edit these)
  blog/                   ← Markdown posts
  gallery/items.json      ← Gallery metadata
  research/papers.json    ← Papers + recommendations
  playlists/playlists.json
public/                   ← Static assets
  gallery/                ← Your images
src/
  app/
    page.js               ← Main journey (sections 1-7)
    studio/page.js        ← Visitor DAW
    gallery/page.js       ← Visitor compositions
    blog/                 ← Blog pages
    admin/page.js         ← Admin dashboard
    api/                  ← API routes
  components/
    SacredSymbols.js      ← Sacred geometry SVGs
    sections/Sections.js  ← All 7 section components
  lib/
    audio/engine.js       ← Web Audio engine
    content.js            ← Markdown/JSON reader
```

## License

Code: MIT. Content and images: © Padmanabha Banerjee.
