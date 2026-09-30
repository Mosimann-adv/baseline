import { useRef, useState } from "react";
import { Group, PrimaryButton, Screen } from "../components/ui";
import { CATEGORY_LABELS, programMinutes } from "../content/programs";
import { formatDayMonth } from "../lib/dates";
import type { Program } from "../lib/types";
import { ExerciseVideo } from "../components/ExerciseVideo";

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
    <Screen eyebrow={`${program.kind === "session" ? "Sessão" : "Bloco"} · ${programMinutes(program)} min`} title={program.title} onBack={onBack}>
      <p className="lead">{program.summary}</p>
      <p className="program-facts">
        {program.drills.length} {program.drills.length === 1 ? "exercício" : "exercícios"} · ~{programMinutes(program)} min · {program.equipment}
      </p>
      {program.blocks && <Group header="Como a sessão se organiza">{program.blocks.map((block) => <div className="row" key={block.id}><span className="row-label">{block.title}<small>{CATEGORY_LABELS[block.category]}</small></span></div>)}</Group>}
      {doneCount !== null && doneCount !== undefined && doneCount > 0 && (
        <p className="program-history">
            Você registrou esta prática {doneCount === 1 ? "1 vez" : `${doneCount} vezes`}
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
                      <ExerciseVideo video={drill.video} />
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
        <button type="button" className="inline-link" onClick={showAll}>Ver todos os exercícios antes</button>
      </div>
    </Screen>
  );
}
