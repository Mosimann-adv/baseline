import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption.tsx";
import { Phone } from "../components/Phone.tsx";
import { Tap } from "../components/Tap.tsx";
import pontos from "../../public/captures/pontos.json";

/** 8–14 s: detalhe do treino, toque em "Começar treino", exercício com vídeo e o próximo com contagem. */
export function Treino() {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [30, 180], [0.93, 0.96], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill>
      <Caption lines={["vídeo do exercício", "na tela"]} from={4} accent={0} sub={{ text: "contagem e dica em cada exercício", from: 110 }} />
      <Phone shots={[{ src: "detalhe", at: -8 }, { src: "treino-trabalho", at: 30 }, { src: "treino-descanso", at: 118 }]} y={560} scale={zoom}>
        <Tap x={pontos.comecarTreino.x} y={pontos.comecarTreino.y} at={24} />
      </Phone>
    </AbsoluteFill>
  );
}
