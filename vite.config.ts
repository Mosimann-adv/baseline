import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

declare const process: { env: Record<string, string | undefined> };

// Versão do package.json vira __APP_VERSION__ no bundle (mostrada na tela Conta, para suporte).
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

// Variável de ambiente tem prioridade sobre o .env.production, inclusive vazia. Na Vercel as duas
// foram cadastradas sem valor e o site saiu sem Supabase; vazias, elas são ignoradas aqui.
for (const key of ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]) {
  if (process.env[key]?.trim() === "") delete process.env[key];
}

// base "./": o Capacitor carrega os arquivos de dentro do app, então os caminhos precisam ser relativos.
// Vendor em chunks próprios: react e supabase raramente mudam entre deploys, então ficam no cache do navegador.
export default defineConfig({
  plugins: [react(), {
    name: "baseline-offline",
    apply: "build",
    generateBundle(_options, bundle) {
      const assets = [...Object.keys(bundle), "index.html", "hero.webp", "pix-qr.png", "icons/icon-192.png", "icons/icon-512.png", "icons/favicon-64.png"];
      const unique = [...new Set(assets)].filter((path) => !path.endsWith(".map"));
      const version = createHash("sha256").update(unique.sort().join("|")).digest("hex").slice(0, 12);
      const worker = readFileSync(new URL("./src/offline-worker.js", import.meta.url), "utf8");
      this.emitFile({ type: "asset", fileName: "offline-assets.json", source: JSON.stringify(unique) });
      this.emitFile({ type: "asset", fileName: "sw.js", source: worker.replace("__CACHE_VERSION__", version) });
    },
  }],
  base: "./",
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: {
    outDir: "dist",
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("scheduler")) return "vendor-react";
          return undefined;
        },
      },
    },
  },
});
