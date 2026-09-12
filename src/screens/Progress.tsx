import { Group, Screen } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import { formatDayMonth } from "../lib/dates";
import { achievements, goalStreak, isTestDue, lastWeeks, nextTestDate, testProgress, type WeekSummary } from "../lib/progress";
import { formatTestValue, testsFor } from "../content/tests";
import { programById } from "../content/programs";
import type { Athlete, SkillTestRecord, TrainingSession } from "../lib/types";

export function Progress({
  athlete,
  sessions,
  tests,
  onBack,
  onStartTests,
}: {
  athlete: Athlete;
  sessions: TrainingSession[];
  tests: SkillTestRecord[];
  onBack: () => void;
  onStartTests: () => void;
}) {
  const band = bandFor(ageThisYear(athlete.birth_year));
  const goal = athlete.weekly_goal;
  const streak = goalStreak(sessions, goal);
  const weeks = lastWeeks(sessions, 8);
  const defs = band ? testsFor(band.id) : [];
  const nextDate = nextTestDate(tests);
  const due = isTestDue(tests);
  const badges = achievements(sessions, tests, goal, defs);
  const earned = badges.filter((badge) => badge.earned).length;

  return (
    <Screen eyebrow={athlete.nickname} title="Evolução" onBack={onBack}>
      <div className="metrics two">
        <div className="metric">
          <strong>{streak}</strong>
          <span>{streak === 1 ? "semana seguida na meta" : "semanas seguidas na meta"}</span>
        </div>
        <div className="metric">
          <strong>{sessions.length}</strong>
          <span>{sessions.length === 1 ? "treino no total" : "treinos no total"}</span>
        </div>
      </div>

      <Group header="Últimas 8 semanas" footer={`Meta: ${goal} ${goal === 1 ? "treino" : "treinos"} por semana. A barra fica laranja quando a meta é cumprida.`}>
        <div className="chart-box">
          <WeeksChart weeks={weeks} goal={goal} />
        </div>
      </Group>

      {band && (
        <Group
          header="Testes"
          footer={nextDate ? `Próxima bateria: ${formatDayMonth(nextDate)}. Compare só com você mesmo.` : "Os testes se repetem a cada 4 semanas."}
        >
          {defs.map((def) => {
            const progress = testProgress(def, tests);
            return (
              <div key={def.id} className="row test-row">
                <span className="row-label">
                  {def.name}
                  <small>
                    {progress.last !== null && progress.best !== null
                      ? `Última: ${formatTestValue(def, progress.last)} · melhor: ${formatTestValue(def, progress.best)}`
                      : "Sem marca ainda"}
                  </small>
                </span>
                {progress.improved && <span className="chip-up">evoluiu</span>}
                {progress.points.length > 1 && <Sparkline values={progress.points.map((p) => p.value)} />}
              </div>
            );
          })}
          <button type="button" className="row row-action" onClick={onStartTests}>
            {due ? "Fazer testes agora" : "Fazer testes antes da data"}
          </button>
        </Group>
      )}

      <Group header={`Conquistas · ${earned} de ${badges.length}`}>
        <div className="badges">
          {badges.map((badge) => (
            <div key={badge.id} className={`badge${badge.earned ? " earned" : ""}`}>
              <span className="badge-mark" aria-hidden="true">
                {badge.earned ? "★" : "☆"}
              </span>
              <strong>{badge.title}</strong>
              <span>{badge.description}</span>
              <span className="visually-hidden">{badge.earned ? "Conquistada" : "Ainda não conquistada"}</span>
            </div>
          ))}
        </div>
      </Group>

      <Group header="Todos os treinos">
        {sessions.length === 0 ? (
          <p className="row-note">Nenhum treino registrado ainda.</p>
        ) : (
          sessions.slice(0, 30).map((s) => (
            <div key={s.id} className="row">
              <span className="row-label">
                {programById(s.program_id)?.title ?? "Treino"}
                <small>
                  {formatDayMonth(s.performed_on)} · {s.drills_done}/{s.drills_total} exercícios · {s.minutes} min
                  {s.feeling ? ` · como foi: ${s.feeling}/5` : ""}
                </small>
              </span>
            </div>
          ))
        )}
      </Group>
    </Screen>
  );
}

function WeeksChart({ weeks, goal }: { weeks: WeekSummary[]; goal: number }) {
  const width = 320;
  const height = 132;
  const padTop = 10;
  const padBottom = 20;
  const maxValue = Math.max(goal, ...weeks.map((w) => w.sessions), 1);
  const slot = width / weeks.length;
  const barWidth = slot * 0.56;
  const y = (value: number) => padTop + (height - padTop - padBottom) * (1 - value / maxValue);
  const label = `Treinos por semana: ${weeks.map((w) => `semana de ${formatDayMonth(w.start)}, ${w.sessions}`).join("; ")}`;

  return (
    <svg className="weeks-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <line className="goal-line" x1={0} x2={width} y1={y(goal)} y2={y(goal)} />
      {weeks.map((week, i) => {
        const top = y(week.sessions);
        return (
          <g key={week.start}>
            <rect
              className={week.sessions >= goal ? "bar met" : "bar"}
              x={i * slot + (slot - barWidth) / 2}
              y={Math.min(top, height - padBottom - 2)}
              width={barWidth}
              height={Math.max(2, height - padBottom - top)}
              rx={4}
            />
            <text className="axis" x={i * slot + slot / 2} y={height - 5} textAnchor="middle">
              {formatDayMonth(week.start)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const width = 72;
  const height = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (i: number) => 3 + (i * (width - 6)) / (values.length - 1);
  const y = (v: number) => (max === min ? height / 2 : height - 4 - ((v - min) * (height - 8)) / (max - min));
  const path = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <path d={path} />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={2.8} />
    </svg>
  );
}
