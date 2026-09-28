import { interpolate, random, useCurrentFrame } from "remotion";
import { C } from "../theme.ts";

const COLORS = [C.orange, C.yellow, C.coral, C.blue, C.cream];

/** Confete caindo a partir de `from`, igual para toda renderização (random com semente). */
export function Confetti({ from }: { from: number }) {
  const frame = useCurrentFrame() - from;
  if (frame < 0) return null;
  return (
    <>
      {Array.from({ length: 60 }, (_, i) => {
        const x = random(`x${i}`) * 1080;
        const delay = random(`d${i}`) * 12;
        const speed = 22 + random(`s${i}`) * 18;
        const t = Math.max(0, frame - delay);
        const y = -40 + t * speed;
        const spin = t * (8 + random(`r${i}`) * 10);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + Math.sin(t / 6 + i) * 30,
              top: y,
              width: 18,
              height: 30,
              borderRadius: 4,
              background: COLORS[i % COLORS.length],
              transform: `rotate(${spin}deg)`,
              opacity: interpolate(y, [1500, 1900], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          />
        );
      })}
    </>
  );
}
