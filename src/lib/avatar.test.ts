import { describe, expect, it } from "vitest";
import { avatarFor } from "../lib/avatar";

describe("avatarFor", () => {
  it("é determinístico para o mesmo id", () => {
    expect(avatarFor("abc")).toEqual(avatarFor("abc"));
  });

  it("varia entre ids diferentes", () => {
    const seen = new Set(["a", "b", "c", "d", "e", "f", "g", "h"].map((id) => JSON.stringify(avatarFor(id))));
    expect(seen.size).toBeGreaterThan(1);
  });
});
