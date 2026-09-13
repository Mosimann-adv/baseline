import type { AgeBandId } from "./age";

export type Level = "iniciante" | "intermediario" | "avancado";
export type Position = "armador" | "ala" | "pivo";

export interface Athlete {
  id: string;
  guardian_id: string;
  nickname: string;
  birth_year: number;
  level: Level;
  position: Position | null;
  /** Treinos por semana definidos pelo responsável (1 a 7). */
  weekly_goal: number;
  /** Perfil do próprio dono da conta (18+). Os demais são de crianças e adolescentes. */
  is_self: boolean;
  created_at: string;
}

export interface Consent {
  id: string;
  athlete_id: string;
  document_version: string;
  accepted_at: string;
  revoked_at: string | null;
}

export interface NewAthleteInput {
  nickname: string;
  birthYear: number;
  level: Level;
  position: Position | null;
}

/** Correções que o responsável pode fazer no perfil. */
export type AthletePatch = Partial<Pick<Athlete, "nickname" | "birth_year" | "level" | "position" | "weekly_goal">>;

export type Category = "drible" | "arremesso" | "passe" | "defesa" | "fisico";

export interface Drill {
  id: string;
  name: string;
  /** Instrução curta, lida durante o exercício. */
  cue: string;
  seconds: number;
  restSeconds: number;
  video?: { id: string; start?: number; title: string };
}

export interface Program {
  id: string;
  title: string;
  summary: string;
  category: Category;
  bands: AgeBandId[];
  levels: Level[];
  equipment: string;
  drills: Drill[];
}

export interface TrainingSession {
  id: string;
  guardian_id: string;
  athlete_id: string;
  program_id: string;
  performed_on: string;
  minutes: number;
  drills_done: number;
  drills_total: number;
  feeling: number | null;
  discomfort: boolean;
  created_at: string;
}

export interface NewSessionInput {
  athleteId: string;
  programId: string;
  minutes: number;
  drillsDone: number;
  drillsTotal: number;
  feeling: number | null;
  discomfort: boolean;
}

export interface SkillTestDef {
  id: string;
  name: string;
  unit: string;
  /** "max": quanto maior, melhor. "min": quanto menor, melhor (tempos). */
  better: "max" | "min";
  bands: AgeBandId[];
  /** Como medir, em linguagem simples. */
  protocol: string;
  min: number;
  max: number;
  step: "int" | "decimal";
}

export interface SkillTestRecord {
  id: string;
  guardian_id: string;
  athlete_id: string;
  tested_on: string;
  results: Record<string, number>;
  created_at: string;
}

export interface NewTestInput {
  athleteId: string;
  results: Record<string, number>;
}
