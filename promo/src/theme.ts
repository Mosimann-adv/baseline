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
