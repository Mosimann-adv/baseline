import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, DISPLAY } from "../theme.ts";
import { Tagline } from "./Tagline.tsx";

/** Título grande na Breymont, uma linha por vez, subindo com mola; `sub` é a linha de apoio logo abaixo. */
export function Caption({
  lines,
  from = 0,
  stagger = 6,
  top = 150,
  size = 88,
  accent,
  sub,
}: {
  lines: string[];
  from?: number;
  stagger?: number;
  top?: number;
  size?: number;
  accent?: number;
  sub?: { text: string; from: number };
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top, display: "flex", flexDirection: "column", gap: 8 }}>
      {lines.map((line, i) => {
        const s = spring({ frame: frame - from - i * stagger, fps, config: { damping: 14, mass: 0.7 } });
        return (
          <div
            key={line}
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: size,
              lineHeight: 1.02,
              textTransform: "lowercase",
              color: i === accent ? C.orange : C.cream,
              opacity: s,
              transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
            }}
          >
            {line}
          </div>
        );
      })}
      {sub && <Tagline text={sub.text} from={sub.from} />}
    </div>
  );
}
