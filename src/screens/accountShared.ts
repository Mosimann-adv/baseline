// Auxiliar compartilhado pela tela Conta e pela edição de perfil.
export const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
