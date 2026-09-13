import type { Athlete, Consent } from "./types";

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

export const consentVersionFor = (athlete: Pick<Athlete, "is_self">) => (athlete.is_self ? SELF_CONSENT_VERSION : CONSENT_VERSION);
export const consentPointsFor = (athlete: Pick<Athlete, "is_self">) => (athlete.is_self ? SELF_CONSENT_POINTS : CONSENT_POINTS);

/** Aceite válido: não revogado e da versão atual do termo daquele tipo de perfil. Sem ele, o perfil fica bloqueado. */
export function activeConsent(consents: Consent[], athlete: Pick<Athlete, "id" | "is_self">): Consent | undefined {
  const version = consentVersionFor(athlete);
  return consents.find((c) => c.athlete_id === athlete.id && c.document_version === version && !c.revoked_at);
}
