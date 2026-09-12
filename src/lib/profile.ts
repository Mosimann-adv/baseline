import type { Level, Position } from "./types";

export const LEVELS: readonly { value: Level; label: string }[] = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

export const POSITIONS: readonly { value: Position; label: string }[] = [
  { value: "armador", label: "Armador" },
  { value: "ala", label: "Ala" },
  { value: "pivo", label: "Pivô" },
];
