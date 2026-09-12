import { Group, PrimaryButton, Screen } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import { formatDayMonth, startOfWeekIso } from "../lib/dates";
import { goalStreak, isTestDue } from "../lib/progress";
import { CATEGORY_LABELS, programById, programMinutes, programsFor } from "../content/programs";
import type { Athlete, SkillTestRecord, TrainingSession } from "../lib/types";

export function AthleteHome({
  athlete,
  sessions,
  tests,
  onSwitch,
  onOpenProgram,
  onOpenProgress,
  onStartTests,
}: {
  athlete: Athlete;
  sessions: TrainingSession[];
  tests: SkillTestRecord[];
  onSwitch: () => void;
  onOpenProgram: (programId: string) => void;
  onOpenProgress: () => void;
  onStartTests: () => void;
}) {
  const age = ageThisYear(athlete.birth_year);
  const band = bandFor(age);
  const programs = band ? programsFor(band.id, athlete.level) : [];
  const goal = athlete.weekly_goal;
  const weekStart = startOfWeekIso();
  const thisWeek = sessions.filter((s) => s.performed_on >= weekStart);
  const weekMinutes = thisWeek.reduce((total, s) => total + s.minutes, 0);
  const streak = goalStreak(sessions, goal);
  const goalPct = Math.min(100, Math.round((thisWeek.length / goal) * 100));
  const testDue = band !== null && isTestDue(tests);

  // Sugestão: o treino da faixa feito há mais tempo (ou nunca feito), respeitando a ordem por nível.
  const lastDone = new Map<string, string>();
  for (const s of sessions) if (!lastDone.has(s.program_id)) lastDone.set(s.program_id, s.performed_on);
  const suggestion = [...programs].sort((a, b) => (lastDone.get(a.id) ?? "").localeCompare(lastDone.get(b.id) ?? ""))[0];

  return (
    <Screen eyebrow={band ? `${band.label} · ${age} anos` : `${age} anos`} title={`Oi, ${athlete.nickname}`} onBack={onSwitch}>
      <section className="goal-card" aria-label="Meta da semana">
        <div className="goal-head">
          <span>Meta da semana</span>
          <strong>
            {thisWeek.length} de {goal} {goal === 1 ? "treino" : "treinos"}
          </strong>
        </div>
        <div className="goal-bar" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={thisWeek.length}>
          <span className={thisWeek.length >= goal ? "met" : ""} style={{ width: `${goalPct}%` }} />
        </div>
        <p>
          {weekMinutes} min nesta semana
          {streak > 0 ? ` · ${streak} ${streak === 1 ? "semana seguida" : "semanas seguidas"} na meta` : ""}
        </p>
      </section>

      {testDue && (
        <section className="due-card">
          <div>
            <p className="subtitle">{tests.length === 0 ? "Primeiro teste" : "Hora dos testes"}</p>
            <p>{tests.length === 0 ? "Faça seus primeiros testes para acompanhar a evolução." : "Já passaram 4 semanas: veja o quanto você evoluiu."}</p>
          </div>
          <button type="button" className="secondary-button" onClick={onStartTests}>
            Fazer testes
          </button>
        </section>
      )}

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

      <Group>
        <button type="button" className="row row-nav" onClick={onOpenProgress}>
          <span className="row-label">
            Minha evolução
            <small>Testes, conquistas e todos os treinos</small>
          </span>
        </button>
      </Group>

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
        {sessions.length === 0 ? (
          <p className="row-note">Quando você terminar um treino, ele aparece aqui.</p>
        ) : (
          sessions.slice(0, 3).map((s) => (
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
