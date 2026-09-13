import type { Athlete, Consent } from "./types";
import { ageThisYear } from "./age";

// RASCUNHO — textos pendentes de revisão jurídica. Mudou um texto? Troque a versão dele:
// cada aceite fica gravado com a versão aceita, e perfil sem aceite da versão atual fica bloqueado.

/** Autorização de mãe, pai ou responsável legal para o perfil de uma criança ou adolescente (LGPD art. 14). */
export const CONSENT_VERSION = "2026-09-rascunho-2";

export const CONSENT_POINTS: readonly string[] = [
  "Guardamos só o apelido, o ano de nascimento, o nível e a posição do atleta.",
  "Os treinos e testes registrados, incluindo se algo doeu (só sim ou não), servem apenas para mostrar a evolução ao atleta e a você.",
  "Não mostramos anúncios, não vendemos dados e não usamos ferramentas de análise de terceiros.",
  "Os vídeos de treino abrem pelo YouTube no modo sem cookies.",
  "Você pode ver, revogar e apagar tudo a qualquer momento na tela Conta.",
];

/** Consentimento do próprio adulto para o perfil de treino dele: "algo doeu?" é dado de saúde (LGPD art. 11, I). */
export const SELF_CONSENT_VERSION = "2026-09-adulto-rascunho-1";

export const SELF_CONSENT_POINTS: readonly string[] = [
  "Guardamos seu apelido, ano de nascimento, nível, posição e meta de treinos.",
  "Seus treinos e testes, incluindo se algo doeu (só sim ou não), servem apenas para mostrar sua evolução.",
  "Não mostramos anúncios, não vendemos dados e não usamos ferramentas de análise de terceiros.",
  "Os vídeos de treino abrem pelo YouTube no modo sem cookies.",
  "Você pode revogar este consentimento e apagar tudo a qualquer momento na tela Conta.",
];

/** Adolescente 16–17 no perfil próprio: consentimento do titular (declaração de 16+ na conta). */
export const TEEN_CONSENT_VERSION = "2026-09-teen-rascunho-2";

export const TEEN_CONSENT_POINTS: readonly string[] = [
  "Você tem 16 ou 17 anos e treina no seu próprio perfil. Na conta, você declarou ter 16 anos ou mais.",
  "Guardamos seu apelido, ano de nascimento, nível, posição e meta de treinos.",
  "Seus treinos e testes, incluindo se algo doeu (só sim ou não), servem apenas para mostrar sua evolução. “Algo doeu?” é um dado de saúde: você consente.",
  "Não mostramos anúncios, não vendemos dados e não usamos ferramentas de análise de terceiros.",
  "Os vídeos de treino abrem pelo YouTube no modo sem cookies.",
  "Você pode revogar o aceite e apagar a conta a qualquer momento na tela Conta.",
];

export function isTeenSelf(athlete: Pick<Athlete, "is_self" | "birth_year">): boolean {
  return athlete.is_self && ageThisYear(athlete.birth_year) < 18;
}

export const consentVersionFor = (athlete: Pick<Athlete, "is_self" | "birth_year">) => {
  if (!athlete.is_self) return CONSENT_VERSION;
  return isTeenSelf(athlete) ? TEEN_CONSENT_VERSION : SELF_CONSENT_VERSION;
};

export const consentPointsFor = (athlete: Pick<Athlete, "is_self" | "birth_year">) => {
  if (!athlete.is_self) return CONSENT_POINTS;
  return isTeenSelf(athlete) ? TEEN_CONSENT_POINTS : SELF_CONSENT_POINTS;
};

/** Aceite válido: não revogado e da versão atual do termo daquele tipo de perfil. Sem ele, o perfil fica bloqueado. */
export function activeConsent(consents: Consent[], athlete: Pick<Athlete, "id" | "is_self" | "birth_year">): Consent | undefined {
  const version = consentVersionFor(athlete);
  return consents.find((c) => c.athlete_id === athlete.id && c.document_version === version && !c.revoked_at);
}
