import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cacheEpoch, clearAccountDeviceData, invalidateAccountReads, openAccountDeviceCache, readCached, writeCached } from "./cache";

const store = new Map<string, string>();
beforeEach(() => {
  store.clear(); openAccountDeviceCache("g"); openAccountDeviceCache("other");
  vi.stubGlobal("localStorage", { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value), removeItem: (key: string) => store.delete(key), get length() { return store.size; }, key: (index: number) => [...store.keys()][index] ?? null });
});
afterEach(() => vi.unstubAllGlobals());
describe("cópia local e respostas atrasadas", () => {
  it("uma resposta iniciada antes de sair não recria os dados apagados", () => {
    const before = cacheEpoch("g");
    writeCached("g", "family", { nickname: "Rafa" }, before);
    writeCached("other", "family", { nickname: "Outro" });
    clearAccountDeviceData("g");
    writeCached("g", "family", { nickname: "Rafa" }, before);
    expect(readCached("g", "family")).toBeNull();
    openAccountDeviceCache("g");
    writeCached("g", "family", { nickname: "Resposta antiga" }, before);
    expect(readCached("g", "family")).toBeNull();
    expect(readCached("other", "family")).toEqual({ nickname: "Outro" });
  });
  it("revogar/excluir invalida leituras antigas e permite uma carga nova", () => {
    const before = cacheEpoch("g");
    invalidateAccountReads("g");
    writeCached("g", "family", { active: true }, before);
    writeCached("g", "family", { active: false }, cacheEpoch("g"));
    expect(readCached("g", "family")).toEqual({ active: false });
  });
});
