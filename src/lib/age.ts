export const MIN_AGE = 6;
export const MAX_AGE = 17;

export interface AgeBand {
  id: "6-8" | "9-11" | "12-14" | "15-17";
  label: string;
  focus: string;
}

const BANDS: readonly AgeBand[] = [
  { id: "6-8", label: "Iniciação", focus: "Coordenação, domínio de bola e jogos com bola" },
  { id: "9-11", label: "Minibasquete", focus: "Drible com as duas mãos, bandeja, passe e jogos reduzidos" },
  { id: "12-14", label: "Fundamentos", focus: "Arremesso, mão fraca, leitura de jogo e físico com o peso do corpo" },
  { id: "15-17", label: "Desenvolvimento", focus: "Velocidade, salto e força com supervisão" },
];

// Guardamos só o ano de nascimento (coleta mínima), então a idade é a que o atleta completa neste ano.
export function ageThisYear(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear;
}

export function bandFor(age: number): AgeBand | null {
  if (age < MIN_AGE || age > MAX_AGE) return null;
  if (age <= 8) return BANDS[0];
  if (age <= 11) return BANDS[1];
  if (age <= 14) return BANDS[2];
  return BANDS[3];
}

export function allowedBirthYears(now = new Date()): number[] {
  const year = now.getFullYear();
  return Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => year - MIN_AGE - i);
}
