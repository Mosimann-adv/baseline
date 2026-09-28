import { AbsoluteFill } from "remotion";
import { Caption } from "../components/Caption.tsx";
import { Confetti } from "../components/Confetti.tsx";
import { Phone } from "../components/Phone.tsx";

/** 14–19 s: meta batida e mapa de fundamentos, com confete. */
export function Evolucao() {
  return (
    <AbsoluteFill>
      <Caption lines={["veja sua evolução"]} from={4} sub={{ text: "sem comparar com ninguém", from: 60 }} />
      <Phone shots={[{ src: "evolucao", at: -8 }]} y={470} />
      <Confetti from={30} />
    </AbsoluteFill>
  );
}
