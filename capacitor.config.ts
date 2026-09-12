import type { CapacitorConfig } from "@capacitor/cli";

// appId é permanente depois da primeira publicação no Google Play: confirmar antes de publicar.
const config: CapacitorConfig = {
  appId: "br.org.arvoredo.baseline",
  appName: "Baseline",
  webDir: "dist",
  android: { allowMixedContent: false },
};

export default config;
