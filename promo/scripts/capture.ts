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

const server = spawn(`npx vite preview --outDir dist-demo --port ${PORT} --strictPort`, {
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
