import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

/** Entrada de cena: 6 quadros de fade. */
export function FadeIn({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
}
