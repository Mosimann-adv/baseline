/** Faixa dos perfis de crianças e adolescentes. */
export const MIN_AGE = 6;
export const MAX_AGE = 17;
/** Perfil próprio do dono da conta (adulto 18+ ou adolescente 16–17). */
export const ADULT_MIN_AGE = 18;
export const SELF_MIN_AGE = 16;
const ADULT_MAX_AGE = 90;

export type AgeBandId = "6-8" | "9-11" | "12-14" | "15-17" | "adulto";

export interface AgeBand {
  id: AgeBandId;
  label: string;
  focus: string;
}

const BANDS: readonly AgeBand[] = [
  { id: "6-8", label: "Iniciação", focus: "Coordenação, domínio de bola e jogos com bola" },
  { id: "9-11", label: "Minibasquete", focus: "Drible com as duas mãos, bandeja, passe e jogos reduzidos" },
  { id: "12-14", label: "Fundamentos", focus: "Arremesso, mão fraca, leitura de jogo e físico com o peso do corpo" },
  { id: "15-17", label: "Desenvolvimento", focus: "Velocidade, salto e força com supervisão" },
  { id: "adulto", label: "Adulto", focus: "Arremesso, mão fraca, velocidade e salto, no seu ritmo" },
];

// Guardamos só o ano de nascimento (coleta mínima), então a idade é a que a pessoa completa neste ano.
export function ageThisYear(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear;
}

export function bandFor(age: number): AgeBand | null {
  if (age < MIN_AGE) return null;
  if (age <= 8) return BANDS[0];
  if (age <= 11) return BANDS[1];
  if (age <= 14) return BANDS[2];
  if (age <= 17) return BANDS[3];
  return BANDS[4];
}

/** Na v1 a faixa Adulto usa os treinos e testes de 15–17 (decisão do dono do projeto, 2026-09-12). */
export function contentBand(band: AgeBandId): AgeBandId {
  return band === "adulto" ? "15-17" : band;
}

export function allowedBirthYears(now = new Date()): number[] {
  const year = now.getFullYear();
  return Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => year - MIN_AGE - i);
}

export function adultBirthYears(now = new Date()): number[] {
  const year = now.getFullYear();
  return Array.from({ length: ADULT_MAX_AGE - ADULT_MIN_AGE + 1 }, (_, i) => year - ADULT_MIN_AGE - i);
}

/** Anos para perfil próprio: 16 a 90 (adolescente com conta própria e adulto). */
export function selfBirthYears(now = new Date()): number[] {
  const year = now.getFullYear();
  return Array.from({ length: ADULT_MAX_AGE - SELF_MIN_AGE + 1 }, (_, i) => year - SELF_MIN_AGE - i);
}
