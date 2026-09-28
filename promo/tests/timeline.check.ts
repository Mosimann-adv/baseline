import { test } from "node:test";
import assert from "node:assert/strict";
import { BALL_LANDINGS, BEAT_FRAMES, FPS, TOTAL_FRAMES, sceneSlots } from "../src/timeline.ts";
import { ballHeight, squash } from "../src/bounce.ts";

test("26 s a 30 fps, cenas encadeadas sem buraco e na ordem do roteiro", () => {
  assert.equal(TOTAL_FRAMES, 26 * FPS);
  const slots = sceneSlots();
  assert.deepEqual(slots.map((s) => s.id), ["abertura", "treinos", "treino", "evolucao", "perfis", "final"]);
  assert.equal(slots[0].from, 0);
  for (let i = 1; i < slots.length; i++) assert.equal(slots[i].from, slots[i - 1].from + slots[i - 1].durationInFrames);
});

test("toques da bola caem na batida e dentro da abertura", () => {
  const abertura = sceneSlots()[0];
  for (const f of BALL_LANDINGS) {
    assert.equal(f % BEAT_FRAMES, 0);
    assert.ok(f < abertura.durationInFrames);
  }
});

test("bola começa no alto, toca o chão em cada toque e sobe entre eles", () => {
  assert.equal(ballHeight(0, BALL_LANDINGS, 300), 300);
  for (const f of BALL_LANDINGS) assert.equal(ballHeight(f, BALL_LANDINGS, 300), 0);
  assert.equal(ballHeight(27, BALL_LANDINGS, 300), 300);
  assert.equal(ballHeight(200, BALL_LANDINGS, 300), 0);
  for (let f = 0; f < 120; f++) assert.ok(ballHeight(f, BALL_LANDINGS, 300) >= 0);
});

test("amassado só perto do toque", () => {
  assert.equal(squash(18, BALL_LANDINGS), 0.2);
  assert.equal(squash(27, BALL_LANDINGS), 0);
});
