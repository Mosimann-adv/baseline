function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) return String((err as { message: unknown }).message);
  return "";
}

export function friendlyError(err: unknown): string {
  const msg = messageOf(err);
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/already registered|already exists/i.test(msg)) return "Este e-mail já tem conta. Use “Já tenho conta” para entrar.";
  if (/password should be at least|weak password/i.test(msg)) return "A senha precisa ter pelo menos 8 caracteres.";
  if (/email not confirmed/i.test(msg)) return "Confirme o e-mail pelo link que enviamos antes de entrar.";
  if (/rate limit|too many/i.test(msg)) return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
  if (/idade fora da faixa/i.test(msg)) return "Perfis de crianças e adolescentes são para 6 a 17 anos.";
  if (/perfil proprio exige 18/i.test(msg)) return "O perfil próprio é para quem tem 18 anos ou mais.";
  if (/tipo de perfil nao pode/i.test(msg)) return "O tipo do perfil não pode ser alterado.";
  if (/athletes_one_self/i.test(msg)) return "Você já tem um perfil próprio nesta conta.";
  if (/row-level security/i.test(msg)) return "Este perfil está sem aceite ativo. Dê o consentimento ou a autorização de novo na tela Conta.";
  if (/duplicate key/i.test(msg)) return "Este perfil já tem aceite ativo.";
  if (/could not find the function|PGRST202/i.test(msg)) return "O servidor ainda não foi atualizado para esta versão do app. Tente de novo mais tarde.";
  if (/failed to fetch|network/i.test(msg)) return "Sem conexão. Confira a internet e tente de novo.";
  return "Algo não funcionou. Tente de novo em instantes.";
}
