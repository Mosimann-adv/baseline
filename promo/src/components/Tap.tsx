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
