// Sons do treino: bipes curtos com WebAudio e aviso por voz do próximo exercício.
// Navegadores só deixam tocar áudio depois de um toque na tela — destravamos no primeiro toque (unlockAudio).

let ctx: AudioContext | null = null;

type AudioCtor = new () => AudioContext;

export function unlockAudio(): void {
  try {
    if (ctx) {
      if (ctx.state === "suspended") void ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    ctx = Ctor ? new Ctor() : null;
  } catch {
    ctx = null;
  }
}

function tone(freq: number, at: number, seconds: number): void {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const start = ctx.currentTime + at;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

function play(notes: Array<[freq: number, at: number, seconds: number]>): void {
  if (!ctx) return;
  for (const [freq, at, seconds] of notes) tone(freq, at, seconds);
}

// "up": começa exercício · "down": começa descanso · "tick": últimos segundos do descanso · "done": fim do treino.
export function cue(kind: "up" | "down" | "tick" | "done"): void {
  if (!ctx) return;
  if (kind === "up") play([[880, 0.01, 0.12], [1175, 0.17, 0.18]]);
  if (kind === "down") play([[660, 0.01, 0.22]]);
  if (kind === "tick") play([[988, 0.01, 0.09]]);
  if (kind === "done") play([[784, 0.01, 0.14], [988, 0.16, 0.14], [1319, 0.31, 0.3]]);
}

export function say(text: string): void {
  try {
    if (typeof speechSynthesis === "undefined") return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    utter.rate = 0.95;
    speechSynthesis.speak(utter);
  } catch {
    // Sem voz disponível no aparelho: os bipes seguem valendo.
  }
}
