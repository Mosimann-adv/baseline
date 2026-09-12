import { Group, Screen } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import type { Athlete } from "../lib/types";

export function WhoTrains({
  athletes,
  onPick,
  onGuardian,
}: {
  athletes: Athlete[];
  onPick: (id: string) => void;
  onGuardian: () => void;
}) {
  return (
    <Screen title="Quem vai treinar?">
      <div className="athlete-grid">
        {athletes.map((athlete) => {
          const age = ageThisYear(athlete.birth_year);
          const band = bandFor(age);
          return (
            <button key={athlete.id} type="button" className="athlete-card" onClick={() => onPick(athlete.id)}>
              <span className="avatar" aria-hidden="true">
                {athlete.nickname.slice(0, 1).toUpperCase()}
              </span>
              <strong>{athlete.nickname}</strong>
              <span>{band ? `${band.label} · ${age} anos` : `${age} anos`}</span>
            </button>
          );
        })}
      </div>
      <Group>
        <button type="button" className="row row-nav" onClick={onGuardian}>
          <span className="row-label">
            Área do responsável
            <small>Adicionar atleta, autorizações e dados da conta</small>
          </span>
        </button>
      </Group>
    </Screen>
  );
}
