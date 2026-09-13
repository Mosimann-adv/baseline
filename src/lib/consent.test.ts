import { describe, expect, it } from "vitest";
import { CONSENT_VERSION, SELF_CONSENT_VERSION, TEEN_CONSENT_VERSION, activeConsent, consentVersionFor, isTeenSelf } from "./consent";
import type { Athlete, Consent } from "./types";

const athlete = (over: Partial<Athlete> = {}): Athlete => ({
  id: "a1",
  guardian_id: "g1",
  nickname: "Ju",
  birth_year: 2015,
  level: "iniciante",
  position: null,
  weekly_goal: 3,
  is_self: false,
  created_at: "2026-01-01",
  ...over,
});

const consent = (over: Partial<Consent>): Consent =>
  ({ id: "c1", athlete_id: "a1", document_version: CONSENT_VERSION, accepted_at: "2026-01-01T00:00:00Z", revoked_at: null, ...over });

describe("isTeenSelf", () => {
  it("perfil próprio de 16–17 é teen; 18+ é adulto", () => {
    expect(isTeenSelf({ is_self: true, birth_year: 2010 })).toBe(true);
    expect(isTeenSelf({ is_self: true, birth_year: 2008 })).toBe(false);
    expect(isTeenSelf({ is_self: false, birth_year: 2010 })).toBe(false);
  });
});

describe("consentVersionFor", () => {
  it("menor usa o termo de responsável", () => {
    expect(consentVersionFor({ is_self: false, birth_year: 2015 })).toBe(CONSENT_VERSION);
  });

  it("perfil próprio muda o termo aos 18 anos", () => {
    expect(consentVersionFor({ is_self: true, birth_year: 2010 })).toBe(TEEN_CONSENT_VERSION);
    expect(consentVersionFor({ is_self: true, birth_year: 2008 })).toBe(SELF_CONSENT_VERSION);
  });
});

describe("activeConsent", () => {
  it("aceite da versão atual e não revogado vale", () => {
    const list = [consent({})];
    expect(activeConsent(list, athlete())?.document_version).toBe(CONSENT_VERSION);
  });

  it("aceite revogado não vale, mesmo na versão atual", () => {
    const list = [consent({ revoked_at: "2026-02-01T00:00:00Z" })];
    expect(activeConsent(list, athlete())).toBeUndefined();
  });

  it("aceite de versão antiga do termo não vale (perfil fica bloqueado)", () => {
    const list = [consent({ document_version: "2025-01-velha" })];
    expect(activeConsent(list, athlete())).toBeUndefined();
  });

  it("perfil próprio de adulto exige o termo de adulto, não o de menor", () => {
    const adult = athlete({ is_self: true, birth_year: 1990 });
    expect(activeConsent([consent({})], adult)).toBeUndefined();
    expect(activeConsent([consent({ document_version: SELF_CONSENT_VERSION })], adult)).toBeDefined();
  });

  it("adolescente que completou 18 precisa do termo de adulto", () => {
    const turnedAdult = athlete({ is_self: true, birth_year: 2008 });
    expect(activeConsent([consent({ document_version: TEEN_CONSENT_VERSION })], turnedAdult)).toBeUndefined();
    expect(activeConsent([consent({ document_version: SELF_CONSENT_VERSION })], turnedAdult)).toBeDefined();
  });
});
