'use client';

// Per-visitor musical identity. Each visitor gets a deterministic
// chord progression + mode, keyed to a localStorage id created on
// first visit. Pings walk that progression across clicks; /studio
// seeds its synth grid from the same progression so hitting Play
// reveals the identity the visitor has been hearing all along.
//
// The eight progressions are classic four-chord walks, one per mode
// family, chosen for distinct emotional colour. They all fit cleanly
// over the portfolio's bass drone regardless of section.
//
// Each chord is represented as an array of semitone offsets from the
// section's root. handlePing plays one tone per click; three tones
// fill a chord; four chords fill a 12-click cycle.

const PROGRESSIONS = [
  {
    key: 'Ionian',
    mood: 'resolute',
    chords: [ [0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12] ],    // I - V - vi - IV
  },
  {
    key: 'Dorian',
    mood: 'pensive',
    chords: [ [0, 3, 7], [5, 9, 12], [2, 5, 9], [7, 10, 14] ],       // i - IV - ii - v
  },
  {
    key: 'Lydian',
    mood: 'dream',
    chords: [ [0, 4, 7], [2, 6, 9], [7, 11, 14], [0, 4, 7] ],        // I - II - V - I
  },
  {
    key: 'Mixolydian',
    mood: 'open-road',
    chords: [ [0, 4, 7], [10, 14, 17], [5, 9, 12], [0, 4, 7] ],      // I - bVII - IV - I
  },
  {
    key: 'Phrygian',
    mood: 'nocturnal',
    chords: [ [0, 3, 7], [1, 5, 8], [8, 12, 15], [7, 10, 14] ],      // i - bII - bVI - v
  },
  {
    key: 'Aeolian',
    mood: 'unfinished',
    chords: [ [0, 3, 7], [10, 14, 17], [8, 12, 15], [5, 8, 12] ],    // i - VII - VI - iv
  },
  {
    key: 'Pentatonic',
    mood: 'patient',
    chords: [ [0, 4, 7], [2, 7, 9], [4, 7, 12], [9, 12, 14] ],       // floating pent figures
  },
  {
    key: 'Harmonic minor',
    mood: 'ritual',
    chords: [ [0, 3, 7], [5, 8, 12], [7, 11, 14], [0, 3, 7] ],       // i - iv - V - i (with raised 7)
  },
];

const STORAGE_KEY = 'padmanabha_visitor_id';

function getOrCreateId() {
  if (typeof window === 'undefined') return null;
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch (e) {
    // Private mode / storage disabled — fall back to session stable-ish id.
    return 'session-fallback';
  }
}

// djb2 hash — small, deterministic, good enough for bucketing.
function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

let _cached = null;

export function getVisitorProgression() {
  if (_cached) return _cached;
  const id = getOrCreateId();
  if (!id) return PROGRESSIONS[0];
  const prog = PROGRESSIONS[hash(id) % PROGRESSIONS.length];
  _cached = { ...prog, visitorId: id };
  return _cached;
}

// Click index → semitone offset from section root. Each 3 clicks walks
// one chord's tones; cycles through all four chords every 12 clicks.
export function semitoneForClick(i) {
  const prog = getVisitorProgression();
  const chordIdx = Math.floor(i / 3) % prog.chords.length;
  const toneIdx = i % 3;
  return prog.chords[chordIdx][toneIdx];
}
