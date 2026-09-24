import type { ReactNode } from "react";

export type TabId = "trainings" | "progress" | "videos" | "profile";

const ICONS: Record<TabId, ReactNode> = {
  trainings: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3.6 12h16.8M5.8 5.8c2.8 2.8 2.8 9.6 0 12.4M18.2 5.8c-2.8 2.8-2.8 9.6 0 12.4" />
    </svg>
  ),
  progress: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4v16h16" />
      <path d="M7 15l4-4 3 3 5-6" />
    </svg>
  ),
  videos: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="M10 9.5v5l4.5-2.5z" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
    </svg>
  ),
};

const LABELS: Record<TabId, string> = {
  trainings: "Treinos",
  progress: "Evolução",
  videos: "Vídeos",
  profile: "Perfil",
};

const ARIA_LABELS: Record<TabId, string> = {
  trainings: "Treinos",
  progress: "Evolução",
  videos: "Vídeos",
  profile: "Perfil — trocar de perfil e Conta",
};

/** Rodapé de navegação do contexto do atleta: Treinos, Evolução, Vídeos e Perfil (troca de perfil e Conta). */
export function TabBar({
  current,
  onSelect,
  badges = {},
}: {
  current: TabId;
  onSelect: (tab: TabId) => void;
  /** Pontinho de "tem algo para fazer aqui" (ex.: testes na hora, na Evolução). */
  badges?: Partial<Record<TabId, boolean>>;
}) {
  return (
    <nav className="tabbar" aria-label="Navegação principal">
      {(Object.keys(LABELS) as TabId[]).map((id) => (
        <button
          key={id}
          type="button"
          className={`tab${current === id ? " active" : ""}`}
          aria-label={badges[id] ? `${ARIA_LABELS[id]} — testes na hora` : ARIA_LABELS[id]}
          aria-current={current === id ? "page" : undefined}
          onClick={() => {
            // Toque perceptível: a mesma vibração curta do treino, onde houver suporte.
            navigator.vibrate?.(10);
            onSelect(id);
          }}
        >
          <span className="tab-icon">
            {ICONS[id]}
            {badges[id] && <span className="tab-dot" aria-hidden="true" />}
          </span>
          <span>{LABELS[id]}</span>
        </button>
      ))}
    </nav>
  );
}
