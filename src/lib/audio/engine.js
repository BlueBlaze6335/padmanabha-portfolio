/**
 * Audio Engine — padmanabha.ai
 * 
 * Architecture:
 * 1. Look-ahead scheduler (not setInterval) — schedules notes ~100ms ahead using audioContext.currentTime
 * 2. Pre-baked drum buffers — generated once at init, reused via lightweight BufferSource
 * 3. Voice pooling — fixed pool of synth/bass voices, oldest stolen when cap hit
 * 4. Drone engine — sustained filtered pad with exponential volume decay across sections
 * 
 * Memory: fixed ceiling, no per-note allocation, no GC pauses
 */

// ─── Singleton Context ──────────────────────────────────────────
let _ctx = null;
let _master = null;

let _analyser = null;

// Mobile detection: disables expensive DSP features (waveshaper 2x
// oversample) where phone speakers can't render the difference anyway.
// Kept lazy so SSR doesn't touch window.
let _isMobileCached = null;
function isMobile() {
  if (_isMobileCached !== null) return _isMobileCached;
  if (typeof window === 'undefined') return false;
  _isMobileCached = window.matchMedia?.('(max-width: 768px)').matches === true;
  return _isMobileCached;
}

export function getAudioContext() {
  if (_ctx) return _ctx;
  _ctx = new (window.AudioContext || window.webkitAudioContext)();
  // Chain: sources → master(hot) → compressor(soft-knee, moderate ratio,
  // with built-in limiting headroom via low threshold + high ratio)
  // → makeup (+6 dB) → destination. The older build stacked a second
  // DynamicsCompressor as a brickwall; dropping it saves meaningful CPU
  // on mobile without perceptible audible change — the single
  // compressor already rides hard enough to prevent DAC clipping.
  _master = _ctx.createGain();
  _master.gain.value = 2.5;

  const comp = _ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 4;
  comp.ratio.value = 10;
  comp.attack.value = 0.003;
  comp.release.value = 0.2;

  const makeup = _ctx.createGain();
  makeup.gain.value = 1.8;

  // Smaller fftSize = 4x less data to read per frame for the waveform.
  // 1024 still gives ~22ms window at 48kHz — plenty for visualisation.
  _analyser = _ctx.createAnalyser();
  _analyser.fftSize = 1024;
  _analyser.smoothingTimeConstant = 0.85;

  _master.connect(comp);
  comp.connect(makeup);
  makeup.connect(_analyser);
  makeup.connect(_ctx.destination);
  return _ctx;
}

export function getAnalyser() {
  if (!_analyser) getAudioContext();
  return _analyser;
}

// ─── Shared delay sends ─────────────────────────────────────────
// One delay loop per profile, created lazily. Voices connect their
// envelope output to the shared input; no per-note delay allocation.
// This alone eliminates ~30 node allocations per second at 120 BPM
// with a few synth/bass steps active — the primary cracking culprit.
const _delayBuses = new Map();
function getDelayBus(profile, delTime, delFb, wet = 0.22) {
  const key = `${delTime}|${delFb}`;
  const existing = _delayBuses.get(key);
  if (existing) return existing;
  const ctx = getAudioContext();
  const input = ctx.createGain();
  input.gain.value = wet;
  const del = ctx.createDelay(0.5);
  del.delayTime.value = delTime;
  const fb = ctx.createGain();
  fb.gain.value = delFb;
  input.connect(del);
  del.connect(fb);
  fb.connect(del);
  del.connect(getMaster());
  const bus = { input };
  _delayBuses.set(key, bus);
  return bus;
}

export function getMaster() {
  if (!_master) getAudioContext();
  return _master;
}

export function resumeAudio() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ─── Distortion Curve (shared) ──────────────────────────────────
const _distCurves = {};
function getDistortionCurve(amount) {
  const key = Math.round(amount);
  if (_distCurves[key]) return _distCurves[key];
  const n = 8192;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  _distCurves[key] = curve;
  return curve;
}

// ─── Pre-baked Drum Buffers ─────────────────────────────────────
let _drumBuffers = null;

export function initDrumBuffers() {
  if (_drumBuffers) return _drumBuffers;
  const ctx = getAudioContext();
  const sr = ctx.sampleRate;

  // Kick: sine sweep 160→40Hz + transient noise burst
  const kickLen = Math.floor(sr * 0.45);
  const kickBuf = ctx.createBuffer(1, kickLen, sr);
  const kickData = kickBuf.getChannelData(0);
  for (let i = 0; i < kickLen; i++) {
    const t = i / sr;
    const freq = 160 * Math.exp(-t * 25);
    const sine = Math.sin(2 * Math.PI * freq * t);
    const env = Math.exp(-t * 8);
    const noise = (i < sr * 0.015) ? (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.003)) * 0.4 : 0;
    kickData[i] = (sine * env * 0.85 + noise) * 0.9;
  }

  // Snare: triangle tone + bandpass noise
  const snareLen = Math.floor(sr * 0.15);
  const snareBuf = ctx.createBuffer(1, snareLen, sr);
  const snareData = snareBuf.getChannelData(0);
  for (let i = 0; i < snareLen; i++) {
    const t = i / sr;
    const tone = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 30) * 0.4;
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 15) * 0.55;
    snareData[i] = tone + noise;
  }

  // Hi-hat: highpass noise burst
  const hhLen = Math.floor(sr * 0.05);
  const hhBuf = ctx.createBuffer(1, hhLen, sr);
  const hhData = hhBuf.getChannelData(0);
  let hhPrev = 0;
  for (let i = 0; i < hhLen; i++) {
    const raw = (Math.random() * 2 - 1) * Math.exp(-i / (hhLen * 0.12));
    // Simple highpass: output = current - previous
    hhData[i] = (raw - hhPrev) * 0.7;
    hhPrev = raw;
  }

  // Crash: long filtered noise
  const crashLen = Math.floor(sr * 0.7);
  const crashBuf = ctx.createBuffer(1, crashLen, sr);
  const crashData = crashBuf.getChannelData(0);
  let crPrev = 0;
  for (let i = 0; i < crashLen; i++) {
    const raw = (Math.random() * 2 - 1) * Math.exp(-i / (crashLen * 0.35));
    crashData[i] = (raw - crPrev) * 0.5;
    crPrev = raw;
  }

  _drumBuffers = { kick: kickBuf, snare: snareBuf, hh: hhBuf, crash: crashBuf };
  return _drumBuffers;
}

export function playDrumHit(type, time, volume = 0.8) {
  const ctx = getAudioContext();
  const bufs = initDrumBuffers();
  const buf = bufs[type];
  if (!buf) return;

  const source = ctx.createBufferSource();
  source.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(getMaster());
  source.start(time);
}

// ─── Synth Voice Pool ───────────────────────────────────────────
const SYNTH_PROFILES = {
  glass:  { wave: 'triangle', dist: 20,  fStart: 400, fPeak: 3000, fEnd: 600, q: 3,  atk: 0.02, dur: 1.8, detune: 1.002, delTime: 0.25, delFb: 0.3 },
  warm:   { wave: 'sawtooth', dist: 70,  fStart: 200, fPeak: 1600, fEnd: 300, q: 5,  atk: 0.04, dur: 1.8, detune: 1.005, delTime: 0.16, delFb: 0.18 },
  grit:   { wave: 'sawtooth', dist: 150, fStart: 150, fPeak: 1200, fEnd: 200, q: 8,  atk: 0.02, dur: 1.4, detune: 1.008, delTime: 0.12, delFb: 0.1 },
};

const BASS_PROFILES = {
  sub:    { wave: 'sine',     dist: 10,  fStart: 80,  fPeak: 300,  fEnd: 80,  q: 2,  atk: 0.02, dur: 1.5, hasSub: false },
  crunch: { wave: 'sawtooth', dist: 100, fStart: 100, fPeak: 700,  fEnd: 120, q: 8,  atk: 0.03, dur: 1.5, hasSub: true },
  fuzz:   { wave: 'square',   dist: 200, fStart: 80,  fPeak: 500,  fEnd: 100, q: 10, atk: 0.02, dur: 1.2, hasSub: true },
};

export { SYNTH_PROFILES, BASS_PROFILES };

// Voice pool: lower caps than before (6→4 synth, 4→2 bass) — on phones
// the old caps + full per-voice graphs crushed the audio thread.
const MAX_SYNTH_VOICES = 4;
const MAX_BASS_VOICES = 2;
let _synthVoices = [];
let _bassVoices = [];

// Oversample 2x is inaudible on phone speakers but doubles waveshaper
// DSP cost — turn it off on mobile viewports.
const SHAPER_OVERSAMPLE = () => (isMobile() ? 'none' : '2x');

export function playSynthNote(freq, time, volume = 0.7, profileName = 'warm') {
  const ctx = getAudioContext();
  const P = SYNTH_PROFILES[profileName] || SYNTH_PROFILES.warm;

  // Steal oldest voice if at cap
  if (_synthVoices.length >= MAX_SYNTH_VOICES) {
    const old = _synthVoices.shift();
    try { old.o1.stop(time); old.o2.stop(time); } catch (e) {}
    // Explicit disconnect so the subgraph releases immediately
    try { old.tail.disconnect(); } catch (e) {}
  }

  const o1 = ctx.createOscillator();
  o1.type = P.wave;
  o1.frequency.setValueAtTime(freq, time);
  const o2 = ctx.createOscillator();
  o2.type = P.wave;
  o2.frequency.setValueAtTime(freq * P.detune, time);

  const ws = ctx.createWaveShaper();
  ws.curve = getDistortionCurve(P.dist);
  ws.oversample = SHAPER_OVERSAMPLE();

  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.Q.value = P.q;
  filt.frequency.setValueAtTime(P.fStart, time);
  filt.frequency.exponentialRampToValueAtTime(P.fPeak, time + P.atk + 0.04);
  filt.frequency.exponentialRampToValueAtTime(P.fEnd, time + P.dur * 0.8);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.001, time);
  env.gain.exponentialRampToValueAtTime(0.1 * volume, time + P.atk);
  env.gain.exponentialRampToValueAtTime(0.001, time + P.dur);

  o1.connect(ws);
  o2.connect(ws);
  ws.connect(filt);
  filt.connect(env);
  env.connect(getMaster());
  // Shared delay send instead of per-voice delay nodes — the big win
  env.connect(getDelayBus(profileName, P.delTime, P.delFb, 0.22).input);

  const stop = time + P.dur + 0.4;
  o1.start(time);
  o2.start(time);
  o1.stop(stop);
  o2.stop(stop);

  // Keep a reference to the tail of the dry chain so we can disconnect
  // it when the voice is stolen or aged out — helps the GC.
  const voice = { o1, o2, stop, tail: env };
  _synthVoices.push(voice);
  setTimeout(() => {
    _synthVoices = _synthVoices.filter(v => v !== voice);
    try { env.disconnect(); } catch (e) {}
    try { filt.disconnect(); } catch (e) {}
    try { ws.disconnect(); } catch (e) {}
  }, (P.dur + 0.5) * 1000);
}

export function playBassNote(freq, time, volume = 0.75, profileName = 'crunch') {
  const ctx = getAudioContext();
  const P = BASS_PROFILES[profileName] || BASS_PROFILES.crunch;

  if (_bassVoices.length >= MAX_BASS_VOICES) {
    const old = _bassVoices.shift();
    try { old.o.stop(time); if (old.sub) old.sub.stop(time); } catch (e) {}
    try { old.tail.disconnect(); } catch (e) {}
  }

  const o = ctx.createOscillator();
  o.type = P.wave;
  o.frequency.setValueAtTime(freq, time);

  const ws = ctx.createWaveShaper();
  ws.curve = getDistortionCurve(P.dist);
  ws.oversample = SHAPER_OVERSAMPLE();

  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.Q.value = P.q;
  filt.frequency.setValueAtTime(P.fStart, time);
  filt.frequency.exponentialRampToValueAtTime(P.fPeak, time + P.atk + 0.03);
  filt.frequency.exponentialRampToValueAtTime(P.fEnd, time + P.dur * 0.7);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.001, time);
  env.gain.exponentialRampToValueAtTime(0.18 * volume, time + P.atk);
  env.gain.exponentialRampToValueAtTime(0.001, time + P.dur);

  o.connect(ws);
  ws.connect(filt);
  filt.connect(env);
  env.connect(getMaster());

  let subOsc = null;
  let subEnv = null;
  if (P.hasSub) {
    subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq, time);
    subEnv = ctx.createGain();
    subEnv.gain.setValueAtTime(0.001, time);
    subEnv.gain.exponentialRampToValueAtTime(0.12 * volume, time + 0.02);
    subEnv.gain.exponentialRampToValueAtTime(0.001, time + P.dur + 0.3);
    subOsc.connect(subEnv);
    subEnv.connect(getMaster());
    subOsc.start(time);
    subOsc.stop(time + P.dur + 0.4);
  }

  o.start(time);
  o.stop(time + P.dur + 0.4);

  const voice = { o, sub: subOsc, tail: env };
  _bassVoices.push(voice);
  setTimeout(() => {
    _bassVoices = _bassVoices.filter(v => v !== voice);
    try { env.disconnect(); } catch (e) {}
    try { filt.disconnect(); } catch (e) {}
    try { ws.disconnect(); } catch (e) {}
    try { subEnv && subEnv.disconnect(); } catch (e) {}
  }, (P.dur + 0.5) * 1000);
}

// ─── Look-ahead Scheduler ───────────────────────────────────────
const SCHEDULE_AHEAD = 0.1;  // seconds to schedule ahead
const LOOKAHEAD_MS = 25;     // how often the scheduler runs

export class Scheduler {
  constructor() {
    this.bpm = 120;
    this.step = 0;
    this.totalSteps = 16;
    this.playing = false;
    this.nextStepTime = 0;
    this._timerID = null;
    this.onStep = null; // callback(stepIndex, time)
    this.onVisualStep = null; // callback(stepIndex) — for UI updates
  }

  start() {
    if (this.playing) return;
    const ctx = resumeAudio();
    this.playing = true;
    this.step = 0;
    this.nextStepTime = ctx.currentTime + 0.05;
    this._schedule();
  }

  stop() {
    this.playing = false;
    if (this._timerID) {
      clearTimeout(this._timerID);
      this._timerID = null;
    }
    this.step = 0;
  }

  setBpm(bpm) {
    this.bpm = Math.max(30, Math.min(300, bpm));
  }

  _schedule() {
    if (!this.playing) return;
    const ctx = getAudioContext();
    const stepDur = 60 / this.bpm / 4; // 16th note duration

    while (this.nextStepTime < ctx.currentTime + SCHEDULE_AHEAD) {
      // Schedule audio at precise time
      if (this.onStep) {
        this.onStep(this.step, this.nextStepTime);
      }

      // Schedule visual update (approximate, via setTimeout)
      const visualDelay = Math.max(0, (this.nextStepTime - ctx.currentTime) * 1000);
      const currentStep = this.step;
      setTimeout(() => {
        if (this.playing && this.onVisualStep) {
          this.onVisualStep(currentStep);
        }
      }, visualDelay);

      this.nextStepTime += stepDur;
      this.step = (this.step + 1) % this.totalSteps;
    }

    this._timerID = setTimeout(() => this._schedule(), LOOKAHEAD_MS);
  }
}

// ─── Drone Engine ───────────────────────────────────────────────
// Volume curve: section 0=1.0, 1=0.82, 2=0.67, 3=0.55, 4=0.44, 5=0.36, 6=0.28, 7=0.15, gallery=0
const SECTION_FREQS = [65.41, 73.42, 82.41, 87.31, 98.0, 110.0, 123.47, 130.81];
const DRONE_VOLUMES = [1.0, 0.82, 0.67, 0.55, 0.44, 0.36, 0.28, 0.15];
const CROSSFADE_TIME = 0.4;

let _droneOscs = null;
let _droneGain = null;
let _droneFilter = null;
let _droneActive = false;

export function startDrone(sectionIndex = 0) {
  const ctx = resumeAudio();
  const now = ctx.currentTime;
  const freq = SECTION_FREQS[sectionIndex] || 65.41;
  const vol = DRONE_VOLUMES[sectionIndex] || 0.15;

  if (_droneActive) {
    // Crossfade to new note
    _droneOscs.forEach(o => {
      o.frequency.exponentialRampToValueAtTime(
        freq * (o._detuneRatio || 1),
        now + CROSSFADE_TIME
      );
    });
    _droneGain.gain.linearRampToValueAtTime(vol * 0.06, now + CROSSFADE_TIME);
    return;
  }

  // Create drone: 3 detuned filtered sawtooths
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(vol * 0.06, now + 1.5);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  filter.Q.value = 1;
  filter.connect(gain);
  gain.connect(getMaster());

  const detunes = [1, 1.003, 0.997];
  const oscs = detunes.map(d => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(freq * d, now);
    o._detuneRatio = d;
    o.connect(filter);
    o.start(now);
    return o;
  });

  _droneOscs = oscs;
  _droneGain = gain;
  _droneFilter = filter;
  _droneActive = true;
}

export function updateDrone(sectionIndex) {
  if (!_droneActive || !_droneOscs) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const freq = SECTION_FREQS[sectionIndex] || 65.41;
  const vol = DRONE_VOLUMES[sectionIndex] || 0.15;

  _droneOscs.forEach(o => {
    o.frequency.exponentialRampToValueAtTime(freq * (o._detuneRatio || 1), now + CROSSFADE_TIME);
  });
  _droneGain.gain.linearRampToValueAtTime(vol * 0.06, now + CROSSFADE_TIME);
}

export function isDroneActive() { return _droneActive; }

export function stopDrone() {
  if (!_droneActive || !_droneOscs) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  _droneGain.gain.linearRampToValueAtTime(0.001, now + 0.5);
  setTimeout(() => {
    _droneOscs.forEach(o => { try { o.stop(); } catch (e) {} });
    _droneOscs = null;
    _droneGain = null;
    _droneActive = false;
  }, 600);
}

// ─── Chorus Pad ─────────────────────────────────────────────────
let _padNodes = [];
let _padActive = false;

export function togglePad(volume = 0.4) {
  _padActive = !_padActive;
  if (_padActive) {
    const ctx = resumeAudio();
    const vol = volume / 100;
    [130.81, 164.81, 196, 261.63].forEach(f => {
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 1.008;
      const g = ctx.createGain(); g.gain.value = 0.035 * vol;
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.25;
      const lg = ctx.createGain(); lg.gain.value = 2.5;
      lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
      o1.connect(g); o2.connect(g); g.connect(getMaster());
      o1.start(); o2.start(); lfo.start();
      _padNodes.push({ o1, o2, lfo, g });
    });
  } else {
    _padNodes.forEach(p => {
      try { p.g.gain.value = 0; p.o1.stop(); p.o2.stop(); p.lfo.stop(); } catch (e) {}
    });
    _padNodes = [];
  }
  return _padActive;
}

export function isPadActive() { return _padActive; }

// ─── Section Transition Note (one-shot with delay/echo) ─────────
export function playTransitionNote(freq) {
  const ctx = resumeAudio();
  const now = ctx.currentTime;

  const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = freq;
  const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = freq * 1.004;
  const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = freq / 2;

  const ws = ctx.createWaveShaper(); ws.curve = getDistortionCurve(70); ws.oversample = '2x';
  const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.Q.value = 7;
  filt.frequency.setValueAtTime(180, now);
  filt.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
  filt.frequency.exponentialRampToValueAtTime(250, now + 2);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.001, now);
  env.gain.exponentialRampToValueAtTime(0.14, now + 0.06);
  env.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

  const subEnv = ctx.createGain();
  subEnv.gain.setValueAtTime(0.001, now);
  subEnv.gain.exponentialRampToValueAtTime(0.1, now + 0.04);
  subEnv.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

  const del = ctx.createDelay(0.5); del.delayTime.value = 0.22;
  const fb = ctx.createGain(); fb.gain.value = 0.32;
  const delOut = ctx.createGain(); delOut.gain.value = 0.28;
  const del2 = ctx.createDelay(0.5); del2.delayTime.value = 0.37;
  const del2Out = ctx.createGain(); del2Out.gain.value = 0.14;

  o1.connect(ws); o2.connect(ws); ws.connect(filt); filt.connect(env);
  env.connect(getMaster());
  env.connect(del); del.connect(fb); fb.connect(del); del.connect(delOut); delOut.connect(getMaster());
  env.connect(del2); del2.connect(del2Out); del2Out.connect(getMaster());
  sub.connect(subEnv); subEnv.connect(getMaster());

  [o1, o2, sub].forEach(o => { o.start(now); o.stop(now + 3.5); });
}

// ─── Interaction Ping (for button clicks in sections) ───────────
// Immersive synth pad for interactive elements — not a game beep.
//
// Sound design: a 3-voice chord (root + perfect 5th + octave) plus a
// sub-octave for body, each voice built from two slightly detuned
// sawtooths for the super-saw shimmer. A single lowpass filter sweeps
// from bright → dark over the 0.55 s tail so the hit feels like a pad
// note rather than a bell. Soft 25 ms attack, exponential decay.
//
// The input `freq` is the section's parent note (C2–C3, 65–130 Hz).
// Transposed up 2 octaves so the fundamental lands at 260–520 Hz where
// phone speakers actually reproduce it. The chromatic progression that
// handlePing drives (one semitone per index) is preserved at the root;
// the 5th + octave voices shift in parallel so each click reads as a
// chord and successive clicks trace a chromatic harmonic line.
export function playPing(freq, velocity = 0.85) {
  const ctx = resumeAudio();
  const now = ctx.currentTime;
  const master = getMaster();
  const f0 = freq * 4; // up 2 octaves into phone-speaker range

  // Shared filter + envelope feed the whole chord so node count per
  // click stays bounded (important with many successive clicks).
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.Q.value = 3;
  filt.frequency.setValueAtTime(f0 * 8, now);
  filt.frequency.exponentialRampToValueAtTime(f0 * 2, now + 0.8);

  // Peak ~0.42 — deliberately sits ~2× louder than the drone level,
  // so the click layer cuts through without stopping the drone from
  // being present underneath. Attack is soft enough to sound pad-like
  // (15 ms) but fast enough to feel responsive. Tail rings for ~0.8 s
  // which reads as "a chord was struck" rather than a tap.
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.linearRampToValueAtTime(0.42 * velocity, now + 0.015);
  env.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

  filt.connect(env);
  env.connect(master);

  // The chord: root, perfect 5th (2^(7/12)), octave, and a sub-octave
  // for warmth. Amps picked so the root dominates and harmonics
  // support rather than compete.
  const chord = [
    { hz: f0,             amp: 0.55 }, // root
    { hz: f0 * 1.49831,   amp: 0.28 }, // perfect 5th
    { hz: f0 * 2.0,       amp: 0.30 }, // octave
    { hz: f0 * 0.5,       amp: 0.22 }, // sub-octave
  ];

  const stop = now + 0.82;
  for (const v of chord) {
    // Two detuned sawtooths per voice (± 4 cents) — super-saw lite.
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'sawtooth';
    o2.type = 'sawtooth';
    o1.frequency.setValueAtTime(v.hz * 0.99769, now); // -4 cents
    o2.frequency.setValueAtTime(v.hz * 1.00231, now); // +4 cents
    const vg = ctx.createGain();
    vg.gain.value = v.amp;
    o1.connect(vg);
    o2.connect(vg);
    vg.connect(filt);
    o1.start(now);
    o2.start(now);
    o1.stop(stop);
    o2.stop(stop);
  }

  // Release the dry chain once the envelope is done — helps GC.
  setTimeout(() => { try { env.disconnect(); filt.disconnect(); } catch (e) {} }, 900);
}
