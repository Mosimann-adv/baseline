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
  /** Meta em vigor por semana; as anteriores não mudam ao ajustar a atual. */
  goal_history?: Record<string, number>;
  earned_badges?: string[];
  /** Perfil do próprio dono da conta (16+). Os demais são de crianças e adolescentes. */
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
export type AthletePatch = Partial<Pick<Athlete, "nickname" | "birth_year" | "level" | "position" | "weekly_goal" | "earned_badges">>;

export type Category = "drible" | "arremesso" | "passe" | "defesa" | "fisico";

export interface Drill {
  id: string;
  name: string;
  /** Instrução curta, lida durante o exercício. */
  cue: string;
  seconds: number;
  restSeconds: number;
  /** previewOnly: vídeo só na prévia antes do treino, porque não mostra o exercício em si. */
  video?: { id: string; start?: number; end?: number; title: string; previewOnly?: boolean };
  /** Dica de foco para os exercícios sem vídeo, em uma frase curtinha para a criança seguir. */
  focus?: string;
  /** Sessões compostas atribuem cada exercício ao seu bloco e fundamento. */
  blockId?: string;
  category?: Category;
}

/** "learn" permanece apenas para interpretar registros de versões anteriores. */
export type TrainingMode = "learn" | "train";

export interface SessionExecution {
  version: 1;
  contentVersion: string;
  kind: "block" | "session";
  mode: TrainingMode;
  seconds: number;
  completed: string[];
  blocks: { id: string; category: Category; done: number; total: number; seconds: number }[];
  /** Metadados históricos: trilhas não são oferecidas na experiência atual. */
  trailId?: string;
  trailStepId?: string;
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
  kind?: "block" | "session";
  contentVersion?: string;
  blocks?: { id: string; title: string; category: Category }[];
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
  execution?: SessionExecution | null;
  /** Só no aparelho: ainda não chegou no servidor. */
  pending?: boolean;
  pendingError?: string | null;
}

export interface NewSessionInput {
  /** O rascunho conserva o UUID: reenviar não duplica um treino. */
  id?: string;
  athleteId: string;
  programId: string;
  minutes: number;
  drillsDone: number;
  drillsTotal: number;
  feeling: number | null;
  discomfort: boolean;
  performedOn?: string;
  execution?: SessionExecution;
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
  pending?: boolean;
  pendingError?: string | null;
}

export interface NewTestInput {
  id?: string;
  athleteId: string;
  results: Record<string, number>;
}
