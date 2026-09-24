import { useMemo, useState } from "react";
import { CountUp, Group, PrimaryButton, Screen } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import { formatDayMonth, localIsoDate, startOfWeekIso } from "../lib/dates";
import {
  achievements,
  bestGoalStreak,
  fundamentalsProgress,
  goalStreak,
  isTestDue,
  lastWeeks,
  nextTestDate,
  testProgress,
  type FundamentalProgress,
  type WeekSummary,
} from "../lib/progress";
import { formatTestValue, testsFor } from "../content/tests";
import { CATEGORY_LABELS, programById, programsFor } from "../content/programs";
import { TestDetail } from "./TestDetail";
import type { Athlete, Category, Program, SkillTestDef, SkillTestRecord, TrainingSession } from "../lib/types";

export function Progress({
  athlete,
  sessions,
  tests,
  onBack,
  onStartTests,
  onOpenProgram,
  onUpdateGoal,
}: {
  athlete: Athlete;
  sessions: TrainingSession[];
  tests: SkillTestRecord[];
  onBack: () => void;
  onStartTests: () => void;
  onOpenProgram: (programId: string) => void;
  onUpdateGoal: (goal: number) => Promise<void> | void;
}) {
  const band = bandFor(ageThisYear(athlete.birth_year));
  const goal = athlete.weekly_goal;
  const streak = goalStreak(sessions, goal);
  const record = bestGoalStreak(sessions, goal);
  const weeks = lastWeeks(sessions, 8);
  const defs = band ? testsFor(band.id) : [];
  const nextDate = nextTestDate(tests);
  const due = isTestDue(tests);
  const badges = achievements(sessions, tests, goal, defs);
  const earned = badges.filter((badge) => badge.earned).length;
  // Tocar num teste abre o detalhe dele, com todas as marcas e o que o teste mede.
  const [openTestId, setOpenTestId] = useState<string | null>(null);
  // Abas internas: uma história por vez em vez do scroll infinito.
  const [tab, setTab] = useState<"mapa" | "testes" | "mais">("mapa");
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
        {(["mapa", "testes", "mais"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {id === "mapa" ? "Mapa" : id === "testes" ? "Testes" : "Conquistas"}
          </button>
        ))}
      </div>

      {tab === "mapa" && (
        <>
          <GoalCard sessions={sessions} goal={goal} streak={streak} onUpdateGoal={onUpdateGoal} />

          <FundamentalsMap
            athlete={athlete}
            sessions={sessions}
            tests={tests}
            defs={defs}
            onOpenProgram={onOpenProgram}
          />

          <div className="metrics two">
            <div className="metric">
              <strong>
                <CountUp value={streak} />
              </strong>
              <span>{streak === 1 ? "semana seguida na meta" : "semanas seguidas na meta"}</span>
              {record > 0 && (
                <span className="metric-record">recorde: {record === 1 ? "1 semana" : `${record} semanas`}</span>
              )}
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

          <Group header="Últimos treinos">
            {sessions.length === 0 ? (
              <p className="row-note">Termine um treino e ele aparece aqui.</p>
            ) : (
              sessions.slice(0, 3).map((s) => (
                <div key={s.id} className="row">
                  <span className="row-label">
                    {programById(s.program_id)?.title ?? "Treino"}
                    <small>
                      {formatDayMonth(s.performed_on)} · {s.drills_done}/{s.drills_total} · {s.minutes} min
                      {s.feeling ? ` · como foi: ${s.feeling}/5` : ""}
                      {s.pending ? " · neste aparelho" : ""}
                    </small>
                  </span>
                </div>
              ))
            )}
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
            {due ? "Fazer testes agora" : "Registrar novas marcas"}
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
                <span>{badge.description}</span>
                <span className="visually-hidden">{badge.earned ? "Conquistada" : "Ainda não conquistada"}</span>
              </div>
            ))}
          </div>
        </Group>
      )}
    </Screen>
  );
}

/** Meta da semana com ajuste − / + (1 a 7), sem sair da Evolução. */
function GoalCard({
  sessions,
  goal,
  streak,
  onUpdateGoal,
}: {
  sessions: TrainingSession[];
  goal: number;
  streak: number;
  onUpdateGoal: (goal: number) => Promise<void> | void;
}) {
  const weekStart = startOfWeekIso();
  const thisWeek = sessions.filter((s) => s.performed_on >= weekStart);
  const weekMinutes = thisWeek.reduce((total, s) => total + s.minutes, 0);
  const met = thisWeek.length >= goal;
  const goalPct = Math.min(100, Math.round((thisWeek.length / goal) * 100));
  const [updating, setUpdating] = useState(false);
  async function changeGoal(delta: number) {
    const next = goal + delta;
    if (updating || next < 1 || next > 7) return;
    setUpdating(true);
    try {
      await onUpdateGoal(next);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <section className={`goal-card${met ? " met" : ""}`} aria-label="Meta da semana">
      <div className="goal-head">
        <span>Meta da semana</span>
        {met && (
          <span className="met-badge" role="status">
            Meta batida!
          </span>
        )}
        <strong>
          {thisWeek.length} de {goal} {goal === 1 ? "treino" : "treinos"}
        </strong>
      </div>
      <div className="goal-bar" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={thisWeek.length}>
        <span className={met ? "met" : ""} style={{ width: `${goalPct}%` }} />
      </div>
      <div className="goal-foot">
        <p>
          {weekMinutes} min nesta semana
          {streak > 0 ? ` · ${streak} ${streak === 1 ? "semana seguida" : "semanas seguidas"} na meta` : ""}
        </p>
        <div className="goal-stepper" role="group" aria-label="Ajustar meta da semana">
          <button type="button" aria-label="Diminuir meta" disabled={updating || goal <= 1} onClick={() => void changeGoal(-1)}>
            −
          </button>
          <span aria-hidden="true">{goal}</span>
          <button type="button" aria-label="Aumentar meta" disabled={updating || goal >= 7} onClick={() => void changeGoal(1)}>
            +
          </button>
        </div>
      </div>
    </section>
  );
}

const FUNDAMENTAL_COPY: Record<Category, string> = {
  drible: "Controle de bola, ritmo e confiança com as duas mãos.",
  arremesso: "Mecânica, equilíbrio e repetição perto ou longe da cesta.",
  passe: "Precisão, leitura e conexão com quem joga junto.",
  defesa: "Postura, deslocamento e reação sem cruzar os pés.",
  fisico: "Coordenação, velocidade, salto e aterrissagem segura.",
};

function FundamentalsMap({
  athlete,
  sessions,
  tests,
  defs,
  onOpenProgram,
}: {
  athlete: Athlete;
  sessions: TrainingSession[];
  tests: SkillTestRecord[];
  defs: SkillTestDef[];
  onOpenProgram: (programId: string) => void;
}) {
  const band = bandFor(ageThisYear(athlete.birth_year));
  const fundamentals = useMemo(() => fundamentalsProgress(sessions, tests, defs), [sessions, tests, defs]);
  const availablePrograms = useMemo(
    () => (band ? programsFor(band.id, athlete.level) : []),
    [band, athlete.level],
  );
  const focus = useMemo(
    () =>
      [...fundamentals]
        .filter((item) => availablePrograms.some((program) => program.category === item.category))
        .sort(
          (a, b) =>
            a.recentSessions - b.recentSessions ||
            a.sessions - b.sessions ||
            (a.lastTrained ?? "").localeCompare(b.lastTrained ?? ""),
        )[0]?.category ??
      "drible",
    [fundamentals, availablePrograms],
  );
  const [selectedCategory, setSelectedCategory] = useState<Category>(focus);
  const selected = fundamentals.find((item) => item.category === selectedCategory) ?? fundamentals[0];
  const suggestion = suggestedProgram(selected.category, availablePrograms, sessions);

  return (
    <section className="fundamentals-map" aria-labelledby="fundamentals-title">
      <div className="fundamentals-head">
        <div>
          <p className="subtitle">Seu jogo</p>
          <h2 id="fundamentals-title">Mapa de fundamentos</h2>
        </div>
        <span className="map-window">últimos 28 dias</span>
      </div>
      <p className="fundamentals-intro">
        Veja o que você vem praticando e toque em uma área para escolher o próximo treino.
      </p>

      <div className="skill-court" aria-label="Fundamentos do basquete">
        <span className="court-line court-half" aria-hidden="true" />
        <span className="court-line court-key" aria-hidden="true" />
        <span className="court-line court-arc" aria-hidden="true" />
        {fundamentals.map((item) => (
          <FundamentalNode
            key={item.category}
            item={item}
            selected={item.category === selected.category}
            recommended={item.category === focus}
            onSelect={() => setSelectedCategory(item.category)}
          />
        ))}
      </div>

      <p className="map-legend">Os números mostram treinos registrados nos últimos 28 dias, não uma nota de habilidade.</p>

      <article className="fundamental-detail" aria-live="polite">
        <div className="fundamental-detail-head">
          <div>
            <p className="subtitle">{selected.category === focus ? "Foco sugerido" : "Fundamento"}</p>
            <h3>{CATEGORY_LABELS[selected.category]}</h3>
          </div>
          {selected.improved && <span className="progress-signal">teste evoluiu</span>}
        </div>
        <p className="fundamental-description">{FUNDAMENTAL_COPY[selected.category]}</p>
        <div className="fundamental-stats">
          <div>
            <strong>{selected.sessions}</strong>
            <span>{selected.sessions === 1 ? "treino" : "treinos"}</span>
          </div>
          <div>
            <strong>{selected.minutes}</strong>
            <span>minutos</span>
          </div>
          <div>
            <strong>{selected.lastTrained ? formatDayMonth(selected.lastTrained) : "—"}</strong>
            <span>último</span>
          </div>
        </div>
        <p className="fundamental-note">{fundamentalNote(selected)}</p>
        {suggestion ? (
          <PrimaryButton onClick={() => onOpenProgram(suggestion.id)}>Treinar {suggestion.title}</PrimaryButton>
        ) : (
          <p className="fundamental-unavailable">Ainda não há um treino deste fundamento para esta faixa.</p>
        )}
      </article>
    </section>
  );
}

function FundamentalNode({
  item,
  selected,
  recommended,
  onSelect,
}: {
  item: FundamentalProgress;
  selected: boolean;
  recommended: boolean;
  onSelect: () => void;
}) {
  const label = CATEGORY_LABELS[item.category];
  return (
    <button
      type="button"
      className={`skill-node skill-node-${item.category}${selected ? " selected" : ""}${item.recentSessions > 0 ? " practiced" : ""}`}
      aria-pressed={selected}
      aria-label={`${label}: ${item.recentSessions} ${item.recentSessions === 1 ? "treino registrado nos últimos 28 dias" : "treinos registrados nos últimos 28 dias"}${recommended ? ", foco sugerido" : ""}${item.improved ? ", teste evoluiu" : ""}`}
      onClick={onSelect}
    >
      {recommended && <span className="skill-node-focus" aria-hidden="true" />}
      {item.improved && <span className="skill-node-up" aria-hidden="true">↗</span>}
      <span className="skill-node-count">{item.recentSessions}</span>
      <span className="skill-node-label">{label}</span>
    </button>
  );
}

function suggestedProgram(category: Category, programs: Program[], sessions: TrainingSession[]): Program | undefined {
  const lastDone = new Map<string, string>();
  for (const session of sessions) {
    const last = lastDone.get(session.program_id);
    if (!last || session.performed_on > last) lastDone.set(session.program_id, session.performed_on);
  }
  return programs
    .filter((program) => program.category === category)
    .sort((a, b) => (lastDone.get(a.id) ?? "").localeCompare(lastDone.get(b.id) ?? ""))[0];
}

function fundamentalNote(item: FundamentalProgress): string {
  if (item.improved) return "Sua marca mais recente melhorou em relação à primeira medição.";
  if (item.tested) return "Você já tem uma marca de teste para acompanhar neste fundamento.";
  if (item.availableTests > 0) return "Faça os testes para acompanhar suas marcas além da frequência de treino.";
  if (item.recentSessions > 0) {
    return `${item.recentSessions} ${item.recentSessions === 1 ? "treino registrado" : "treinos registrados"} nos últimos 28 dias.`;
  }
  if (item.sessions > 0) return "Faz mais de 28 dias desde a última prática registrada deste fundamento.";
  return "Comece por um treino e este ponto do mapa passa a contar sua história.";
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
        const center = i * slot + slot / 2;
        const met = week.sessions > 0 && week.sessions >= goal;
        return (
          <g key={week.start}>
            <title>{`${week.sessions} de ${goal} treinos`}</title>
            <rect
              className={week.sessions >= goal ? "bar met" : "bar"}
              x={i * slot + (slot - barWidth) / 2}
              y={Math.min(top, height - padBottom - 2)}
              width={barWidth}
              height={Math.max(2, height - padBottom - top)}
              rx={4}
            />
            {met && (
              <text className="bar-value" x={center} y={Math.max(top - 5, 10)} textAnchor="middle">
                {week.sessions}
              </text>
            )}
            <text className="axis" x={center} y={height - 5} textAnchor="middle">
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
