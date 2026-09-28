export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export type SceneId = "abertura" | "treinos" | "treino" | "evolucao" | "perfis" | "final";

/** Roteiro aprovado: segundos de cada cena, na ordem. */
const SCENE_SECONDS: ReadonlyArray<readonly [SceneId, number]> = [
  ["abertura", 3],
  ["treinos", 5],
  ["treino", 6],
  ["evolucao", 5],
  ["perfis", 3],
  ["final", 4],
];

export interface SceneSlot {
  id: SceneId;
  from: number;
  durationInFrames: number;
}

export function sceneSlots(): SceneSlot[] {
  let from = 0;
  return SCENE_SECONDS.map(([id, seconds]) => {
    const slot = { id, from, durationInFrames: Math.round(seconds * FPS) };
    from += slot.durationInFrames;
    return slot;
  });
}

export const TOTAL_FRAMES = sceneSlots().reduce((total, slot) => total + slot.durationInFrames, 0);

/** 100 BPM a 30 fps: um tempo a cada 18 quadros. */
export const BEAT_FRAMES = 18;

/** Quadros em que a bola da abertura toca o chão (um por tempo). */
export const BALL_LANDINGS = [18, 36, 54, 72] as const;
