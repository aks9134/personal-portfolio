"use client";

// Opt-in UI sound, synthesised with Web Audio (no files, no requests). Off by default; the header's Sound switch
// sets html[data-sound="on"]. Short and quiet: a relay tick for hovers and presses, a lower clunk for toggles.
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
// Browsers only allow audio after a click or key press on the page. Until then (a returning visitor who left sound
// on, hovering first) every sound is skipped silently instead of logging an autoplay warning.
let unlocked = false;
if (typeof window !== "undefined") {
  const unlock = () => {
    unlocked = true;
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("keydown", unlock, true);
  };
  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
}

const on = () => unlocked && typeof document !== "undefined" && document.documentElement.dataset.sound === "on";

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function burst(freq: number, gain: number, dur: number) {
  const a = audio();
  const src = a.createBufferSource();
  src.buffer = noise;
  const band = a.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = freq;
  band.Q.value = 6;
  const g = a.createGain();
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  src.connect(band).connect(g).connect(a.destination);
  src.start();
  src.stop(a.currentTime + dur);
}

export const sound = {
  tick() {
    if (on()) burst(3200, 0.08, 0.03);
  },
  clunk() {
    if (on()) {
      burst(900, 0.18, 0.06);
      burst(2400, 0.06, 0.03);
    }
  },
  /** Plays even when sound was just switched on by this very press, so the switch confirms itself. */
  confirm() {
    unlocked = true; // called from the Sound switch's own click
    burst(900, 0.18, 0.06);
  },
};
