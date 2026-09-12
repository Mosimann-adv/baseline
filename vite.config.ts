import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./": o Capacitor carrega os arquivos de dentro do app, então os caminhos precisam ser relativos.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "dist", target: "es2022" },
});
