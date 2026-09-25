import { AccountSettings, type AccountProps } from "./AccountSettings";

// Tela Conta: abre direto, sem PIN (decisão do dono do projeto, 2026-09-12).
// Ações sem volta (revogar, excluir perfil, excluir conta) continuam com confirmação em dois passos.
// Os blocos grandes ficam em AccountSettings (a tela em si) e ProfileSettings (um perfil).
export function GuardianArea(props: AccountProps) {
  return <AccountSettings {...props} />;
}
