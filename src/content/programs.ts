import type { AgeBandId } from "../lib/age";
import type { Category, Level, Program } from "../lib/types";

// RASCUNHO — conteúdo pendente de validação por profissional de educação física.
// Vídeos: só IDs do YouTube conferidos (oEmbed). Exercício sem equivalente fica sem vídeo.
// start/end: recorte do trecho que demonstra o exercício (start = capítulo do YouTube; end = próximo capítulo).
// Onde diz "confirmar", o tempo veio dos "Key moments" automáticos do YouTube — conferir assistindo.
// Vídeos curtos da Jr. NBA sem capítulos: start 30 para pular a introdução (pedido do dono).
const VIDEOS = {
  aquecimento: { id: "IoPvijC5TgY", title: "Aquecimento dinâmico para basquete — Nathanael Morton" },
  deslocamento: { id: "sz45B4GpEXw", start: 30, title: "Recuar, deslizar e arrancar — Jr. NBA" },
  // start 5: capítulo "The Defensive Mirror Drill" (demo vai até 0:19, "Solid Defensive Posture").
  espelho: { id: "HJwBzfT3ZJc", start: 5, end: 19, title: "Espelho defensivo — Jr. NBA" },
  // start 51: capítulo "Acceleration" (o "Intro" vai até 0:51); end 93: começa "Standing Long Jump".
  aceleracao: { id: "PzjxFXQy1XI", start: 51, end: 93, title: "Saída e aceleração — Coach DuWayne Campbell" },
  // start 30: capítulo "Countermovement" (o "Intro" vai até 0:30); end 80: começa "Hip Whip". Confirmar.
  saltoVertical: { id: "iU9MOreQB8Y", start: 30, end: 80, title: "Salto vertical com contramovimento — Jason Curtis" },
  // start 67: capítulo "move with the basketball" (0:00–1:07 é introdução); end 97: cobre até "stay on top". Confirmar.
  drible: { id: "BnvGa0I8bMc", start: 67, end: 97, title: "Fundamentos do drible — Jr. NBA" },
  dribleAlto: { id: "UY1Z4bKUZRU", start: 30, title: "Drible alto — Jr. NBA" },
  dribleBaixo: { id: "qBkSOtWQe4o", start: 30, title: "Drible baixo — Jr. NBA" },
  dribleDedos: { id: "8NiQszvmHho", start: 30, title: "Drible com os dedos — Jr. NBA" },
  cones: { id: "1Sp_dQorGvA", start: 30, title: "Drible entre cones — Jr. NBA" },
  estatua: { id: "f7tB5drRCNA", start: 30, title: "Drible e estátua — Jr. NBA" },
  crossover: { id: "OQWe-Y4zwEg", start: 30, title: "Crossover por dentro e por fora — Jr. NBA" },
  ritmo: { id: "HDHFyQ0DwS4", start: 30, title: "Drible de puxada — Jr. NBA" },
  // start 59: capítulo "The Finish"; end 119: cobre "Extended Finish" e "Cadence", até "Mechanics". Confirmar.
  arremesso: { id: "t7ciq_x4138", start: 59, end: 119, title: "Fundamentos do arremesso — Jr. NBA" },
  // start 83: "Key moment" sobre os pés no arremesso de forma. Confirmar.
  forma: { id: "ihKEQGn3KNo", start: 83, title: "Arremesso de forma, sem cesta — Jr. NBA" },
  // start 4: "Key moment" sobre a importância do lance livre. Confirmar.
  lanceLivre: { id: "lnuZNZPDvaY", start: 4, title: "Fundamentos do lance livre — Jr. NBA" },
  // start 113: "Key moment" explicando a parada (jump stop). Confirmar.
  paradaArremesso: { id: "AueLd1-H1V8", start: 113, title: "Parada e arremesso — Jr. NBA" },
  crossoverArremesso: { id: "ajAQJRkSkIo", start: 30, title: "Crossover e arremesso — Jr. NBA" },
  // start 112: "Key moment" sobre os passos da bandeja. Confirmar.
  bandeja: { id: "hI0aUdwBAqw", start: 112, title: "Bandeja em cinco — Jr. NBA" },
  bandejaPasso: { id: "TlOwO09gzpI", start: 30, title: "Bandeja com drop-step — Jr. NBA" },
  passePeito: { id: "SbOsxamKyzY", start: 27, end: 64, title: "Passe de peito — USA Basketball" },
  passePicado: { id: "SbOsxamKyzY", start: 64, end: 90, title: "Passe picado — USA Basketball" },
  passaCorta: { id: "YzadRKLSMB4", start: 30, title: "Passa e corta — Jr. NBA" },
  passePivo: { id: "jgqdv9ySjYM", start: 30, title: "Parada, pivô e passe — Jr. NBA" },
  base: { id: "4A6KqSJX8Ek", start: 30, title: "Postura defensiva — Jr. NBA" },
  lateral: { id: "j7JUvMrXLRk", start: 30, title: "Deslizamento lateral — Jr. NBA" },
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
      { id: "drible-forte", name: "Drible com a mão forte", cue: "Empurre a bola com a ponta dos dedos, não com a palma. Olhe para a frente.", seconds: 30, restSeconds: 15, video: VIDEOS.drible },
      { id: "drible-outra", name: "Drible com a outra mão", cue: "Agora com a mão que você usa menos. Devagar está ótimo.", seconds: 30, restSeconds: 15, video: VIDEOS.dribleBaixo },
      { id: "drible-andando", name: "Drible andando", cue: "Vá até a parede e volte driblando, com a bola na altura da cintura.", seconds: 40, restSeconds: 20, video: VIDEOS.dribleAlto },
      { id: "estatua", name: "Estátua", cue: "Com um adulto: drible até ele dizer “estátua”. Aí segure a bola e congele.", seconds: 60, restSeconds: 0, video: VIDEOS.estatua },
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
      { id: "lado", name: "Corrida de lado", cue: "Passos para o lado sem cruzar os pés. Vá e volte.", seconds: 30, restSeconds: 15, video: VIDEOS.lateral },
      { id: "parar-firme", name: "Correr e parar firme", cue: "Corra devagar e pare com os dois pés no chão, joelhos dobrados, quando ouvir o sinal.", seconds: 40, restSeconds: 20, video: VIDEOS.aceleracao },
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
      { id: "alto-baixo", name: "Drible alto e baixo", cue: "Três dribles na altura da cintura, três na altura do joelho. Depois a outra mão.", seconds: 40, restSeconds: 20, video: VIDEOS.dribleAlto },
      { id: "troca-frente", name: "Troca de mão pela frente", cue: "Passe a bola de uma mão para a outra na frente do corpo, abaixo do joelho.", seconds: 40, restSeconds: 20, video: VIDEOS.crossover },
      { id: "oito", name: "Drible em oito", cue: "Com as pernas afastadas, drible entre elas desenhando um 8.", seconds: 40, restSeconds: 20, video: VIDEOS.dribleDedos },
      { id: "cones", name: "Drible até o cone e volta", cue: "Use a mão de fora do cone. Na volta, troque de mão.", seconds: 45, restSeconds: 20, video: VIDEOS.cones },
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
      { id: "passo-sem-bola", name: "Passo da bandeja sem bola", cue: "Pela direita: pé direito, pé esquerdo e sobe com o joelho direito.", seconds: 40, restSeconds: 20, video: VIDEOS.bandejaPasso },
      { id: "bandeja-direita", name: "Bandeja pela direita", cue: "Suba com a mão direita e mire no quadrado da tabela.", seconds: 60, restSeconds: 20, video: VIDEOS.bandeja },
      { id: "bandeja-esquerda", name: "Bandeja pela esquerda", cue: "Pé esquerdo, pé direito e sobe com a mão esquerda.", seconds: 60, restSeconds: 20, video: VIDEOS.bandeja },
      { id: "perto-da-cesta", name: "Arremesso perto da cesta", cue: "Cotovelo embaixo da bola e termine com a mão virada para baixo.", seconds: 60, restSeconds: 0, video: VIDEOS.forma },
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
      { id: "peito", name: "Passe de peito", cue: "Empurre a bola com as duas mãos e termine com os polegares para baixo.", seconds: 40, restSeconds: 20, video: VIDEOS.passePeito },
      { id: "picado", name: "Passe picado", cue: "A bola quica no chão a dois terços do caminho até a parede.", seconds: 40, restSeconds: 20, video: VIDEOS.passePicado },
      { id: "passa-desloca", name: "Passa e desloca", cue: "Passe, dê um passo para o lado e receba a bola já pronto para passar de novo.", seconds: 40, restSeconds: 20, video: VIDEOS.passaCorta },
      { id: "uma-mao", name: "Passe com uma mão", cue: "Passe com a mão direita e depois com a esquerda, dando um passo à frente.", seconds: 40, restSeconds: 0, video: VIDEOS.passePivo },
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
      { id: "base", name: "Postura defensiva", cue: "Pés afastados, joelhos dobrados, costas retas e mãos ativas.", seconds: 30, restSeconds: 15, video: VIDEOS.base },
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
      { id: "fraca-parado", name: "Mão fraca parado", cue: "Drible forte e baixo com a mão que você usa menos, olhando para a frente.", seconds: 45, restSeconds: 15, video: VIDEOS.dribleBaixo },
      { id: "ritmo", name: "Mudança de ritmo", cue: "Drible devagar por três passos e acelere de repente por dois.", seconds: 45, restSeconds: 20, video: VIDEOS.ritmo },
      { id: "cross-entre", name: "Crossover e entre as pernas", cue: "Um crossover, um drible entre as pernas. Repita sem perder o ritmo.", seconds: 45, restSeconds: 20, video: VIDEOS.crossover },
      { id: "cones-fraca", name: "Zigue-zague com a mão fraca", cue: "Contorne os cones usando só a mão fraca na ida e só a forte na volta.", seconds: 60, restSeconds: 0, video: VIDEOS.cones },
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
      { id: "uma-mao", name: "Arremesso com uma mão", cue: "Bem perto da cesta, só a mão de arremesso. Termine com o pulso dobrado.", seconds: 60, restSeconds: 20, video: VIDEOS.forma },
      { id: "cinco-pontos", name: "Cinco pontos em volta da cesta", cue: "Arremesse de cinco posições a dois passos da cesta, na mesma altura de salto.", seconds: 90, restSeconds: 30, video: VIDEOS.arremesso },
      { id: "lance-livre", name: "Lance livre com rotina", cue: "A mesma rotina toda vez: quiques, respira, olha o aro e arremessa.", seconds: 90, restSeconds: 0, video: VIDEOS.lanceLivre },
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
      { id: "aterrissagem", name: "Aterrissagem suave", cue: "Salte baixo e aterrisse sem barulho, joelhos na direção dos pés.", seconds: 30, restSeconds: 30, video: VIDEOS.saltoVertical },
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
      { id: "freio", name: "Arrancada e freio em 3 passos", cue: "Diminua o tamanho dos passos e baixe o quadril para parar equilibrado.", seconds: 20, restSeconds: 60, video: VIDEOS.aceleracao },
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
      { id: "um-drible", name: "Um drible e arremesso", cue: "Um drible forte para o lado, pare com os dois pés e arremesse.", seconds: 90, restSeconds: 30, video: VIDEOS.paradaArremesso },
      { id: "crossover-parada", name: "Crossover e parada", cue: "Crossover, parada em dois tempos e arremesso com o corpo de frente para a cesta.", seconds: 90, restSeconds: 30, video: VIDEOS.crossoverArremesso },
      { id: "sequencia", name: "Sequência de arremessos", cue: "Cinco arremessos seguidos de pontos diferentes. Anote quantos caíram.", seconds: 90, restSeconds: 0, video: VIDEOS.arremesso },
    ],
  },
  // Rascunho de 2026-09-13: ball handling para treinar em casa, sem cesta (pedido do dono).
  {
    id: "bola-que-obedece",
    title: "Bola que obedece",
    summary: "Brincadeiras de controle em espaço pequeno: rolar a bola em volta do corpo e driblar devagar, sem precisar de cesta.",
    category: "drible",
    bands: ["6-8"],
    levels: ALL_LEVELS,
    equipment: "Bola tamanho 5 e um espaço livre de 2 por 2 metros, longe de janelas e luminárias.",
    drills: [
      { id: "oito-rolando", name: "Oito nas pernas", cue: "Sentado com as pernas abertas, passe a bola por dentro e por fora das pernas, desenhando um 8.", seconds: 40, restSeconds: 15 },
      { id: "volta-corpo", name: "Volta no corpo", cue: "Com os pés juntos, rode a bola três vezes na cintura e três vezes nas pernas, sem deixar cair.", seconds: 40, restSeconds: 15 },
      { id: "toque-pegue", name: "Toque e pegue", cue: "Jogue a bola para cima, bata uma palma e pegue. Já está fácil? Tente duas palmas.", seconds: 30, restSeconds: 15 },
      { id: "drible-joelhos", name: "Drible de joelhos", cue: "Ajoelhado (num tapete se o chão for duro), drible baixinho ao lado do corpo, só com a ponta dos dedos.", seconds: 30, restSeconds: 15, video: VIDEOS.dribleDedos },
      { id: "drible-devagar", name: "Drible devagar", cue: "Drible andando devagar até a parede e volte. Olhe para a frente, não para a bola.", seconds: 40, restSeconds: 20, video: VIDEOS.dribleAlto },
    ],
  },
  {
    id: "maos-rapidas",
    title: "Mãos rápidas",
    summary: "Dribles rápidos, trocas de mão e recuo para a bola ficar colada na mão.",
    category: "drible",
    bands: ["9-11"],
    levels: ALL_LEVELS,
    equipment: "Bola tamanho 5 e 2 cones ou garrafas.",
    drills: [
      { id: "dedos-parado", name: "Drible de dedos", cue: "Sentado ou de joelhos, drible rápido só com a ponta dos dedos, sem usar a palma.", seconds: 30, restSeconds: 15, video: VIDEOS.dribleDedos },
      { id: "troca-baixa", name: "Troca de mão baixa", cue: "Drible baixo e passe a bola de uma mão para a outra na frente do corpo, sem olhar para a bola.", seconds: 40, restSeconds: 20, video: VIDEOS.crossover },
      { id: "recuo", name: "Drible de recuo", cue: "Drible dois passos para a frente e puxe a bola de volta, escondendo-a com o corpo.", seconds: 40, restSeconds: 20, video: VIDEOS.ritmo },
      { id: "dois-cones", name: "Oito entre dois cones", cue: "Drible em zigue-zague entre os dois cones. Use a mão de fora na ida e troque na volta.", seconds: 45, restSeconds: 20, video: VIDEOS.cones },
      { id: "congela-andando", name: "Congela em movimento", cue: "Com um adulto: drible andando em qualquer direção e, no sinal, congele segurando a bola firme.", seconds: 60, restSeconds: 0, video: VIDEOS.estatua },
    ],
  },
  {
    id: "drible-sem-olhar",
    title: "Drible sem olhar",
    summary: "Driblar olhando para a frente, como no jogo. Alguns exercícios precisam de um adulto.",
    category: "drible",
    bands: ["9-11", "12-14"],
    levels: ALL_LEVELS,
    equipment: "Bola tamanho 5 ou 6, 2 cones ou garrafas e um espaço de 2 por 2 metros.",
    drills: [
      { id: "olhar-frente", name: "Ponto na parede", cue: "Drible parado olhando para um ponto alto na parede. Conte até 30 sem olhar para a bola.", seconds: 30, restSeconds: 15, video: VIDEOS.dribleAlto },
      { id: "conta-dedos", name: "Contar dedos", cue: "Com um adulto na sua frente: drible sem olhar para a bola e diga quantos dedos ele está mostrando.", seconds: 40, restSeconds: 20 },
      { id: "chamou-trocou", name: "Chamou, trocou", cue: "Com um adulto: ele grita “direita” ou “esquerda” e você troca a mão do drible na hora.", seconds: 40, restSeconds: 20 },
      { id: "troca-sem-olhar", name: "Troca escondida", cue: "Troque a mão do drible na frente do corpo e depois por baixo da perna, sempre de olho na frente.", seconds: 40, restSeconds: 20, video: VIDEOS.crossover },
      { id: "cones-sem-olhar", name: "Zigue-zague sem olhar", cue: "Drible entre os dois cones olhando para a frente, não para os cones. Comece devagar.", seconds: 45, restSeconds: 0, video: VIDEOS.cones },
    ],
  },
  {
    id: "duas-bolas",
    title: "Duas bolas",
    summary: "Drible com duas bolas ao mesmo tempo para mãos mais fortes e mais rápidas.",
    category: "drible",
    bands: ["12-14", "15-17"],
    levels: ALL_LEVELS,
    equipment: "2 bolas (tamanho 6 ou 7) e um espaço de 2 por 2 metros.",
    drills: [
      { id: "duplo-alto", name: "Duplo alto", cue: "Drible as duas bolas na altura da cintura, no mesmo ritmo. Depois faça cada mão em um ritmo.", seconds: 40, restSeconds: 20, video: VIDEOS.dribleAlto },
      { id: "duplo-baixo", name: "Duplo baixo", cue: "Agora baixinho, na altura do joelho, só com a ponta dos dedos.", seconds: 40, restSeconds: 20, video: VIDEOS.dribleBaixo },
      { id: "alternado", name: "Alternado", cue: "Uma bola sobe enquanto a outra desce, como um balanço. Sem olhar para as bolas.", seconds: 40, restSeconds: 20 },
      { id: "para-ergue", name: "Para e ergue", cue: "No sinal de um adulto (ou conte mentalmente), pare uma bola segurando firme e continue só com a outra.", seconds: 45, restSeconds: 20 },
      { id: "duplo-andando", name: "Duplo andando", cue: "Ande para a frente driblando as duas bolas até a parede e volte, mantendo o mesmo ritmo.", seconds: 60, restSeconds: 0, video: VIDEOS.drible },
    ],
  },
  {
    id: "cadeia-de-dribles",
    title: "Cadeia de dribles",
    summary: "Juntar movimentos em sequência — crossover, entre as pernas e puxado — sem perder o ritmo.",
    category: "drible",
    bands: ["12-14", "15-17"],
    levels: ALL_LEVELS,
    equipment: "Bola tamanho 6 ou 7 e 2 cones ou garrafas.",
    drills: [
      { id: "aquece-maos", name: "Drible forte parado", cue: "Drible forte e baixo com cada mão, olhando para a frente.", seconds: 30, restSeconds: 15, video: VIDEOS.drible },
      { id: "finta-cruzar", name: "Finta de cruzar", cue: "Fingir que vai cruzar a bola e não cruza; na próxima, cruze de verdade. Alterne os dois.", seconds: 45, restSeconds: 20, video: VIDEOS.crossover },
      { id: "entre-pernas", name: "Entre as pernas", cue: "Um drible entre as pernas, um do lado de fora. O pé da frente fica parado.", seconds: 45, restSeconds: 20 },
      { id: "puxado-arranque", name: "Puxou, arrancou", cue: "Drible dois passos para a frente, puxe a bola de volta e arranque pelo lado por três passos.", seconds: 45, restSeconds: 20, video: VIDEOS.ritmo },
      { id: "cadeia", name: "A cadeia inteira", cue: "Junte tudo: crossover, entre as pernas e puxado — quatro dribles em cada. Já está fácil? Inclua por trás das costas.", seconds: 60, restSeconds: 0 },
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
