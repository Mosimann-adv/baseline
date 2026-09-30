import { useEffect, useState } from "react";
import "../styles.explore.css";
import { BANDS, contentBand, type AgeBandId } from "../lib/age";
import { CATEGORY_LABELS, PROGRAMS, needsHoop, programMinutes, programShelves } from "../content/programs";
import type { Drill, Level, Program } from "../lib/types";
import { Group, Notice, PrimaryButton, Screen } from "../components/ui";

// Exploração pública (antes do cadastro): a pessoa escolhe uma faixa temporária e olha
// os treinos, as dicas e os vídeos. NADA é registrado: sem perfil, sem idade guardada,
// sem histórico e sem pergunta de saúde. A demonstração com timer vive só na memória.
// Regras do projeto: vídeos só de IDs conferidos, sempre por youtube-nocookie.com.

const YOUTUBE_NOCOOKIE = "https://www.youtube-nocookie.com";

const LEVEL_LABELS: Record<Level, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

type ExploreView =
  | { name: "bands" }
  | { name: "programs"; band: AgeBandId }
  | { name: "program"; band: AgeBandId; program: Program }
  | { name: "drill"; band: AgeBandId; program: Program; drill: Drill };

/** Treinos da faixa escolhida, de todos os níveis (não há nível gravado na exploração). */
function programsOfBand(band: AgeBandId): Program[] {
  const target = contentBand(band);
  return PROGRAMS.filter((program) => program.bands.includes(target));
}

function previewSrc(video: NonNullable<Drill["video"]>): string {
  const params = new URLSearchParams({ rel: "0", playsinline: "1" });
  if (video.start) params.set("start", String(video.start));
  if (video.end) params.set("end", String(video.end));
  return `${YOUTUBE_NOCOOKIE}/embed/${video.id}?${params.toString()}`;
}

export function Explore({ onExit, onSignUp }: { onExit: () => void; onSignUp: () => void }) {
  const [view, setView] = useState<ExploreView>({ name: "bands" });

  // O voltar do Android fica por conta do useScreenBack do Screen (todas as telas daqui passam onBack:
  // faixas → sair, treinos → faixas, bloco → treinos, demonstração → bloco).

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  if (view.name === "drill") {
    return <DrillDemo drill={view.drill} onDone={() => setView({ name: "program", band: view.band, program: view.program })} />;
  }
  if (view.name === "program") {
    return (
      <ProgramPreview
        program={view.program}
        onBack={() => setView({ name: "programs", band: view.band })}
        onTryDrill={(drill) => setView({ name: "drill", band: view.band, program: view.program, drill })}
        onSignUp={onSignUp}
      />
    );
  }
  if (view.name === "programs") {
    return <ProgramList band={view.band} onBack={() => setView({ name: "bands" })} onOpen={(program) => setView({ name: "program", band: view.band, program })} onSignUp={onSignUp} />;
  }
  return <BandPicker onExit={onExit} onPick={(band) => setView({ name: "programs", band })} onSignUp={onSignUp} />;
}

function BandPicker({ onExit, onPick, onSignUp }: { onExit: () => void; onPick: (band: AgeBandId) => void; onSignUp: () => void }) {
  return (
    <Screen eyebrow="Explorar" title="Conhecer os treinos" onBack={onExit}>
      <p className="lead">Escolha uma faixa de idade para ver os treinos. É só uma olhada: nada é registrado e ninguém cria perfil.</p>
      <Notice>Conteúdo em validação por profissional de educação física.</Notice>
      <Group header="Para quem são os treinos">
        <div className="explore-band-grid">
          {BANDS.map((band) => (
            <button key={band.id} type="button" className="explore-band" onClick={() => onPick(band.id)}>
              <strong>{band.label}</strong>
              <span>{band.id === "adulto" ? "18 anos ou mais" : `${band.id.replace("-", "–")} anos`}</span>
              <span>{band.focus}</span>
            </button>
          ))}
        </div>
      </Group>
      <div className="bottom-cta stack">
        <PrimaryButton onClick={onSignUp}>Criar conta para registrar</PrimaryButton>
        <p className="explore-note">A conta é a partir de 16 anos. Para crianças e adolescentes, o responsável cria o perfil depois do cadastro.</p>
      </div>
    </Screen>
  );
}

function ProgramList({ band, onBack, onOpen, onSignUp }: { band: AgeBandId; onBack: () => void; onOpen: (program: Program) => void; onSignUp: () => void }) {
  const bandInfo = BANDS.find((b) => b.id === band);
  const shelves = programShelves(programsOfBand(band));
  return (
    <Screen eyebrow={bandInfo ? `Faixa ${bandInfo.label}` : "Explorar"} title="Treinos" onBack={onBack}>
      <p className="explore-current">
        Faixa escolhida só para esta olhada{bandInfo ? `: ${bandInfo.focus.toLowerCase()}` : ""}.
      </p>
      {shelves.map((shelf) => (
        <section key={shelf.category} className="shelf" aria-labelledby={`explore-shelf-${shelf.category}`}>
          <h2 className="shelf-head" id={`explore-shelf-${shelf.category}`}>
            <span>{CATEGORY_LABELS[shelf.category]}</span>
            <small>{shelf.programs.length === 1 ? "1 treino" : `${shelf.programs.length} treinos`}</small>
          </h2>
          <div className={`shelf-row${shelf.programs.length === 1 ? " single" : ""}`}>
            {shelf.programs.map((program) => (
              <button key={program.id} type="button" className={`program-card cat-${program.category}`} onClick={() => onOpen(program)}>
                <strong>{program.title}</strong>
                <span className="program-card-meta">
                  {programMinutes(program)} min · {program.drills.length} {program.drills.length === 1 ? "exercício" : "exercícios"}
                </span>
                <span className="place-pill">{needsHoop(program) ? "Com cesta" : "Sem cesta"}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      <div className="bottom-cta stack">
        <PrimaryButton onClick={onSignUp}>Criar conta para registrar</PrimaryButton>
      </div>
    </Screen>
  );
}

function ProgramPreview({ program, onBack, onTryDrill, onSignUp }: { program: Program; onBack: () => void; onTryDrill: (drill: Drill) => void; onSignUp: () => void }) {
  // Um exercício aberto por vez, como no detalhe do app.
  const [openId, setOpenId] = useState<string | null>(null);
  const levelHint =
    program.levels.length < 3
      ? program.levels.map((level) => LEVEL_LABELS[level]).join(" e ")
      : null;
  return (
    <Screen eyebrow={`${CATEGORY_LABELS[program.category]} · ~${programMinutes(program)} min`} title={program.title} onBack={onBack}>
      <p className="lead">{program.summary}</p>
      <p className="program-facts">
        <span>
          {program.drills.length} {program.drills.length === 1 ? "exercício" : "exercícios"}
        </span>
        <span>{program.equipment}</span>
        {levelHint && <span>{levelHint}</span>}
      </p>
      <Group footer="Toque em um exercício para ver a dica e o vídeo. Conteúdo em validação por profissional de educação física.">
        {program.drills.map((drill, index) => {
          const open = openId === drill.id;
          return (
            <div key={drill.id} className="drill-item">
              <button type="button" className="row drill-row" aria-expanded={open} onClick={() => setOpenId(open ? null : drill.id)}>
                <span className="row-label">
                  {index + 1}. {drill.name}
                  <small>
                    {drill.seconds} s{drill.restSeconds > 0 ? ` · descanso ${drill.restSeconds} s` : ""}
                    {drill.video ? " · vídeo" : ""}
                  </small>
                </span>
                <span className="row-value" aria-hidden="true">
                  {open ? "−" : "+"}
                </span>
              </button>
              {open && (
                <div className="drill-preview">
                  <p className="drill-cue">{drill.cue}</p>
                  {drill.video ? (
                    <div className="video-block">
                      <div className="video-frame">
                        <iframe
                          src={previewSrc(drill.video)}
                          title={drill.video.title}
                          loading="lazy"
                          allow="encrypted-media; picture-in-picture"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </div>
                      <a
                        className="plain-link"
                        href={`https://www.youtube.com/watch?v=${drill.video.id}${drill.video.start ? `&t=${drill.video.start}s` : ""}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir no YouTube
                      </a>
                    </div>
                  ) : (
                    <p className="focus-hint">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="3.5" />
                      </svg>
                      {drill.focus ? `Foco: ${drill.focus}` : "Sem vídeo para este exercício — siga a dica acima."}
                    </p>
                  )}
                  <div className="explore-drill-actions">
                    <button type="button" className="secondary-button" onClick={() => onTryDrill(drill)}>
                      Experimentar com timer
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Group>
      <div className="bottom-cta stack">
        <PrimaryButton onClick={onSignUp}>Criar conta para registrar</PrimaryButton>
        <p className="explore-note">Na conta, o treino guiado passa de exercício em exercício com sons, descanso e registro da prática.</p>
      </div>
    </Screen>
  );
}

/** Demonstração de UM exercício com timer, só na memória: ao sair, nada fica guardado. */
function DrillDemo({ drill, onDone }: { drill: Drill; onDone: () => void }) {
  const [left, setLeft] = useState(drill.seconds);
  const [running, setRunning] = useState(false);
  const finished = left === 0;

  useEffect(() => {
    if (!running || finished) return;
    const id = window.setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [running, finished, left]);

  useEffect(() => {
    if (finished) setRunning(false);
  }, [finished]);

  return (
    <Screen eyebrow="Demonstração" title={drill.name} onBack={onDone}>
      <div className="explore-demo stack">
        <p className="drill-cue">{drill.cue}</p>
        {drill.video && (
          <div className="video-block">
            <div className="video-frame">
              <iframe
                src={previewSrc(drill.video)}
                title={drill.video.title}
                loading="lazy"
                allow="encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        )}
        <p className="phase-label">{finished ? "Tempo!" : running ? "Vai" : "Pronto"}</p>
        <p className="countdown" aria-live="off">
          {left}
        </p>
        <p className="explore-note">Só uma demonstração: nada é registrado nem contado para o histórico.</p>
        <div className="explore-timer-row">
          {finished ? (
            <button type="button" className="secondary-button" onClick={() => setLeft(drill.seconds)}>
              Zerar
            </button>
          ) : (
            <button type="button" className="secondary-button" onClick={() => setRunning((value) => !value)}>
              {running ? "Pausar" : "Começar"}
            </button>
          )}
          <button type="button" className="secondary-button" onClick={onDone}>
            Concluir
          </button>
        </div>
      </div>
    </Screen>
  );
}
