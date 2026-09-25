import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

declare const process: { env: Record<string, string | undefined> };

// Variável de ambiente tem prioridade sobre o .env.production, inclusive vazia. Na Vercel as duas
// foram cadastradas sem valor e o site saiu sem Supabase; vazias, elas são ignoradas aqui.
for (const key of ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]) {
  if (process.env[key]?.trim() === "") delete process.env[key];
}

// base "./": o Capacitor carrega os arquivos de dentro do app, então os caminhos precisam ser relativos.
// Vendor em chunks próprios: react e supabase raramente mudam entre deploys, então ficam no cache do navegador.
export default defineConfig({
  plugins: [react()],
  base: "./",
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
