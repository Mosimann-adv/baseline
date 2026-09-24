import { useEffect, useState } from "react";
import { BouncingBall, Group, Screen } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import { clearResume, readResume, type ResumeState } from "../lib/resumeSession";
import { CATEGORY_LABELS, needsHoop, programById, programMinutes, programShelves, programsFor } from "../content/programs";
import type { Athlete } from "../lib/types";

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

  // Filtro por lugar; some quando todos os treinos da faixa são do mesmo tipo.
  const [place, setPlace] = useState<Place>("all");
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
    <Screen eyebrow={band ? `${band.label} · ${age} anos` : `${age} anos`} title={`Oi, ${athlete.nickname}`} titleAside={<BouncingBall />}>
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
          <button type="button" className="secondary-button" onClick={() => void retryPending()} disabled={retrying}>
            {retrying ? "Tentando…" : "Tentar agora"}
          </button>
        </section>
      )}

      {band ? (
        <>
          {hasBothPlaces && (
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
          {shelves.map((shelf) => (
            <section key={shelf.category} className="shelf" aria-labelledby={`shelf-${shelf.category}`}>
              <h2 className="shelf-head" id={`shelf-${shelf.category}`}>
                <span>{CATEGORY_LABELS[shelf.category]}</span>
                <small>{shelf.programs.length === 1 ? "1 treino" : `${shelf.programs.length} treinos`}</small>
              </h2>
              <div className={`shelf-row${shelf.programs.length === 1 ? " single" : ""}`}>
                {shelf.programs.map((program) => (
                  <button
                    key={program.id}
                    type="button"
                    className={`program-card cat-${program.category}`}
                    onClick={() => onOpenProgram(program.id)}
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
        </>
      ) : (
        <Group header="Treinos">
          <p className="row-note">Confira o ano de nascimento do perfil na tela Conta.</p>
        </Group>
      )}
    </Screen>
  );
}
