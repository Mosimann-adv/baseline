import type { FC } from "react";
import { AbsoluteFill, Audio, Series, staticFile } from "remotion";
import { FadeIn } from "./components/FadeIn.tsx";
import { Abertura } from "./scenes/Abertura.tsx";
import { Evolucao } from "./scenes/Evolucao.tsx";
import { Final } from "./scenes/Final.tsx";
import { Perfis } from "./scenes/Perfis.tsx";
import { Treino } from "./scenes/Treino.tsx";
import { Treinos } from "./scenes/Treinos.tsx";
import { C } from "./theme.ts";
import { sceneSlots, type SceneId } from "./timeline.ts";

export const SCENES: Record<SceneId, FC> = { abertura: Abertura, treinos: Treinos, treino: Treino, evolucao: Evolucao, perfis: Perfis, final: Final };

export function Video() {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 28%, ${C.raised} 0%, ${C.mare} 45%, ${C.deep} 100%)` }}>
      <Series>
        {sceneSlots().map((slot) => {
          const Scene = SCENES[slot.id];
          return (
            <Series.Sequence key={slot.id} durationInFrames={slot.durationInFrames}>
              <FadeIn>
                <Scene />
              </FadeIn>
            </Series.Sequence>
          );
        })}
      </Series>
      <Audio src={staticFile("trilha.wav")} />
    </AbsoluteFill>
  );
}
