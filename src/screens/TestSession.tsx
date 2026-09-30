import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Notice, PrimaryButton, Screen } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import { formatDayMonth, localIsoDate } from "../lib/dates";
import { friendlyError } from "../lib/errors";
import { latestTestDate, nextTestFor, testIsDue, testsDue } from "../lib/testStatus";
import { addDaysIso } from "../lib/progress";
import { cue, unlockAudio } from "../lib/sounds";
import { TEST_INTERVAL_DAYS, TEST_TIMERS, formatTestValue, protocolFor, testsFor, type TestTimerSpec } from "../content/tests";
import type { Athlete, NewTestInput, SkillTestRecord } from "../lib/types";
import { readCached, writeCached } from "../lib/cache";
import { loadQueue } from "../lib/offlineQueue";

type Stage = "guide" | "measure" | "receipt";
type TimerPhase = "idle" | "prep" | "run" | "paused" | "done";

const PREP_SECONDS = 3;

// Rascunho da marca por conta/perfil: sobrevive a fechar o app e só sai daqui
// quando a marca é salva ou descartada. Só o número digitado — nada de saúde.
const draftKey = (guardianId: string, athleteId: string) => `baseline.testDraft.${guardianId}.${athleteId}`;

function readDrafts(guardianId: string, athleteId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(draftKey(guardianId, athleteId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string" && /^[a-z0-9-]{1,40}$/.test(key)) values[key] = value.slice(0, 12);
    }
    return values;
  } catch {
    return {};
  }
}

function writeDrafts(guardianId: string, athleteId: string, values: Record<string, string>): void {
  try {
    if (Object.keys(values).length === 0) localStorage.removeItem(draftKey(guardianId, athleteId));
    else localStorage.setItem(draftKey(guardianId, athleteId), JSON.stringify(values));
  } catch {
    // Sem armazenamento: o rascunho vive só na memória desta visita.
  }
}

/** Testes guiados, um por vez: instruções, marca com confirmação e recibo — sem obrigar a bateria inteira. */
export function TestSession({
  athlete,
  tests,
  onBack,
  onSave,
  initialTestId,
  quickEntry = false,
}: {
  athlete: Athlete;
  tests: SkillTestRecord[];
  onBack: () => void;
  onSave: (input: NewTestInput) => Promise<void>;
  /** Teste vindo do detalhe da Evolução: já abre na marca (entrada rápida). */
  initialTestId?: string;
  quickEntry?: boolean;
}) {
  const age = ageThisYear(athlete.birth_year);
  const minor = age < 18;
  const band = bandFor(age);
  const defs = useMemo(() => (band ? testsFor(band.id) : []), [band]);
  const dueIds = useMemo(() => new Set(testsDue(defs, tests).map((def) => def.id)), [defs, tests]);
  const [currentId, setCurrentId] = useState<string | null>(() =>
    initialTestId && defs.some((def) => def.id === initialTestId)
      ? initialTestId
      : (defs.find((def) => dueIds.has(def.id)) ?? defs[0])?.id ?? null,
  );
  const [stage, setStage] = useState<Stage>(quickEntry ? "measure" : "guide");
  const [drafts, setDrafts] = useState<Record<string, string>>(() => readDrafts(athlete.guardian_id, athlete.id));
  const [requestIds, setRequestIds] = useState<Record<string, string>>(() => readCached(athlete.guardian_id, `testIds.${athlete.id}`) ?? {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ defId: string; value: number; previous: number | null } | null>(null);
  const [queued, setQueued] = useState(false);

  useEffect(() => {
    writeDrafts(athlete.guardian_id, athlete.id, drafts);
  }, [drafts, athlete.guardian_id, athlete.id]);

  const def = defs.find((item) => item.id === currentId) ?? defs[0] ?? null;

  if (!def) {
    return (
      <Screen eyebrow={athlete.nickname} title="Testes" onBack={onBack}>
        <Notice tone="error">Não há testes para a idade do perfil. Confira o ano de nascimento na tela Conta.</Notice>
      </Screen>
    );
  }

  const raw = drafts[def.id]?.trim() ?? "";
  const value = raw === "" ? NaN : Number(raw.replace(",", "."));
  const valid = Number.isFinite(value) && value >= def.min && value <= def.max && (def.step === "decimal" || Number.isInteger(value));
  const lastDate = latestTestDate(def.id, tests);
  const last = lastDate ? tests.find((record) => record.tested_on === lastDate && typeof record.results[def.id] === "number")?.results[def.id] : undefined;
  const next = nextTestFor(def.id, tests);
  const due = testIsDue(def.id, tests);
  const timerSpec = TEST_TIMERS[def.id];

  function setValue(nextRaw: string) {
    setDrafts((current) => ({ ...current, [def!.id]: nextRaw }));
    if (!requestIds[def!.id]) {
      const next = { ...requestIds, [def!.id]: crypto.randomUUID() };
      setRequestIds(next); writeCached(athlete.guardian_id, `testIds.${athlete.id}`, next);
    }
  }

  function clearDraft(defId: string) {
    setDrafts((current) => {
      const without = { ...current };
      delete without[defId];
      return without;
    });
    const nextIds = { ...requestIds }; delete nextIds[defId];
    setRequestIds(nextIds); writeCached(athlete.guardian_id, `testIds.${athlete.id}`, nextIds);
  }

  function discard() {
    clearDraft(def.id);
    setError(null);
    setStage("guide");
  }

  function pickTest(id: string) {
    setCurrentId(id);
    setReceipt(null);
    setStage("guide");
  }

  function measureAnother() {
    if (!receipt) return;
    const upcoming = defs.find((item) => item.id !== receipt.defId && dueIds.has(item.id)) ?? defs.find((item) => item.id !== receipt.defId);
    if (!upcoming) return;
    setReceipt(null);
    setCurrentId(upcoming.id);
    setStage("guide");
  }

  async function save() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const id = requestIds[def!.id] ?? crypto.randomUUID();
      await onSave({ id, athleteId: athlete.id, results: { [def!.id]: value } });
      setQueued(loadQueue(athlete.guardian_id).some((item) => item.id === id));
      setReceipt({ defId: def!.id, value, previous: last ?? null });
      clearDraft(def!.id);
      setStage("receipt");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  const rangeText =
    def.step === "decimal"
      ? `Segundos com décimos, de ${def.min} a ${def.max}.`
      : `Conte e digite: de ${def.min} a ${def.max} ${def.unit}.`;
  const betterText = def.better === "min" ? "Quanto menor, melhor." : "Quanto maior, melhor.";
  const lastText = last !== undefined && lastDate ? `${formatTestValue(def, last)} · ${formatDayMonth(lastDate)}` : "Primeira vez";
  const whenText = due ? "Pode medir agora." : next ? `Próxima comparação: ${formatDayMonth(next)}. Pode medir antes se quiser.` : "";

  return (
    <Screen eyebrow={`${athlete.nickname} · um teste por vez`} title="Testes" onBack={onBack}>
      <p className="lead">
        {minor
          ? "Com um adulto por perto, meça um teste por vez. Só entra no histórico a marca que você salvar."
          : "Meça um teste por vez. Se o teste pedir cronômetro, peça para alguém ajudar — ou use o timer da tela."}
      </p>

      {stage !== "receipt" && defs.length > 1 && (
        <Group header="Escolha o teste" footer="Um por vez. Registre só o que medir hoje; o resto pode ficar para depois.">
          <label className="row" htmlFor="test-picker">
            <span className="row-label">Teste</span>
            <select id="test-picker" className="row-select" value={def.id} onChange={(e) => pickTest(e.target.value)}>
              {defs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {testIsDue(item.id, tests) ? "" : " · já mediu"}
                </option>
              ))}
            </select>
          </label>
        </Group>
      )}

      {stage === "receipt" && receipt ? (
        (() => {
          const receiptDef = defs.find((item) => item.id === receipt.defId);
          if (!receiptDef) return null;
          const improved = receipt.previous === null || (receiptDef.better === "max" ? receipt.value > receipt.previous : receipt.value < receipt.previous);
          const comparison =
            receipt.previous === null
              ? "Primeira marca deste teste."
              : improved
                ? `Melhor que a anterior (${formatTestValue(receiptDef, receipt.previous)}).`
                : receipt.value === receipt.previous
                  ? "Igual à anterior. Repetir o teste mantém a comparação justa."
                  : `Sua marca anterior foi ${formatTestValue(receiptDef, receipt.previous)}.`;
          return (
            <>
              <Notice tone="success">{queued ? "Marca guardada neste aparelho, aguardando envio." : "Marca registrada."}</Notice>
              <div className="metrics two">
                <div className="metric">
                  <strong>{formatTestValue(receiptDef, receipt.value)}</strong>
                  <span>marca de hoje</span>
                </div>
                <div className="metric">
                  <strong>{formatDayMonth(localIsoDate())}</strong>
                  <span>data</span>
                </div>
              </div>
              <Group header="Próximos passos" footer="A comparação é sempre com a sua própria marca.">
                <div className="row">
                  <span className="row-label">
                    Próxima medição
                    <small>Pode repetir antes, se quiser — cada teste é independente.</small>
                  </span>
                  <span className="row-value">{formatDayMonth(addDaysIso(localIsoDate(), TEST_INTERVAL_DAYS))}</span>
                </div>
                <div className="row">
                  <span className="row-label">
                    Comparação
                    <small>{comparison}</small>
                  </span>
                  {improved && receipt.previous !== null && <span className="chip-up">evoluiu</span>}
                </div>
              </Group>
              <div className="stack bottom-cta">
                {defs.length > 1 && (
                  <button type="button" className="secondary-button" onClick={measureAnother}>
                    Medir outro teste
                  </button>
                )}
                <PrimaryButton onClick={onBack}>Voltar à evolução</PrimaryButton>
              </div>
            </>
          );
        })()
      ) : (
        <>
          {stage === "guide" && (
            <Group header={def.name} footer={protocolFor(def, age)}>
              <div className="row">
                <span className="row-label">
                  Como anotar
                  <small>
                    {rangeText} {betterText}
                  </small>
                </span>
              </div>
              <div className="row">
                <span className="row-label">
                  Sua última marca
                  <small>{lastText}</small>
                </span>
              </div>
              <div className="row">
                <span className="row-label">
                  Quando medir de novo
                  <small>{whenText}</small>
                </span>
              </div>
            </Group>
          )}
          {stage === "guide" && raw !== "" && <Notice>Rascunho guardado neste aparelho: “{raw}”. Continue de onde parou.</Notice>}

          {timerSpec && (
            <Group
              header="Cronômetro"
              footer={
                timerSpec.direction === "down"
                  ? "Preparação, tempo correndo e aviso no fim. O resultado você digita em seguida."
                  : "Cronômetro simples para quem acompanha. O tempo medido você digita em seguida."
              }
            >
              <MeasureTimer key={def.id} spec={timerSpec} />
            </Group>
          )}

          {stage === "measure" && (
            <Group header={`Marcar · ${def.name}`} footer="Confira o número antes de salvar. Só esta marca é registrada.">
              <label className="row" htmlFor={`test-${def.id}`}>
                <span className="row-label">
                  Sua marca
                  <small>{last !== undefined ? `Anterior: ${formatTestValue(def, last)}` : "Primeira marca deste teste"}</small>
                </span>
                <input
                  id={`test-${def.id}`}
                  className="row-input test-input"
                  inputMode={def.step === "int" ? "numeric" : "decimal"}
                  autoComplete="off"
                  placeholder={def.unit}
                  value={drafts[def.id] ?? ""}
                  autoFocus
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
              <p className="row-note" role="status">
                {valid
                  ? `Você vai salvar: ${formatTestValue(def, value)}${
                      last === undefined
                        ? " — primeira marca deste teste."
                        : value === last
                          ? " — igual à anterior."
                          : (def.better === "max" ? value > last : value < last)
                            ? " — melhor que a sua anterior."
                            : ` — sua anterior foi ${formatTestValue(def, last)}.`
                    }`
                  : `Digite um valor entre ${def.min} e ${def.max}${def.step === "decimal" ? " (vírgula para décimos)" : ` ${def.unit}`}.`}
              </p>
              {error && <Notice tone="error">{error}</Notice>}
              <button type="button" className="row row-action" disabled={busy} onClick={discard}>
                Descartar esta marca
              </button>
              <button type="button" className="row row-action" disabled={busy} onClick={() => setStage("guide")}>
                Ver as instruções de novo
              </button>
            </Group>
          )}

          {stage === "measure" && (
            <div className="bottom-cta">
              <PrimaryButton disabled={!valid || busy} onClick={() => void save()}>
                {busy ? "Salvando…" : "Salvar marca"}
              </PrimaryButton>
            </div>
          )}
          {stage === "guide" && (
            <div className="bottom-cta">
              <PrimaryButton onClick={() => setStage("measure")}>{raw !== "" ? "Continuar minha marca" : "Anotar minha marca"}</PrimaryButton>
            </div>
          )}
        </>
      )}
    </Screen>
  );
}

/** Ajuda opcional de medição, só na memória: preparação 3-2-1 e contagem ou cronômetro. */
function MeasureTimer({ spec }: { spec: TestTimerSpec }) {
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [prepLeft, setPrepLeft] = useState(PREP_SECONDS);
  const [left, setLeft] = useState(spec.direction === "down" ? spec.total : 0);
  const [tenths, setTenths] = useState(0);
  const pausedFrom = useRef<TimerPhase>("run");
  const pause = () => { pausedFrom.current = phase; setPhase("paused"); };

  useEffect(() => {
    if (phase !== "run" && phase !== "prep") return;
    const hide = () => { if (document.hidden) pause(); };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [phase]);

  useEffect(() => {
    if (phase !== "prep") return;
    if (prepLeft === 0) {
      setPhase("run");
      cue("up");
      return;
    }
    const id = window.setTimeout(() => {
      if (prepLeft > 1) cue("tick");
      setPrepLeft((current) => current - 1);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [phase, prepLeft]);

  useEffect(() => {
    if (phase !== "run" || spec.direction !== "down") return;
    const started = Date.now();
    const remaining = left;
    const id = window.setInterval(() => setLeft(Math.max(0, remaining - Math.floor((Date.now() - started) / 1000))), 100);
    return () => window.clearInterval(id);
  }, [phase, spec]);

  useEffect(() => {
    if (phase === "run" && spec.direction === "down" && left === 0) {
      setPhase("done"); cue("done"); navigator.vibrate?.(300);
    }
  }, [phase, spec, left]);

  useEffect(() => {
    if (phase !== "run" || spec.direction !== "up") return;
    const started = Date.now();
    const initial = tenths;
    const id = window.setInterval(() => setTenths(initial + Math.floor((Date.now() - started) / 100)), 100);
    return () => window.clearInterval(id);
  }, [phase, spec]);

  function startPrep() {
    unlockAudio();
    cue("tick");
    setPrepLeft(PREP_SECONDS);
    setLeft(spec.direction === "down" ? spec.total : 0);
    setTenths(0);
    setPhase("prep");
  }

  function reset() {
    setPrepLeft(PREP_SECONDS);
    setLeft(spec.direction === "down" ? spec.total : 0);
    setTenths(0);
    setPhase("idle");
  }

  const status =
    phase === "idle"
      ? "Pronto para começar"
      : phase === "prep"
        ? "Prepare…"
        : phase === "run"
          ? spec.direction === "down"
            ? "Vale!"
            : "Cronometrando"
          : phase === "paused"
            ? "Pausado"
            : spec.direction === "down"
              ? "Tempo!"
              : "Parado";
  const ending = spec.direction === "down" && (phase === "run" || phase === "paused") && left <= 3;
  const display =
    phase === "prep"
      ? String(prepLeft)
      : phase === "idle"
        ? spec.direction === "down"
          ? String(spec.total)
          : "0,0"
        : spec.direction === "down"
          ? String(left)
          : (tenths / 10).toFixed(1).replace(".", ",");
  const stopButton = spec.direction === "up" && (phase === "run" || phase === "paused") && (
    <button type="button" className="secondary-button" onClick={() => setPhase("done")}>
      Parar
    </button>
  );

  return (
    <div className="stack">
      <p className="row-note" role="status">
        {status}
      </p>
      <p className={`countdown${ending ? " ending" : ""}`} aria-live="off">
        {display}
      </p>
      <div className="stack">
        {phase === "idle" && (
          <button type="button" className="secondary-button" onClick={startPrep}>
            {spec.direction === "down" ? "Preparar e contar" : "Preparar e cronometrar"}
          </button>
        )}
        {phase === "prep" && (
          <button type="button" className="secondary-button" onClick={reset}>
            Cancelar
          </button>
        )}
        {phase === "run" && (
          <>
            <button type="button" className="secondary-button" onClick={pause}>
              Pausar
            </button>
            {stopButton}
            <button type="button" className="secondary-button" onClick={reset}>
              Recomeçar
            </button>
          </>
        )}
        {phase === "paused" && (
          <>
            <button type="button" className="secondary-button" onClick={() => setPhase(pausedFrom.current)}>
              Continuar
            </button>
            {stopButton}
            <button type="button" className="secondary-button" onClick={reset}>
              Recomeçar
            </button>
          </>
        )}
        {phase === "done" && (
          <button type="button" className="secondary-button" onClick={startPrep}>
            Recomeçar
          </button>
        )}
      </div>
      {phase === "done" && (
        <p className="row-footnote">
          {spec.direction === "down"
            ? "Conte o resultado e digite na sua marca. O timer não registra nada sozinho."
            : `Digite ${display} s (ou o tempo marcado por quem acompanha) na sua marca.`}
        </p>
      )}
    </div>
  );
}
