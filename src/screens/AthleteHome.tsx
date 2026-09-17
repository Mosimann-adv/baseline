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

  // Um aviso por vez no topo: bloqueado > retomar > offline. Teste vira chamada após o hero.
  const hasBlocked = pending.count > 0 && pending.blocked;
  const showResume = !hasBlocked && resume && resumeProgram;
  const showPending = !hasBlocked && !showResume && pending.count > 0;

  // Lista enxuta: 3 treinos à vista, resto atrás de "ver todos". Menos rolagem, mais decisão.
  const [showAll, setShowAll] = useState(false);
  const firstThree = visible.slice(0, 3);
  const listed = showAll ? visible : firstThree;
  const recent = sessions.slice(0, 2);

  return (
    <Screen eyebrow={band ? `${band.label} · ${age} anos` : `${age} anos`} title={`Oi, ${athlete.nickname}`}>
      {hasBlocked && (
        <section className="due-card blocked">
          <div>
            <p className="subtitle">Não enviado</p>
            <p>{pending.error ?? "O aceite deste perfil foi revogado. O registro ficou neste aparelho."}</p>
          </div>
          <button type="button" className="secondary-button" onClick={onRetryPending}>
            Tentar agora
          </button>
        </section>
      )}

      {showResume && resume && resumeProgram && (
        <section className="due-card pending">
          <div>
            <p className="subtitle">Treino pela metade</p>
            <p>
              Faltam {resumeLeft === 1 ? "1 exercício" : `${resumeLeft} exercícios`} de “{resumeProgram.title}”.
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

      {showPending && (
        <section className="due-card pending">
          <div>
            <p className="subtitle">Aguardando internet</p>
            <p>
              {pending.count === 1 ? "1 registro" : `${pending.count} registros`} neste aparelho. Sobe sozinho com conexão.
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
            <p>{tests.length === 0 ? "Meça sua base para ver a evolução." : "Já deu 4 semanas: meça de novo."}</p>
          </div>
          <button type="button" className="secondary-button" onClick={onStartTests}>
            Fazer testes
          </button>
        </section>
      )}

      {suggestion && (
        <section aria-label="Treino para hoje">
          <button type="button" className="hero-card" onClick={() => onOpenProgram(suggestion.id)}>
            <span className="subtitle">Para hoje · {programMinutes(suggestion)} min</span>
            <span className="hero-title">{suggestion.title}</span>
            <span className="hero-summary-clamp">{suggestion.summary}</span>
            <span className="hero-meta">
              {CATEGORY_LABELS[suggestion.category]} · {suggestion.drills.length} exercícios
            </span>
          </button>
          <div className="hero-actions">
            <PrimaryButton onClick={() => onOpenProgram(suggestion.id)}>Ver treino</PrimaryButton>
          </div>
        </section>
      )}

      {band ? (
        <>
          <Group header="Treinos para você">
            {listed.map((program) => (
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
          {visible.length > 3 && !showAll && (
            <button type="button" className="row row-action" onClick={() => setShowAll(true)}>
              Ver todos os treinos ({visible.length})
            </button>
          )}
          {showAll && (
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
              <button type="button" className="plain-button quiet" onClick={() => setShowAll(false)}>
                Mostrar menos
              </button>
            </>
          )}
        </>
      ) : (
        <Group header="Treinos">
          <p className="row-note">Confira o ano de nascimento do perfil na tela Conta.</p>
        </Group>
      )}

      <Group header="Últimos treinos">
        {sessions.length === 0 ? (
          <p className="row-note">Termine um treino e ele aparece aqui.</p>
        ) : (
          recent.map((s) => (
            <div key={s.id} className="row">
              <span className="row-label">
                {programById(s.program_id)?.title ?? "Treino"}
                <small>
                  {formatDayMonth(s.performed_on)} · {s.drills_done}/{s.drills_total} · {s.minutes} min
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
