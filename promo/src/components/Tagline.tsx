import { interpolate, useCurrentFrame } from "remotion";
import { BODY, C } from "../theme.ts";

/** Linha de apoio na Poppins, logo abaixo do título: entra com fade e leve subida. */
export function Tagline({ text, from, color = C.yellow }: { text: string; from: number; color?: string }) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, from + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ marginTop: 18, fontFamily: BODY, fontWeight: 600, fontSize: 44, lineHeight: 1.25, color, opacity: t, transform: `translateY(${(1 - t) * 16}px)` }}>
      {text}
    </div>
  );
}
