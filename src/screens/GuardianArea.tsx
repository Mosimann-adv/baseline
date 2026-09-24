import { useEffect, useRef, useState, type FormEvent } from "react";
import { Field, Group, Notice, PrimaryButton, Screen, Segmented, SwitchRow } from "../components/ui";
import { useAuth } from "../state/auth";
import { ageThisYear, allowedBirthYears, bandFor, selfBirthYears } from "../lib/age";
import { activeConsent, consentPointsFor, consentVersionFor, TEEN_CONSENT_VERSION } from "../lib/consent";
import { localIsoDate } from "../lib/dates";
import { friendlyError } from "../lib/errors";
import { collectFamilyData, saveJsonFile } from "../lib/exportData";
import { LEVELS, POSITIONS } from "../lib/profile";
import { canCreateMinorProfiles, type AccountKind } from "../lib/account";
import { countAthleteRows } from "../lib/counts";
import { shareText } from "../lib/native";
import { setSoundOn, setVoiceOn, soundOn, voiceOn } from "../lib/sounds";
import type { ParentStatus } from "../lib/parentConfirm";
import { LEGAL_DOCS, type LegalId } from "../content/legal";
import { APP_WEB, INSTITUTE_CNPJ, PIX_KEY, SUPPORT, appPublicUrl } from "../content/support";

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
  accountKind: AccountKind;
  parent: ParentStatus;
  onRefreshParent: () => void;
  onBack: () => void;
  onAddAthlete: () => void;
  onAddSelf: () => void;
  onUpdate: (athleteId: string, patch: AthletePatch) => Promise<void>;
  onRevoke: (athleteId: string) => Promise<void>;
  onAuthorize: (athlete: Athlete) => Promise<void>;
  onDeleteAthlete: (athleteId: string) => Promise<void>;
}

// Tela Conta: abre direto, sem PIN (decisão do dono do projeto, 2026-09-12).
// Ações sem volta (revogar, excluir perfil, excluir conta) continuam com confirmação em dois passos.
export function GuardianArea(props: AccountProps) {
  return <AccountSettings {...props} />;
}

type Sub = { kind: "athlete"; id: string } | { kind: "doc"; id: LegalId } | null;

function AccountSettings({
  guardianId,
  email,
  athletes,
  consents,
  sessions,
  tests,
  accountKind,
  parent,
  onRefreshParent,
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
  const [signingOut, setSigningOut] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Som e voz do treino: preferência deste aparelho, guardada longe do fluxo de treino.
  const [sound, setSound] = useState(soundOn);
  const [voice, setVoice] = useState(voiceOn);
  const errorRef = useRef<HTMLDivElement>(null);
  const prevError = useRef<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [sub]);

  // O erro fica no rodapé, fora da vista quando a ação foi no topo: rola até ele ao aparecer.
  useEffect(() => {
    if (prevError.current === null && error !== null) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    prevError.current = error;
  }, [error]);

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
        guardianId={guardianId}
        onDelete={async () => {
          await onDeleteAthlete(selected.id);
          setSub(null);
        }}
      />
    );
  }

  const hasSelf = athletes.some((a) => a.is_self);
  const ordered = [...athletes].sort((a, b) => Number(b.is_self) - Number(a.is_self));
  const allowMinors = canCreateMinorProfiles(accountKind);

  async function removeEverything() {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(password);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  async function leaveAccount() {
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
    } catch (err) {
      setError(friendlyError(err));
      setSigningOut(false);
    }
  }

  async function shareParent() {
    setShareNote(null);
    const url = appPublicUrl("confirmar-responsavel");
    const text = [
      "Confirme a conta no Baseline.",
      "",
      `Abra: ${url}`,
      parent.code ? `Código: ${parent.code}` : null,
      parent.parentEmail ? `Use o e-mail ${parent.parentEmail}.` : null,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      const result = await shareText("Confirmar Baseline", text);
      if (result === "copied") setShareNote("Texto copiado. Envie no WhatsApp ou no e-mail do responsável.");
      onRefreshParent();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function exportData() {
    setExporting(true);
    setExportNote(null);
    setError(null);
    try {
      const data = await collectFamilyData(guardianId, email);
      const result = await saveJsonFile(data, `baseline-dados-${localIsoDate()}.json`);
      // Cancelar o compartilhamento do sistema não é erro: sai em silêncio.
      if (result === "cancelled") return;
      if (result === "shared") setExportNote("Arquivo compartilhado.");
      if (result === "downloaded") setExportNote("Arquivo baixado. Guarde em local seguro.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setExporting(false);
    }
  }

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
    } catch {
      const field = document.createElement("textarea");
      field.value = PIX_KEY;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-9999px";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Screen eyebrow="Baseline" title="Conta" onBack={onBack}>
      {accountKind === "teen" && !parent.confirmed && (
        <section className="due-card blocked">
          <div>
            <p className="subtitle">Confirmação do responsável</p>
            <p>
              Peça para {parent.parentEmail ?? "o responsável"} abrir {APP_WEB.replace("https://", "")}/#/confirmar-responsavel e
              digitar o código <strong>{parent.code ?? "—"}</strong>.
            </p>
          </div>
          <button type="button" className="secondary-button" onClick={() => void shareParent()}>
            Enviar ao responsável
          </button>
        </section>
      )}
      {shareNote && <Notice tone="success">{shareNote}</Notice>}
      {accountKind === "teen" && parent.confirmed && (
        <Notice tone="success">Responsável confirmado{parent.parentEmail ? ` (${parent.parentEmail})` : ""}.</Notice>
      )}

      <Group header="Perfis de treino" footer="Toque para corrigir, mudar a meta ou gerenciar o aceite.">
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
        {allowMinors && (
          <button type="button" className="row row-action" onClick={onAddAthlete}>
            Adicionar criança ou adolescente
          </button>
        )}
      </Group>

      <Group header="Privacidade e dados" footer="A cópia inclui conta, perfis, aceites, treinos e testes.">
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

      <Group
        header="Apoie o Arvoredo"
        footer="App gratuito. Doação opcional ao Instituto — nunca no treino."
      >
        <div className="pix-box">
          <p className="pix-lead">Cada real vira treino, bola e oportunidade.</p>
          <div className="pix-key">
            <span className="pix-key-text">{PIX_KEY}</span>
            <button type="button" className={copied ? "copy-btn copied" : "copy-btn"} onClick={() => void copyPix()}>
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="pix-note">Chave Pix (CNPJ {INSTITUTE_CNPJ}).</p>
          <details className="disclosure">
            <summary>Ver QR Code</summary>
            <div className="disclosure-body">
              <div className="pix-box">
                <img className="pix-qr" src="pix-qr.png" alt="QR Code Pix do Instituto Arvoredo" width={150} height={150} />
                <p className="pix-hint">Escaneie o QR ou copie a chave acima.</p>
              </div>
            </div>
          </details>
        </div>
        <a className="row row-nav" href={SUPPORT.whatsapp} target="_blank" rel="noopener noreferrer">
          <svg className="row-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
          <span className="row-label">
            WhatsApp
            <small>{SUPPORT.whatsappLabel}</small>
          </span>
        </a>
        <a className="row row-nav" href={SUPPORT.instagram} target="_blank" rel="noopener noreferrer">
          <svg className="row-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" />
          </svg>
          <span className="row-label">
            Instagram
            <small>{SUPPORT.instagramLabel}</small>
          </span>
        </a>
        <a className="row row-nav" href={SUPPORT.sponsor} target="_blank" rel="noopener noreferrer">
          <svg className="row-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          <span className="row-label">
            Para empresas
            <small>Cotas Bola, Uniforme e Cesta no site do Instituto</small>
          </span>
        </a>
        <a className="row row-nav" href={SUPPORT.donate} target="_blank" rel="noopener noreferrer">
          <svg className="row-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="row-label">Abrir o site do Arvoredo</span>
        </a>
      </Group>

      <Group header="Som e voz" footer="Vale para os treinos neste aparelho.">
        <SwitchRow
          id="sound-pref"
          label="Bipes do treino"
          checked={sound}
          onChange={(value) => {
            setSound(value);
            setSoundOn(value);
          }}
        />
        <SwitchRow
          id="voice-pref"
          label="Voz anuncia o próximo exercício"
          checked={voice}
          onChange={(value) => {
            setVoice(value);
            setVoiceOn(value);
          }}
        />
      </Group>

      <Group header="Conta">
        <div className="row">
          <span className="row-label">E-mail</span>
          <span className="row-value">{email}</span>
        </div>
        <button type="button" className="row row-action" disabled={signingOut} onClick={() => void leaveAccount()}>
          {signingOut ? "Saindo…" : "Sair da conta"}
        </button>
      </Group>

      <Group header="Excluir conta" footer="Apaga conta, perfis e registros. Sem volta. A senha evita que apaguem por engano.">
        {confirming ? (
          <>
            <p className="row-note">Digite a senha desta conta para confirmar. Tudo será apagado agora.</p>
            <Group>
              <Field id="delete-password" label="Senha" type="password" autoComplete="current-password" value={password} onChange={setPassword} />
            </Group>
            <button type="button" className="row row-action destructive" disabled={busy || password.length < 1} onClick={() => void removeEverything()}>
              {busy ? "Excluindo…" : "Excluir tudo definitivamente"}
            </button>
            <button
              type="button"
              className="row row-action"
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                setPassword("");
              }}
            >
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className="row row-action destructive" onClick={() => setConfirming(true)}>
            Excluir conta e dados
          </button>
        )}
      </Group>
      {error && (
        <div ref={errorRef}>
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </Screen>
  );
}

function ProfileSettings({
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
}: {
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
