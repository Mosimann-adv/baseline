import { Group, Screen } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import type { Athlete } from "../lib/types";

export function AthleteHome({ athlete, onSwitch }: { athlete: Athlete; onSwitch: () => void }) {
  const age = ageThisYear(athlete.birth_year);
  const band = bandFor(age);

  return (
    <Screen eyebrow={band ? `${band.label} · ${age} anos` : `${age} anos`} title={`Oi, ${athlete.nickname}`} onBack={onSwitch}>
      <Group header="Seu foco nesta fase">
        <p className="row-note">{band ? band.focus : "Peça para o responsável conferir o ano de nascimento no seu perfil."}</p>
      </Group>
      <Group header="Treinos" footer="A biblioteca de treinos com vídeos chega na próxima etapa do app.">
        <div className="row">
          <span className="row-label">Nenhum treino disponível ainda</span>
        </div>
      </Group>
    </Screen>
  );
}
