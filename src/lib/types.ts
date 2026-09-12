export type Level = "iniciante" | "intermediario" | "avancado";
export type Position = "armador" | "ala" | "pivo";

export interface Athlete {
  id: string;
  guardian_id: string;
  nickname: string;
  birth_year: number;
  level: Level;
  position: Position | null;
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
