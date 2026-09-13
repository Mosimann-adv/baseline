import { useEffect, useState, type FormEvent } from "react";
import { Field, Group, Notice, PlainButton, PrimaryButton, Screen, Segmented, SwitchRow } from "../components/ui";
import { useAuth } from "../state/auth";
import { adultBirthYears, ageThisYear, allowedBirthYears, bandFor } from "../lib/age";
import { activeConsent, consentPointsFor, consentVersionFor } from "../lib/consent";
import { localIsoDate } from "../lib/dates";
import { friendlyError } from "../lib/errors";
import { collectFamilyData, saveJsonFile } from "../lib/exportData";
import { checkPin, hasPin, savePin } from "../lib/pin";
import { LEVELS, POSITIONS } from "../lib/profile";
import { LEGAL_DOCS, type LegalId } from "../content/legal";
import { LegalScreen } from "./LegalScreen";
import type { Athlete, AthletePatch, Consent, Level, Position, SkillTestRecord, TrainingSession } from "../lib/types";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const GOALS = [1, 2, 3, 4, 5, 6, 7];

interface AccountProps {
  guardianId: string;
  email: string;
  athletes: Athlete[];
  consents: Consent[];
  sessions: TrainingSession[];
  tests: SkillTestRecord[];
  onBack: () => void;
  onAddAthlete: () => void;
  onAddSelf: () => void;
  onUpdate: (athleteId: string, patch: AthletePatch) => Promise<void>;
  onRevoke: (athleteId: string) => Promise<void>;
  onAuthorize: (athlete: Athlete) => Promise<void>;
  onDeleteAthlete: (athleteId: string) => Promise<void>;
}

// Tela Conta. O PIN existe para proteger perfis de crianças e adolescentes:
// conta só com o perfil do próprio adulto abre direto.
export function GuardianArea(props: AccountProps) {
  const needsPin = props.athletes.some((a) => !a.is_self);
  const [unlocked, setUnlocked] = useState(false);
  if (needsPin && !unlocked) return <PinGate guardianId={props.guardianId} onUnlock={() => setUnlocked(true)} onBack={props.onBack} />;
  return <AccountSettings {...props} />;
}

function PinGate({ guardianId, onUnlock, onBack }: { guardianId: string; onUnlock: () => void; onBack: () => void }) {
  const { signOut } = useAuth();
  const creating = !hasPin(guardianId);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const onlyDigits = (value: string) => value.replace(/\D/g, "").slice(0, 4);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4}$/.test(pin)) {
      setError("O PIN tem 4 números.");
      return;
    }
    if (creating) {
      if (pin !== confirmPin) {
        setError("Os dois PINs não são iguais.");
        return;
      }
      await savePin(guardianId, pin);
      onUnlock();
      return;
    }
    if (await checkPin(guardianId, pin)) onUnlock();
    else {
      setError("PIN incorreto.");
      setPin("");
    }
  }

  return (
    <Screen eyebrow="Só para adultos" title={creating ? "Crie um PIN" : "Digite o PIN"} onBack={onBack}>
      <form onSubmit={submit} className="stack">
        <Group
          footer={
            creating
              ? "A conta tem perfis de crianças ou adolescentes. O PIN protege autorizações e dados deles neste aparelho. Não compartilhe com eles."
              : "Esqueceu o PIN? Saia da conta e entre de novo com seu e-mail e senha para criar outro."
          }
        >
          <Field id="guardian-pin" label="PIN" type="password" inputMode="numeric" maxLength={4} autoComplete="off" value={pin} onChange={(v) => setPin(onlyDigits(v))} />
          {creating && (
            <Field id="guardian-pin-confirm" label="Repita o PIN" type="password" inputMode="numeric" maxLength={4} autoComplete="off" value={confirmPin} onChange={(v) => setConfirmPin(onlyDigits(v))} />
          )}
        </Group>
        {error && <Notice tone="error">{error}</Notice>}
        <PrimaryButton type="submit">{creating ? "Salvar PIN" : "Entrar"}</PrimaryButton>
        {!creating && <PlainButton onClick={() => void signOut()}>Esqueci o PIN, sair da conta</PlainButton>}
      </form>
    </Screen>
  );
}

type Sub = { kind: "athlete"; id: string } | { kind: "doc"; id: LegalId } | null;

function AccountSettings({
  guardianId,
  email,
  athletes,
  consents,
  sessions,
  tests,
  onBack,
  onAddAthlete,
  onAddSelf,
  onUpdate,
  onRevoke,
  onAuthorize,
  onDeleteAthlete,
}: AccountProps) {
  const { signOut, deleteAccount } = useAuth();
  const [sub, setSub] = useState<Sub>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [sub]);

  if (sub?.kind === "doc") return <LegalScreen doc={LEGAL_DOCS[sub.id]} onBack={() => setSub(null)} />;

  const selected = sub?.kind === "athlete" ? athletes.find((a) => a.id === sub.id) : undefined;
  if (selected) {
    return (
      <ProfileSettings
        key={selected.id}
        athlete={selected}
        consents={consents.filter((c) => c.athlete_id === selected.id)}
        sessionCount={sessions.filter((s) => s.athlete_id === selected.id).length}
        testCount={tests.filter((t) => t.athlete_id === selected.id).length}
        onBack={() => setSub(null)}
        onUpdate={(patch) => onUpdate(selected.id, patch)}
        onRevoke={() => onRevoke(selected.id)}
        onAuthorize={() => onAuthorize(selected)}
        onDelete={async () => {
          await onDeleteAthlete(selected.id);
          setSub(null);
        }}
      />
    );
  }

  const hasSelf = athletes.some((a) => a.is_self);
  const ordered = [...athletes].sort((a, b) => Number(b.is_self) - Number(a.is_self));

  async function removeEverything() {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  async function exportData() {
    setExporting(true);
    setExportNote(null);
    setError(null);
    try {
      const data = await collectFamilyData(guardianId, email);
      const result = await saveJsonFile(data, `baseline-dados-${localIsoDate()}.json`);
      if (result === "shared") setExportNote("Arquivo compartilhado.");
      if (result === "downloaded") setExportNote("Arquivo baixado. Guarde em local seguro.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen eyebrow="Baseline" title="Conta" onBack={onBack}>
      <Group header="Perfis de treino" footer="Toque em um perfil para corrigir os dados, mudar a meta semanal, revogar o aceite ou excluir.">
        {ordered.map((athlete) => {
          const active = activeConsent(consents, athlete);
          const status = athlete.is_self
            ? active
              ? "consentimento ativo"
              : "sem consentimento"
            : active
              ? `autorizado em ${formatDate(active.accepted_at)}`
              : "sem autorização";
          return (
            <button key={athlete.id} type="button" className="row row-nav" onClick={() => setSub({ kind: "athlete", id: athlete.id })}>
              <span className="row-label">
                {athlete.nickname}
                <small>
                  {athlete.is_self ? "Você · " : ""}
                  {ageThisYear(athlete.birth_year)} anos · meta {athlete.weekly_goal} por semana · {status}
                </small>
              </span>
            </button>
          );
        })}
        {!hasSelf && (
          <button type="button" className="row row-action" onClick={onAddSelf}>
            Criar meu perfil de treino
          </button>
        )}
        <button type="button" className="row row-action" onClick={onAddAthlete}>
          Adicionar criança ou adolescente
        </button>
      </Group>

      <Group header="Privacidade e dados" footer="A cópia inclui a conta, os perfis, os aceites, os treinos e os testes. Guarde em local seguro.">
        <button type="button" className="row row-action" disabled={exporting} onClick={() => void exportData()}>
          {exporting ? "Preparando arquivo…" : "Baixar cópia dos dados"}
        </button>
        <button type="button" className="row row-nav" onClick={() => setSub({ kind: "doc", id: "privacidade" })}>
          <span className="row-label">Política de privacidade</span>
        </button>
        <button type="button" className="row row-nav" onClick={() => setSub({ kind: "doc", id: "termos" })}>
          <span className="row-label">Termos de uso</span>
        </button>
      </Group>
      {exportNote && <Notice tone="success">{exportNote}</Notice>}

      <Group header="Conta" footer="Ao sair, o PIN deste aparelho é apagado.">
        <div className="row">
          <span className="row-label">E-mail</span>
          <span className="row-value">{email}</span>
        </div>
        <button type="button" className="row row-action" onClick={() => void signOut()}>
          Sair da conta
        </button>
      </Group>

      <Group header="Excluir conta" footer="Apaga a conta, todos os perfis, os aceites e todos os registros. Não dá para desfazer.">
        {confirming ? (
          <>
            <p className="row-note">Tem certeza? Tudo desta conta será apagado agora.</p>
            <button type="button" className="row row-action destructive" disabled={busy} onClick={() => void removeEverything()}>
              {busy ? "Excluindo…" : "Excluir tudo definitivamente"}
            </button>
            <button type="button" className="row row-action" disabled={busy} onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className="row row-action destructive" onClick={() => setConfirming(true)}>
            Excluir conta e dados
          </button>
        )}
      </Group>
      {error && <Notice tone="error">{error}</Notice>}
    </Screen>
  );
}

function ProfileSettings({
  athlete,
  consents,
  sessionCount,
  testCount,
  onBack,
  onUpdate,
  onRevoke,
  onAuthorize,
  onDelete,
}: {
  athlete: Athlete;
  consents: Consent[];
  sessionCount: number;
  testCount: number;
  onBack: () => void;
  onUpdate: (patch: AthletePatch) => Promise<void>;
  onRevoke: () => Promise<void>;
  onAuthorize: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
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

  const self = athlete.is_self;
  const age = ageThisYear(athlete.birth_year);
  const band = bandFor(age);
  const active = activeConsent(consents, athlete);
  const lastRevoked = consents.find((c) => c.revoked_at);
  const years = self ? adultBirthYears() : allowedBirthYears();
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
      <form onSubmit={save} className="stack">
        <Group header="Perfil" footer="Corrija os dados quando precisar. O nível e a idade mudam os treinos e testes sugeridos.">
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
