import { AbsoluteFill } from "remotion";
import { Caption } from "../components/Caption.tsx";
import { Phone } from "../components/Phone.tsx";
import { Tap } from "../components/Tap.tsx";
import pontos from "../../public/captures/pontos.json";

/** 3–8 s: prateleiras de treino, deslize para o lado, filtro "Sem cesta". */
export function Treinos() {
  const card = pontos.primeiroCartao;
  return (
    <AbsoluteFill>
      <Caption lines={["escolha o treino"]} from={4} sub={{ text: "com ou sem cesta", from: 80 }} />
      <Phone
        y={470}
        shots={[
          { src: "treinos", at: -8 },
          { src: "treinos-deslize", at: 44 },
          { src: "treinos", at: 76 },
          { src: "treinos-sem-cesta", at: 96 },
        ]}
      >
        <Tap x={card.x + 90} y={card.y} toX={card.x - 110} toY={card.y} at={34} />
        <Tap x={pontos.semCesta.x} y={pontos.semCesta.y} at={90} />
      </Phone>
    </AbsoluteFill>
  );
}
