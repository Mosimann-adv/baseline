import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Group, CountUp, Notice, PlainButton, PrimaryButton, Segmented } from "../components/ui";
import { avatarFor } from "../lib/avatar";
import { friendlyError } from "../lib/errors";
import { keepAwake } from "../lib/native";
import { clearResume, writeResume, type ResumeState } from "../lib/resumeSession";
import { cue, say, unlockAudio } from "../lib/sounds";
import type { Athlete, Drill, NewSessionInput, Program } from "../lib/types";

type Phase = "ready" | "getready" | "work" | "rest" | "done";

interface RunState {
  phase: Phase;
  index: number;
  endsAt: number;
  pausedLeft: number | null;
  done: number;
  startedAt: number | null;
}

interface Action {
  type: "start" | "advance" | "skip" | "extend" | "pause" | "resume" | "finish";
  now: number;
  drills: Drill[];
}

const INITIAL: RunState = { phase: "ready", index: 0, endsAt: 0, pausedLeft: null, done: 0, startedAt: null };
const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com";

// Volta ao ponto em que o treino parou, já pausado: quem treina vê quanto restava e decide continuar.
// "Prepare-se" recomeça a contagem de 3 s; marca fora dos limites do programa cai no começo.
// O relógio de duração é rebaseado: o tempo com o app fechado não entra como treino
// (agora − (salvo − começou) mantém só o que correu de verdade).
function initialFromResume(resume: ResumeState | null | undefined, drills: Drill[]): RunState {
  if (!resume) return INITIAL;
  const startedAt =
    resume.startedAt !== null && resume.savedAt > resume.startedAt ? Date.now() - (resume.savedAt - resume.startedAt) : resume.startedAt;
  if (resume.phase === "getready") {
    return { ...INITIAL, phase: "getready", endsAt: Date.now() + 3000, startedAt };
  }
  const drill = drills[resume.index];
  if (!drill) return INITIAL;
  const limit = (resume.phase === "rest" ? drill.restSeconds : drill.seconds) + 5;
  if (resume.secondsLeft <= 0 || resume.secondsLeft > limit) return INITIAL;
  return {
    ...INITIAL,
    phase: resume.phase,
    index: resume.index,
    done: Math.max(0, Math.min(resume.done, resume.index + 1)),
    pausedLeft: resume.secondsLeft * 1000,
    startedAt,
  };
}

// Contagem pelo relógio (endsAt), não por ticks: o intervalo atrasa com a tela bloqueada ou o app em segundo plano.
function run(state: RunState, action: Action): RunState {
  const { drills, now } = action;
  const last = drills.length - 1;
  const workFrom = (index: number): RunState => ({ ...state, phase: "work", index, endsAt: now + drills[index].seconds * 1000, pausedLeft: null });

  switch (action.type) {
    case "start":
      // 3 s para largar o celular e pegar a bola antes do primeiro exercício.
      return { ...INITIAL, phase: "getready", endsAt: now + 3000, startedAt: now };
    case "pause":
      if (state.pausedLeft !== null || (state.phase !== "work" && state.phase !== "rest")) return state;
      return { ...state, pausedLeft: Math.max(0, state.endsAt - now) };
    case "resume":
      if (state.pausedLeft === null) return state;
      return { ...state, endsAt: now + state.pausedLeft, pausedLeft: null };
    case "finish":
      return { ...state, phase: "done", pausedLeft: null };
    case "advance":
      if (state.phase === "getready") return workFrom(0);
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
    case "extend":
      // Descanso que não corta: ir buscar água ou atender não pode custar o próximo exercício.
      if (state.phase !== "rest") return state;
      if (state.pausedLeft !== null) return { ...state, pausedLeft: state.pausedLeft + 15000 };
      return { ...state, endsAt: state.endsAt + 15000 };
  }
  return state;
}

function useWakeLock(active: boolean) {
  useEffect(() => {
    void keepAwake(active);
    if (!active || !("wakeLock" in navigator)) {
      return () => {
        void keepAwake(false);
      };
    }
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
      void keepAwake(false);
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
  if (video.end) params.set("end", String(video.end));
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
  resume,
  onExit,
  onSave,
}: {
  athlete: Athlete;
  program: Program;
  resume?: ResumeState | null;
  onExit: () => void;
  onSave: (input: NewSessionInput) => Promise<void>;
}) {
  const drills = program.drills;
  const [state, dispatch] = useReducer(run, drills, (d) => initialFromResume(resume, d));
  const [now, setNow] = useState(() => Date.now());
  const [confirmExit, setConfirmExit] = useState(false);
  // Sair no meio do treino pede confirmação em dois passos, como as outras ações sem volta.
  // A confirmação caduca em segundos e a cada troca de fase, para um toque sem querer não encerrar depois.
  useEffect(() => {
    if (!confirmExit) return;
    const id = window.setTimeout(() => setConfirmExit(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirmExit]);
  useEffect(() => {
    setConfirmExit(false);
  }, [state.phase, state.index]);
  const playerRef = useRef<HTMLIFrameElement>(null);
  // Todo toque destrava o áudio (requisito dos navegadores); os bipes só tocam depois disso.
  const act = (type: Action["type"]) => {
    unlockAudio();
    dispatch({ type, now: Date.now(), drills });
  };

  // Vídeo do exercício corrente, lido pelos efeitos do player antes do render.
  // previewOnly não entra no treino: serve só para ver antes (ProgramDetail).
  const currentDrill = drills[Math.min(state.index, drills.length - 1)];
  const video = state.phase !== "rest" && !currentDrill.video?.previewOnly ? currentDrill.video : undefined;

  const running = (state.phase === "work" || state.phase === "rest" || state.phase === "getready") && state.pausedLeft === null;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && state.endsAt <= now) dispatch({ type: "advance", now: Date.now(), drills });
  }, [running, state.endsAt, now, drills]);

  // Guarda o treino pela metade a cada segundo de fase ativa: se o app fechar sem querer,
  // dá para retomar do mesmo ponto. Antes de começar ou depois de terminar, nada a retomar.
  const savedSecond =
    state.phase === "work" || state.phase === "rest" || state.phase === "getready"
      ? Math.ceil((state.pausedLeft ?? Math.max(0, state.endsAt - now)) / 1000)
      : 0;
  useEffect(() => {
    if (state.phase === "work" || state.phase === "rest" || state.phase === "getready") {
      writeResume({
        athleteId: athlete.id,
        programId: program.id,
        phase: state.phase,
        index: state.index,
        done: state.done,
        secondsLeft: savedSecond,
        startedAt: state.startedAt,
        savedAt: Date.now(),
      });
    } else if (state.phase === "done") {
      clearResume();
    }
  }, [athlete.id, program.id, state.phase, state.index, state.done, state.pausedLeft, state.startedAt, savedSecond]);

  // App em segundo plano ou tela travada: pausa na hora, para os exercícios não passarem sem a pessoa ver.
  // Ao voltar, o treino fica em "Pausado" com o tempo que restava, e quem treina decide continuar.
  useEffect(() => {
    if (!running) return;
    const onHide = () => {
      if (document.hidden) dispatch({ type: "pause", now: Date.now(), drills });
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [running, drills]);

  useEffect(() => {
    if (state.phase === "work") {
      navigator.vibrate?.(60);
      cue("up");
    }
    if (state.phase === "rest") {
      navigator.vibrate?.(60);
      cue("down");
      const nextName = drills[state.index + 1]?.name;
      if (nextName) say(`Próximo: ${nextName}`);
    }
    if (state.phase === "done") {
      navigator.vibrate?.([120, 80, 120]);
      cue("done");
    }
  }, [state.phase, state.index, drills]);

  // Últimos 3 s de descanso: bipe por segundo para se preparar sem olhar para a tela.
  const restSeconds = state.phase === "rest" ? Math.ceil((state.pausedLeft ?? Math.max(0, state.endsAt - now)) / 1000) : 0;
  useEffect(() => {
    if (state.phase !== "rest" || state.pausedLeft !== null) return;
    if (restSeconds > 0 && restSeconds <= 3) cue("tick");
  }, [state.phase, state.pausedLeft, restSeconds]);

  // Pausar o treino pausa o vídeo em exibição (exercício ou prévia do próximo), e continuar volta a tocar (API de iframe do YouTube via postMessage).
  const ytCommand = (func: string, args: unknown[] = []) => {
    playerRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), YOUTUBE_ORIGIN);
  };

  useEffect(() => {
    if (state.phase !== "work" && state.phase !== "rest") return;
    const func = state.pausedLeft === null ? "playVideo" : "pauseVideo";
    ytCommand(func);
  }, [state.phase, state.pausedLeft]);

  // Repetição do trecho: ao terminar (ou cair antes do começo do exercício), volta ao `start`
  // em vez de mostrar a introdução de novo. O `loop=1` do embed fica como plano B se os eventos não chegarem.
  const lastSeekRef = useRef(0);
  useEffect(() => {
    const frame = playerRef.current;
    if (!video || !frame) return;
    frame.contentWindow?.postMessage(JSON.stringify({ event: "listening" }), YOUTUBE_ORIGIN);

    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== YOUTUBE_ORIGIN || ev.source !== frame.contentWindow) return;
      let data: { event?: string; info?: unknown };
      try {
        data = JSON.parse(String(ev.data)) as { event?: string; info?: unknown };
      } catch {
        return;
      }
      const start = video.start ?? 0;
      const time = typeof data.info === "object" && data.info !== null && "currentTime" in data.info ? Number((data.info as { currentTime: unknown }).currentTime) : NaN;

      if (data.event === "onStateChange" && data.info === 0) {
        ytCommand("seekTo", [start, true]);
        ytCommand("playVideo");
        return;
      }
      if (data.event === "infoDelivery" && !Number.isNaN(time)) {
        const now = Date.now();
        if (now - lastSeekRef.current < 1500) return;
        if (time + 1.5 < start || (video.end !== undefined && time >= video.end)) {
          lastSeekRef.current = now;
          ytCommand("seekTo", [start, true]);
          ytCommand("playVideo");
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [video]);

  useWakeLock(state.phase !== "done");

  if (state.phase === "done") {
    return <Finish athlete={athlete} program={program} done={state.done} startedAt={state.startedAt} onExit={onExit} onSave={onSave} />;
  }

  const drill = drills[state.index];
  const next = drills[state.index + 1];
  const left = state.pausedLeft ?? Math.max(0, state.endsAt - now);
  // A contagem avisa de longe: nos últimos 3 s ela pulsa em coral, junto com os bipes.
  const ending = (state.phase === "work" || state.phase === "rest") && state.pausedLeft === null && left > 0 && left <= 3000;
  const countdownClass = `countdown${ending ? " ending" : ""}`;
  const progress = ((state.index + (state.phase === "rest" ? 1 : 0)) / drills.length) * 100;

  return (
    <main className={`training${state.phase === "work" && state.pausedLeft === null ? " focus" : ""}`}>
      <div className="training-top">
        <button
          type="button"
          className="back-button"
          onClick={() => {
            if (state.phase === "ready") return onExit();
            if (confirmExit) act("finish");
            else setConfirmExit(true);
          }}
        >
          {state.phase === "ready" ? "Voltar" : confirmExit ? "Encerrar mesmo?" : "Encerrar"}
        </button>
        <span className="training-count">
          Exercício {Math.min(state.index + 1, drills.length)} de {drills.length}
        </span>
      </div>
      <div className="progress-line" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      {state.phase === "getready" ? (
        <section className="training-body" aria-live="polite">
          <p className="phase-label">Prepare-se</p>
          <h1 className="drill-name">{drills[0].name}</h1>
          <p className="drill-cue">{drills[0].cue}</p>
          <p className="countdown tick" key={left} aria-live="off">
            {clock(left)}
          </p>
        </section>
      ) : state.phase === "rest" ? (
        <section className={`training-body${next?.video ? " with-video" : ""}`} aria-live="polite">
          <p className="phase-label">Descanso</p>
          <p className={countdownClass} key={left}>{clock(left)}</p>
          {next && (
            <>
              <p className="training-next">
                Próximo: <strong>{next.name}</strong>
              </p>
              <p className="drill-cue">{next.cue}</p>
              {next.video && (
                <div className="video-block">
                  <div className="video-frame">
                    <iframe
                      key={`next-${next.id}`}
                      ref={playerRef}
                      src={youtubeSrc(next.video, true)}
                      title={next.video.title}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                </div>
              )}
            </>
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
                  onLoad={() => playerRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening" }), YOUTUBE_ORIGIN)}
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
          {drill.focus && !video && (
            <p className="focus-hint" aria-label="Foco do exercício">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="3.5" />
              </svg>
              {drill.focus}
            </p>
          )}
          {state.phase === "work" && (
            <p className={countdownClass} aria-live="off">
              {clock(left)}
            </p>
          )}
          {state.phase === "ready" && (
            <ol className="ready-list" aria-label="Você vai fazer">
              {drills.map((item, i) => (
                <li key={item.id}>
                  <span>
                    {i + 1}. {item.name}
                  </span>
                  <span className="ready-meta">
                    {item.seconds} s{item.video && !item.video.previewOnly ? " · vídeo" : ""}
                  </span>
                </li>
              ))}
            </ol>
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
            <div className="rest-row">
              <PlainButton onClick={() => act("extend")}>+15 s de descanso</PlainButton>
              <PlainButton onClick={() => act(state.pausedLeft === null ? "pause" : "resume")}>
                {state.pausedLeft === null ? "Pausar" : "Continuar"}
              </PlainButton>
            </div>
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

// Confete de chegada: partículas efêmeras nas cores do kit, só visual (aria-hidden).
// prefers-reduced-motion anula a animação e elas somem.
const CONFETTI_COLORS = ["#f3c44b", "#eea047", "#d96953", "#7db8e8", "#f8f1e0"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: Math.round(Math.random() * 100),
        delay: Math.round(Math.random() * 700),
        duration: 1600 + Math.round(Math.random() * 1200),
        size: 6 + Math.round(Math.random() * 6),
        drift: Math.round((Math.random() - 0.5) * 120),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

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
  const avatar = avatarFor(athlete.id);
  const [minutes] = useState(() => Math.max(1, Math.round((Date.now() - (startedAt ?? Date.now())) / 60000)));
  const [feeling, setFeeling] = useState<(typeof FEELINGS)[number]["value"] | null>(null);
  const [discomfort, setDiscomfort] = useState<"nao" | "sim" | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Sair sem salvar descarta o registro: pede confirmação em dois passos, como as outras ações sem volta.
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  useEffect(() => {
    if (!confirmDiscard) return;
    const id = window.setTimeout(() => setConfirmDiscard(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirmDiscard]);
  const total = program.drills.length;

  // Confirma o salvamento na tela antes de voltar — sem internet, o treino fica na fila e sobe depois.
  useEffect(() => {
    if (!saved) return;
    const id = window.setTimeout(onExit, 1800);
    return () => window.clearTimeout(id);
  }, [saved, onExit]);

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
      setSaved(true);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <main className="screen">
      <Confetti />
      <div className="top-bar" />
      <div className="large-title-block finish-head">
        <div className="finish-avatar" style={{ background: avatar.background }} aria-hidden="true">
          {avatar.glyph}
        </div>
        <p className="subtitle">{done === total ? "Treino completo" : "Treino encerrado"}</p>
        <h1 className="large-title">Mandou bem, {athlete.nickname}</h1>
      </div>
      <div className="metrics two">
        <div className="metric">
          <strong>
            <CountUp value={done} />/{total}
          </strong>
          <span>exercícios</span>
        </div>
        <div className="metric">
          <strong>
            <CountUp value={minutes} />
          </strong>
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
      {discomfort === "sim" && (
        <Notice tone="error">
          {athlete.is_self ? "Pare de treinar agora." : "Pare de treinar e conte para um adulto agora."} Se a dor continuar, procure um médico.
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {saved ? (
        <Notice tone="success">Treino salvo! Até a próxima.</Notice>
      ) : (
        <div className="stack bottom-cta">
          <PrimaryButton onClick={() => void save()} disabled={busy}>
            {busy ? "Salvando…" : "Salvar treino"}
          </PrimaryButton>
          <PlainButton onClick={() => (confirmDiscard ? onExit() : setConfirmDiscard(true))} disabled={busy}>
            {confirmDiscard ? "Descartar mesmo?" : "Sair sem salvar"}
          </PlainButton>
        </div>
      )}
    </main>
  );
}
