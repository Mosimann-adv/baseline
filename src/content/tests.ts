import type { AgeBandId } from "../lib/age";
import type { SkillTestDef } from "../lib/types";

// RASCUNHO — protocolos pendentes de validação por profissional de educação física.
// Sprint e salto só a partir de 12 anos. O atleta compara só com ele mesmo.
export const TEST_INTERVAL_DAYS = 28;

export const SKILL_TESTS: SkillTestDef[] = [
  {
    id: "arremessos-perto",
    name: "Arremessos certos perto da cesta",
    unit: "de 10",
    better: "max",
    bands: ["6-8"],
    protocol: "10 arremessos a um passo da cesta. Conte quantos entraram.",
    min: 0,
    max: 10,
    step: "int",
  },
  {
    id: "lance-livre",
    name: "Lances livres certos",
    unit: "de 10",
    better: "max",
    bands: ["9-11", "12-14", "15-17"],
    protocol: "10 lances livres com a sua rotina. Conte quantos entraram.",
    min: 0,
    max: 10,
    step: "int",
  },
  {
    id: "arremessos-1min",
    name: "Arremessos certos em 1 minuto",
    unit: "cestas",
    better: "max",
    bands: ["9-11", "12-14", "15-17"],
    protocol: "Arremesse de perto da cesta e pegue o próprio rebote durante 1 minuto. Um adulto marca o tempo e conta as cestas.",
    min: 0,
    max: 40,
    step: "int",
  },
  {
    id: "mao-fraca-30s",
    name: "Dribles com a mão fraca em 30 segundos",
    unit: "dribles",
    better: "max",
    bands: ["6-8", "9-11", "12-14", "15-17"],
    protocol: "Um adulto marca 30 segundos. Conte os dribles com a mão que você usa menos, sem perder a bola.",
    min: 0,
    max: 150,
    step: "int",
  },
  {
    id: "zigue-zague",
    name: "Drible em zigue-zague",
    unit: "s",
    better: "min",
    bands: ["9-11", "12-14", "15-17"],
    protocol: "5 cones em linha, com 2 passos entre eles. Vá e volte driblando entre os cones; um adulto cronometra.",
    min: 3,
    max: 120,
    step: "decimal",
  },
  {
    id: "sprint-10m",
    name: "Sprint de 10 m",
    unit: "s",
    better: "min",
    bands: ["12-14", "15-17"],
    protocol: "Saída parada, 10 metros medidos em chão firme. Faça 2 tentativas com descanso e anote a melhor.",
    min: 1,
    max: 6,
    step: "decimal",
  },
  {
    id: "salto-vertical",
    name: "Salto vertical",
    unit: "cm",
    better: "max",
    bands: ["12-14", "15-17"],
    protocol: "Marque na parede a altura da mão em pé e a altura tocada no salto. Anote a diferença em centímetros.",
    min: 5,
    max: 120,
    step: "int",
  },
];

export function testsFor(band: AgeBandId): SkillTestDef[] {
  return SKILL_TESTS.filter((test) => test.bands.includes(band));
}

export function formatTestValue(test: SkillTestDef, value: number): string {
  const number = test.step === "decimal" ? String(value).replace(".", ",") : String(value);
  return `${number} ${test.unit}`;
}
