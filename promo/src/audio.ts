import { BALL_LANDINGS, BEAT_FRAMES, FPS, TOTAL_FRAMES, sceneSlots } from "./timeline.ts";

export const SAMPLE_RATE = 44100;

/** Ruído determinístico: a trilha sai igual a cada geração. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Um som: frequência (Hz) do tom, amplitude do tom e amplitude do ruído em cada instante t. */
interface Voice {
  seconds: number;
  freq: (t: number) => number;
  tone: (t: number) => number;
  noise: (t: number) => number;
}

const KICK: Voice = { seconds: 0.35, freq: (t) => 50 + 90 * Math.exp(-t * 30), tone: (t) => 0.9 * Math.exp(-t * 9), noise: () => 0 };
const SNARE: Voice = { seconds: 0.2, freq: () => 190, tone: (t) => 0.2 * Math.exp(-t * 18), noise: (t) => 0.35 * Math.exp(-t * 22) };
const HAT: Voice = { seconds: 0.05, freq: () => 0, tone: () => 0, noise: (t) => 0.12 * Math.exp(-t * 90) };
/** Drible: baque grave e curto, com um estalo de 4 ms no contato. */
const DRIBBLE: Voice = {
  seconds: 0.18,
  freq: (t) => 95 + 60 * Math.exp(-t * 40),
  tone: (t) => 0.8 * Math.exp(-t * 28),
  noise: (t) => (t < 0.004 ? 0.3 : 0),
};

function add(buf: Float32Array, atSec: number, voice: Voice, rand: () => number) {
  const start = Math.round(atSec * SAMPLE_RATE);
  const length = Math.round(voice.seconds * SAMPLE_RATE);
  let phase = 0;
  for (let i = 0; i < length && start + i < buf.length; i++) {
    const t = i / SAMPLE_RATE;
    phase += (2 * Math.PI * voice.freq(t)) / SAMPLE_RATE;
    buf[start + i] += Math.sin(phase) * voice.tone(t) + (rand() * 2 - 1) * voice.noise(t);
  }
}

export function buildTrack(): Float32Array {
  const totalSec = TOTAL_FRAMES / FPS;
  const buf = new Float32Array(Math.round(totalSec * SAMPLE_RATE));
  const rand = mulberry32(7);
  const sec = (frame: number) => frame / FPS;

  // Abertura: só o drible, junto com cada toque da bola.
  for (const landing of BALL_LANDINGS) add(buf, sec(landing), DRIBBLE, rand);

  // Depois da abertura: bumbo em todo tempo, caixa nos tempos pares, chimbal no contratempo.
  const introEnd = sceneSlots()[0].durationInFrames;
  for (let frame = introEnd; frame < TOTAL_FRAMES - FPS; frame += BEAT_FRAMES) {
    const beat = (frame - introEnd) / BEAT_FRAMES;
    add(buf, sec(frame), KICK, rand);
    if (beat % 2 === 1) add(buf, sec(frame), SNARE, rand);
    add(buf, sec(frame + BEAT_FRAMES / 2), HAT, rand);
    if (beat % 4 === 0) add(buf, sec(frame), DRIBBLE, rand);
  }

  // Último segundo: fade até o silêncio.
  const fadeStart = buf.length - SAMPLE_RATE;
  for (let i = fadeStart; i < buf.length; i++) buf[i] *= (buf.length - i) / SAMPLE_RATE;

  // Normaliza o pico em 0,89.
  const peak = buf.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
  if (peak > 0) for (let i = 0; i < buf.length; i++) buf[i] *= 0.89 / peak;
  return buf;
}

export function encodeWav(samples: Float32Array, sampleRate = SAMPLE_RATE): Uint8Array {
  const out = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(out.buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) out[offset + i] = text.charCodeAt(i);
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, Math.round(v * 32767), true);
  }
  return out;
}
