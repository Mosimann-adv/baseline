import { Group, Screen } from "../components/ui";

/** Primeira tela de uma conta sem perfis: o adulto escolhe se começa pelo próprio treino ou pelo de um menor. */
export function ProfileChoice({ onSelf, onMinor }: { onSelf: () => void; onMinor: () => void }) {
  return (
    <Screen eyebrow="Primeiro passo" title="Quem vai treinar?">
      <p className="lead">Escolha por onde começar. A mesma conta pode ter o seu perfil e os de crianças e adolescentes que você acompanha.</p>
      <Group>
        <button type="button" className="row row-nav" onClick={onSelf}>
          <span className="row-label">
            Eu
            <small>Perfil de treino para adultos, a partir de 18 anos</small>
          </span>
        </button>
        <button type="button" className="row row-nav" onClick={onMinor}>
          <span className="row-label">
            Uma criança ou adolescente
            <small>De 6 a 17 anos, com a sua autorização</small>
          </span>
        </button>
      </Group>
    </Screen>
  );
}
