import type { ReactNode } from "react";

export type TabId = "trainings" | "progress" | "profile";

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
  profile: "Perfil",
};

/** Rodapé de navegação do contexto do atleta: Treinos, Evolução e Perfil (troca de perfil e Conta). */
export function TabBar({ current, onSelect }: { current: TabId; onSelect: (tab: TabId) => void }) {
  return (
    <nav className="tabbar" aria-label="Navegação principal">
      {(Object.keys(LABELS) as TabId[]).map((id) => (
        <button
          key={id}
          type="button"
          className={`tab${current === id ? " active" : ""}`}
          aria-current={current === id ? "page" : undefined}
          onClick={() => onSelect(id)}
        >
          {ICONS[id]}
          <span>{LABELS[id]}</span>
        </button>
      ))}
    </nav>
  );
}
