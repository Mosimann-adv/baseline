import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Ball } from "../components/Ball.tsx";
import { Caption } from "../components/Caption.tsx";
import { ballHeight, squash } from "../bounce.ts";
import { BALL_LANDINGS } from "../timeline.ts";

const SIZE = 240;
const GROUND = 1500;
const PEAK = 460;

/** 0–3 s: a bola quica; o 1º toque revela "treino de basquete" e o 3º, "onde você estiver". */
export function Abertura() {
  const frame = useCurrentFrame();
  const height = ballHeight(frame, BALL_LANDINGS, PEAK);
  const amount = squash(frame, BALL_LANDINGS);
  const shadow = 0.35 + 0.65 * (1 - height / PEAK);
  return (
    <AbsoluteFill>
      <Caption lines={["treino de basquete", "onde você estiver"]} from={BALL_LANDINGS[0]} stagger={BALL_LANDINGS[2] - BALL_LANDINGS[0]} top={260} size={100} accent={1} />
      <div style={{ position: "absolute", left: 540 - SIZE * 0.45, top: GROUND - 10, width: SIZE * 0.9, height: 34, borderRadius: "50%", background: "rgba(11,35,64,.6)", transform: `scaleX(${shadow})`, opacity: shadow }} />
      <div style={{ position: "absolute", left: 540 - SIZE / 2, top: GROUND - SIZE - height }}>
        <Ball size={SIZE} squashAmount={amount} rotate={frame * 6} />
      </div>
    </AbsoluteFill>
  );
}
