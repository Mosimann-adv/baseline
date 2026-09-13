import { describe, expect, it } from "vitest";
import { formatDayMonth, localIsoDate, startOfWeekIso } from "./dates";

describe("localIsoDate", () => {
  it("formata AAAA-MM-DD no fuso do aparelho", () => {
    expect(localIsoDate(new Date(2026, 8, 13))).toBe("2026-09-13");
    expect(localIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("startOfWeekIso", () => {
  it("domingo volta para a segunda-feira da mesma semana", () => {
    // 13 de setembro de 2026 é domingo; a semana começa em 07/09 (segunda).
    expect(startOfWeekIso(new Date(2026, 8, 13))).toBe("2026-09-07");
  });

  it("segunda-feira fica nela mesma", () => {
    expect(startOfWeekIso(new Date(2026, 8, 7))).toBe("2026-09-07");
  });

  it("meio da semana volta para a segunda", () => {
    expect(startOfWeekIso(new Date(2026, 8, 10))).toBe("2026-09-07");
  });

  it("atravessa a virada de mês", () => {
    // Quarta 1 de julho de 2026: semana de 29 de junho.
    expect(startOfWeekIso(new Date(2026, 6, 1))).toBe("2026-06-29");
  });
});

describe("formatDayMonth", () => {
  it("formata DD/MM", () => {
    expect(formatDayMonth("2026-09-07")).toBe("07/09");
  });
});
