import { Group, Notice, Screen } from "../components/ui";
import { formatDayMonth } from "../lib/dates";
import { isTestDue, testProgress } from "../lib/progress";
import { formatTestValue } from "../content/tests";
import type { Athlete, SkillTestDef, SkillTestRecord } from "../lib/types";

// Detalhe de um teste da Evolução: o que mede, todas as marcas no gráfico e na lista.
// Segue a regra do produto: a comparação é só com a própria marca, nunca com outras pessoas.
export function TestDetail({
  athlete,
  def,
  tests,
  onBack,
  onStartTests,
}: {
  athlete: Athlete;
  def: SkillTestDef;
  tests: SkillTestRecord[];
  onBack: () => void;
  onStartTests: () => void;
}) {
  const progress = testProgress(def, tests);
  const marks = [...progress.points].reverse();
  const due = isTestDue(tests);

  return (
    <Screen eyebrow={athlete.nickname} title={def.name} onBack={onBack}>
      <Group
        header="Como funciona"
        footer={def.better === "min" ? "Neste teste, quanto menor o tempo, melhor." : "Neste teste, quanto maior a marca, melhor."}
      >
        <p className="row-note">{def.protocol}</p>
      </Group>

      {progress.last !== null && progress.best !== null ? (
        <div className="metrics two">
          <div className="metric">
            <strong>{formatTestValue(def, progress.last)}</strong>
            <span>última marca</span>
          </div>
          <div className="metric">
            <strong>{formatTestValue(def, progress.best)}</strong>
            <span>melhor marca</span>
          </div>
        </div>
      ) : (
        <Notice>Faça o teste pela primeira vez para começar a acompanhar a evolução.</Notice>
      )}

      {progress.points.length > 1 && (
        <Group header="Evolução da marca" footer="Compare só com você mesmo.">
          <div className="chart-box">
            <TestChart def={def} points={progress.points} />
          </div>
        </Group>
      )}

      {marks.length > 0 && (
        <Group header={`Marcas · ${marks.length}`}>
          {marks.map((point, i) => (
            <div key={`${point.date}-${i}`} className="row">
              <span className="row-label">
                {formatTestValue(def, point.value)}
                <small>
                  {formatDayMonth(point.date)}
                  {i === 0 ? " · mais recente" : ""}
                </small>
              </span>
              {point.value === progress.best && <span className="chip-up">melhor</span>}
            </div>
          ))}
        </Group>
      )}

      <button type="button" className="row row-action" onClick={onStartTests}>
        {due ? "Fazer testes agora" : "Registrar nova marca"}
      </button>
    </Screen>
  );
}

const chartNumber = (def: SkillTestDef, value: number) => (def.step === "decimal" ? String(value).replace(".", ",") : String(value));

function TestChart({ def, points }: { def: SkillTestDef; points: { date: string; value: number }[] }) {
  const width = 320;
  const height = 160;
  const padX = 26;
  const padTop = 16;
  const padBottom = 22;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (i: number) => padX + (i * (width - 2 * padX)) / (points.length - 1);
  const y = (v: number) => (max === min ? height / 2 : padTop + (height - padTop - padBottom) * (1 - (v - min) / (max - min)));
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const label = `Marcas de ${def.name}: ${points.map((p) => `${formatDayMonth(p.date)}, ${formatTestValue(def, p.value)}`).join("; ")}`;

  return (
    <svg className="test-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <path className="line" d={path} />
      {points.map((point, i) => (
        <g key={`${point.date}-${i}`}>
          <circle className="dot" cx={x(i)} cy={y(point.value)} r={4} />
          <text className="value" x={x(i)} y={y(point.value) - 8}>
            {chartNumber(def, point.value)}
          </text>
        </g>
      ))}
      <text className="axis" x={padX} y={height - 6} textAnchor="start">
        {formatDayMonth(points[0].date)}
      </text>
      <text className="axis" x={width - padX} y={height - 6} textAnchor="end">
        {formatDayMonth(points[points.length - 1].date)}
      </text>
    </svg>
  );
}
