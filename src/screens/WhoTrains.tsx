import { Group, Screen } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import type { Athlete } from "../lib/types";

export function WhoTrains({
  athletes,
  isLocked,
  onPick,
  onAccount,
}: {
  athletes: Athlete[];
  isLocked: (athlete: Athlete) => boolean;
  onPick: (id: string) => void;
  onAccount: () => void;
}) {
  // O perfil do próprio adulto vem primeiro. Criar e gerenciar perfis fica na tela Conta.
  const ordered = [...athletes].sort((a, b) => Number(b.is_self) - Number(a.is_self));

  return (
    <Screen title="Quem vai treinar?">
      <div className="athlete-grid">
        {ordered.map((athlete) => {
          const age = ageThisYear(athlete.birth_year);
          const band = bandFor(age);
          const locked = isLocked(athlete);
          const detail = locked
            ? athlete.is_self
              ? "Precisa de consentimento"
              : "Precisa de autorização"
            : athlete.is_self
              ? "Você"
              : band
                ? `${band.label} · ${age} anos`
                : `${age} anos`;
          // Perfil sem aceite não treina: o toque leva à tela Conta.
          return (
            <button
              key={athlete.id}
              type="button"
              className={`athlete-card${locked ? " locked" : ""}`}
              onClick={() => (locked ? onAccount() : onPick(athlete.id))}
            >
              <span className="avatar" aria-hidden="true">
                {athlete.nickname.slice(0, 1).toUpperCase()}
              </span>
              <strong>{athlete.nickname}</strong>
              <span>{detail}</span>
            </button>
          );
        })}
      </div>
      <Group>
        <button type="button" className="row row-nav" onClick={onAccount}>
          <span className="row-label">
            Conta
            <small>Perfis, autorizações, privacidade e dados</small>
          </span>
        </button>
      </Group>
    </Screen>
  );
}
