import { describe, expect, it } from "vitest";
import { sessionsFor, practiceById } from "./practices";
import { programsFor } from "./programs";
import { contentBand, type AgeBandId } from "../lib/age";

describe("conteúdo e composição", () => {
  const bands: AgeBandId[] = ["6-8", "9-11", "12-14", "15-17", "adulto"];
  it("todas as faixas têm os cinco fundamentos", () => {
    for (const band of bands) expect(new Set(programsFor(band, "iniciante").map((program) => program.category)).size).toBe(5);
  });
  it("sessões preservam origem dos exercícios, preparação e fechamento", () => {
    for (const band of bands) {
      const session = sessionsFor(band)[0];
      expect(session).toBeDefined();
      expect(session.blocks?.[0].id).toBe("preparacao");
      expect(session.blocks?.at(-1)?.id).toBe("fechamento");
      expect(new Set(session.drills.map((drill) => drill.id)).size).toBe(session.drills.length);
      for (const block of session.blocks?.slice(1, -1) ?? []) expect(practiceById(block.id)?.bands).toContain(contentBand(band));
    }
  });
});
