import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY, C, DISPLAY } from "../theme.ts";

/** 22–26 s: ícone, marca, "Grátis. Sem anúncios." e o Instagram do Instituto. */
export function Final() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = (delay: number) => spring({ frame: frame - delay, fps, config: { damping: 12, mass: 0.6 } });
  const rise = (delay: number) => ({ opacity: pop(delay), transform: `translateY(${interpolate(pop(delay), [0, 1], [30, 0])}px)` });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 28, paddingBottom: 120 }}>
      <Img src={staticFile("icons/icon-512.png")} style={{ width: 260, height: 260, borderRadius: 64, transform: `scale(${pop(0)})`, boxShadow: "0 30px 80px rgba(0,0,0,.4)" }} />
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 150, lineHeight: 1, color: C.cream, textTransform: "lowercase", ...rise(8) }}>baseline</div>
      <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 46, color: C.yellow, letterSpacing: "0.16em", textTransform: "uppercase", ...rise(14) }}>by Arvoredo</div>
      <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 56, color: C.cream, marginTop: 40, ...rise(28) }}>Grátis. Sem anúncios.</div>
      <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 44, color: C.orange, ...rise(40) }}>@arvoredo.basquetebol</div>
    </AbsoluteFill>
  );
}
