import { test } from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_RATE, buildTrack, encodeWav } from "../src/audio.ts";
import { BALL_LANDINGS, FPS, TOTAL_FRAMES } from "../src/timeline.ts";

const rms = (buf: Float32Array, fromSec: number, toSec: number) => {
  const a = Math.round(fromSec * SAMPLE_RATE);
  const b = Math.round(toSec * SAMPLE_RATE);
  let sum = 0;
  for (let i = a; i < b; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / (b - a));
};

test("dura o vídeo inteiro e não estoura", () => {
  const track = buildTrack();
  assert.equal(track.length, Math.round((TOTAL_FRAMES / FPS) * SAMPLE_RATE));
  const peak = track.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
  assert.ok(peak > 0.5 && peak <= 0.9, `pico ${peak}`);
});

test("o drible soa no toque da bola, não antes", () => {
  const track = buildTrack();
  const hit = BALL_LANDINGS[0] / FPS;
  assert.ok(rms(track, hit, hit + 0.05) > 4 * rms(track, hit - 0.2, hit - 0.05));
});

test("termina em silêncio (fade)", () => {
  const track = buildTrack();
  const end = TOTAL_FRAMES / FPS;
  assert.ok(rms(track, end - 0.05, end) < 0.01);
});

test("WAV PCM 16 bits mono com cabeçalho correto", () => {
  const samples = new Float32Array([0, 0.5, -0.5, 1]);
  const wav = encodeWav(samples);
  const text = (a: number, b: number) => String.fromCharCode(...wav.slice(a, b));
  const view = new DataView(wav.buffer);
  assert.equal(text(0, 4), "RIFF");
  assert.equal(text(8, 12), "WAVE");
  assert.equal(view.getUint32(24, true), SAMPLE_RATE);
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint32(40, true), samples.length * 2);
  assert.equal(wav.length, 44 + samples.length * 2);
});
