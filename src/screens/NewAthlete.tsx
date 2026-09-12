import { useState, type FormEvent } from "react";
import { Field, Group, Notice, PrimaryButton, Screen, Segmented, SwitchRow } from "../components/ui";
import { ageThisYear, allowedBirthYears, bandFor } from "../lib/age";
import { CONSENT_POINTS, CONSENT_VERSION } from "../lib/consent";
import { friendlyError } from "../lib/errors";
import type { Athlete, Level, NewAthleteInput, Position } from "../lib/types";

const LEVELS: readonly { value: Level; label: string }[] = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

const POSITIONS: readonly { value: Position; label: string }[] = [
  { value: "armador", label: "Armador" },
  { value: "ala", label: "Ala" },
  { value: "pivo", label: "Pivô" },
];

export function NewAthlete({
  first,
  onBack,
  onCreate,
}: {
  first: boolean;
  onBack?: () => void;
  onCreate: (input: NewAthleteInput) => Promise<Athlete>;
}) {
  const years = allowedBirthYears();
  const [nickname, setNickname] = useState("");
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [level, setLevel] = useState<Level>("iniciante");
  const [position, setPosition] = useState<Position | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const band = birthYear === null ? null : bandFor(ageThisYear(birthYear));
  const displayName = nickname.trim() || "o atleta";
  const ready = nickname.trim().length > 0 && birthYear !== null && consent;

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
    <Screen eyebrow={first ? "Primeiro passo" : "Novo perfil"} title="Cadastrar atleta" onBack={onBack}>
      <form onSubmit={submit} className="stack">
        <Group header="Atleta" footer="Use um apelido. Não pedimos nome completo, foto nem escola.">
          <Field id="athlete-nickname" label="Apelido" value={nickname} onChange={setNickname} maxLength={24} autoComplete="off" placeholder="Ex.: Juju" />
          <label className="row" htmlFor="athlete-year">
            <span className="row-label">Ano de nascimento</span>
            <select
              id="athlete-year"
              className="row-select"
              value={birthYear ?? ""}
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
            <Segmented label="Nível do atleta" options={LEVELS} value={level} onChange={setLevel} />
          </div>
        </Group>

        <Group header="Posição" footer="Opcional. Toque de novo para desmarcar.">
          <div className="row">
            <Segmented
              label="Posição do atleta"
              options={POSITIONS}
              value={position}
              onChange={(value) => setPosition(position === value ? null : value)}
            />
          </div>
        </Group>

        <Group
          header="Autorização do responsável"
          footer={`Versão do termo: ${CONSENT_VERSION}. Você pode revogar e apagar os dados na Área do responsável.`}
        >
          <ul className="consent-list">
            {CONSENT_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <SwitchRow id="athlete-consent" label={`Autorizo o uso dos dados de ${displayName} como descrito acima`} checked={consent} onChange={setConsent} />
        </Group>

        {error && <Notice tone="error">{error}</Notice>}
        <PrimaryButton type="submit" disabled={!ready || busy}>
          {busy ? "Salvando…" : "Cadastrar atleta"}
        </PrimaryButton>
      </form>
    </Screen>
  );
}
