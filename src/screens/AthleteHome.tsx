import { useEffect, useState } from "react";
import { BouncingBall, Group, Screen, Segmented } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import { clearResume, readResume, type ResumeState } from "../lib/resumeSession";
import { CATEGORY_LABELS, needsHoop, programMinutes, programShelves, programsFor } from "../content/programs";
import type { Athlete } from "../lib/types";
import { practiceById, sessionsFor } from "../content/practices";
import { useRef } from "react";

type Place = "all" | "free" | "hoop";
const PLACE_LABELS: Record<Place, string> = { all: "Tudo", free: "Sem cesta", hoop: "Com cesta" };

export function AthleteHome({
  athlete,
  pending,
  onOpenProgram,
  onRetryPending,
  onOpenAccount,
  onResume,
}: {
  athlete: Athlete;
  pending: { count: number; blocked: boolean; error: string | null };
  onOpenProgram: (programId: string) => void;
  onRetryPending: () => void | Promise<void>;
  onOpenAccount: () => void;
  onResume: (resume: ResumeState) => void;
}) {
  const age = ageThisYear(athlete.birth_year);
  const band = bandFor(age);
  const programs = band ? programsFor(band.id, athlete.level) : [];

  // Treino pela metade: lido ao abrir a tela, porque voltar de um treino remonta a Home.
  const [resume, setResume] = useState<ResumeState | null>(() => readResume(athlete.id, athlete.guardian_id));
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  useEffect(() => {
    if (!confirmDiscard) return;
    const id = window.setTimeout(() => setConfirmDiscard(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirmDiscard]);
  const resumeProgram = resume ? practiceById(resume.programId) : undefined;
  const resumeTotal = resumeProgram?.drills.length ?? 0;
  const resumeLeft = resume ? Math.max(0, Math.min(resumeTotal - resume.done, resumeTotal)) : 0;
  const discardResume = () => {
    clearResume(athlete.guardian_id, athlete.id);
    setResume(null);
    setConfirmDiscard(false);
  };

  // Filtro por lugar; some quando todos os treinos da faixa são do mesmo tipo.
  const catalogKey = `baseline.catalog.${athlete.guardian_id}.${athlete.id}`;
  const [savedCatalog] = useState(() => { try { return JSON.parse(localStorage.getItem(catalogKey) ?? "{}"); } catch { return {}; } });
  const [place, setPlace] = useState<Place>(() => ["all", "free", "hoop"].includes(savedCatalog.place) ? savedCatalog.place : "all");
  const [kind, setKind] = useState<"blocks" | "sessions">(() => savedCatalog.kind === "sessions" ? "sessions" : "blocks");
  const root = useRef<HTMLDivElement>(null);
  const remember = () => {
    const shelves = Object.fromEntries(Array.from(root.current?.querySelectorAll<HTMLElement>(".shelf-row") ?? []).map((row) => [row.dataset.category, row.scrollLeft]));
    try { localStorage.setItem(catalogKey, JSON.stringify({ place, kind, scrollY: window.scrollY, shelves })); } catch { /* preferências opcionais */ }
  };
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      for (const row of root.current?.querySelectorAll<HTMLElement>(".shelf-row") ?? []) row.scrollLeft = savedCatalog.shelves?.[row.dataset.category ?? ""] ?? 0;
      window.scrollTo(0, savedCatalog.kind === "trails" ? 0 : savedCatalog.scrollY ?? 0);
    });
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => { try { localStorage.setItem(catalogKey, JSON.stringify({ ...savedCatalog, place, kind })); } catch { /* opcional */ } }, [place, kind]);
  const openProgram = (id: string) => { remember(); onOpenProgram(id); };
  const hasBothPlaces = programs.some(needsHoop) && programs.some((program) => !needsHoop(program));
  const visible = programs.filter((program) => place === "all" || (place === "hoop") === needsHoop(program));
  const shelves = programShelves(visible);

  // Um aviso por vez no topo: bloqueado > retomar > offline. Meta, testes e histórico ficam na Evolução.
  const hasBlocked = pending.count > 0 && pending.blocked;
  const showResume = !hasBlocked && resume && resumeProgram;
  const showPending = !hasBlocked && !showResume && pending.count > 0;

  // "Tentar agora" da fila pode esperar a rede: mostra "Tentando…" enquanto reenvia.
  const [retrying, setRetrying] = useState(false);
  async function retryPending() {
    setRetrying(true);
    try {
      await onRetryPending();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <Screen eyebrow={band ? `${band.label} · ${age} anos` : `${age} anos`} title="Treinar" titleAside={<BouncingBall />}>
      <div ref={root}>
      {hasBlocked && (
        <section className="due-card blocked">
          <div>
            <p className="subtitle">Não enviado</p>
            <p>{pending.error ?? "O aceite deste perfil foi revogado. O registro ficou neste aparelho."}</p>
          </div>
          <button type="button" className="secondary-button" onClick={onOpenAccount}>
            Resolver na Conta
          </button>
        </section>
      )}

      {showResume && resume && resumeProgram && (
        <section className="due-card pending">
          <div>
            <p className="subtitle">{resume.phase === "done" ? "Falta salvar sua prática" : "Prática em andamento"}</p>
            <p>
              {resume.phase === "done" ? `O resultado de “${resumeProgram.title}” está neste aparelho.` : `Faltam ${resumeLeft === 1 ? "1 exercício" : `${resumeLeft} exercícios`} de “${resumeProgram.title}”.`}
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
          <button type="button" className="secondary-button" onClick={() => void retryPending()} disabled={retrying}>
            {retrying ? "Tentando…" : "Tentar agora"}
          </button>
        </section>
      )}

      {band ? (
        <>
          <div className="library-tabs"><Segmented label="Biblioteca de práticas" value={kind} onChange={setKind} options={[{ value: "blocks", label: "Blocos" }, { value: "sessions", label: "Sessões" }]} /></div>
          <p className="library-description">{kind === "blocks" ? "Práticas curtas de um fundamento." : "Preparação, blocos de prática e fechamento."}</p>
          {kind === "blocks" && hasBothPlaces && (
            <div className="chips" role="group" aria-label="Filtrar treinos por lugar">
              {(Object.keys(PLACE_LABELS) as Place[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`chip${place === id ? " active" : ""}`}
                  aria-pressed={place === id}
                  onClick={() => setPlace(id)}
                >
                  {PLACE_LABELS[id]}
                </button>
              ))}
            </div>
          )}
          {kind === "blocks" && shelves.map((shelf) => (
            <section key={shelf.category} className="shelf" aria-labelledby={`shelf-${shelf.category}`}>
              <h2 className="shelf-head" id={`shelf-${shelf.category}`}>
                <span>{CATEGORY_LABELS[shelf.category]}</span>
                <small>{shelf.programs.length === 1 ? "1 treino" : `${shelf.programs.length} treinos`}</small>
              </h2>
              <div data-category={shelf.category} className={`shelf-row${shelf.programs.length === 1 ? " single" : ""}`}>
                {shelf.programs.map((program) => (
                  <button
                    key={program.id}
                    type="button"
                    className={`program-card cat-${program.category}`}
                    onClick={() => openProgram(program.id)}
                  >
                    <strong>{program.title}</strong>
                    <span className="program-card-meta">
                      {programMinutes(program)} min · {program.drills.length} exercícios
                    </span>
                    <span className="place-pill">{needsHoop(program) ? "Com cesta" : "Sem cesta"}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {kind === "sessions" && <div className="practice-grid">{sessionsFor(band.id).map((program) => <button key={program.id} className="program-card" onClick={() => openProgram(program.id)}><strong>{program.title}</strong><span className="program-card-meta">{programMinutes(program)} min · {program.drills.length} exercícios</span><span className="place-pill">Sessão com preparação</span></button>)}</div>}
          {kind !== "blocks" && <p className="disclosure-note">Rascunho pedagógico para a prévia, pendente de validação profissional.</p>}
        </>
      ) : (
        <Group header="Treinos">
          <p className="row-note">Confira o ano de nascimento do perfil na tela Conta.</p>
        </Group>
      )}
      </div>
    </Screen>
  );
}
