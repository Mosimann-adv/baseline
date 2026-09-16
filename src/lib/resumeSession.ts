// Treino pela metade: guarda no aparelho o ponto em que o treino parou,
// para a pessoa retomar depois de fechar o app sem querer (bateria, ligação).
// Só existe um treino em andamento por aparelho, então uma chave única basta.
const KEY = "baseline.resume";

export interface ResumeState {
  athleteId: string;
  programId: string;
  phase: "getready" | "work" | "rest";
  index: number;
  done: number;
  /** Segundos que faltavam na fase no momento em que foi guardado. */
  secondsLeft: number;
  startedAt: number | null;
  savedAt: number;
}

function read(): ResumeState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResumeState;
    if (
      parsed &&
      typeof parsed.athleteId === "string" &&
      typeof parsed.programId === "string" &&
      (parsed.phase === "getready" || parsed.phase === "work" || parsed.phase === "rest")
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function readResume(athleteId: string): ResumeState | null {
  const state = read();
  return state?.athleteId === athleteId ? state : null;
}

export function writeResume(state: ResumeState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Sem armazenamento: o treino simplesmente não pode ser retomado.
  }
}

export function clearResume(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nada a fazer sem armazenamento.
  }
}
