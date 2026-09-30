import { useEffect, useState } from "react";
import "../styles.learn.css";
import { ExerciseVideo } from "../components/ExerciseVideo";
import { Group, Notice, PlainButton, PrimaryButton, Screen, Segmented } from "../components/ui";
import { SUPPORT } from "../content/support";
import { CATEGORY_LABELS, needsHoop, programMinutes, programsFor } from "../content/programs";
import { ageThisYear, bandFor, type AgeBand } from "../lib/age";
import type { Athlete, Category, Program } from "../lib/types";

// Área Aprender: demonstração de um exercício por vez, com dica e vídeo direto
// (youtube-nocookie, sem pôster). A pessoa escolhe fundamento e bloco por controles
// simples — não há recomendação automática nem escolha assistida. Conteúdo rascunho.
// Sem atleta (ou faixa fora do esperado), a tela vira o canal institucional de antes.

const YOUTUBE_NOCOOKIE = "https://www.youtube-nocookie.com";

// Destaques do canal, conferidos via oEmbed (título e canal). Sem autoplay: a pessoa toca para ver.
const FEATURED = [
  { id: "0kiwSRaOM9k", title: "Como jogar 3x3 em 10 minutos", meta: "1 min" },
  { id: "EssbdQpjDoU", title: "Regras: tamanho da quadra", meta: "27 s" },
  { id: "tAuQZmwo2F0", title: "Como virar de frente e ser agressivo", meta: "40 s" },
] as const;

const DRAFT_FOOTER = "Conteúdo em validação por profissional de educação física.";

export function Channel({ athlete, onOpenProgram }: { athlete?: Athlete; onOpenProgram?: (programId: string) => void }) {
  const band = athlete ? bandFor(ageThisYear(athlete.birth_year)) : null;
  if (!athlete || !band) return <ChannelFallback />;
  return <Learn athlete={athlete} band={band} onOpenProgram={onOpenProgram} />;
}

/** Com atleta: fundamentos da faixa, blocos e demonstração um exercício por vez. */
function Learn({ athlete, band, onOpenProgram }: { athlete: Athlete; band: AgeBand; onOpenProgram?: (programId: string) => void }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [program, setProgram] = useState<Program | null>(null);

  const bandId = band.id;
  const programs = programsFor(bandId, athlete.level);
  const categories = (Object.keys(CATEGORY_LABELS) as Category[]).filter((c) => programs.some((p) => p.category === c));
  // Sem escolha feita (ou com escolha que deixou de existir), mostra o primeiro fundamento da faixa.
  const current: Category | null = category && categories.includes(category) ? category : (categories[0] ?? null);
  const blocks = current ? programs.filter((p) => p.category === current) : [];
  const kid = bandId === "6-8" || bandId === "9-11";

  if (program) {
    return (
      <BlockPreview
        key={program.id}
        program={program}
        onBack={() => setProgram(null)}
        onPractice={onOpenProgram ? () => onOpenProgram(program.id) : undefined}
      />
    );
  }

  return (
    <Screen eyebrow={`Faixa ${band.label}`} title="Aprender">
      <p className="lead">
        {kid
          ? "Escolha um fundamento, veja um exercício por vez e treine com um adulto por perto."
          : "Escolha um fundamento e veja como se faz, um exercício por vez."}
      </p>
      <Notice>{DRAFT_FOOTER}</Notice>
      {current ? (
        <>
          <Segmented
            label="Fundamento"
            options={categories.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
            value={current}
            onChange={setCategory}
          />
          <Group header={`Blocos de ${CATEGORY_LABELS[current].toLowerCase()}`} footer="Toque em um bloco para ver os exercícios.">
            {blocks.map((p) => (
              <button key={p.id} type="button" className="row row-nav" onClick={() => setProgram(p)}>
                <span className="row-label">
                  {p.title}
                  <small>
                    {programMinutes(p)} min · {p.drills.length} {p.drills.length === 1 ? "exercício" : "exercícios"} ·{" "}
                    {needsHoop(p) ? "com cesta" : "sem cesta"}
                  </small>
                </span>
              </button>
            ))}
          </Group>
        </>
      ) : (
        <Group header="Blocos">
          <p className="row-note">Ainda não há treinos desta faixa por aqui. Volte em breve.</p>
        </Group>
      )}
      <InstitutionalVideos secondary />
    </Screen>
  );
}

/** Um exercício por vez: dica, vídeo direto e controles Anterior/Próximo, com a lista para pular. */
function BlockPreview({ program, onBack, onPractice }: { program: Program; onBack: () => void; onPractice?: () => void }) {
  const drills = program.drills;
  const [index, setIndex] = useState(0);
  const drill = drills[index];
  return (
    <Screen eyebrow={`${CATEGORY_LABELS[program.category]} · ~${programMinutes(program)} min`} title={program.title} onBack={onBack}>
      <p className="lead">{program.summary}</p>
      <p className="program-facts">
        <span>{program.equipment}</span>
        <span>
          {drills.length} {drills.length === 1 ? "exercício" : "exercícios"}
        </span>
      </p>
      <div className="stack">
        <p className="training-count">
          Exercício {index + 1} de {drills.length}
        </p>
        <p className="drill-name">{drill.name}</p>
        <p className="drill-cue">{drill.cue}</p>
        {drill.video ? (
          <ExerciseVideo video={drill.video} playing={false} />
        ) : (
          <p className="focus-hint">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3.5" />
            </svg>
            {drill.focus ? `Foco: ${drill.focus}` : "Sem vídeo para este exercício — siga a dica acima."}
          </p>
        )}
        <div className="rest-row">
          <PlainButton onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
            Anterior
          </PlainButton>
          <PlainButton onClick={() => setIndex((i) => Math.min(drills.length - 1, i + 1))} disabled={index === drills.length - 1}>
            Próximo
          </PlainButton>
        </div>
      </div>
      <Group header="Exercícios deste bloco" footer={DRAFT_FOOTER}>
        {drills.map((d, i) => (
          <button key={d.id} type="button" className="row drill-row" aria-current={i === index} onClick={() => setIndex(i)}>
            <span className="row-label">
              {i + 1}. {d.name}
              <small>
                {d.seconds} s{d.video ? " · vídeo" : ""}
              </small>
            </span>
          </button>
        ))}
      </Group>
      {onPractice && (
        <div className="bottom-cta stack">
          <PrimaryButton onClick={onPractice}>Praticar este bloco</PrimaryButton>
        </div>
      )}
    </Screen>
  );
}

/** Vídeos institucionais do canal do Arvoredo: diretos, com loading lazy e sem pôster. */
function InstitutionalVideos({ secondary = false }: { secondary?: boolean }) {
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
    <Group
      header={secondary ? "Canal do Arvoredo" : undefined}
      footer={secondary ? "Destaques do YouTube do Instituto. Abre o vídeo sem cookies." : undefined}
    >
      {!online && <p className="row-note">Sem internet agora: os vídeos precisam de conexão para abrir.</p>}
      {FEATURED.map((video) => (
        <div key={video.id} className="video-block learn-featured">
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
  );
}

/** Sem atleta (ou faixa improvável): o canal institucional que já existia, agora com o título Aprender. */
function ChannelFallback() {
  return (
    <Screen eyebrow="Instituto Arvoredo" title="Aprender">
      <p className="lead">Destaques do YouTube do Arvoredo.</p>
      <InstitutionalVideos />
    </Screen>
  );
}
