import { useState } from "react";
import { Group, Notice, Screen } from "../components/ui";
import type { AccountKind } from "../lib/account";
import { friendlyError } from "../lib/errors";

/** Primeira tela de uma conta sem perfis. Conta e saída aparecem quando o App fornece os caminhos. */
export function ProfileChoice({
  kind,
  onSelf,
  onMinor,
  onAccount,
  onSignOut,
}: {
  kind: AccountKind;
  onSelf: () => void;
  onMinor: () => void;
  onAccount?: () => void;
  onSignOut?: () => Promise<void>;
}) {
  const teen = kind === "teen";
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setSigningOut(true);
    setError(null);
    try {
      await onSignOut?.();
    } catch (err) {
      setError(friendlyError(err));
      setSigningOut(false);
    }
  }

  return (
    <Screen eyebrow="Primeiro passo" title="Quem vai treinar?">
      {teen ? (
        <p className="lead">Esta conta é sua. Crie o perfil de treino para começar. Perfis de crianças ficam na conta de um responsável de 18 anos ou mais.</p>
      ) : (
        <p className="lead">Escolha por onde começar. A mesma conta pode ter o seu perfil e os de crianças e adolescentes que você acompanha.</p>
      )}
      <Group>
        <button type="button" className="row row-nav" onClick={onSelf}>
          <span className="row-label">
            Eu
            <small>{teen ? "Seu perfil de treino, com confirmação do responsável" : "Perfil de treino a partir de 16 anos"}</small>
          </span>
        </button>
        {!teen && (
          <button type="button" className="row row-nav" onClick={onMinor}>
            <span className="row-label">
              Uma criança ou adolescente
              <small>De 6 a 17 anos, com a sua autorização. Quem tem menos de 16 só treina por aqui.</small>
            </span>
          </button>
        )}
      </Group>
      {(onAccount || onSignOut) && (
        <Group>
          {onAccount && (
            <button type="button" className="row row-nav" onClick={onAccount}>
              <span className="row-label">
                Conta
                <small>Perfis, autorizações, privacidade e dados</small>
              </span>
            </button>
          )}
          {onSignOut && (
            <button type="button" className="row row-action" disabled={signingOut} onClick={() => void signOut()}>
              {signingOut ? "Saindo…" : "Sair da conta"}
            </button>
          )}
        </Group>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </Screen>
  );
}
