// ============================================================================
// MODULE: Audio Engine
// PURPOSE: Prozedurale Soundezeugung via Web Audio API (keine externen Dateien)
// RESPONSIBILITIES:
//   - Jump-Sound
//   - Hintergrundmusik (generativ)
//   - Close-Pass Jubel
//   - Milestone-Stinger (bei 10/20/30/40/50)
//   - Kollisions-Sound
// NON-GOALS:
//   - Keine externen Audio-Dateien
//   - Keine UI-Logik
// ============================================================================

let ctx = null;
let musicNodes = [];
let musicRunning = false;
let masterGain = null;

// Lazy-init AudioContext on first user interaction
function getCtx() {
    if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.6;
        masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

// ── Utility ──────────────────────────────────────────────────────────────────
function createOsc(type, freq, startTime, duration, gainPeak, destination) {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(g);
    g.connect(destination || masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    return osc;
}

// ── Jump Sound ────────────────────────────────────────────────────────────────
export function playJump() {
    const ac = getCtx();
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
    g.gain.setValueAtTime(0.25, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
}

// ── Land Sound (subtle thud) ──────────────────────────────────────────────────
export function playLand() {
    const ac = getCtx();
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
}

// ── Close Pass Jubel ──────────────────────────────────────────────────────────
export function playClose() {
    const ac = getCtx();
    const now = ac.currentTime;
    // Aufsteigende Dreiklang-Fanfare
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
        createOsc('sine', freq, now + i * 0.07, 0.18, 0.18);
    });
    // Rauschen-Perkussion
    const buf = ac.createBuffer(1, ac.sampleRate * 0.1, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.3, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    src.connect(ng);
    ng.connect(masterGain);
    src.start(now);
}

// ── Collision / Game Over ─────────────────────────────────────────────────────
export function playHit() {
    const ac = getCtx();
    const now = ac.currentTime;
    // Deep impact
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    g.gain.setValueAtTime(0.5, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.6);
    // Noise burst
    const buf = ac.createBuffer(1, ac.sampleRate * 0.15, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.4, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    src.connect(ng);
    ng.connect(masterGain);
    src.start(now);
}

// ── Milestone Stinger (bei 10/20/30/40/50) ───────────────────────────────────
export function playMilestone(scoreLevel) {
    const ac = getCtx();
    const now = ac.currentTime;
    // Pitch steigt mit jedem Meilenstein
    const basePitch = 330 + scoreLevel * 40;
    const stabs = [basePitch, basePitch * 1.25, basePitch * 1.5, basePitch * 2];
    stabs.forEach((freq, i) => {
        createOsc('square', freq, now + i * 0.06, 0.14, 0.2);
        createOsc('sine',   freq * 0.5, now + i * 0.06, 0.14, 0.1);
    });
    // Cymbal-artiges Rauschen
    const buf = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5000;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.25, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    src.connect(hp);
    hp.connect(ng);
    ng.connect(masterGain);
    src.start(now);
}

// ── Background Music ──────────────────────────────────────────────────────────
// Generative Sequencer: 8-step bassline + Hihat + Kick
const BASS_SEQ    = [55, 55, 82, 55, 73, 55, 82, 98];  // Hz, A1-artig
const MELODY_SEQ  = [220, 0, 277, 0, 330, 220, 0, 370]; // Hz, 0 = Pause

let musicScheduler = null;
let musicStep = 0;
let musicTempo = 120; // BPM, kann mit Geschwindigkeit angepasst werden

export function startMusic() {
    if (musicRunning) return;
    musicRunning = true;
    musicTempo   = 120;   // immer bei 120 BPM starten, nie den alten Wert erben
    musicStep    = 0;
    scheduleMusic();
}

// Ruhige Menü-Musik (80 BPM, nur Bass + Melody, kein Kick-Schlagzeug)
export function startMenuMusic() {
    if (musicRunning) return;
    musicRunning = true;
    musicTempo   = 80;
    musicStep    = 0;
    _menuMode    = true;
    scheduleMusic();
}

export function stopMusic() {
    musicRunning = false;
    _menuMode    = false;
    if (musicScheduler) clearTimeout(musicScheduler);
    musicNodes.forEach(n => { try { n.stop(); } catch(e){} });
    musicNodes = [];
}

export function setMusicTempo(bpm) {
    musicTempo = Math.max(80, Math.min(200, bpm));
}

let _menuMode = false;

function scheduleMusic() {
    if (!musicRunning) return;
    const ac = getCtx();
    const stepDur = 60 / musicTempo / 2; // Achtel-Noten
    const now = ac.currentTime;

    // ── Kick (nur im Spiel, nicht im Menü) ──
    if (!_menuMode && musicStep % 4 === 0) {
        const osc = ac.createOscillator();
        const g   = ac.createGain();
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
        g.gain.setValueAtTime(0.45, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(g); g.connect(masterGain);
        osc.start(now); osc.stop(now + 0.2);
        musicNodes.push(osc);
    }

    // ── Hi-Hat (nur im Spiel) ──
    if (!_menuMode && musicStep % 2 === 1) {
        const buf = ac.createBuffer(1, ac.sampleRate * 0.05, ac.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const hp = ac.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 7000;
        const src = ac.createBufferSource();
        src.buffer = buf;
        const ng = ac.createGain();
        ng.gain.setValueAtTime(0.06, now);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        src.connect(hp); hp.connect(ng); ng.connect(masterGain);
        src.start(now);
        musicNodes.push(src);
    }

    // ── Bass ──
    const bassFreq = BASS_SEQ[musicStep % BASS_SEQ.length];
    const bassOsc = ac.createOscillator();
    const bassG   = ac.createGain();
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.value = bassFreq;
    bassG.gain.setValueAtTime(0.12, now);
    bassG.gain.exponentialRampToValueAtTime(0.001, now + stepDur * 0.8);
    const bassFilter = ac.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 400;
    bassOsc.connect(bassFilter);
    bassFilter.connect(bassG);
    bassG.connect(masterGain);
    bassOsc.start(now);
    bassOsc.stop(now + stepDur);
    musicNodes.push(bassOsc);

    // ── Melody ──
    const melFreq = MELODY_SEQ[musicStep % MELODY_SEQ.length];
    if (melFreq > 0) {
        const melOsc = ac.createOscillator();
        const melG   = ac.createGain();
        melOsc.type = 'triangle';
        melOsc.frequency.value = melFreq;
        melG.gain.setValueAtTime(0.07, now);
        melG.gain.exponentialRampToValueAtTime(0.001, now + stepDur * 0.6);
        melOsc.connect(melG);
        melG.connect(masterGain);
        melOsc.start(now);
        melOsc.stop(now + stepDur);
        musicNodes.push(melOsc);
    }

    musicStep = (musicStep + 1) % 8;
    // Bereinige alte Nodes gelegentlich
    if (musicNodes.length > 40) musicNodes = musicNodes.slice(-20);

    musicScheduler = setTimeout(scheduleMusic, stepDur * 1000 * 0.92);
}

// Lautstärke global
export function setVolume(v) {
    if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
}
