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
  if (/idade fora da faixa/i.test(msg)) return "O Baseline é para atletas de 6 a 17 anos.";
  if (/failed to fetch|network/i.test(msg)) return "Sem conexão. Confira a internet e tente de novo.";
  return "Algo não funcionou. Tente de novo em instantes.";
}
