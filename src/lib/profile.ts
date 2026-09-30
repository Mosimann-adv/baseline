import type { Level, Position } from "./types";

export const LEVELS: readonly { value: Level; label: string }[] = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

export const LEVEL_HINTS: Record<Level, string> = {
  iniciante: "Está começando ou retomando: pratique os movimentos básicos, um passo por vez.",
  intermediario: "Já pratica e consegue driblar, passar e arremessar com familiaridade.",
  avancado: "Treina com frequência e já combina movimentos com controle e ritmo.",
};

export const POSITIONS: readonly { value: Position; label: string }[] = [
  { value: "armador", label: "Armador" },
  { value: "ala", label: "Ala" },
  { value: "pivo", label: "Pivô" },
];
