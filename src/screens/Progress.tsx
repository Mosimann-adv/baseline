import { useRef, useState } from "react";
import { CountUp, Group, Notice, PrimaryButton, Screen } from "../components/ui";
import { MonthCalendar, Sparkline, WeeksChart } from "../components/charts";
import { ageThisYear, bandFor } from "../lib/age";
import { formatDayMonth, startOfWeekIso } from "../lib/dates";
import { friendlyError } from "../lib/errors";
import { achievements, bestGoalStreak, fundamentalsProgress, goalStreak, isCountedPractice, lastWeeks, testProgress } from "../lib/progress";
import { nextTestFor, testIsDue, testsDue } from "../lib/testStatus";
import { formatTestValue, testsFor } from "../content/tests";
import { CATEGORY_LABELS, programMinutes, programsFor } from "../content/programs";
import { practiceById } from "../content/practices";
import { TestDetail } from "./TestDetail";
import type { Athlete, Category, SkillTestRecord, TrainingSession } from "../lib/types";

const TABS = ["summary", "map", "tests", "achievements"] as const;
const LABELS = { summary: "Resumo", map: "Mapa", tests: "Testes", achievements: "Conquistas" };

export function Progress({ athlete, sessions, tests, onBack, onStartTests, onOpenProgram, onUpdateGoal }: {
  athlete: Athlete; sessions: TrainingSession[]; tests: SkillTestRecord[]; onBack: () => void;
  onStartTests: (testId?: string, quickEntry?: boolean) => void; onOpenProgram: (programId: string) => void;
  onUpdateGoal: (goal: number) => Promise<void> | void;
}) {
  const band = bandFor(ageThisYear(athlete.birth_year));
  const counted = sessions.filter(isCountedPractice);
  const defs = band ? testsFor(band.id) : [];
  const due = testsDue(defs, tests);
  const streak = goalStreak(counted, athlete.weekly_goal, new Date(), athlete.goal_history);
  const record = bestGoalStreak(counted, athlete.weekly_goal, athlete.goal_history);
  const badges = achievements(counted, tests, athlete.weekly_goal, defs, new Date(), athlete.goal_history, athlete.earned_badges);
  const fundamentals = fundamentalsProgress(counted, tests, defs);
  const available = band ? programsFor(band.id, athlete.level) : [];
  const week = counted.filter((session) => session.performed_on >= startOfWeekIso());
  const recentCategories = fundamentals.filter((item) => item.recentSessions > 0);
  const [tab, setTab] = useState<(typeof TABS)[number]>("summary");
  const [category, setCategory] = useState<Category>("drible");
  const [openTest, setOpenTest] = useState<string | null>(null);
  const [historyLimit, setHistoryLimit] = useState(6);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedTest = defs.find((test) => test.id === openTest);
  if (selectedTest) return <TestDetail athlete={athlete} def={selectedTest} tests={tests} onBack={() => setOpenTest(null)} onStartTests={onStartTests} />;

  return <Screen eyebrow={athlete.nickname} title="Evolução">
    <div className="tabs-mini progress-tabs" role="tablist" aria-label="Seções da evolução">{TABS.map((id, index) => <button key={id} ref={(el) => { refs.current[index] = el; }}
      type="button" role="tab" id={`evolution-tab-${id}`} aria-selected={tab === id} aria-controls={`evolution-panel-${id}`} tabIndex={tab === id ? 0 : -1}
      onClick={() => setTab(id)} onKeyDown={(event) => {
        const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!delta) return;
        event.preventDefault();
        const next = (index + delta + TABS.length) % TABS.length;
        setTab(TABS[next]); refs.current[next]?.focus();
      }}>{LABELS[id]}</button>)}</div>
    {TABS.map((id) => <div key={id} role="tabpanel" id={`evolution-panel-${id}`} aria-labelledby={`evolution-tab-${id}`} hidden={tab !== id} className="tabpanel">
      {tab === id && id === "summary" && <>
        <GoalCard athlete={athlete} count={week.length} minutes={week.reduce((sum, session) => sum + session.minutes, 0)} onUpdateGoal={onUpdateGoal} />
        {counted.length > 0 && <div className="stack next-practice-action"><PrimaryButton onClick={onBack}>Escolher minha próxima prática</PrimaryButton></div>}
        {counted.length === 0 ? <section className="empty-practice"><h2>Sua primeira prática começa aqui</h2><p>Escolha um bloco, faça no seu ritmo e salve. Depois você acompanha a sua constância e suas marcas.</p><PrimaryButton onClick={onBack}>Escolher uma prática</PrimaryButton></section> : <>
          <div className="metrics two"><div className="metric"><strong><CountUp value={counted.length} /></strong><span>práticas registradas no total</span></div><div className="metric"><strong><CountUp value={streak} /></strong><span>semanas seguidas na meta</span><span className="metric-record">recorde: {record}</span></div></div>
          <Group header="O que você vem praticando" footer="Prática registrada nos últimos 28 dias. Frequência não é uma nota de habilidade.">{recentCategories.length ? recentCategories.map((item) => <button type="button" className="row row-nav" key={item.category} onClick={() => { setCategory(item.category); setTab("map"); }}><span className="row-label">{CATEGORY_LABELS[item.category]}<small>{item.recentSessions} {item.recentSessions === 1 ? "prática" : "práticas"} nos últimos 28 dias</small></span></button>) : <p className="row-note">Você pode voltar a praticar quando fizer sentido para sua rotina.</p>}</Group>
        </>}
        <Group header="Suas marcas" footer="Medições são comparadas só com as suas anteriores. Cada teste tem sua própria data.">{defs.slice(0, 2).map((def) => {
          const progress = testProgress(def, tests);
          return <button type="button" className="row row-nav" key={def.id} onClick={() => setOpenTest(def.id)}><span className="row-label">{def.name}<small>{progress.last === null ? "Ainda sem medição" : `Última: ${formatTestValue(def, progress.last)}`}</small></span>{progress.improved && <span className="chip-up">marca melhor</span>}</button>;
        })}<button type="button" className="row row-action" onClick={() => setTab("tests")}>Ver todos os testes</button></Group>
        {due.length > 0 && <p className="disclosure-note">{due.length} {due.length === 1 ? "teste pode" : "testes podem"} ser medidos. Faça só o que fizer sentido hoje.</p>}
        {sessions.length > 0 && <details className="disclosure"><summary>Histórico e calendário</summary><div className="disclosure-body">
          <Group header="Últimas práticas">{sessions.slice(0, historyLimit).map((session) => <div className="row" key={session.id}><span className="row-label">{practiceById(session.program_id)?.title ?? "Prática"}<small>{formatDayMonth(session.performed_on)} · {session.drills_done}/{session.drills_total} exercícios · {session.minutes} min{session.feeling ? ` · ${session.execution ? "como se sentiu" : "como foi"}: ${session.feeling}/5` : ""}{session.pending ? " · aguardando envio" : ""}{session.drills_done === 0 ? " · não conta na meta" : ""}</small></span></div>)}{sessions.length > historyLimit && <button type="button" className="row row-action" onClick={() => setHistoryLimit((value) => value + 12)}>Ver mais práticas</button>}</Group>
          <MonthCalendar sessions={sessions} />
        </div></details>}
        {counted.length > 0 && <details className="disclosure"><summary>Constância nas últimas 8 semanas</summary><div className="chart-box"><WeeksChart weeks={lastWeeks(counted, 8)} goal={athlete.weekly_goal} /></div><p className="disclosure-note">A linha mostra a meta atual. Novas alterações preservam as metas passadas. Antes desta atualização, usamos a meta disponível, pois as anteriores não eram registradas.</p></details>}
      </>}
      {tab === id && id === "map" && <section className="fundamentals-map"><div className="fundamentals-head"><div><p className="subtitle">Sua prática</p><h2>Mapa de fundamentos</h2></div><span className="map-window">últimos 28 dias</span></div>
        <p className="fundamentals-intro">Toque em um fundamento para ver seu histórico e os blocos disponíveis.</p>
        <div className="skill-court" aria-label="Fundamentos do basquete"><span className="court-line court-half" aria-hidden="true" /><span className="court-line court-key" aria-hidden="true" /><span className="court-line court-arc" aria-hidden="true" />
          {fundamentals.map((item) => <button type="button" key={item.category} className={`skill-node skill-node-${item.category}${category === item.category ? " selected" : ""}${item.recentSessions ? " practiced" : ""}`} aria-pressed={category === item.category}
            aria-label={`${CATEGORY_LABELS[item.category]}: ${item.recentSessions} práticas nos últimos 28 dias`} onClick={() => setCategory(item.category)}><span className="skill-node-count">{item.recentSessions}</span><span className="skill-node-label">{CATEGORY_LABELS[item.category]}</span></button>)}
        </div><p className="map-legend">Números de práticas, não notas de habilidade. Em sessões, só os blocos com exercícios concluídos contam para cada fundamento.</p>
        <div className="fundamental-detail" aria-live="polite"><h3>{CATEGORY_LABELS[category]}</h3><p className="fundamental-note">Histórico completo deste fundamento</p><div className="fundamental-stats"><div><strong>{fundamentals.find((item) => item.category === category)?.sessions ?? 0}</strong><span>práticas</span></div><div><strong>{fundamentals.find((item) => item.category === category)?.minutes ?? 0}</strong><span>min de exercícios*</span></div><div><strong>{fundamentals.find((item) => item.category === category)?.lastTrained ? formatDayMonth(fundamentals.find((item) => item.category === category)!.lastTrained!) : "—"}</strong><span>última prática</span></div></div>
          <p className="fundamental-note">* Registros antigos usam a duração do bloco. Sessões novas dividem o tempo de exercícios por fundamento, sem descanso.</p>
          <Group header="Blocos para praticar">{available.filter((program) => program.category === category).map((program) => <button type="button" className="row row-nav" key={program.id} onClick={() => onOpenProgram(program.id)}><span className="row-label">{program.title}<small>{programMinutes(program)} min · {program.drills.length} exercícios</small></span></button>)}{!available.some((program) => program.category === category) && <p className="row-note">Ainda não há bloco para esta faixa. Os registros anteriores continuam no histórico.</p>}</Group>
        </div>
        <details className="disclosure"><summary>Ver fundamentos em lista</summary>{fundamentals.map((item) => <button type="button" className="row row-action" key={item.category} onClick={() => setCategory(item.category)}>{CATEGORY_LABELS[item.category]} · {item.recentSessions} práticas em 28 dias</button>)}</details>
      </section>}
      {tab === id && id === "tests" && <Group header="Medir um fundamento" footer="Aqueça antes, use o mesmo protocolo e compare somente suas próprias marcas.">{defs.map((def) => {
        const progress = testProgress(def, tests);
        const next = nextTestFor(def.id, tests);
        return <button type="button" className="row row-nav" key={def.id} onClick={() => setOpenTest(def.id)}><span className="row-label">{def.name}<small>{progress.last === null ? "Primeira medição" : `Última: ${formatTestValue(def, progress.last)} · melhor: ${formatTestValue(def, progress.best!)}`}</small><small>{next ? testIsDue(def.id, tests) ? "Pode medir novamente" : `Próxima medição: ${formatDayMonth(next)}` : "Ainda sem marca"}</small></span>{progress.points.length > 1 && <Sparkline values={progress.points.map((point) => point.value)} />}</button>;
      })}<button type="button" className="row row-action" onClick={() => onStartTests(due[0]?.id ?? defs[0]?.id)}>Medir um teste</button></Group>}
      {tab === id && id === "achievements" && <Group header={`Conquistas · ${badges.filter((badge) => badge.earned).length} de ${badges.length}`} footer="Conquistas permanentes. A constância considera as metas registradas em cada semana."><div className="badges">{badges.map((badge) => <div className={`badge${badge.earned ? " earned" : ""}`} key={badge.id}><span className="badge-mark" aria-hidden="true">{badge.earned ? "★" : "☆"}</span><strong>{badge.title}</strong><span>{badge.description}</span><span className="visually-hidden">{badge.earned ? "Conquistada" : "Ainda não conquistada"}</span></div>)}</div></Group>}
    </div>)}
  </Screen>;
}

function GoalCard({ athlete, count, minutes, onUpdateGoal }: { athlete: Athlete; count: number; minutes: number; onUpdateGoal: (goal: number) => Promise<void> | void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const goal = athlete.weekly_goal;
  async function update(delta: number) {
    if (busy || goal + delta < 1 || goal + delta > 7) return;
    setBusy(true); setError(null);
    try { await onUpdateGoal(goal + delta); } catch (err) { setError(friendlyError(err)); } finally { setBusy(false); }
  }
  return <><section className={`goal-card${count >= goal ? " met" : ""}`} aria-label="Meta da semana"><div className="goal-head"><span>Meta da semana</span><strong>{count} de {goal} práticas</strong>{count >= goal && <span className="met-badge">Meta cumprida</span>}</div>
    <div className="goal-bar" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(count, goal)}><span style={{ width: `${Math.min(100, count / goal * 100)}%` }} /></div>
    <div className="goal-foot"><p>{minutes} min nesta semana</p><div className="goal-stepper" role="group" aria-label="Ajustar meta da semana"><button type="button" aria-label="Diminuir meta" disabled={busy || goal === 1} onClick={() => void update(-1)}>−</button><span>{goal}</span><button type="button" aria-label="Aumentar meta" disabled={busy || goal === 7} onClick={() => void update(1)}>+</button></div></div>
    <p className="goal-explanation">Um bloco ou uma sessão com exercício concluído conta como uma prática. Ajuste uma meta que caiba na sua rotina.</p>
  </section>{error && <Notice tone="error">{error}</Notice>}</>;
}
