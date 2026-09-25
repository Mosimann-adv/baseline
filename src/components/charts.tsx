import { useMemo, useState } from "react";
import { formatDayMonth, localIsoDate } from "../lib/dates";
import type { WeekSummary } from "../lib/progress";
import { programById } from "../content/programs";
import type { TrainingSession } from "../lib/types";

export function WeeksChart({ weeks, goal }: { weeks: WeekSummary[]; goal: number }) {
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

export function Sparkline({ values }: { values: number[] }) {
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

// Dias da semana começando na segunda; o nome completo vai no abbr do th para leitores de tela.
const WEEKDAYS = [
  { short: "S", full: "Segunda" },
  { short: "T", full: "Terça" },
  { short: "Q", full: "Quarta" },
  { short: "Q", full: "Quinta" },
  { short: "S", full: "Sexta" },
  { short: "S", full: "Sábado" },
  { short: "D", full: "Domingo" },
] as const;

// Calendário do mês com bolinha nos dias com treino. Só lê `sessions` que a tela já tem:
// sem busca nova, sem limite novo e sem comparar com outras pessoas.
// Tabela nativa (caption, thead, tbody): o antigo role="grid" anunciava uma grade sem linhas nem células.
export function MonthCalendar({ sessions }: { sessions: TrainingSession[] }) {
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

  // Dias enfileirados com os vazios do começo, cortados em semanas de 7 células.
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

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
      <table className="cal-table">
        <caption className="visually-hidden">Treinos em {monthLabel}</caption>
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th key={day.full} scope="col" abbr={day.full}>
                {day.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((day, d) =>
                day === null ? (
                  <td key={`vazio-${w}-${d}`} />
                ) : (
                  <td key={day}>
                    <DayButton
                      day={day}
                      iso={isoOf(day)}
                      today={today}
                      selected={selected}
                      count={byDay.get(isoOf(day))?.length ?? 0}
                      onToggle={() => setSelected((cur) => (cur === isoOf(day) ? null : isoOf(day)))}
                    />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
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

function DayButton({
  day,
  iso,
  today,
  selected,
  count,
  onToggle,
}: {
  day: number;
  iso: string;
  today: string;
  selected: string | null;
  count: number;
  onToggle: () => void;
}) {
  const future = iso > today;
  return (
    <button
      type="button"
      className={`cal-day${count > 0 ? " has" : ""}${iso === today ? " today" : ""}${iso === selected ? " selected" : ""}`}
      disabled={future || count === 0}
      aria-label={count > 0 ? `Dia ${day}, ${count} ${count === 1 ? "treino" : "treinos"}` : `Dia ${day}`}
      onClick={onToggle}
    >
      {day}
      {count > 0 && <span className="cal-dot" aria-hidden="true" />}
    </button>
  );
}
