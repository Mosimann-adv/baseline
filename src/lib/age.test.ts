import { describe, expect, it } from "vitest";
import { MIN_AGE, MAX_AGE, ageThisYear, bandFor, contentBand } from "./age";

const IN_2026 = new Date(2026, 5, 15);

describe("ageThisYear", () => {
  it("calcula pelo ano corrente, sem mês nem dia", () => {
    expect(ageThisYear(2015, IN_2026)).toBe(11);
    expect(ageThisYear(2008, IN_2026)).toBe(18);
  });
});

describe("bandFor", () => {
  it("recusa idade abaixo da mínima", () => {
    expect(bandFor(MIN_AGE - 1)).toBeNull();
  });

  it("encaixa os limites de cada faixa", () => {
    expect(bandFor(6)?.id).toBe("6-8");
    expect(bandFor(8)?.id).toBe("6-8");
    expect(bandFor(9)?.id).toBe("9-11");
    expect(bandFor(11)?.id).toBe("9-11");
    expect(bandFor(12)?.id).toBe("12-14");
    expect(bandFor(14)?.id).toBe("12-14");
    expect(bandFor(15)?.id).toBe("15-17");
    expect(bandFor(MAX_AGE)?.id).toBe("15-17");
  });

  it("acima de 17 é adulto", () => {
    expect(bandFor(18)?.id).toBe("adulto");
    expect(bandFor(40)?.id).toBe("adulto");
  });
});

describe("contentBand", () => {
  it("adulto usa o conteúdo de 15–17 na v1", () => {
    expect(contentBand("adulto")).toBe("15-17");
  });

  it("as demais faixas seguem iguais", () => {
    expect(contentBand("6-8")).toBe("6-8");
    expect(contentBand("15-17")).toBe("15-17");
  });
});
