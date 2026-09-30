import { describe, expect, it } from "vitest";
import { SKILL_TESTS, protocolFor } from "./tests";

const def = (id: string) => SKILL_TESTS.find((test) => test.id === id)!;

describe("protocolo por idade (adulto vs menor)", () => {
  it("menor mantém o texto com o adulto por perto", () => {
    expect(protocolFor(def("mao-fraca-30s"), 10)).toContain("Um adulto");
    expect(protocolFor(def("zigue-zague"), 17)).toContain("um adulto cronometra");
  });

  it("adulto pede alguém para marcar o tempo ou cronometrar", () => {
    expect(protocolFor(def("mao-fraca-30s"), 18)).not.toContain("adulto");
    expect(protocolFor(def("mao-fraca-30s"), 44)).toContain("alguém");
    expect(protocolFor(def("arremessos-1min"), 30)).toContain("Peça para alguém");
    expect(protocolFor(def("zigue-zague"), 20)).not.toContain("adulto");
  });

  it("protocolo que não depende de outra pessoa não muda", () => {
    expect(protocolFor(def("sprint-10m"), 30)).toBe(def("sprint-10m").protocol);
    expect(protocolFor(def("lance-livre"), 30)).toBe(def("lance-livre").protocol);
  });
});
