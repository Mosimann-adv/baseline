import { Group, Screen } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import type { Athlete } from "../lib/types";

export function WhoTrains({
  athletes,
  isLocked,
  onPick,
  onGuardian,
}: {
  athletes: Athlete[];
  isLocked: (athleteId: string) => boolean;
  onPick: (id: string) => void;
  onGuardian: () => void;
}) {
  return (
    <Screen title="Quem vai treinar?">
      <div className="athlete-grid">
        {athletes.map((athlete) => {
          const age = ageThisYear(athlete.birth_year);
          const band = bandFor(age);
          const locked = isLocked(athlete.id);
          // Perfil sem autorização não treina: o toque leva o adulto à Área do responsável.
          return (
            <button
              key={athlete.id}
              type="button"
              className={`athlete-card${locked ? " locked" : ""}`}
              onClick={() => (locked ? onGuardian() : onPick(athlete.id))}
            >
              <span className="avatar" aria-hidden="true">
                {athlete.nickname.slice(0, 1).toUpperCase()}
              </span>
              <strong>{athlete.nickname}</strong>
              <span>{locked ? "Precisa de autorização" : band ? `${band.label} · ${age} anos` : `${age} anos`}</span>
            </button>
          );
        })}
      </div>
      <Group>
        <button type="button" className="row row-nav" onClick={onGuardian}>
          <span className="row-label">
            Área do responsável
            <small>Perfis, autorizações, privacidade e conta</small>
          </span>
        </button>
      </Group>
    </Screen>
  );
}
