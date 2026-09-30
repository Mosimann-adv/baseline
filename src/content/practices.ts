import { contentBand, type AgeBandId } from "../lib/age";
import type { Program, TrainingSession } from "../lib/types";
import { PROGRAMS, programById } from "./programs";

// RASCUNHO PEDAGÓGICO. Composição explícita para a prévia local; validar com o profissional antes de publicar.
const VERSION = "2026-09-29-rascunho";
const RECIPES = [
  { id: "sessao-brincar-com-bola", title: "Brincar com a bola", bands: ["6-8"] as AgeBandId[], ids: ["amigo-da-bola", "bola-que-obedece"] },
  { id: "sessao-controle-passe-mini", title: "Controlar e passar", bands: ["9-11"] as AgeBandId[], ids: ["drible-duas-maos", "passe-na-parede"] },
  { id: "sessao-controle-passe", title: "Controle e precisão", bands: ["12-14"] as AgeBandId[], ids: ["mao-fraca", "passe-na-parede"] },
  { id: "sessao-controle-passe-desenvolvimento", title: "Controle e passe em movimento", bands: ["15-17"] as AgeBandId[], ids: ["mao-fraca", "passe-em-movimento"] },
];

function buildSession(recipe: (typeof RECIPES)[number]): Program | undefined {
  const sources = recipe.ids.map(programById);
  if (sources.some((program) => !program)) return undefined;
  const parts = sources as Program[];
  const young = recipe.bands.includes("6-8") || recipe.bands.includes("9-11");
  const preparation = young ? programById("corpo-esperto")?.drills[0] : programById("salto-e-aterrissagem")?.drills[0];
  if (!preparation) return undefined;
  const drills = [
    { ...preparation, id: "preparacao", blockId: "preparacao", category: "fisico" as const },
    ...parts.flatMap((program) => program.drills.map((drill) => ({ ...drill, id: `${program.id}:${drill.id}`, blockId: program.id, category: program.category }))),
    { id: "fechamento", name: "Respirar e finalizar", cue: young ? "Respire com calma. Conte ao adulto qual movimento você gostou de praticar e guarde a bola." : "Respire com calma, caminhe devagar e guarde o equipamento. Perceba como você se sente antes de encerrar.", seconds: 45, restSeconds: 0, focus: "Finalizar com calma", blockId: "fechamento", category: "fisico" as const },
  ];
  return {
    id: recipe.id, title: recipe.title, summary: "Uma sessão com preparação, dois blocos de prática e um fechamento tranquilo. Faça no seu ritmo.",
    category: parts[0].category, bands: recipe.bands, levels: ["iniciante", "intermediario", "avancado"],
    equipment: [...new Set(parts.map((program) => program.equipment))].join(" "), drills,
    kind: "session", contentVersion: VERSION,
    blocks: [{ id: "preparacao", title: "Preparação", category: "fisico" }, ...parts.map((part) => ({ id: part.id, title: part.title, category: part.category })), { id: "fechamento", title: "Fechamento", category: "fisico" }],
  };
}

export function sessionsFor(band: AgeBandId): Program[] {
  return RECIPES.filter((recipe) => recipe.bands.includes(contentBand(band))).map(buildSession).filter((session): session is Program => Boolean(session));
}

export function practiceById(id: string): Program | undefined {
  const block = programById(id);
  if (block) return block;
  const recipe = RECIPES.find((item) => item.id === id);
  return recipe ? buildSession(recipe) : undefined;
}

export function practiceHistory(program: Program, sessions: TrainingSession[]): TrainingSession[] {
  return sessions.filter((session) => session.program_id === program.id);
}

export function allPractices(): Program[] {
  return [...PROGRAMS, ...RECIPES.map(buildSession).filter((program): program is Program => Boolean(program))];
}
