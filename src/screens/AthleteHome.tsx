import { useEffect, useState } from "react";
import { Group, PrimaryButton, Screen } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import { formatDayMonth, startOfWeekIso } from "../lib/dates";
import { clearResume, readResume, type ResumeState } from "../lib/resumeSession";
import { goalStreak, isTestDue } from "../lib/progress";
import { CATEGORY_LABELS, programById, programMinutes, programsFor } from "../content/programs";
import type { Athlete, Category, SkillTestRecord, TrainingSession } from "../lib/types";

export function AthleteHome({
  athlete,
  sessions,
  tests,
  pending,
  onOpenProgram,
  onStartTests,
  onRetryPending,
  onResume,
}: {
  athlete: Athlete;
  sessions: TrainingSession[];
  tests: SkillTestRecord[];
  pending: { count: number; blocked: boolean; error: string | null };
  onOpenProgram: (programId: string) => void;
  onStartTests: () => void;
  onRetryPending: () => void;
  onResume: (resume: ResumeState) => void;
}) {
  const age = ageThisYear(athlete.birth_year);
  const band = bandFor(age);
  const programs = band ? programsFor(band.id, athlete.level) : [];
  const [category, setCategory] = useState<Category | "all">("all");
  const categories = [...new Set(programs.map((program) => program.category))];
  const visible = category === "all" ? programs : programs.filter((program) => program.category === category);
  const goal = athlete.weekly_goal;
  const weekStart = startOfWeekIso();
  const thisWeek = sessions.filter((s) => s.performed_on >= weekStart);
  const weekMinutes = thisWeek.reduce((total, s) => total + s.minutes, 0);
  const streak = goalStreak(sessions, goal);
  const goalPct = Math.min(100, Math.round((thisWeek.length / goal) * 100));
  const testDue = band !== null && isTestDue(tests);

  // Treino pela metade: lido ao abrir a tela, porque voltar de um treino remonta a Home.
  const [resume, setResume] = useState<ResumeState | null>(() => readResume(athlete.id));
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  useEffect(() => {
    if (!confirmDiscard) return;
    const id = window.setTimeout(() => setConfirmDiscard(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirmDiscard]);
  const resumeProgram = resume ? programById(resume.programId) : undefined;
  const resumeTotal = resumeProgram?.drills.length ?? 0;
  const resumeLeft = resume ? Math.max(0, Math.min(resumeTotal - resume.done, resumeTotal)) : 0;
  const discardResume = () => {
    clearResume();
    setResume(null);
    setConfirmDiscard(false);
  };

  // Sugestão: o treino da faixa feito há mais tempo (ou nunca feito), respeitando a ordem por nível.
  const lastDone = new Map<string, string>();
  for (const s of sessions) if (!lastDone.has(s.program_id)) lastDone.set(s.program_id, s.performed_on);
  const suggestion = [...programs].sort((a, b) => (lastDone.get(a.id) ?? "").localeCompare(lastDone.get(b.id) ?? ""))[0];

  return (
    <Screen eyebrow={band ? `${band.label} · ${age} anos` : `${age} anos`} title={`Oi, ${athlete.nickname}`}>
      {resume && resumeProgram && (
        <section className={`due-card${confirmDiscard ? " blocked" : " pending"}`}>
          <div>
            <p className="subtitle">Treino pela metade</p>
            <p>
              Faltam {resumeLeft === 1 ? "1 exercício" : `${resumeLeft} exercícios`} de “{resumeProgram.title}”. Continuar de onde parou?
            </p>
          </div>
          <div className="resume-actions">
            <button type="button" className="secondary-button" onClick={() => onResume(resume)}>
              Continuar
            </button>
            <button
              type="button"
              className="plain-button quiet"
              onClick={() => (confirmDiscard ? discardResume() : setConfirmDiscard(true))}
            >
              {confirmDiscard ? "Descartar mesmo?" : "Descartar"}
            </button>
          </div>
        </section>
      )}

      {pending.count > 0 && (
        <section className={`due-card ${pending.blocked ? "blocked" : "pending"}`}>
          <div>
            <p className="subtitle">{pending.blocked ? "Não enviado" : "Aguardando internet"}</p>
            <p>
              {pending.blocked
                ? pending.error ?? "O aceite deste perfil foi revogado. O registro ficou neste aparelho."
                : `${pending.count === 1 ? "1 registro" : `${pending.count} registros`} fica neste aparelho e sobe quando houver conexão.`}
            </p>
          </div>
          <button type="button" className="secondary-button" onClick={onRetryPending}>
            Tentar agora
          </button>
        </section>
      )}

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

      {band ? (
        <>
          {categories.length > 1 && (
            <div className="chips" role="group" aria-label="Filtrar treinos por categoria">
              <button type="button" className={`chip${category === "all" ? " active" : ""}`} onClick={() => setCategory("all")}>
                Todos
              </button>
              {categories.map((id) => (
                <button key={id} type="button" className={`chip${category === id ? " active" : ""}`} onClick={() => setCategory(id)}>
                  {CATEGORY_LABELS[id]}
                </button>
              ))}
            </div>
          )}
          <Group header="Treinos para você" footer={`Faixa ${band.label}: ${band.focus.toLowerCase()}.`}>
            {visible.map((program) => (
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
        </>
      ) : (
        <Group header="Treinos">
          <p className="row-note">Confira o ano de nascimento do perfil na tela Conta.</p>
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
                  {s.pending ? " · neste aparelho" : ""}
                </small>
              </span>
            </div>
          ))
        )}
      </Group>
    </Screen>
  );
}
