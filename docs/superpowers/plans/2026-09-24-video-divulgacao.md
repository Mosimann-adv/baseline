# Vídeo de divulgação do Baseline — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gerar `promo/out/baseline-9x16.mp4`, um vídeo vertical de 26 s que mostra o Baseline em uso, com texto na tela e trilha própria.

**Architecture:** Um script Playwright captura telas reais da demo (`dist-demo`) a 390×844 com escala 3. Um projeto Remotion em `promo/` compõe as capturas dentro de um celular desenhado, com legendas, toques e confete animados. Um script Node gera a trilha em WAV, sincronizada com a mesma linha do tempo (`timeline.ts`).

**Tech Stack:** Node 24 (TypeScript com remoção de tipos nativa), Remotion 4.0.528 (`remotion`, `@remotion/cli`, `@remotion/fonts`), React 19, Playwright 1.63, `node:test`, ffmpeg/ffprobe (já instalados).

**Spec:** `docs/superpowers/specs/2026-09-24-video-divulgacao-design.md`

## Global Constraints

- 1080×1920, 30 fps, 26 s (780 quadros), MP4 H.264 com áudio AAC.
- Cores do kit: Maré `#133358`, `#0b2340`, `#26578c`, laranja `#eea047`, amarelo `#f3c44b`, coral `#d96953`, creme `#f8f1e0`, azul `#7db8e8`.
- Títulos na Breymont em `textTransform: lowercase` e sem travessão (a fonte não tem – nem —). Linhas secundárias na Poppins.
- Área segura: nada importante acima de y=120 nem abaixo de y=1670.
- Nenhuma foto de pessoa real. Só telas do app com os perfis fictícios Rafa e Léo.
- Tela final sem link do site. Só `@arvoredo.basquetebol`.
- `promo/` é isolado: não entra no `tsconfig.json` nem no Vitest da raiz. Os testes do promo se chamam `*.check.ts` e rodam com `node --test`.
- Arquivos gerados (`promo/node_modules/`, `promo/out/`, `promo/public/captures/`, `promo/public/fonts/`, `promo/public/icons/`, `promo/public/trilha.wav`) ficam fora do Git.
- Commit só com autorização explícita do dono, a cada vez.

## Review Focus

- Capturas no modo carrossel: o contexto do Playwright precisa de `isMobile` + `hasTouch`, senão a media query de mouse transforma as prateleiras em grade. O Task 3 confere que `.shelf-row` tem `scrollWidth > clientWidth`.
- Faixa "Modo demonstração" não pode aparecer nas capturas. O Task 3 confere que `.demo-banner` está oculta.
- Player do YouTube que não carrega na captura: a cena do treino continua válida (contagem, nome e dica do exercício). Não se inventa imagem. O Task 6 inspeciona o quadro da cena.
- Rodar a captura sem `dist-demo` ou com a porta ocupada: o script para com mensagem clara em português e sempre derruba o servidor, inclusive no Windows (`taskkill /T`).
- Acentos e cedilha nas legendas ("você", "evolução", "exercício", "Grátis", "anúncios"): as duas fontes cobrem latin. O Task 6 confere nos quadros extraídos.

---

## Estrutura de arquivos

```
promo/
  package.json            scripts: test, capture, soundtrack, studio, render
  tsconfig.json           só para o editor (noEmit)
  scripts/capture.ts      sobe o vite preview, captura telas, copia fontes e ícone, grava pontos.json
  scripts/soundtrack.ts   grava public/trilha.wav
  src/timeline.ts         FPS, tamanho, cenas, batida, toques da bola (fonte única do tempo)
  src/bounce.ts           altura e amassado da bola por quadro
  src/audio.ts            síntese da trilha e codificação WAV
  src/theme.ts            cores e fontes
  src/index.ts            registerRoot
  src/Root.tsx            <Composition id="Baseline">
  src/Video.tsx           fundo, sequência das cenas, áudio
  src/components/Ball.tsx, Caption.tsx, Tagline.tsx, Phone.tsx, Tap.tsx, Confetti.tsx, FadeIn.tsx
  src/scenes/Abertura.tsx, Treinos.tsx, Treino.tsx, Evolucao.tsx, Perfis.tsx, Final.tsx
  tests/timeline.check.ts, tests/audio.check.ts
```

---

### Task 1: Projeto `promo/`, linha do tempo e física da bola

**Files:**
- Create: `promo/package.json`, `promo/tsconfig.json`, `promo/src/timeline.ts`, `promo/src/bounce.ts`, `promo/tests/timeline.check.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `FPS`, `WIDTH`, `HEIGHT`, `TOTAL_FRAMES`, `BEAT_FRAMES`, `BALL_LANDINGS`, `type SceneId`, `sceneSlots(): SceneSlot[]` (`{ id: SceneId; from: number; durationInFrames: number }`); `ballHeight(frame, landings, peak): number`; `squash(frame, landings, amount?): number`.

- [ ] **Step 1: Criar `promo/package.json` e instalar**

```json
{
  "name": "baseline-promo",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"tests/*.check.ts\"",
    "capture": "node scripts/capture.ts",
    "soundtrack": "node scripts/soundtrack.ts",
    "studio": "remotion studio src/index.ts",
    "render": "remotion render src/index.ts Baseline out/baseline-9x16.mp4 --codec=h264"
  }
}
```

Run: `cd promo && npm install remotion@4.0.528 @remotion/cli@4.0.528 @remotion/fonts@4.0.528 react@19 react-dom@19 playwright@1.63.0 && npm install -D @types/react@19 typescript && npx playwright install chromium`

- [ ] **Step 2: `promo/tsconfig.json` (só editor)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src", "scripts", "tests"]
}
```

- [ ] **Step 3: Acrescentar ao `.gitignore` da raiz**

```
# Vídeo de divulgação (gerados)
promo/node_modules/
promo/out/
promo/public/captures/
promo/public/fonts/
promo/public/icons/
promo/public/trilha.wav
```

- [ ] **Step 4: Escrever o teste `promo/tests/timeline.check.ts`**

```ts
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
```

- [ ] **Step 5: Rodar e ver falhar**

Run: `cd promo && npm test`
Expected: FAIL (módulos `../src/timeline.ts` e `../src/bounce.ts` não existem)

- [ ] **Step 6: Implementar `promo/src/timeline.ts`**

```ts
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export type SceneId = "abertura" | "treinos" | "treino" | "evolucao" | "perfis" | "final";

/** Roteiro aprovado: segundos de cada cena, na ordem. */
const SCENE_SECONDS: ReadonlyArray<readonly [SceneId, number]> = [
  ["abertura", 3],
  ["treinos", 5],
  ["treino", 6],
  ["evolucao", 5],
  ["perfis", 3],
  ["final", 4],
];

export interface SceneSlot {
  id: SceneId;
  from: number;
  durationInFrames: number;
}

export function sceneSlots(): SceneSlot[] {
  let from = 0;
  return SCENE_SECONDS.map(([id, seconds]) => {
    const slot = { id, from, durationInFrames: Math.round(seconds * FPS) };
    from += slot.durationInFrames;
    return slot;
  });
}

export const TOTAL_FRAMES = sceneSlots().reduce((total, slot) => total + slot.durationInFrames, 0);

/** 100 BPM a 30 fps: um tempo a cada 18 quadros. */
export const BEAT_FRAMES = 18;

/** Quadros em que a bola da abertura toca o chão (um por tempo). */
export const BALL_LANDINGS = [18, 36, 54, 72] as const;
```

- [ ] **Step 7: Implementar `promo/src/bounce.ts`**

```ts
/** Altura da bola acima do chão (px): cai do alto até o 1º toque, faz parábolas entre toques e fica no chão depois do último. */
export function ballHeight(frame: number, landings: readonly number[], peak: number): number {
  const first = landings[0];
  if (frame <= first) {
    const t = frame / first;
    return peak * (1 - t * t);
  }
  for (let i = 1; i < landings.length; i++) {
    const a = landings[i - 1];
    const b = landings[i];
    if (frame <= b) {
      const t = (frame - a) / (b - a);
      return peak * 4 * t * (1 - t);
    }
  }
  return 0;
}

/** Quanto a bola amassa: `amount` no quadro do toque, zero a partir de 3 quadros de distância. */
export function squash(frame: number, landings: readonly number[], amount = 0.2): number {
  const distance = Math.min(...landings.map((landing) => Math.abs(frame - landing)));
  return distance >= 3 ? 0 : amount * (1 - distance / 3);
}
```

- [ ] **Step 8: Rodar e ver passar**

Run: `cd promo && npm test`
Expected: 4 testes passando.

- [ ] **Step 9: Conferir que a raiz não mudou**

Run (raiz): `npx tsc --noEmit && npm test`
Expected: tipos ok e 52 testes do app (o Vitest não pega `*.check.ts`).

---

### Task 2: Trilha sonora

**Files:**
- Create: `promo/src/audio.ts`, `promo/scripts/soundtrack.ts`, `promo/tests/audio.check.ts`

**Interfaces:**
- Consumes: `FPS`, `TOTAL_FRAMES`, `BEAT_FRAMES`, `BALL_LANDINGS`, `sceneSlots` (Task 1).
- Produces: `SAMPLE_RATE = 44100`; `buildTrack(): Float32Array` (mono, `TOTAL_FRAMES / FPS` s); `encodeWav(samples: Float32Array, sampleRate?: number): Uint8Array`; arquivo `promo/public/trilha.wav`.

- [ ] **Step 1: Escrever `promo/tests/audio.check.ts`**

```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd promo && npm test`
Expected: FAIL em `audio.check.ts` (módulo inexistente).

- [ ] **Step 3: Implementar `promo/src/audio.ts`**

```ts
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd promo && npm test`
Expected: 8 testes passando.

- [ ] **Step 5: `promo/scripts/soundtrack.ts` e gerar**

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { buildTrack, encodeWav } from "../src/audio.ts";

mkdirSync(new URL("../public/", import.meta.url), { recursive: true });
writeFileSync(new URL("../public/trilha.wav", import.meta.url), encodeWav(buildTrack()));
console.log("trilha gravada em public/trilha.wav");
```

Run: `cd promo && npm run soundtrack && ffprobe -v error -show_entries format=duration -of csv=p=0 public/trilha.wav`
Expected: `26.000000`

---

### Task 3: Captura das telas

**Files:**
- Create: `promo/scripts/capture.ts`

**Interfaces:**
- Produces (em `promo/public/`): `captures/{quem-treina,treinos,treinos-deslize,treinos-sem-cesta,detalhe,treino-trabalho,treino-descanso,evolucao}.png` (1170×2532), `captures/pontos.json` (`{ semCesta, primeiroCartao, comecarTreino }`, cada um `{ x: number; y: number }` em px CSS da tela de 390×844), `fonts/*` (cópia de `src/assets/fonts`), `icons/icon-512.png`.

- [ ] **Step 1: Escrever `promo/scripts/capture.ts`**

```ts
import { chromium, type Page } from "playwright";
import { spawn, execSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const pub = fileURLToPath(new URL("../public/", import.meta.url));
const out = `${pub}captures/`;
const PORT = 4179;
const URL_DEMO = `http://localhost:${PORT}/`;

if (!existsSync(`${root}dist-demo/index.html`)) {
  console.error("Falta a demo. Na raiz do repositório rode: npm run build:demo");
  process.exit(1);
}
mkdirSync(out, { recursive: true });
mkdirSync(`${pub}icons`, { recursive: true });
cpSync(`${root}src/assets/fonts`, `${pub}fonts`, { recursive: true });
copyFileSync(`${root}public/icons/icon-512.png`, `${pub}icons/icon-512.png`);

const server = spawn("npx", ["vite", "preview", "--outDir", "dist-demo", "--port", String(PORT), "--strictPort"], {
  cwd: root,
  shell: true,
  stdio: "ignore",
});
function stopServer() {
  if (server.pid === undefined) return;
  if (process.platform === "win32") execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
  else server.kill();
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(URL_DEMO)).ok) return;
    } catch {
      // ainda subindo
    }
    await pause(500);
  }
  throw new Error(`O vite preview não respondeu na porta ${PORT} (porta ocupada?).`);
}

async function shot(page: Page, name: string) {
  await pause(900);
  await page.screenshot({ path: `${out}${name}.png` });
  console.log("capturado:", name);
}

async function center(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`Não achei ${selector} para marcar o toque.`);
  return { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
}

const button = (page: Page, name: string, exact = false) => page.getByRole("button", { name, exact }).first();

try {
  await waitServer();
  const browser = await chromium.launch();
  // isMobile + hasTouch: sem mouse, as prateleiras ficam em carrossel como no celular.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
    locale: "pt-BR",
  });
  await context.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = ".demo-banner{display:none!important}";
      document.head.appendChild(style);
    });
  });
  const page = await context.newPage();
  await page.goto(URL_DEMO);

  await button(page, "Explorar").click();
  await shot(page, "quem-treina");

  await button(page, "Rafa").click();
  await page.locator(".shelf-row").first().waitFor();
  const banner = await page.locator(".demo-banner").isVisible().catch(() => false);
  if (banner) throw new Error("A faixa da demo apareceu na captura.");
  const carousel = await page.evaluate(() => {
    const row = document.querySelector<HTMLElement>(".shelf-row");
    return !!row && row.scrollWidth > row.clientWidth;
  });
  if (!carousel) throw new Error("As prateleiras não estão em carrossel (contexto sem toque?).");
  const pontos = {
    semCesta: await center(page, ".chips .chip:nth-child(2)"),
    primeiroCartao: await center(page, ".program-card"),
    comecarTreino: { x: 0, y: 0 },
  };
  await shot(page, "treinos");

  await page.evaluate(() => {
    const row = document.querySelector<HTMLElement>(".shelf-row");
    if (row) row.scrollLeft = row.scrollWidth;
  });
  await shot(page, "treinos-deslize");
  await page.evaluate(() => {
    const row = document.querySelector<HTMLElement>(".shelf-row");
    if (row) row.scrollLeft = 0;
  });

  await button(page, "Sem cesta").click();
  await shot(page, "treinos-sem-cesta");
  await button(page, "Tudo", true).click();

  await page.locator(".program-card").first().click();
  await pause(600);
  pontos.comecarTreino = await center(page, "button:has-text('Começar treino')");
  await shot(page, "detalhe");

  await button(page, "Começar treino").click();
  await button(page, "Começar", true).click();
  await pause(4200); // 3 s de preparação e o vídeo carregando
  await shot(page, "treino-trabalho");
  await button(page, "Pular exercício").click();
  await shot(page, "treino-descanso");

  await page.goto(URL_DEMO);
  await pause(800);
  await page.locator("nav").getByRole("button", { name: "Evolução" }).click();
  await page.locator(".goal-card").waitFor();
  for (let i = 0; i < 6; i++) {
    if ((await page.locator(".met-badge").count()) > 0) break;
    const minus = page.getByRole("button", { name: "Diminuir meta" });
    if (await minus.isDisabled()) break;
    await minus.click();
    await pause(300);
  }
  await shot(page, "evolucao");

  writeFileSync(`${out}pontos.json`, JSON.stringify(pontos, null, 2));
  await browser.close();
} finally {
  stopServer();
}
```

- [ ] **Step 2: Gerar a demo e capturar**

Run (raiz): `npm run build:demo` e depois `cd promo && npm run capture`
Expected: 8 linhas "capturado: …" e nenhum erro.

- [ ] **Step 3: Conferir tamanhos e olhar as imagens**

Run: `cd promo/public/captures && for f in *.png; do ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "$f" | sed "s|^|$f |"; done && cat pontos.json`
Expected: todas `1170,2532`; `pontos.json` com três pontos dentro de 0–390 × 0–844.
Abrir com Read: `treinos.png`, `treino-trabalho.png` e `evolucao.png`. Conferir que a faixa da demo não aparece, que a prateleira está em carrossel e que "Meta batida!" aparece. Se o vídeo do YouTube estiver preto ou com erro em `treino-trabalho.png`, anotar para o Task 5 (a cena usa `treino-descanso` como tela principal).

---

### Task 4: Base do Remotion, abertura e tela final

**Files:**
- Create: `promo/src/theme.ts`, `promo/src/index.ts`, `promo/src/Root.tsx`, `promo/src/Video.tsx`, `promo/src/components/{Ball,Caption,Tagline,FadeIn}.tsx`, `promo/src/scenes/{Abertura,Final}.tsx`

**Interfaces:**
- Consumes: Task 1 (`timeline.ts`, `bounce.ts`); `public/fonts/*` e `public/icons/icon-512.png` (Task 3); `public/trilha.wav` (Task 2).
- Produces: `C` (cores), `DISPLAY`, `BODY`; `<Caption lines from? stagger? top? size? accent?>`; `<Tagline text from top color?>`; `<FadeIn>`; `<Ball size squashAmount>`; composição `Baseline`; `SCENES: Partial<Record<SceneId, React.FC>>` em `Video.tsx`, que o Task 5 completa.

- [ ] **Step 1: `promo/src/theme.ts`**

```ts
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const C = {
  mare: "#133358",
  deep: "#0b2340",
  raised: "#26578c",
  orange: "#eea047",
  yellow: "#f3c44b",
  coral: "#d96953",
  cream: "#f8f1e0",
  blue: "#7db8e8",
} as const;

export const DISPLAY = "Breymont";
export const BODY = "Poppins";

// As mesmas fontes do app (copiadas pelo capture.ts). O loadFont segura a renderização até carregar.
loadFont({ family: DISPLAY, url: staticFile("fonts/Breymont-Bold.otf"), weight: "700" });
loadFont({ family: BODY, url: staticFile("fonts/poppins-500-latin.woff2"), weight: "500" });
loadFont({ family: BODY, url: staticFile("fonts/poppins-600-latin.woff2"), weight: "600" });
```

- [ ] **Step 2: Componentes comuns**

`promo/src/components/FadeIn.tsx`:

```tsx
import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

/** Entrada de cena: 6 quadros de fade. */
export function FadeIn({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
}
```

`promo/src/components/Caption.tsx`:

```tsx
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, DISPLAY } from "../theme.ts";

/** Título grande na Breymont, uma linha por vez, subindo com mola. */
export function Caption({
  lines,
  from = 0,
  stagger = 6,
  top = 170,
  size = 96,
  accent,
}: {
  lines: string[];
  from?: number;
  stagger?: number;
  top?: number;
  size?: number;
  accent?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top, display: "flex", flexDirection: "column", gap: 8 }}>
      {lines.map((line, i) => {
        const s = spring({ frame: frame - from - i * stagger, fps, config: { damping: 14, mass: 0.7 } });
        return (
          <div
            key={line}
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: size,
              lineHeight: 1.02,
              textTransform: "lowercase",
              color: i === accent ? C.orange : C.cream,
              opacity: s,
              transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
}
```

`promo/src/components/Tagline.tsx`:

```tsx
import { interpolate, useCurrentFrame } from "remotion";
import { BODY, C } from "../theme.ts";

/** Linha de apoio na Poppins, entra com fade e leve subida. */
export function Tagline({ text, from, top, color = C.yellow }: { text: string; from: number; top: number; color?: string }) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, from + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top, fontFamily: BODY, fontWeight: 600, fontSize: 44, color, opacity: t, transform: `translateY(${(1 - t) * 16}px)` }}>
      {text}
    </div>
  );
}
```

`promo/src/components/Ball.tsx` (mesmo desenho da bola do app):

```tsx
/** Bola do app. `squashAmount` 0–1 achata na vertical e alarga na horizontal. */
export function Ball({ size, squashAmount = 0, rotate = 0 }: { size: number; squashAmount?: number; rotate?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      style={{ transform: `scale(${1 + squashAmount * 0.6}, ${1 - squashAmount})`, transformOrigin: "50% 100%" }}
    >
      <g transform={`rotate(${rotate} 16 16)`}>
        <circle cx="16" cy="16" r="14.5" fill="#eea047" stroke="#0b2340" strokeWidth="1.6" />
        <path
          d="M16 1.5v29M1.5 16h29M6 5.6c4.2 4.6 4.2 16.2 0 20.8M26 5.6c-4.2 4.6-4.2 16.2 0 20.8"
          fill="none"
          stroke="#0b2340"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
```

- [ ] **Step 3: `promo/src/scenes/Abertura.tsx`**

```tsx
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Ball } from "../components/Ball.tsx";
import { Caption } from "../components/Caption.tsx";
import { ballHeight, squash } from "../bounce.ts";
import { BALL_LANDINGS } from "../timeline.ts";

const SIZE = 240;
const GROUND = 1250;
const PEAK = 520;

/** 0–3 s: a bola quica; o 1º toque revela "treino de basquete" e o 3º, "onde você estiver". */
export function Abertura() {
  const frame = useCurrentFrame();
  const height = ballHeight(frame, BALL_LANDINGS, PEAK);
  const amount = squash(frame, BALL_LANDINGS);
  const shadow = 0.35 + 0.65 * (1 - height / PEAK);
  return (
    <AbsoluteFill>
      <Caption lines={["treino de basquete", "onde você estiver"]} from={BALL_LANDINGS[0]} stagger={BALL_LANDINGS[2] - BALL_LANDINGS[0]} top={260} size={104} accent={1} />
      <div style={{ position: "absolute", left: 540 - SIZE * 0.45, top: GROUND - 10, width: SIZE * 0.9, height: 34, borderRadius: "50%", background: "rgba(11,35,64,.6)", transform: `scaleX(${shadow})`, opacity: shadow }} />
      <div style={{ position: "absolute", left: 540 - SIZE / 2, top: GROUND - SIZE - height }}>
        <Ball size={SIZE} squashAmount={amount} rotate={frame * 6} />
      </div>
    </AbsoluteFill>
  );
}
```

- [ ] **Step 4: `promo/src/scenes/Final.tsx`**

```tsx
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY, C, DISPLAY } from "../theme.ts";

/** 22–26 s: ícone, marca, "Grátis. Sem anúncios." e o Instagram do Instituto. */
export function Final() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = (delay: number) => spring({ frame: frame - delay, fps, config: { damping: 12, mass: 0.6 } });
  const rise = (delay: number) => ({ opacity: pop(delay), transform: `translateY(${interpolate(pop(delay), [0, 1], [30, 0])}px)` });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 28, paddingBottom: 120 }}>
      <Img src={staticFile("icons/icon-512.png")} style={{ width: 260, height: 260, borderRadius: 64, transform: `scale(${pop(0)})`, boxShadow: "0 30px 80px rgba(0,0,0,.4)" }} />
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 150, lineHeight: 1, color: C.cream, textTransform: "lowercase", ...rise(8) }}>baseline</div>
      <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 46, color: C.yellow, letterSpacing: "0.16em", textTransform: "uppercase", ...rise(14) }}>by Arvoredo</div>
      <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 56, color: C.cream, marginTop: 40, ...rise(28) }}>Grátis. Sem anúncios.</div>
      <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 44, color: C.orange, ...rise(40) }}>@arvoredo.basquetebol</div>
    </AbsoluteFill>
  );
}
```

- [ ] **Step 5: `Video.tsx`, `Root.tsx`, `index.ts`**

`promo/src/Video.tsx`:

```tsx
import type { FC } from "react";
import { AbsoluteFill, Audio, Series, staticFile } from "remotion";
import { FadeIn } from "./components/FadeIn.tsx";
import { Abertura } from "./scenes/Abertura.tsx";
import { Final } from "./scenes/Final.tsx";
import { C } from "./theme.ts";
import { sceneSlots, type SceneId } from "./timeline.ts";

export const SCENES: Partial<Record<SceneId, FC>> = { abertura: Abertura, final: Final };

export function Video() {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 28%, ${C.raised} 0%, ${C.mare} 45%, ${C.deep} 100%)` }}>
      <Series>
        {sceneSlots().map((slot) => {
          const Scene = SCENES[slot.id];
          return (
            <Series.Sequence key={slot.id} durationInFrames={slot.durationInFrames}>
              <FadeIn>{Scene ? <Scene /> : null}</FadeIn>
            </Series.Sequence>
          );
        })}
      </Series>
      <Audio src={staticFile("trilha.wav")} />
    </AbsoluteFill>
  );
}
```

`promo/src/Root.tsx`:

```tsx
import { Composition } from "remotion";
import { Video } from "./Video.tsx";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./timeline.ts";
import "./theme.ts";

export const Root = () => <Composition id="Baseline" component={Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />;
```

`promo/src/index.ts`:

```ts
import { registerRoot } from "remotion";
import { Root } from "./Root.tsx";

registerRoot(Root);
```

- [ ] **Step 6: Renderizar quadros da abertura e do final e olhar**

Run: `cd promo && npx remotion still src/index.ts Baseline out/q-abertura.png --frame=60 && npx remotion still src/index.ts Baseline out/q-final.png --frame=760`
Expected: dois PNG 1080×1920. Abrir com Read: a bola aparece acima da sombra; as duas linhas da abertura aparecem com acentos; no final, ícone, "baseline", "BY ARVOREDO", "Grátis. Sem anúncios." e "@arvoredo.basquetebol", tudo entre y=120 e y=1670.

---

### Task 5: Cenas do app (celular, toques, confete)

**Files:**
- Create: `promo/src/components/{Phone,Tap,Confetti}.tsx`, `promo/src/scenes/{Treinos,Treino,Evolucao,Perfis}.tsx`
- Modify: `promo/src/Video.tsx` (registrar as quatro cenas em `SCENES`)

**Interfaces:**
- Consumes: `Caption`, `Tagline`, `C` (Task 4); `public/captures/*.png` e `public/captures/pontos.json` (Task 3).
- Produces: `<Phone shots={{ src: string; at: number }[]} y? scale? x?>` com filhos em coordenadas da tela; `<Tap x y at>` em px CSS da captura (390×844); `<Confetti from>`.

- [ ] **Step 1: `promo/src/components/Phone.tsx`**

```tsx
import type { ReactNode } from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C } from "../theme.ts";

export const PHONE_W = 540;
const BEZEL = 14;
export const SCREEN_W = PHONE_W - BEZEL * 2;
export const SCREEN_H = Math.round((SCREEN_W * 844) / 390);
export const PHONE_H = SCREEN_H + BEZEL * 2;
/** Converte px CSS da captura (tela de 390 de largura) para px da tela do celular no vídeo. */
export const K = SCREEN_W / 390;

/** Celular com as capturas em sequência (troca com fade de 8 quadros). Filhos ficam por cima da tela. */
export function Phone({
  shots,
  x = (1080 - PHONE_W) / 2,
  y = 500,
  scale = 1,
  children,
}: {
  shots: { src: string; at: number }[];
  x?: number;
  y?: number;
  scale?: number;
  children?: ReactNode;
}) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: PHONE_W,
        height: PHONE_H,
        padding: BEZEL,
        borderRadius: 66,
        background: "#081a30",
        boxShadow: "0 40px 120px rgba(0,0,0,.45), inset 0 0 0 2px rgba(248,241,224,.12)",
        transform: `scale(${scale})`,
        transformOrigin: "50% 40%",
      }}
    >
      <div style={{ position: "relative", width: SCREEN_W, height: SCREEN_H, borderRadius: 52, overflow: "hidden", background: C.mare }}>
        {shots.map((shot) => (
          <Img
            key={`${shot.src}-${shot.at}`}
            src={staticFile(`captures/${shot.src}.png`)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: interpolate(frame, [shot.at, shot.at + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          />
        ))}
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `promo/src/components/Tap.tsx` e `Confetti.tsx`**

```tsx
import { interpolate, useCurrentFrame } from "remotion";
import { K } from "./Phone.tsx";

/** Toque do dedo: ponto que aparece 6 quadros antes e anel que se abre em `at`. Coordenadas em px CSS da captura. */
export function Tap({ x, y, at, toX, toY }: { x: number; y: number; at: number; toX?: number; toY?: number }) {
  const frame = useCurrentFrame();
  const show = interpolate(frame, [at - 6, at - 2, at + 10, at + 16], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const move = interpolate(frame, [at, at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cx = (x + ((toX ?? x) - x) * move) * K;
  const cy = (y + ((toY ?? y) - y) * move) * K;
  const ring = interpolate(frame, [at, at + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <div style={{ position: "absolute", left: cx - 30, top: cy - 30, width: 60, height: 60, borderRadius: "50%", background: "rgba(248,241,224,.55)", opacity: show }} />
      <div style={{ position: "absolute", left: cx - 30, top: cy - 30, width: 60, height: 60, borderRadius: "50%", border: "4px solid rgba(248,241,224,.9)", transform: `scale(${1 + ring * 1.4})`, opacity: (1 - ring) * show }} />
    </>
  );
}
```

```tsx
import { interpolate, random, useCurrentFrame } from "remotion";
import { C } from "../theme.ts";

const COLORS = [C.orange, C.yellow, C.coral, C.blue, C.cream];

/** Confete caindo a partir de `from`, igual para toda renderização (random com semente). */
export function Confetti({ from }: { from: number }) {
  const frame = useCurrentFrame() - from;
  if (frame < 0) return null;
  return (
    <>
      {Array.from({ length: 60 }, (_, i) => {
        const x = random(`x${i}`) * 1080;
        const delay = random(`d${i}`) * 12;
        const speed = 22 + random(`s${i}`) * 18;
        const t = Math.max(0, frame - delay);
        const y = -40 + t * speed;
        const spin = t * (8 + random(`r${i}`) * 10);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + Math.sin(t / 6 + i) * 30,
              top: y,
              width: 18,
              height: 30,
              borderRadius: 4,
              background: COLORS[i % COLORS.length],
              transform: `rotate(${spin}deg)`,
              opacity: interpolate(y, [1500, 1900], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          />
        );
      })}
    </>
  );
}
```

- [ ] **Step 3: As quatro cenas**

`promo/src/scenes/Treinos.tsx` (150 quadros):

```tsx
import { AbsoluteFill } from "remotion";
import { Caption } from "../components/Caption.tsx";
import { Phone } from "../components/Phone.tsx";
import { Tagline } from "../components/Tagline.tsx";
import { Tap } from "../components/Tap.tsx";
import pontos from "../../public/captures/pontos.json";

/** 3–8 s: prateleiras de treino, deslize para o lado, filtro "Sem cesta". */
export function Treinos() {
  const card = pontos.primeiroCartao;
  return (
    <AbsoluteFill>
      <Caption lines={["escolha o treino"]} from={4} />
      <Tagline text="com ou sem cesta" from={80} top={300} />
      <Phone
        shots={[
          { src: "treinos", at: -8 },
          { src: "treinos-deslize", at: 44 },
          { src: "treinos", at: 76 },
          { src: "treinos-sem-cesta", at: 96 },
        ]}
      >
        <Tap x={card.x + 90} y={card.y} toX={card.x - 110} toY={card.y} at={34} />
        <Tap x={pontos.semCesta.x} y={pontos.semCesta.y} at={90} />
      </Phone>
    </AbsoluteFill>
  );
}
```

`promo/src/scenes/Treino.tsx` (180 quadros). Se o Task 3 anotou que o vídeo não carregou em `treino-trabalho.png`, trocar a ordem para `treino-descanso` antes de `treino-trabalho`, sem mudar o texto:

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption.tsx";
import { Phone } from "../components/Phone.tsx";
import { Tagline } from "../components/Tagline.tsx";
import { Tap } from "../components/Tap.tsx";
import pontos from "../../public/captures/pontos.json";

/** 8–14 s: detalhe do treino, toque em "Começar treino", exercício com vídeo e descanso. */
export function Treino() {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [30, 180], [1, 1.05], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill>
      <Caption lines={["vídeo do exercício", "na tela"]} from={4} accent={0} />
      <Tagline text="contagem e descanso guiados" from={110} top={400} />
      <Phone shots={[{ src: "detalhe", at: -8 }, { src: "treino-trabalho", at: 30 }, { src: "treino-descanso", at: 118 }]} y={520} scale={zoom}>
        <Tap x={pontos.comecarTreino.x} y={pontos.comecarTreino.y} at={24} />
      </Phone>
    </AbsoluteFill>
  );
}
```

`promo/src/scenes/Evolucao.tsx` (150 quadros):

```tsx
import { AbsoluteFill } from "remotion";
import { Caption } from "../components/Caption.tsx";
import { Confetti } from "../components/Confetti.tsx";
import { Phone } from "../components/Phone.tsx";
import { Tagline } from "../components/Tagline.tsx";

/** 14–19 s: meta batida e mapa de fundamentos, com confete. */
export function Evolucao() {
  return (
    <AbsoluteFill>
      <Caption lines={["veja sua evolução"]} from={4} />
      <Tagline text="sem comparar com ninguém" from={60} top={300} />
      <Phone shots={[{ src: "evolucao", at: -8 }]} />
      <Confetti from={30} />
    </AbsoluteFill>
  );
}
```

`promo/src/scenes/Perfis.tsx` (90 quadros):

```tsx
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption.tsx";
import { Phone, PHONE_W } from "../components/Phone.tsx";
import { Tagline } from "../components/Tagline.tsx";

/** 19–22 s: "Quem vai treinar?" com Rafa e Léo; o celular entra pela direita. */
export function Perfis() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 15 } });
  return (
    <AbsoluteFill>
      <Caption lines={["para você", "e para as crianças"]} from={2} accent={1} />
      <Tagline text="a partir de 6 anos" from={36} top={400} />
      <Phone shots={[{ src: "quem-treina", at: -8 }]} y={520} x={interpolate(enter, [0, 1], [1080, (1080 - PHONE_W) / 2])} />
    </AbsoluteFill>
  );
}
```

- [ ] **Step 4: Registrar as cenas em `Video.tsx`**

Substituir a linha de `SCENES` e os imports das cenas por:

```tsx
import { Abertura } from "./scenes/Abertura.tsx";
import { Evolucao } from "./scenes/Evolucao.tsx";
import { Final } from "./scenes/Final.tsx";
import { Perfis } from "./scenes/Perfis.tsx";
import { Treino } from "./scenes/Treino.tsx";
import { Treinos } from "./scenes/Treinos.tsx";

export const SCENES: Record<SceneId, FC> = { abertura: Abertura, treinos: Treinos, treino: Treino, evolucao: Evolucao, perfis: Perfis, final: Final };
```

E, no corpo, trocar `{Scene ? <Scene /> : null}` por `<Scene />`.

- [ ] **Step 5: Quadros de cada cena e olhar**

Run: `cd promo && for f in 150 262 400 520 620; do npx remotion still src/index.ts Baseline out/q-$f.png --frame=$f; done`
Expected: 5 PNG. Abrir cada um com Read: legenda legível em cima, celular inteiro entre y≈500 e y≈1660, toque sobre o elemento certo (deslize sobre o primeiro cartão em 150; em 262 o detalhe do treino com o anel sobre "Começar treino"), confete em 520, celular centralizado em 620.

---

### Task 6: Render final, verificação e entrega

**Files:**
- Modify: `docs/CONTINUIDADE.md` (seção nova "Vídeo de divulgação")

- [ ] **Step 1: Renderizar**

Run: `cd promo && npm test && npm run render`
Expected: testes passando e `out/baseline-9x16.mp4` gerado.

- [ ] **Step 2: Conferir o arquivo**

Run: `ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration,size -of compact promo/out/baseline-9x16.mp4`
Expected: vídeo `h264` 1080×1920 a `30/1`, áudio `aac`, duração 26 s, tamanho abaixo de 15 MB.

- [ ] **Step 3: Um quadro por cena e olhar**

Run: `cd promo/out && for t in 1.8 6.5 11 16.5 20.8 24.8; do ffmpeg -v error -y -ss $t -i baseline-9x16.mp4 -frames:v 1 quadro-$t.png; done`
Expected: 6 PNG. Abrir com Read e conferir acentos ("você", "evolução", "exercício", "Grátis", "anúncios"), área segura e se o vídeo do YouTube aparece ou não na cena do treino. Se não aparecer, a cena mostra a contagem: está de acordo com a especificação.

- [ ] **Step 4: Registrar em `docs/CONTINUIDADE.md`**

Acrescentar, depois da seção 6 (Demonstração):

```markdown
## 6.1 Vídeo de divulgação

- Pasta `promo/` (isolada do app): Remotion + Playwright + trilha gerada por código. Especificação em `docs/superpowers/specs/2026-09-24-video-divulgacao-design.md`.
- Para gerar de novo: na raiz `npm run build:demo`; em `promo/`: `npm install`, `npx playwright install chromium`, `npm run capture`, `npm run soundtrack`, `npm run render`. Sai em `promo/out/baseline-9x16.mp4`.
- Sem fotos de pessoas reais; tela final sem link do site até o SMTP próprio estar configurado.
```

- [ ] **Step 5: Entregar ao dono**

Carregar a skill `artifact-design` e publicar uma página curta "Vídeo Baseline" com `<video controls playsinline>` apontando para `baseline-9x16.mp4` (publicado em `files`) e um link de download. Mandar o link. Commit só depois do "pode" do dono.
