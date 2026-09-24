import { describe, expect, it } from "vitest";
import { CATEGORY_LABELS, PROGRAMS, needsHoop, programShelves, programsFor } from "./programs";
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

describe("prateleiras da aba Treinos", () => {
  it("reconhece treino que precisa de cesta pelo equipamento", () => {
    expect(needsHoop(PROGRAMS.find((p) => p.id === "amigo-da-bola")!)).toBe(false);
    for (const program of PROGRAMS) {
      expect(needsHoop(program), program.id).toBe(/cesta/i.test(program.equipment));
    }
  });

  it("agrupa por fundamento na ordem fixa, sem prateleira vazia e sem perder treino", () => {
    for (const band of BANDS) {
      const programs = programsFor(band, "iniciante");
      const shelves = programShelves(programs);
      const order = Object.keys(CATEGORY_LABELS);
      const indexes = shelves.map((shelf) => order.indexOf(shelf.category));
      expect(indexes, band).toEqual([...indexes].sort((a, b) => a - b));
      for (const shelf of shelves) {
        expect(shelf.programs.length).toBeGreaterThan(0);
        for (const program of shelf.programs) expect(program.category).toBe(shelf.category);
      }
      expect(shelves.flatMap((shelf) => shelf.programs.map((p) => p.id))).toEqual(
        order.flatMap((category) => programs.filter((p) => p.category === category).map((p) => p.id)),
      );
    }
  });
});
