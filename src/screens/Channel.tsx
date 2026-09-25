import { useEffect, useState } from "react";
import { Group, Notice, Screen } from "../components/ui";
import { SUPPORT } from "../content/support";

const YOUTUBE_NOCOOKIE = "https://www.youtube-nocookie.com";

// Destaques do canal, conferidos via oEmbed (título e canal). Sem autoplay: a pessoa toca para ver.
const FEATURED = [
  { id: "0kiwSRaOM9k", title: "Como jogar 3x3 em 10 minutos", meta: "1 min" },
  { id: "EssbdQpjDoU", title: "Regras: tamanho da quadra", meta: "27 s" },
  { id: "tAuQZmwo2F0", title: "Como virar de frente e ser agressivo", meta: "40 s" },
] as const;

/** Aba Vídeos: destaques do canal do Arvoredo Basquetebol no YouTube. */
export function Channel() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return (
    <Screen eyebrow="Instituto Arvoredo" title="Canal do Arvoredo">
      <p className="lead">Destaques do YouTube do Arvoredo.</p>
      {!online && <Notice>Sem internet agora: os vídeos precisam de conexão para abrir.</Notice>}
      <div className="stack">
        {FEATURED.map((video) => (
          <div key={video.id} className="video-block">
            <div className="video-frame">
              <iframe
                src={`${YOUTUBE_NOCOOKIE}/embed/${video.id}?rel=0&playsinline=1`}
                title={`${video.title} — Arvoredo Basquetebol`}
                loading="lazy"
                allow="encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <p className="training-next">
              <strong>{video.title}</strong> · {video.meta}
            </p>
            <a
              className="plain-link"
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir no YouTube
            </a>
          </div>
        ))}
      </div>
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
