/** Dados públicos do Instituto Arvoredo, iguais ao site arvoredobasquete.pages.dev. */

export const INSTITUTE_NAME = "Instituto Arvoredo";
/** CNPJ formatado, para textos legais. */
export const INSTITUTE_CNPJ = "56.660.275/0001-06";
/** Chave Pix (CNPJ sem pontuação), para copiar e para o QR. */
export const PIX_KEY = "56660275000106";

/** Endereço público do app (Vercel). Usado na página do responsável e no Google Play. */
export const APP_WEB = "https://baseline-six-sigma.vercel.app";

export const SUPPORT = {
  site: "https://arvoredobasquete.pages.dev/",
  donate: "https://arvoredobasquete.pages.dev/#doar",
  sponsor: "https://arvoredobasquete.pages.dev/#patrocinio",
  whatsapp: "https://wa.me/554896641051",
  whatsappLabel: "(48) 9664-1051",
  instagram: "https://www.instagram.com/arvoredo.basquetebol/",
  instagramLabel: "@arvoredo.basquetebol",
} as const;

/** Hash público (`privacidade`, `confirmar-responsavel`…). No app nativo usa o site, não o localhost. */
export function appPublicUrl(hash: string): string {
  const path = hash.replace(/^#\/?/, "");
  const origin = typeof window !== "undefined" ? window.location.origin : APP_WEB;
  const use = !origin || /localhost|127\.0\.0\.1|capacitor|android/i.test(origin) ? APP_WEB : origin;
  return `${use}/#/${path}`;
}
