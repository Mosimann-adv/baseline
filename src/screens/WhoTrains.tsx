import { useState } from "react";
import { Group, Notice, Screen } from "../components/ui";
import { ageThisYear, bandFor } from "../lib/age";
import { avatarFor } from "../lib/avatar";
import { friendlyError } from "../lib/errors";
import type { Athlete } from "../lib/types";

export function WhoTrains({
  athletes,
  isLocked,
  lockLabel,
  onPick,
  onAccount,
  onSignOut,
}: {
  athletes: Athlete[];
  isLocked: (athlete: Athlete) => boolean;
  lockLabel?: (athlete: Athlete) => string;
  onPick: (id: string) => void;
  onAccount: () => void;
  onSignOut: () => Promise<void>;
}) {
  // O perfil do próprio dono da conta vem primeiro. Criar e gerenciar perfis fica na tela Conta.
  const ordered = [...athletes].sort((a, b) => Number(b.is_self) - Number(a.is_self));
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setSigningOut(true);
    setError(null);
    try {
      await onSignOut();
    } catch (err) {
      setError(friendlyError(err));
      setSigningOut(false);
    }
  }

  return (
    <Screen title="Quem vai treinar?">
      <div className="athlete-grid">
        {ordered.map((athlete) => {
          const age = ageThisYear(athlete.birth_year);
          const band = bandFor(age);
          const locked = isLocked(athlete);
          const detail = locked
            ? (lockLabel?.(athlete) ?? (athlete.is_self ? "Precisa de consentimento" : "Precisa de autorização"))
            : athlete.is_self
              ? "Você"
              : band
                ? `${band.label} · ${age} anos`
                : `${age} anos`;
          // Perfil sem aceite não treina: o toque leva à tela Conta.
          const avatar = avatarFor(athlete.id);
          return (
            <button
              key={athlete.id}
              type="button"
              className={`athlete-card${locked ? " locked" : ""}${athlete.is_self && !locked ? " self" : ""}`}
              onClick={() => (locked ? onAccount() : onPick(athlete.id))}
            >
              <span className="avatar" aria-hidden="true" style={{ background: avatar.background }}>
                {avatar.glyph}
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
        <button type="button" className="row row-action" disabled={signingOut} onClick={() => void signOut()}>
          {signingOut ? "Saindo…" : "Sair da conta"}
        </button>
      </Group>
      {error && <Notice tone="error">{error}</Notice>}
    </Screen>
  );
}
