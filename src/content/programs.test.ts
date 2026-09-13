import { describe, expect, it } from "vitest";
import { CATEGORY_LABELS, PROGRAMS } from "./programs";
import type { AgeBandId } from "../lib/age";

const BANDS: AgeBandId[] = ["6-8", "9-11", "12-14", "15-17", "adulto"];

describe("conteúdo dos programas", () => {
  it("tem id único por programa", () => {
    const ids = PROGRAMS.map((program) => program.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todo programa tem categoria conhecida, faixa válida e exercícios", () => {
    const categories = Object.keys(CATEGORY_LABELS);
    for (const program of PROGRAMS) {
      expect(categories).toContain(program.category);
      expect(program.bands.length).toBeGreaterThan(0);
      for (const band of program.bands) expect(BANDS).toContain(band);
      expect(program.drills.length).toBeGreaterThan(0);
    }
  });

  it("exercícios têm id único dentro do programa e tempos positivos", () => {
    for (const program of PROGRAMS) {
      const ids = program.drills.map((drill) => drill.id);
      expect(new Set(ids).size, program.id).toBe(ids.length);
      for (const drill of program.drills) {
        expect(drill.seconds).toBeGreaterThan(0);
        expect(drill.restSeconds).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("programa exclusivamente infantil (só 6–8 e/ou 9–11) não exige cesta oficial nem duas bolas", () => {
    const kidsOnly = PROGRAMS.filter((program) => program.bands.every((band) => band === "6-8" || band === "9-11"));
    for (const program of kidsOnly) {
      expect(program.equipment, program.id).not.toMatch(/3,05|tamanho 7|2 bolas/i);
    }
  });
});
