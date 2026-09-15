import { Group, Screen } from "../components/ui";
import { SUPPORT } from "../content/support";

/** Aba Vídeos: divulga o canal do Arvoredo Basquetebol no YouTube (abre fora do app). */
export function Channel() {
  return (
    <Screen eyebrow="Instituto Arvoredo" title="Canal do Arvoredo">
      <p className="lead">Os vídeos do Arvoredo Basquetebol estão no YouTube.</p>
      <Group header="YouTube" footer="Abre o YouTube fora do app.">
        <a className="row row-nav" href={SUPPORT.youtube} target="_blank" rel="noopener noreferrer">
          <svg className="row-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="5" width="20" height="14" rx="4" />
            <path d="M10 9.5v5l4.5-2.5z" />
          </svg>
          <span className="row-label">
            Abrir o canal
            <small>{SUPPORT.youtubeLabel}</small>
          </span>
        </a>
      </Group>
    </Screen>
  );
}
