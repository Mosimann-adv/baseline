import { useState, type FormEvent } from "react";
import { Field, Group, Notice, PrimaryButton, Screen, Segmented, SwitchRow } from "../components/ui";
import { ageThisYear, allowedBirthYears, bandFor, selfBirthYears } from "../lib/age";
import { CONSENT_POINTS, CONSENT_VERSION, SELF_CONSENT_VERSION, TEEN_CONSENT_VERSION, consentPointsFor } from "../lib/consent";
import { friendlyError } from "../lib/errors";
import { LEVELS, POSITIONS } from "../lib/profile";
import type { Athlete, Level, NewAthleteInput, Position } from "../lib/types";

/** "self": perfil do próprio dono da conta (16+). "minor": criança ou adolescente, com autorização do responsável. */
export type ProfileKind = "self" | "minor";

export function NewAthlete({
  kind,
  first,
  lockedBirthYear,
  onBack,
  onCreate,
}: {
  kind: ProfileKind;
  first: boolean;
  /** Ano já informado no cadastro da conta: o perfil próprio não pede de novo. */
  lockedBirthYear?: number | null;
  onBack?: () => void;
  onCreate: (input: NewAthleteInput) => Promise<Athlete>;
}) {
  const self = kind === "self";
  const years = self ? selfBirthYears() : allowedBirthYears();
  const [nickname, setNickname] = useState("");
  const [birthYear, setBirthYear] = useState<number | null>(lockedBirthYear ?? null);
  const [level, setLevel] = useState<Level>("iniciante");
  const [position, setPosition] = useState<Position | null>(null);
  const [isGuardian, setIsGuardian] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const band = birthYear === null ? null : bandFor(ageThisYear(birthYear));
  const displayName = nickname.trim() || "o atleta";
  const draft = { is_self: self, birth_year: birthYear ?? 2000 };
  const points = consentPointsFor(draft);
  const teen = self && birthYear !== null && ageThisYear(birthYear) < 18;
  const ready = nickname.trim().length > 0 && birthYear !== null && consent && (self || isGuardian);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready || birthYear === null) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate({ nickname: nickname.trim(), birthYear, level, position });
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <Screen eyebrow={first ? "Primeiro passo" : "Novo perfil"} title={self ? "Meu perfil de treino" : "Cadastrar atleta"} onBack={onBack}>
      <form onSubmit={submit} className="stack">
        <Group
          header={self ? "Você" : "Criança ou adolescente"}
          footer={self ? "Pode ser um apelido. Não pedimos nome completo nem foto." : "Use um apelido. Não pedimos nome completo, foto nem escola."}
        >
          <Field id="athlete-nickname" label="Apelido" value={nickname} onChange={setNickname} maxLength={24} autoComplete="off" placeholder={self ? "Ex.: Rafa" : "Ex.: Juju"} />
          <label className="row" htmlFor="athlete-year">
            <span className="row-label">Ano de nascimento</span>
            <select
              id="athlete-year"
              className="row-select"
              value={birthYear ?? ""}
              disabled={Boolean(lockedBirthYear)}
              onChange={(e) => setBirthYear(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Escolher</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          {band && (
            <p className="row-footnote">
              Faixa {band.label}: {band.focus.toLowerCase()}.
            </p>
          )}
        </Group>

        <Group header="Nível">
          <div className="row">
            <Segmented label="Nível" options={LEVELS} value={level} onChange={setLevel} />
          </div>
        </Group>

        <Group header="Posição" footer="Opcional. Toque de novo para desmarcar.">
          <div className="row">
            <Segmented label="Posição" options={POSITIONS} value={position} onChange={(value) => setPosition(position === value ? null : value)} />
          </div>
        </Group>

        {self ? (
          <Group
            header={teen ? "Seu consentimento (16–17 anos)" : "Seu consentimento"}
            footer={`Versão do termo: ${teen ? TEEN_CONSENT_VERSION : SELF_CONSENT_VERSION}. Treine dentro dos seus limites; em caso de doença, lesão ou dúvida, procure orientação antes de começar.`}
          >
            <ul className="consent-list">
              {points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <SwitchRow id="self-consent" label="Concordo com o uso dos meus dados como descrito acima" checked={consent} onChange={setConsent} />
          </Group>
        ) : (
          <Group header="Autorização do responsável" footer={`Versão do termo: ${CONSENT_VERSION}. Você pode revogar e apagar os dados na tela Conta.`}>
            <ul className="consent-list">
              {CONSENT_POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <SwitchRow id="athlete-guardian" label={`Sou mãe, pai ou responsável legal por ${displayName}`} checked={isGuardian} onChange={setIsGuardian} />
            <SwitchRow id="athlete-consent" label={`Autorizo o uso dos dados de ${displayName} como descrito acima`} checked={consent} onChange={setConsent} />
          </Group>
        )}

        {error && <Notice tone="error">{error}</Notice>}
        <PrimaryButton type="submit" disabled={!ready || busy}>
          {busy ? "Salvando…" : self ? "Criar meu perfil" : "Cadastrar atleta"}
        </PrimaryButton>
      </form>
    </Screen>
  );
}
