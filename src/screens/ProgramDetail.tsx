import { Group, PrimaryButton, Screen } from "../components/ui";
import { CATEGORY_LABELS, programMinutes } from "../content/programs";
import type { Program } from "../lib/types";

export function ProgramDetail({ program, onBack, onStart }: { program: Program; onBack: () => void; onStart: () => void }) {
  return (
    <Screen eyebrow={`${CATEGORY_LABELS[program.category]} · ${programMinutes(program)} min`} title={program.title} onBack={onBack}>
      <p className="lead">{program.summary}</p>
      <Group header="Material">
        <p className="row-note">{program.equipment}</p>
      </Group>
      <Group header={`${program.drills.length} exercícios`} footer="Conteúdo em validação por profissional de educação física.">
        {program.drills.map((drill) => (
          <div key={drill.id} className="row drill-row">
            <span className="row-label">
              {drill.name}
              <small>{drill.cue}</small>
            </span>
            <span className="row-value">
              {drill.seconds} s{drill.video ? " · vídeo" : ""}
            </span>
          </div>
        ))}
      </Group>
      <div className="bottom-cta">
        <PrimaryButton onClick={onStart}>Começar treino</PrimaryButton>
      </div>
    </Screen>
  );
}
