import { useRef, useState } from "react";
import { Group, PlainButton, PrimaryButton, Screen } from "../components/ui";
import { CATEGORY_LABELS, programMinutes } from "../content/programs";
import { formatDayMonth } from "../lib/dates";
import type { Drill, Program } from "../lib/types";

const YOUTUBE_NOCOOKIE = "https://www.youtube-nocookie.com";

function previewSrc(video: NonNullable<Drill["video"]>): string {
  const params = new URLSearchParams({ rel: "0", playsinline: "1" });
  if (video.start) params.set("start", String(video.start));
  if (video.end) params.set("end", String(video.end));
  return `${YOUTUBE_NOCOOKIE}/embed/${video.id}?${params.toString()}`;
}

export function ProgramDetail({
  program,
  onBack,
  onStart,
  doneCount,
  lastDone,
}: {
  program: Program;
  onBack: () => void;
  onStart: () => void;
  /** Histórico do próprio atleta neste treino (opcional): quantas vezes fez e quando foi a última. */
  doneCount?: number | null;
  lastDone?: string | null;
}) {
  // Um exercício aberto por vez: abrir um fecha o anterior; tocar no aberto fecha.
  const [openId, setOpenId] = useState<string | null>(null);
  const [openAll, setOpenAll] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const toggle = (id: string) => {
    if (openAll) {
      setOpenAll(false);
      setOpenId(id);
      return;
    }
    setOpenId(openId === id ? null : id);
  };

  // O botão precisa mostrar os exercícios, não só rolar: a lista costuma
  // já estar visível acima do botão, então só rolar parecia não fazer nada.
  const showAll = () => {
    setOpenAll(true);
    requestAnimationFrame(() => {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <Screen eyebrow={`${CATEGORY_LABELS[program.category]} · ${programMinutes(program)} min`} title={program.title} onBack={onBack}>
      <p className="lead">{program.summary}</p>
      <p className="program-facts">
        {program.drills.length} {program.drills.length === 1 ? "exercício" : "exercícios"} · ~{programMinutes(program)} min · {program.equipment}
      </p>
      {doneCount !== null && doneCount !== undefined && doneCount > 0 && (
        <p className="program-history">
          Você treinou este treino {doneCount === 1 ? "1 vez" : `${doneCount} vezes`}
          {lastDone ? ` · última em ${formatDayMonth(lastDone)}` : ""}
        </p>
      )}
      <div ref={listRef} className="drill-list-anchor">
        <Group header={`${program.drills.length} exercícios`} footer="Toque em um exercício para ver a dica e o vídeo antes de começar. Conteúdo em validação por profissional de educação física.">
          {program.drills.map((drill, index) => {
            const open = openAll || openId === drill.id;
            return (
              <div key={drill.id} className="drill-item">
                <button type="button" className="row drill-row" aria-expanded={open} onClick={() => toggle(drill.id)}>
                  <span className="row-label">
                    {index + 1}. {drill.name}
                    <small>
                      {drill.seconds} s{drill.restSeconds > 0 ? ` · descanso ${drill.restSeconds} s` : " · sem descanso"}
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
                  </div>
                )}
              </div>
            );
          })}
        </Group>
      </div>
      <div className="bottom-cta stack">
        <PrimaryButton onClick={onStart}>Começar treino</PrimaryButton>
        <PlainButton onClick={showAll}>Ver exercícios antes</PlainButton>
      </div>
    </Screen>
  );
}
