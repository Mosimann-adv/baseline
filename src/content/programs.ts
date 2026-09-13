import type { AgeBandId } from "../lib/age";
import type { Category, Level, Program } from "../lib/types";

// RASCUNHO — conteúdo pendente de validação por profissional de educação física.
// Vídeos: só IDs do YouTube já conferidos no app pessoal. Não inventar IDs; exercício sem vídeo verificado fica sem vídeo.
const VIDEOS = {
  aquecimento: { id: "IoPvijC5TgY", title: "Aquecimento dinâmico para basquete — Nathanael Morton" },
  deslocamento: { id: "sz45B4GpEXw", title: "Recuar, deslizar e arrancar — Jr. NBA" },
  espelho: { id: "HJwBzfT3ZJc", title: "Espelho defensivo — Jr. NBA" },
  aceleracao: { id: "PzjxFXQy1XI", title: "Saída e aceleração — Coach DuWayne Campbell" },
  saltoVertical: { id: "iU9MOreQB8Y", title: "Salto vertical com contramovimento — Jason Curtis" },
} as const;

export const CATEGORY_LABELS: Record<Category, string> = {
  drible: "Drible",
  arremesso: "Arremesso",
  passe: "Passe",
  defesa: "Defesa",
  fisico: "Preparo físico",
};

const ALL_LEVELS: Level[] = ["iniciante", "intermediario", "avancado"];

export const PROGRAMS: Program[] = [
  {
    id: "amigo-da-bola",
    title: "Amigo da bola",
    summary: "Brincadeiras para a bola obedecer: passar de mão, driblar parado e andando.",
    category: "drible",
    bands: ["6-8"],
    levels: ALL_LEVELS,
    equipment: "Bola tamanho 5 e um espaço livre sem objetos por perto.",
    drills: [
      { id: "cintura", name: "Bola em volta da cintura", cue: "Passe a bola de uma mão para a outra em volta da cintura, sem deixar cair.", seconds: 30, restSeconds: 15 },
      { id: "drible-forte", name: "Drible com a mão forte", cue: "Empurre a bola com a ponta dos dedos, não com a palma. Olhe para a frente.", seconds: 30, restSeconds: 15 },
      { id: "drible-outra", name: "Drible com a outra mão", cue: "Agora com a mão que você usa menos. Devagar está ótimo.", seconds: 30, restSeconds: 15 },
      { id: "drible-andando", name: "Drible andando", cue: "Vá até a parede e volte driblando, com a bola na altura da cintura.", seconds: 40, restSeconds: 20 },
      { id: "estatua", name: "Estátua", cue: "Com um adulto: drible até ele dizer “estátua”. Aí segure a bola e congele.", seconds: 60, restSeconds: 0 },
    ],
  },
  {
    id: "corpo-esperto",
    title: "Corpo esperto",
    summary: "Coordenação e equilíbrio para correr, pular e parar com segurança.",
    category: "fisico",
    bands: ["6-8", "9-11"],
    levels: ALL_LEVELS,
    equipment: "Espaço livre de 5 metros.",
    drills: [
      { id: "polichinelo", name: "Polichinelo", cue: "Abra e feche braços e pernas no mesmo ritmo.", seconds: 30, restSeconds: 15 },
      { id: "pe-so", name: "Pular num pé só", cue: "Pulinhos baixos. Troque de pé na metade do tempo.", seconds: 20, restSeconds: 20 },
      { id: "lado", name: "Corrida de lado", cue: "Passos para o lado sem cruzar os pés. Vá e volte.", seconds: 30, restSeconds: 15 },
      { id: "parar-firme", name: "Correr e parar firme", cue: "Corra devagar e pare com os dois pés no chão, joelhos dobrados, quando ouvir o sinal.", seconds: 40, restSeconds: 20 },
      { id: "equilibrio", name: "Equilíbrio de cegonha", cue: "Fique num pé só com os braços abertos. Troque de pé na metade.", seconds: 30, restSeconds: 0 },
    ],
  },
  {
    id: "drible-duas-maos",
    title: "Drible com as duas mãos",
    summary: "Troca de mão, drible alto e baixo e drible em movimento contornando obstáculos.",
    category: "drible",
    bands: ["9-11"],
    levels: ALL_LEVELS,
    equipment: "Bola tamanho 5 e 2 cones ou garrafas.",
    drills: [
      { id: "alto-baixo", name: "Drible alto e baixo", cue: "Três dribles na altura da cintura, três na altura do joelho. Depois a outra mão.", seconds: 40, restSeconds: 20 },
      { id: "troca-frente", name: "Troca de mão pela frente", cue: "Passe a bola de uma mão para a outra na frente do corpo, abaixo do joelho.", seconds: 40, restSeconds: 20 },
      { id: "oito", name: "Drible em oito", cue: "Com as pernas afastadas, drible entre elas desenhando um 8.", seconds: 40, restSeconds: 20 },
      { id: "cones", name: "Drible até o cone e volta", cue: "Use a mão de fora do cone. Na volta, troque de mão.", seconds: 45, restSeconds: 20 },
    ],
  },
  {
    id: "bandeja-dois-lados",
    title: "Bandeja dos dois lados",
    summary: "O passo da bandeja pela direita e pela esquerda, e arremessos perto da cesta.",
    category: "arremesso",
    bands: ["9-11", "12-14"],
    levels: ALL_LEVELS,
    equipment: "Bola e cesta: 2,60 m no minibasquete, 3,05 m a partir dos 12 anos.",
    drills: [
      { id: "passo-sem-bola", name: "Passo da bandeja sem bola", cue: "Pela direita: pé direito, pé esquerdo e sobe com o joelho direito.", seconds: 40, restSeconds: 20 },
      { id: "bandeja-direita", name: "Bandeja pela direita", cue: "Suba com a mão direita e mire no quadrado da tabela.", seconds: 60, restSeconds: 20 },
      { id: "bandeja-esquerda", name: "Bandeja pela esquerda", cue: "Pé esquerdo, pé direito e sobe com a mão esquerda.", seconds: 60, restSeconds: 20 },
      { id: "perto-da-cesta", name: "Arremesso perto da cesta", cue: "Cotovelo embaixo da bola e termine com a mão virada para baixo.", seconds: 60, restSeconds: 0 },
    ],
  },
  {
    id: "passe-na-parede",
    title: "Passe na parede",
    summary: "Passe de peito, passe picado e passe com deslocamento usando uma parede.",
    category: "passe",
    bands: ["9-11", "12-14"],
    levels: ALL_LEVELS,
    equipment: "Bola e uma parede lisa, a 2 ou 3 passos de distância.",
    drills: [
      { id: "peito", name: "Passe de peito", cue: "Empurre a bola com as duas mãos e termine com os polegares para baixo.", seconds: 40, restSeconds: 20 },
      { id: "picado", name: "Passe picado", cue: "A bola quica no chão a dois terços do caminho até a parede.", seconds: 40, restSeconds: 20 },
      { id: "passa-desloca", name: "Passa e desloca", cue: "Passe, dê um passo para o lado e receba a bola já pronto para passar de novo.", seconds: 40, restSeconds: 20 },
      { id: "uma-mao", name: "Passe com uma mão", cue: "Passe com a mão direita e depois com a esquerda, dando um passo à frente.", seconds: 40, restSeconds: 0 },
    ],
  },
  {
    id: "defesa-postura",
    title: "Postura de defesa",
    summary: "Base defensiva, deslizamento lateral e reação ao adversário.",
    category: "defesa",
    bands: ["9-11", "12-14", "15-17"],
    levels: ALL_LEVELS,
    equipment: "Espaço de 5 metros. O espelho precisa de um parceiro.",
    drills: [
      { id: "base", name: "Postura defensiva", cue: "Pés afastados, joelhos dobrados, costas retas e mãos ativas.", seconds: 30, restSeconds: 15 },
      { id: "desliza", name: "Deslizamento lateral", cue: "Empurre o chão com a perna de trás e não cruze os pés.", seconds: 30, restSeconds: 20, video: VIDEOS.deslocamento },
      { id: "recua-desliza-corre", name: "Recuar, deslizar e correr", cue: "Recue, deslize para o lado e, no sinal, gire o quadril e arranque.", seconds: 30, restSeconds: 20, video: VIDEOS.deslocamento },
      { id: "espelho", name: "Espelho com um parceiro", cue: "Um lidera, o outro copia os movimentos sem cruzar os pés.", seconds: 20, restSeconds: 20, video: VIDEOS.espelho },
    ],
  },
  {
    id: "mao-fraca",
    title: "Mão fraca no comando",
    summary: "Controle com a mão menos usada, mudança de ritmo e dribles combinados.",
    category: "drible",
    bands: ["12-14", "15-17"],
    levels: ALL_LEVELS,
    equipment: "Bola tamanho 6 ou 7 e 3 cones.",
    drills: [
      { id: "fraca-parado", name: "Mão fraca parado", cue: "Drible forte e baixo com a mão que você usa menos, olhando para a frente.", seconds: 45, restSeconds: 15 },
      { id: "ritmo", name: "Mudança de ritmo", cue: "Drible devagar por três passos e acelere de repente por dois.", seconds: 45, restSeconds: 20 },
      { id: "cross-entre", name: "Crossover e entre as pernas", cue: "Um crossover, um drible entre as pernas. Repita sem perder o ritmo.", seconds: 45, restSeconds: 20 },
      { id: "cones-fraca", name: "Zigue-zague com a mão fraca", cue: "Contorne os cones usando só a mão fraca na ida e só a forte na volta.", seconds: 60, restSeconds: 0 },
    ],
  },
  {
    id: "arremesso-base",
    title: "Base do arremesso",
    summary: "Mecânica com uma mão, arremessos em volta da cesta e rotina de lance livre.",
    category: "arremesso",
    bands: ["12-14", "15-17"],
    levels: ALL_LEVELS,
    equipment: "Bola e cesta de 3,05 m.",
    drills: [
      { id: "uma-mao", name: "Arremesso com uma mão", cue: "Bem perto da cesta, só a mão de arremesso. Termine com o pulso dobrado.", seconds: 60, restSeconds: 20 },
      { id: "cinco-pontos", name: "Cinco pontos em volta da cesta", cue: "Arremesse de cinco posições a dois passos da cesta, na mesma altura de salto.", seconds: 90, restSeconds: 30 },
      { id: "lance-livre", name: "Lance livre com rotina", cue: "A mesma rotina toda vez: quiques, respira, olha o aro e arremessa.", seconds: 90, restSeconds: 0 },
    ],
  },
  {
    id: "salto-e-aterrissagem",
    title: "Salto e aterrissagem",
    summary: "Aterrissar com segurança antes de saltar alto, com deslocamento e arrancada.",
    category: "fisico",
    bands: ["12-14", "15-17"],
    levels: ALL_LEVELS,
    equipment: "Chão firme e antiderrapante.",
    drills: [
      { id: "aquecimento", name: "Aquecimento dinâmico", cue: "Trote leve, mobilidade de tornozelo e deslocamentos curtos.", seconds: 180, restSeconds: 30, video: VIDEOS.aquecimento },
      { id: "aterrissagem", name: "Aterrissagem suave", cue: "Salte baixo e aterrisse sem barulho, joelhos na direção dos pés.", seconds: 30, restSeconds: 30 },
      { id: "salto-vertical", name: "Salto vertical", cue: "Desça rápido, suba sem pausa e aterrisse no mesmo lugar. Poucas repetições, com qualidade.", seconds: 30, restSeconds: 60, video: VIDEOS.saltoVertical },
      { id: "lateral-arrancada", name: "Lateral e arrancada", cue: "Dois passos laterais e, no sinal, arranque por três passos.", seconds: 30, restSeconds: 45, video: VIDEOS.deslocamento },
    ],
  },
  {
    id: "arrancada-e-freio",
    title: "Arrancada e freio",
    summary: "Sair rápido, frear com controle e reagir ao adversário.",
    category: "fisico",
    bands: ["15-17"],
    levels: ALL_LEVELS,
    equipment: "10 metros livres e chão firme. O espelho precisa de um parceiro.",
    drills: [
      { id: "aquecimento", name: "Aquecimento dinâmico", cue: "Trote leve, mobilidade e acelerações progressivas.", seconds: 180, restSeconds: 30, video: VIDEOS.aquecimento },
      { id: "saida", name: "Saída de aceleração 10 m", cue: "Corpo inclinado para a frente e braços fortes. Descanse bem entre as saídas.", seconds: 20, restSeconds: 60, video: VIDEOS.aceleracao },
      { id: "freio", name: "Arrancada e freio em 3 passos", cue: "Diminua o tamanho dos passos e baixe o quadril para parar equilibrado.", seconds: 20, restSeconds: 60 },
      { id: "espelho-reativo", name: "Espelho reativo", cue: "Blocos curtos: reaja ao parceiro sem antecipar.", seconds: 15, restSeconds: 45, video: VIDEOS.espelho },
    ],
  },
  {
    id: "arremesso-apos-drible",
    title: "Arremesso depois do drible",
    summary: "Parar equilibrado e arremessar depois de um ou dois dribles.",
    category: "arremesso",
    bands: ["15-17"],
    levels: ["intermediario", "avancado"],
    equipment: "Bola e cesta de 3,05 m.",
    drills: [
      { id: "um-drible", name: "Um drible e arremesso", cue: "Um drible forte para o lado, pare com os dois pés e arremesse.", seconds: 90, restSeconds: 30 },
      { id: "crossover-parada", name: "Crossover e parada", cue: "Crossover, parada em dois tempos e arremesso com o corpo de frente para a cesta.", seconds: 90, restSeconds: 30 },
      { id: "sequencia", name: "Sequência de arremessos", cue: "Cinco arremessos seguidos de pontos diferentes. Anote quantos caíram.", seconds: 90, restSeconds: 0 },
    ],
  },
];

export function programById(id: string): Program | undefined {
  return PROGRAMS.find((program) => program.id === id);
}

/** Treinos da faixa etária; os do nível do atleta primeiro. */
export function programsFor(band: AgeBandId, level: Level): Program[] {
  // Na v1 a faixa Adulto usa os programas de 15–17 (ver contentBand em lib/age.ts).
  const target = band === "adulto" ? "15-17" : band;
  const ofBand = PROGRAMS.filter((program) => program.bands.includes(target));
  const forLevel = ofBand.filter((program) => program.levels.includes(level));
  return forLevel.length > 0 ? forLevel : ofBand;
}

export function programMinutes(program: Program): number {
  const seconds = program.drills.reduce((total, drill) => total + drill.seconds + drill.restSeconds, 0);
  return Math.max(1, Math.round(seconds / 60));
}
