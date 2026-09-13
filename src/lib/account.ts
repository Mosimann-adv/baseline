import type { Session } from "@supabase/supabase-js";
import { ageThisYear } from "./age";

/** Conta própria a partir desta idade, com e-mail do responsável confirmando (16–17). */
export const ACCOUNT_MIN_AGE = 16;
export const ADULT_ACCOUNT_AGE = 18;

export type AccountKind = "adult" | "teen";

export interface AccountMeta {
  kind: AccountKind;
  birthYear: number | null;
  parentEmail: string | null;
}

export function kindFromBirthYear(birthYear: number, now = new Date()): AccountKind | null {
  const age = ageThisYear(birthYear, now);
  if (age >= ADULT_ACCOUNT_AGE && age <= 90) return "adult";
  if (age >= ACCOUNT_MIN_AGE && age < ADULT_ACCOUNT_AGE) return "teen";
  return null;
}

export function metaFromSession(session: Session | null): AccountMeta {
  const data = (session?.user.user_metadata ?? {}) as Record<string, unknown>;
  const birthYear = typeof data.birth_year === "number" ? data.birth_year : Number(data.birth_year) || null;
  const parentEmail = typeof data.parent_email === "string" ? data.parent_email : null;
  const stored = data.account_kind === "teen" || data.account_kind === "adult" ? data.account_kind : null;
  // A idade manda: quem cadastrou aos 17 vira adulto no ano em que completa 18.
  const inferred = birthYear ? kindFromBirthYear(birthYear) : null;
  return {
    kind: inferred ?? stored ?? "adult",
    birthYear,
    parentEmail,
  };
}

export function canCreateMinorProfiles(kind: AccountKind): boolean {
  return kind === "adult";
}
