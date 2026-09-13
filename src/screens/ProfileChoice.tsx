import { Group, Screen } from "../components/ui";
import type { AccountKind } from "../lib/account";

/** Primeira tela de uma conta sem perfis. */
export function ProfileChoice({
  kind,
  onSelf,
  onMinor,
}: {
  kind: AccountKind;
  onSelf: () => void;
  onMinor: () => void;
}) {
  if (kind === "teen") {
    return (
      <Screen eyebrow="Primeiro passo" title="Quem vai treinar?">
        <p className="lead">Esta conta é sua. Crie o perfil de treino para começar. Perfis de crianças ficam na conta de um responsável de 18 anos ou mais.</p>
        <Group>
          <button type="button" className="row row-nav" onClick={onSelf}>
            <span className="row-label">
              Eu
              <small>Seu perfil de treino, com confirmação do responsável</small>
            </span>
          </button>
        </Group>
      </Screen>
    );
  }

  return (
    <Screen eyebrow="Primeiro passo" title="Quem vai treinar?">
      <p className="lead">Escolha por onde começar. A mesma conta pode ter o seu perfil e os de crianças e adolescentes que você acompanha.</p>
      <Group>
        <button type="button" className="row row-nav" onClick={onSelf}>
          <span className="row-label">
            Eu
            <small>Perfil de treino a partir de 16 anos</small>
          </span>
        </button>
        <button type="button" className="row row-nav" onClick={onMinor}>
          <span className="row-label">
            Uma criança ou adolescente
            <small>De 6 a 17 anos, com a sua autorização. Quem tem menos de 16 só treina por aqui.</small>
          </span>
        </button>
      </Group>
    </Screen>
  );
}
