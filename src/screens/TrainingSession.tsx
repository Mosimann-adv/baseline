import { useEffect, useReducer, useRef, useState } from "react";
import { Group, Notice, PlainButton, PrimaryButton, Segmented } from "../components/ui";
import { friendlyError } from "../lib/errors";
import type { Athlete, Drill, NewSessionInput, Program } from "../lib/types";

type Phase = "ready" | "work" | "rest" | "done";

interface RunState {
  phase: Phase;
  index: number;
  endsAt: number;
  pausedLeft: number | null;
  done: number;
  startedAt: number | null;
}

interface Action {
  type: "start" | "advance" | "skip" | "pause" | "resume" | "finish";
  now: number;
  drills: Drill[];
}

const INITIAL: RunState = { phase: "ready", index: 0, endsAt: 0, pausedLeft: null, done: 0, startedAt: null };
const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com";

// Contagem pelo relógio (endsAt), não por ticks: o intervalo atrasa com a tela bloqueada ou o app em segundo plano.
function run(state: RunState, action: Action): RunState {
  const { drills, now } = action;
  const last = drills.length - 1;
  const workFrom = (index: number): RunState => ({ ...state, phase: "work", index, endsAt: now + drills[index].seconds * 1000, pausedLeft: null });

  switch (action.type) {
    case "start":
      return { ...INITIAL, phase: "work", endsAt: now + drills[0].seconds * 1000, startedAt: now };
    case "pause":
      if (state.pausedLeft !== null || (state.phase !== "work" && state.phase !== "rest")) return state;
      return { ...state, pausedLeft: Math.max(0, state.endsAt - now) };
    case "resume":
      if (state.pausedLeft === null) return state;
      return { ...state, endsAt: now + state.pausedLeft, pausedLeft: null };
    case "finish":
      return { ...state, phase: "done", pausedLeft: null };
    case "advance":
      if (state.phase === "work") {
        const done = state.done + 1;
        if (state.index >= last) return { ...state, phase: "done", done, pausedLeft: null };
        const rest = drills[state.index].restSeconds;
        if (rest > 0) return { ...state, phase: "rest", done, endsAt: now + rest * 1000, pausedLeft: null };
        return { ...workFrom(state.index + 1), done };
      }
      if (state.phase === "rest") return workFrom(state.index + 1);
      return state;
    case "skip":
      if (state.phase === "rest") return workFrom(state.index + 1);
      if (state.phase !== "work") return state;
      if (state.index >= last) return { ...state, phase: "done", pausedLeft: null };
      return workFrom(state.index + 1);
  }
  return state;
}

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = () =>
      navigator.wakeLock
        .request("screen")
        .then((sentinel) => {
          if (cancelled) void sentinel.release();
          else lock = sentinel;
        })
        .catch(() => undefined);
    void request();
    const onVisible = () => {
      if (document.visibilityState === "visible" && (!lock || lock.released)) void request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [active]);
}

// O vídeo acompanha o exercício: começa junto com a contagem e repete até o fim.
// Navegadores de celular só tocam sozinhos com som desligado; o som liga no próprio player.
function youtubeSrc(video: NonNullable<Drill["video"]>, autoplay: boolean): string {
  const params = new URLSearchParams({
    rel: "0",
    playsinline: "1",
    enablejsapi: "1",
    mute: "1",
    loop: "1",
    playlist: video.id,
    autoplay: autoplay ? "1" : "0",
  });
  if (video.start) params.set("start", String(video.start));
  if (location.origin.startsWith("http")) params.set("origin", location.origin);
  return `${YOUTUBE_ORIGIN}/embed/${video.id}?${params.toString()}`;
}

const clock = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export function TrainingSession({
  athlete,
  program,
  onExit,
  onSave,
}: {
  athlete: Athlete;
  program: Program;
  onExit: () => void;
  onSave: (input: NewSessionInput) => Promise<void>;
}) {
  const drills = program.drills;
  const [state, dispatch] = useReducer(run, INITIAL);
  const [now, setNow] = useState(() => Date.now());
  const playerRef = useRef<HTMLIFrameElement>(null);
  const act = (type: Action["type"]) => dispatch({ type, now: Date.now(), drills });

  const running = (state.phase === "work" || state.phase === "rest") && state.pausedLeft === null;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && state.endsAt <= now) dispatch({ type: "advance", now: Date.now(), drills });
  }, [running, state.endsAt, now, drills]);

  useEffect(() => {
    if (state.phase === "work") navigator.vibrate?.(60);
    if (state.phase === "done") navigator.vibrate?.([120, 80, 120]);
  }, [state.phase, state.index]);

  // Pausar o treino pausa o vídeo, e continuar volta a tocar (API de iframe do YouTube via postMessage).
  useEffect(() => {
    if (state.phase !== "work") return;
    const func = state.pausedLeft === null ? "playVideo" : "pauseVideo";
    playerRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), YOUTUBE_ORIGIN);
  }, [state.phase, state.pausedLeft]);

  useWakeLock(state.phase !== "done");

  if (state.phase === "done") {
    return <Finish athlete={athlete} program={program} done={state.done} startedAt={state.startedAt} onExit={onExit} onSave={onSave} />;
  }

  const drill = drills[state.index];
  const next = drills[state.index + 1];
  const left = state.pausedLeft ?? Math.max(0, state.endsAt - now);
  const progress = ((state.index + (state.phase === "rest" ? 1 : 0)) / drills.length) * 100;
  const video = state.phase !== "rest" ? drill.video : undefined;

  return (
    <main className="training">
      <div className="training-top">
        <button type="button" className="back-button" onClick={() => (state.phase === "ready" ? onExit() : act("finish"))}>
          {state.phase === "ready" ? "Voltar" : "Encerrar"}
        </button>
        <span className="training-count">
          Exercício {Math.min(state.index + 1, drills.length)} de {drills.length}
        </span>
      </div>
      <div className="progress-line" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      {state.phase === "rest" ? (
        <section className="training-body" aria-live="polite">
          <p className="phase-label">Descanso</p>
          <p className="countdown">{clock(left)}</p>
          {next && (
            <p className="training-next">
              Próximo: <strong>{next.name}</strong>
            </p>
          )}
        </section>
      ) : (
        <section className={`training-body${video ? " with-video" : ""}`}>
          {video && (
            <div className="video-block">
              <div className="video-frame">
                <iframe
                  key={`${drill.id}-${state.phase}`}
                  ref={playerRef}
                  src={youtubeSrc(video, state.phase === "work")}
                  title={video.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              <a
                className="plain-link"
                href={`https://www.youtube.com/watch?v=${video.id}${video.start ? `&t=${video.start}s` : ""}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                O vídeo não aparece? Abrir no YouTube
              </a>
            </div>
          )}
          <p className="phase-label">{state.phase === "ready" ? program.title : state.pausedLeft === null ? "Agora" : "Pausado"}</p>
          <h1 className="drill-name">{drill.name}</h1>
          <p className="drill-cue">{drill.cue}</p>
          {state.phase === "work" && (
            <p className="countdown" aria-live="off">
              {clock(left)}
            </p>
          )}
        </section>
      )}

      <div className="training-actions">
        {state.phase === "ready" && <PrimaryButton onClick={() => act("start")}>Começar</PrimaryButton>}
        {state.phase === "work" && (
          <>
            <PrimaryButton onClick={() => act(state.pausedLeft === null ? "pause" : "resume")}>
              {state.pausedLeft === null ? "Pausar" : "Continuar"}
            </PrimaryButton>
            <PlainButton onClick={() => act("skip")}>Pular exercício</PlainButton>
          </>
        )}
        {state.phase === "rest" && (
          <>
            <PrimaryButton onClick={() => act("skip")}>Pular descanso</PrimaryButton>
            <PlainButton onClick={() => act(state.pausedLeft === null ? "pause" : "resume")}>
              {state.pausedLeft === null ? "Pausar" : "Continuar"}
            </PlainButton>
          </>
        )}
      </div>
    </main>
  );
}

const FEELINGS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
] as const;

const DISCOMFORT = [
  { value: "nao", label: "Não" },
  { value: "sim", label: "Sim" },
] as const;

function Finish({
  athlete,
  program,
  done,
  startedAt,
  onExit,
  onSave,
}: {
  athlete: Athlete;
  program: Program;
  done: number;
  startedAt: number | null;
  onExit: () => void;
  onSave: (input: NewSessionInput) => Promise<void>;
}) {
  const [minutes] = useState(() => Math.max(1, Math.round((Date.now() - (startedAt ?? Date.now())) / 60000)));
  const [feeling, setFeeling] = useState<(typeof FEELINGS)[number]["value"] | null>(null);
  const [discomfort, setDiscomfort] = useState<"nao" | "sim" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = program.drills.length;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await onSave({
        athleteId: athlete.id,
        programId: program.id,
        minutes,
        drillsDone: done,
        drillsTotal: total,
        feeling: feeling ? Number(feeling) : null,
        discomfort: discomfort === "sim",
      });
      onExit();
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <main className="screen">
      <div className="top-bar" />
      <div className="large-title-block">
        <p className="subtitle">{done === total ? "Treino completo" : "Treino encerrado"}</p>
        <h1 className="large-title">Mandou bem, {athlete.nickname}</h1>
      </div>
      <div className="metrics two">
        <div className="metric">
          <strong>
            {done}/{total}
          </strong>
          <span>exercícios</span>
        </div>
        <div className="metric">
          <strong>{minutes}</strong>
          <span>{minutes === 1 ? "minuto" : "minutos"}</span>
        </div>
      </div>
      <Group header="Como foi o treino?" footer="1 = foi bem difícil · 5 = foi ótimo">
        <div className="row">
          <Segmented label="Como foi o treino, de 1 a 5" options={FEELINGS} value={feeling} onChange={setFeeling} />
        </div>
      </Group>
      <Group header="Algo doeu?">
        <div className="row">
          <Segmented label="Algo doeu durante o treino?" options={DISCOMFORT} value={discomfort} onChange={setDiscomfort} />
        </div>
      </Group>
      {discomfort === "sim" && <Notice tone="error">Pare de treinar e conte para um adulto agora. Se a dor continuar, procure um médico.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      <div className="stack bottom-cta">
        <PrimaryButton onClick={() => void save()} disabled={busy}>
          {busy ? "Salvando…" : "Salvar treino"}
        </PrimaryButton>
        <PlainButton onClick={onExit} disabled={busy}>
          Sair sem salvar
        </PlainButton>
      </div>
    </main>
  );
}
