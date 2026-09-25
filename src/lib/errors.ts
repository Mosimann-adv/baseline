/** RLS recusou treino/teste porque o perfil está sem aceite ativo. Usada na fila e nos hooks. */
export const RLS_BLOCKED_MESSAGE =
  "Este perfil está sem aceite ativo. Dê o consentimento ou a autorização de novo na tela Conta.";

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) return String((err as { message: unknown }).message);
  return "";
}

function codeOf(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) return String((err as { code: unknown }).code);
  return "";
}

export function isDuplicateKey(err: unknown): boolean {
  return codeOf(err) === "23505" || /duplicate key/i.test(messageOf(err));
}

export function isRlsError(err: unknown): boolean {
  const msg = messageOf(err);
  return /row-level security|42501/i.test(msg) || codeOf(err) === "42501";
}

export function isNetworkError(err: unknown): boolean {
  const msg = messageOf(err);
  if (/failed to fetch|network|offline|fetch/i.test(msg)) return true;
  if (err instanceof TypeError) return true;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  return false;
}

export function friendlyError(err: unknown): string {
  const msg = messageOf(err);
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/already registered|already exists/i.test(msg)) return "Este e-mail já tem conta. Use “Já tenho conta” para entrar.";
  if (/password should be at least|weak password/i.test(msg)) return "A senha precisa ter pelo menos 8 caracteres.";
  if (/email not confirmed/i.test(msg)) return "Confirme o e-mail pelo link que enviamos antes de entrar.";
  if (/otp|token has expired|invalid token|invalid otp/i.test(msg)) return "Código inválido ou vencido. Peça outro e tente de novo.";
  if (/same password/i.test(msg)) return "A nova senha precisa ser diferente da atual.";
  // Supabase: "Email rate limit exceeded" — o provedor de e-mail embutido manda só 2 e-mails por hora no projeto todo.
  if (/email rate limit/i.test(msg))
    return "O servidor está no limite de envio de e-mails agora. Espere um pouco — pode levar até uma hora — ou entre com e-mail e senha.";
  if (/rate limit|too many/i.test(msg)) return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  if (/idade fora da faixa/i.test(msg)) return "Perfis de crianças e adolescentes são para 6 a 17 anos.";
  // O banco real segue na regra da 0005 (18+) até alguém aplicar a 0006 no SQL Editor.
  // A mensagem fala a verdade do servidor que respondeu, não a do demo.
  if (/perfil proprio exige 18/i.test(msg)) return "O perfil próprio está aberto a partir de 18 anos por enquanto.";
  if (/perfil proprio exige/i.test(msg)) return "O perfil próprio é para quem tem 16 anos ou mais.";
  if (/conta propria a partir de 16/i.test(msg)) return "Conta própria é a partir de 16 anos. Quem tem menos treina pelo perfil criado pelo responsável.";
  if (/tipo de perfil nao pode/i.test(msg)) return "O tipo do perfil não pode ser alterado.";
  if (/athletes_one_self/i.test(msg)) return "Você já tem um perfil próprio nesta conta.";
  if (isRlsError(err)) return RLS_BLOCKED_MESSAGE;
  if (isDuplicateKey(err)) return "Este perfil já tem aceite ativo.";
  if (/could not find the function|PGRST202/i.test(msg)) return "O servidor ainda não foi atualizado para esta versão do app. Tente de novo mais tarde.";
  if (isNetworkError(err)) return "Sem conexão. Confira a internet e tente de novo.";
  return "Algo não funcionou. Tente de novo em instantes.";
}
