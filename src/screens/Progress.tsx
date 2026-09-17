import { useMemo, useState } from "react";
import { CountUp, Group, Screen } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import { formatDayMonth, localIsoDate } from "../lib/dates";
import { achievements, goalStreak, isTestDue, lastWeeks, nextTestDate, testProgress, type WeekSummary } from "../lib/progress";
import { formatTestValue, testsFor } from "../content/tests";
import { programById } from "../content/programs";
import { TestDetail } from "./TestDetail";
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
  // Tocar num teste abre o detalhe dele, com todas as marcas e o que o teste mede.
  const [openTestId, setOpenTestId] = useState<string | null>(null);
  // Abas internas: uma história por vez em vez do scroll infinito.
  const [tab, setTab] = useState<"resumo" | "testes" | "mais">("resumo");
  const openDef = band ? defs.find((def) => def.id === openTestId) : undefined;

  if (openDef) {
    return (
      <TestDetail
        athlete={athlete}
        def={openDef}
        tests={tests}
        onBack={() => setOpenTestId(null)}
        onStartTests={onStartTests}
      />
    );
  }

  return (
    <Screen eyebrow={athlete.nickname} title="Evolução" onBack={onBack}>
      <div className="tabs-mini" role="tablist" aria-label="Seções da evolução">
        {(["resumo", "testes", "mais"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {id === "resumo" ? "Resumo" : id === "testes" ? "Testes" : "Conquistas"}
          </button>
        ))}
      </div>

      {tab === "resumo" && (
        <>
          <div className="metrics two">
            <div className="metric">
              <strong>
                <CountUp value={streak} />
              </strong>
              <span>{streak === 1 ? "semana seguida na meta" : "semanas seguidas na meta"}</span>
            </div>
            <div className="metric">
              <strong>
                <CountUp value={sessions.length} />
              </strong>
              <span>{sessions.length === 1 ? "treino no total" : "treinos no total"}</span>
            </div>
          </div>

          <Group header="Últimas 8 semanas" footer={`Meta: ${goal} por semana.`}>
            <div className="chart-box">
              <WeeksChart weeks={weeks} goal={goal} />
            </div>
          </Group>

          {due ? (
            <section className="due-card pending">
              <div>
                <p className="subtitle">Hora dos testes</p>
                <p>Meça de novo e veja o quanto evoluiu.</p>
              </div>
              <button type="button" className="secondary-button" onClick={onStartTests}>
                Fazer testes
              </button>
            </section>
          ) : nextDate ? (
            <p className="disclosure-note">Próxima bateria: {formatDayMonth(nextDate)}.</p>
          ) : null}

          <details className="disclosure">
            <summary>Ver calendário do mês</summary>
            <div className="disclosure-body">
              {sessions.length === 0 ? (
                <p className="row-note">Termine um treino e ele aparece aqui.</p>
              ) : (
                <MonthCalendar sessions={sessions} />
              )}
            </div>
          </details>
        </>
      )}

      {tab === "testes" && band && (
        <Group
          header="Testes"
          footer={nextDate ? `Próxima bateria: ${formatDayMonth(nextDate)}. Compare só com você.` : "Os testes se repetem a cada 4 semanas."}
        >
          {defs.map((def) => {
            const progress = testProgress(def, tests);
            return (
              <button key={def.id} type="button" className="row row-nav" onClick={() => setOpenTestId(def.id)}>
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
              </button>
            );
          })}
          <button type="button" className="row row-action" onClick={onStartTests}>
            {due ? "Fazer testes agora" : "Fazer testes antes da data"}
          </button>
        </Group>
      )}

      {tab === "testes" && !band && (
        <Group header="Testes">
          <p className="row-note">Confira o ano de nascimento do perfil na tela Conta.</p>
        </Group>
      )}

      {tab === "mais" && (
        <Group header={`Conquistas · ${earned} de ${badges.length}`}>
          <div className="badges">
            {badges.map((badge) => (
              <div key={badge.id} className={`badge${badge.earned ? " earned" : ""}`}>
                <span className="badge-mark" aria-hidden="true">
                  {badge.earned ? "★" : "☆"}
                </span>
                <strong>{badge.title}</strong>
                {badge.earned && <span>{badge.description}</span>}
                <span className="visually-hidden">{badge.earned ? "Conquistada" : "Ainda não conquistada"}</span>
              </div>
            ))}
          </div>
        </Group>
      )}
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

// Calendário do mês com bolinha nos dias com treino. Só lê `sessions` que a tela já tem:
// sem busca nova, sem limite novo e sem comparar com outras pessoas.
function MonthCalendar({ sessions }: { sessions: TrainingSession[] }) {
  const today = localIsoDate();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, TrainingSession[]>();
    for (const s of sessions) {
      const list = map.get(s.performed_on) ?? [];
      list.push(s);
      map.set(s.performed_on, list);
    }
    return map;
  }, [sessions]);

  const base = new Date();
  const first = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const year = first.getFullYear();
  const month = first.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7; // semana começa na segunda
  const pad = (n: number) => String(n).padStart(2, "0");
  const isoOf = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const monthLabel = first.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const selectedList = selected ? (byDay.get(selected) ?? []) : [];

  return (
    <div className="cal">
      <div className="cal-nav">
        <button type="button" className="cal-arrow" aria-label="Mês anterior" disabled={offset <= -11} onClick={() => { setOffset((o) => o - 1); setSelected(null); }}>
          ‹
        </button>
        <strong>{monthLabel}</strong>
        <button type="button" className="cal-arrow" aria-label="Próximo mês" disabled={offset >= 0} onClick={() => { setOffset((o) => o + 1); setSelected(null); }}>
          ›
        </button>
      </div>
      <div className="cal-grid" role="grid" aria-label={`Treinos em ${monthLabel}`}>
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <span key={i} className="cal-weekday" aria-hidden="true">
            {d}
          </span>
        ))}
        {Array.from({ length: leading }).map((_, i) => (
          <span key={`vazio-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const iso = isoOf(day);
          const count = byDay.get(iso)?.length ?? 0;
          const future = iso > today;
          return (
            <button
              key={iso}
              type="button"
              className={`cal-day${count > 0 ? " has" : ""}${iso === today ? " today" : ""}${iso === selected ? " selected" : ""}`}
              disabled={future || count === 0}
              aria-label={count > 0 ? `Dia ${day}, ${count} ${count === 1 ? "treino" : "treinos"}` : `Dia ${day}`}
              onClick={() => setSelected((cur) => (cur === iso ? null : iso))}
            >
              {day}
              {count > 0 && <span className="cal-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {selected ? (
        <div className="cal-list">
          {selectedList.map((s) => (
            <div key={s.id} className="row">
              <span className="row-label">
                {programById(s.program_id)?.title ?? "Treino"}
                <small>
                  {formatDayMonth(s.performed_on)} · {s.drills_done}/{s.drills_total} exercícios · {s.minutes} min
                </small>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="row-note">Toque num dia com bolinha para ver o treino.</p>
      )}
    </div>
  );
}
