import { Group, PrimaryButton, Screen } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import { formatDayMonth, startOfWeekIso } from "../lib/dates";
import { CATEGORY_LABELS, programById, programMinutes, programsFor } from "../content/programs";
import type { Athlete, TrainingSession } from "../lib/types";

export function AthleteHome({
  athlete,
  sessions,
  onSwitch,
  onOpenProgram,
}: {
  athlete: Athlete;
  sessions: TrainingSession[];
  onSwitch: () => void;
  onOpenProgram: (programId: string) => void;
}) {
  const age = ageThisYear(athlete.birth_year);
  const band = bandFor(age);
  const programs = band ? programsFor(band.id, athlete.level) : [];
  const mine = sessions.filter((s) => s.athlete_id === athlete.id);
  const weekStart = startOfWeekIso();
  const thisWeek = mine.filter((s) => s.performed_on >= weekStart);
  const weekMinutes = thisWeek.reduce((total, s) => total + s.minutes, 0);

  // Sugestão: o treino da faixa feito há mais tempo (ou nunca feito), respeitando a ordem por nível.
  const lastDone = new Map<string, string>();
  for (const s of mine) if (!lastDone.has(s.program_id)) lastDone.set(s.program_id, s.performed_on);
  const suggestion = [...programs].sort((a, b) => (lastDone.get(a.id) ?? "").localeCompare(lastDone.get(b.id) ?? ""))[0];

  return (
    <Screen eyebrow={band ? `${band.label} · ${age} anos` : `${age} anos`} title={`Oi, ${athlete.nickname}`} onBack={onSwitch}>
      <div className="metrics two">
        <div className="metric">
          <strong>{thisWeek.length}</strong>
          <span>{thisWeek.length === 1 ? "treino nesta semana" : "treinos nesta semana"}</span>
        </div>
        <div className="metric">
          <strong>{weekMinutes}</strong>
          <span>minutos nesta semana</span>
        </div>
      </div>

      {suggestion && (
        <section className="suggestion-card">
          <p className="subtitle">Treino sugerido</p>
          <h2>{suggestion.title}</h2>
          <p>{suggestion.summary}</p>
          <p className="suggestion-meta">
            {CATEGORY_LABELS[suggestion.category]} · {programMinutes(suggestion)} min · {suggestion.drills.length} exercícios
          </p>
          <PrimaryButton onClick={() => onOpenProgram(suggestion.id)}>Ver treino</PrimaryButton>
        </section>
      )}

      {band ? (
        <Group header="Treinos para você" footer={`Faixa ${band.label}: ${band.focus.toLowerCase()}.`}>
          {programs.map((program) => (
            <button key={program.id} type="button" className="row row-nav" onClick={() => onOpenProgram(program.id)}>
              <span className="row-label">
                {program.title}
                <small>
                  {CATEGORY_LABELS[program.category]} · {programMinutes(program)} min
                  {lastDone.has(program.id) ? ` · feito em ${formatDayMonth(lastDone.get(program.id)!)}` : ""}
                </small>
              </span>
            </button>
          ))}
        </Group>
      ) : (
        <Group header="Treinos">
          <p className="row-note">Peça para o responsável conferir o ano de nascimento no seu perfil.</p>
        </Group>
      )}

      <Group header="Últimos treinos">
        {mine.length === 0 ? (
          <p className="row-note">Quando você terminar um treino, ele aparece aqui.</p>
        ) : (
          mine.slice(0, 5).map((s) => (
            <div key={s.id} className="row">
              <span className="row-label">
                {programById(s.program_id)?.title ?? "Treino"}
                <small>
                  {formatDayMonth(s.performed_on)} · {s.drills_done}/{s.drills_total} exercícios · {s.minutes} min
                </small>
              </span>
            </div>
          ))
        )}
      </Group>
    </Screen>
  );
}
