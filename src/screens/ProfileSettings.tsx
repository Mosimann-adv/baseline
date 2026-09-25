import { useEffect, useState, type FormEvent } from "react";
import { Field, Group, Notice, PrimaryButton, Screen, Segmented, SwitchRow } from "../components/ui";
import { ageThisYear, allowedBirthYears, bandFor, selfBirthYears } from "../lib/age";
import { activeConsent, consentPointsFor, consentVersionFor, TEEN_CONSENT_VERSION } from "../lib/consent";
import { friendlyError } from "../lib/errors";
import { LEVELS, POSITIONS } from "../lib/profile";
import { countAthleteRows } from "../lib/counts";
import { formatDate } from "./accountShared";
import type { Athlete, AthletePatch, Consent, Level, Position } from "../lib/types";

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const GOALS = [1, 2, 3, 4, 5, 6, 7];

export interface ProfileSettingsProps {
  athlete: Athlete;
  consents: Consent[];
  sessionCount: number;
  testCount: number;
  guardianId: string;
  onBack: () => void;
  onUpdate: (patch: AthletePatch) => Promise<void>;
  onRevoke: () => Promise<void>;
  onAuthorize: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function ProfileSettings({
  athlete,
  consents,
  sessionCount: initialSessions,
  testCount: initialTests,
  guardianId,
  onBack,
  onUpdate,
  onRevoke,
  onAuthorize,
  onDelete,
}: ProfileSettingsProps) {
  const [nickname, setNickname] = useState(athlete.nickname);
  const [birthYear, setBirthYear] = useState(athlete.birth_year);
  const [level, setLevel] = useState<Level>(athlete.level);
  const [position, setPosition] = useState<Position | null>(athlete.position);
  const [goal, setGoal] = useState(athlete.weekly_goal);
  const [agree, setAgree] = useState(false);
  const [agreeGuardian, setAgreeGuardian] = useState(false);
  const [confirm, setConfirm] = useState<"revoke" | "delete" | null>(null);
  const [busy, setBusy] = useState<"save" | "consent" | "delete" | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(initialSessions);
  const [testCount, setTestCount] = useState(initialTests);

  useEffect(() => {
    void countAthleteRows(guardianId, athlete.id)
      .then((counts) => {
        setSessionCount(counts.sessions);
        setTestCount(counts.tests);
      })
      .catch(() => undefined);
  }, [guardianId, athlete.id]);

  const self = athlete.is_self;
  const age = ageThisYear(athlete.birth_year);
  const band = bandFor(age);
  const active = activeConsent(consents, athlete);
  const lastRevoked = consents.find((c) => c.revoked_at);
  const years = self ? selfBirthYears() : allowedBirthYears();
  const yearOptions = years.includes(athlete.birth_year) ? years : [...years, athlete.birth_year];
  const canAccept = agree && (self || agreeGuardian);

  const patch: AthletePatch = {};
  if (nickname.trim() !== athlete.nickname) patch.nickname = nickname.trim();
  if (birthYear !== athlete.birth_year) patch.birth_year = birthYear;
  if (level !== athlete.level) patch.level = level;
  if (position !== athlete.position) patch.position = position;
  if (goal !== athlete.weekly_goal) patch.weekly_goal = goal;
  const canSave = Object.keys(patch).length > 0 && nickname.trim().length > 0;

  async function run(kind: "save" | "consent" | "delete", action: () => Promise<void>): Promise<boolean> {
    setBusy(kind);
    setError(null);
    setSaved(false);
    try {
      await action();
      return true;
    } catch (err) {
      setError(friendlyError(err));
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (canSave && (await run("save", () => onUpdate(patch)))) setSaved(true);
  }

  return (
    <Screen eyebrow={self ? `Seu perfil · ${age} anos` : band ? `${band.label} · ${age} anos` : `${age} anos`} title={athlete.nickname} onBack={onBack}>
      {!self && age >= 16 && age < 18 && (
        <Notice>
          {athlete.nickname} já pode ter conta própria (a partir de 16, com você confirmando). O histórico fica neste perfil até vocês decidirem apagá-lo — não migra sozinho.
        </Notice>
      )}
      {!self && age >= 18 && (
        <Notice>
          {athlete.nickname} já é adulto. O perfil continua nesta conta e os treinos passaram à faixa Adulto. Se quiser conta própria, cria um login novo; os treinos daqui não migram sozinhos.
        </Notice>
      )}
      {self && age >= 18 && !active && consents.some((c) => c.document_version === TEEN_CONSENT_VERSION) && (
        <Notice>Você completou 18 anos. Dê o consentimento de adulto para continuar treinando.</Notice>
      )}
      <form onSubmit={save} className="stack">
        <Group header="Perfil" footer="O nível e a idade mudam os treinos sugeridos.">
          <Field id="edit-nickname" label="Apelido" value={nickname} onChange={setNickname} maxLength={24} autoComplete="off" />
          <label className="row" htmlFor="edit-year">
            <span className="row-label">Ano de nascimento</span>
            <select id="edit-year" className="row-select" value={birthYear} onChange={(e) => setBirthYear(Number(e.target.value))}>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="row" htmlFor="edit-goal">
            <span className="row-label">Meta semanal</span>
            <select id="edit-goal" className="row-select" value={goal} onChange={(e) => setGoal(Number(e.target.value))}>
              {GOALS.map((value) => (
                <option key={value} value={value}>
                  {count(value, "treino", "treinos")}
                </option>
              ))}
            </select>
          </label>
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
        {saved && !canSave && <Notice tone="success">Alterações salvas.</Notice>}
        <PrimaryButton type="submit" disabled={!canSave || busy !== null}>
          {busy === "save" ? "Salvando…" : "Salvar alterações"}
        </PrimaryButton>
      </form>

      <Group header={self ? "Consentimento" : "Autorização"} footer={`Versão atual do termo: ${consentVersionFor(athlete)}.`}>
        {active ? (
          <>
            <div className="row">
              <span className="row-label">
                {self ? "Consentimento dado" : "Autorizado"}
                <small>em {formatDate(active.accepted_at)}</small>
              </span>
              <span className="status-chip ok">{self ? "ativo" : "ativa"}</span>
            </div>
            {confirm === "revoke" ? (
              <>
                <p className="row-note">
                  {self
                    ? "Sem consentimento, seu perfil fica bloqueado: nada de treinos nem registros novos. Os registros já feitos ficam guardados, sem uso, até você consentir de novo ou excluir o perfil."
                    : `Sem autorização, ${athlete.nickname} não consegue abrir treinos nem registrar nada. Os registros já feitos ficam guardados, sem uso, até você autorizar de novo ou excluir o perfil.`}
                </p>
                <button
                  type="button"
                  className="row row-action destructive"
                  disabled={busy !== null}
                  onClick={async () => {
                    if (await run("consent", onRevoke)) setConfirm(null);
                  }}
                >
                  {busy === "consent" ? "Revogando…" : "Revogar agora"}
                </button>
                <button type="button" className="row row-action" disabled={busy !== null} onClick={() => setConfirm(null)}>
                  Cancelar
                </button>
              </>
            ) : (
              <button type="button" className="row row-action destructive" onClick={() => setConfirm("revoke")}>
                {self ? "Revogar consentimento" : "Revogar autorização"}
              </button>
            )}
          </>
        ) : (
          <>
            <p className="row-note">
              {lastRevoked?.revoked_at
                ? `${self ? "Consentimento revogado" : "Autorização revogada"} em ${formatDate(lastRevoked.revoked_at)}.`
                : "Falta aceitar a versão atual do termo."}{" "}
              {self ? "Enquanto isso, seu perfil não consegue treinar." : `Enquanto isso, ${athlete.nickname} não consegue treinar.`}
            </p>
            <ul className="consent-list">
              {consentPointsFor(athlete).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            {!self && (
              <SwitchRow id="reauthorize-guardian" label={`Sou mãe, pai ou responsável legal por ${athlete.nickname}`} checked={agreeGuardian} onChange={setAgreeGuardian} />
            )}
            <SwitchRow
              id="reauthorize-consent"
              label={self ? "Concordo com o uso dos meus dados como descrito acima" : `Autorizo o uso dos dados de ${athlete.nickname} como descrito acima`}
              checked={agree}
              onChange={setAgree}
            />
            <button
              type="button"
              className="row row-action"
              disabled={!canAccept || busy !== null}
              onClick={async () => {
                if (await run("consent", onAuthorize)) {
                  setAgree(false);
                  setAgreeGuardian(false);
                }
              }}
            >
              {busy === "consent" ? "Salvando…" : self ? "Dar consentimento" : "Autorizar"}
            </button>
          </>
        )}
      </Group>

      {consents.length > 1 && (
        <Group header={self ? "Histórico de consentimentos" : "Histórico de autorizações"}>
          {consents.map((c) => (
            <div key={c.id} className="row">
              <span className="row-label">
                Termo {c.document_version}
                <small>
                  aceito em {formatDate(c.accepted_at)}
                  {c.revoked_at ? ` · revogado em ${formatDate(c.revoked_at)}` : ""}
                </small>
              </span>
            </div>
          ))}
        </Group>
      )}

      <Group
        header="Excluir perfil"
        footer={
          self
            ? `Apaga seu perfil de treino, os aceites, ${count(sessionCount, "treino", "treinos")} e ${count(testCount, "bateria de testes", "baterias de testes")}. A conta continua. Não dá para desfazer.`
            : `Apaga o perfil, as autorizações, ${count(sessionCount, "treino", "treinos")} e ${count(testCount, "bateria de testes", "baterias de testes")} de ${athlete.nickname}. Não dá para desfazer.`
        }
      >
        {confirm === "delete" ? (
          <>
            <p className="row-note">{self ? "Tem certeza? Seu perfil e seus registros serão apagados agora." : `Tem certeza? Tudo de ${athlete.nickname} será apagado agora.`}</p>
            <button type="button" className="row row-action destructive" disabled={busy !== null} onClick={() => void run("delete", onDelete)}>
              {busy === "delete" ? "Excluindo…" : "Excluir perfil definitivamente"}
            </button>
            <button type="button" className="row row-action" disabled={busy !== null} onClick={() => setConfirm(null)}>
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className="row row-action destructive" onClick={() => setConfirm("delete")}>
            Excluir perfil
          </button>
        )}
      </Group>
      {error && <Notice tone="error">{error}</Notice>}
    </Screen>
  );
}
