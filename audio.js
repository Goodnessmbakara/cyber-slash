/**
 * Cyber Synth Web Audio Engine
 * Procedural retro cyberpunk sound effects and synthwave bassline.
 */

let ctx = null;
let musicInterval = null;
let isMuted = false;
let step = 0;

function getContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      ctx = new AudioCtx();
    }
  }
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

export function setMuted(muted) {
  isMuted = muted;
  if (isMuted && musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

export function getMuted() {
  return isMuted;
}

export function playJump() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const osc = c.createOscillator();
  const gain = c.createGain();
  const now = c.currentTime;

  osc.type = "sine";
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(540, now + 0.18);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.18);
}

export function playSlash() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;

  // White noise burst with bandpass for sword whoosh
  const bufferSize = c.sampleRate * 0.15;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = c.createBufferSource();
  noise.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + 0.14);
  filter.Q.value = 3.0;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);

  noise.start(now);
  noise.stop(now + 0.15);
}

export function playHit() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.22);
}

export function playOrb() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(587.33, now); // D5
  osc.frequency.setValueAtTime(880, now + 0.06); // A5

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.2);
}

export function playGameOver() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(280, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.6);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.6);
}

const bassNotes = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83]; // A2, C3, D3, E3

export function startMusic() {
  if (musicInterval || isMuted) return;
  const c = getContext();
  if (!c) return;

  step = 0;
  musicInterval = setInterval(() => {
    if (isMuted) return;
    const now = c.currentTime;
    const freq = bassNotes[step % bassNotes.length];
    step++;

    const osc = c.createOscillator();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.18);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);

    osc.start(now);
    osc.stop(now + 0.19);
  }, 220); // ~136 BPM 8th-note pulse
}

export function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}
