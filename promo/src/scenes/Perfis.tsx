import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption.tsx";
import { Phone, PHONE_W } from "../components/Phone.tsx";

/** 19–22 s: "Quem vai treinar?" com Rafa e Léo; o celular entra pela direita. */
export function Perfis() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 15 } });
  return (
    <AbsoluteFill>
      <Caption lines={["para você", "e para as crianças"]} from={2} accent={1} sub={{ text: "a partir de 6 anos", from: 36 }} />
      <Phone shots={[{ src: "quem-treina", at: -8 }]} y={560} scale={0.94} x={interpolate(enter, [0, 1], [1080, (1080 - PHONE_W) / 2])} />
    </AbsoluteFill>
  );
}
