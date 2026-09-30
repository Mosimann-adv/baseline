import { afterEach, describe, expect, it } from "vitest";
import { authenticatedAreaBlocked, PASSWORD_RECOVERY_KEY, readRecoveryFlag, writeRecoveryFlag } from "./auth";
import { cooldownRemaining, SEND_COOLDOWN_S } from "../screens/AuthScreens";

// Regressão do fluxo de recuperação de senha (UX-01): depois de validar o código,
// a sessão abre mas a área autenticada só pode liberar depois da senha nova gravada.

function stubSessionStorage() {
  const map = new Map<string, string>();
  (globalThis as { sessionStorage?: unknown }).sessionStorage = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
  return map;
}

afterEach(() => {
  delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
});

describe("gate da recuperação de senha (UX-01)", () => {
  it("área autenticada fica fechada com sessão aberta e senha pendente", () => {
    expect(authenticatedAreaBlocked(true, true)).toBe(true);
    expect(authenticatedAreaBlocked(true, false)).toBe(false);
    expect(authenticatedAreaBlocked(false, true)).toBe(false);
    expect(authenticatedAreaBlocked(false, false)).toBe(false);
  });

  it("o gate sobrevive a um recarregamento na mesma aba (sessionStorage)", () => {
    const map = stubSessionStorage();
    expect(readRecoveryFlag()).toBe(false);
    writeRecoveryFlag(true);
    expect(readRecoveryFlag()).toBe(true);
    expect(map.get(PASSWORD_RECOVERY_KEY)).toBe("1");
    writeRecoveryFlag(false);
    expect(readRecoveryFlag()).toBe(false);
    expect(map.has(PASSWORD_RECOVERY_KEY)).toBe(false);
  });

  it("sem storage disponível, ler e gravar não quebram e o gate começa fechado", () => {
    expect(readRecoveryFlag()).toBe(false);
    expect(() => writeRecoveryFlag(true)).not.toThrow();
    expect(readRecoveryFlag()).toBe(false);
  });
});

describe("cooldown de reenvio de e-mail", () => {
  it("conta os segundos desde o envio e libera em zero", () => {
    const sentAt = 1_000;
    expect(cooldownRemaining(null, sentAt)).toBe(0);
    expect(cooldownRemaining(sentAt, sentAt)).toBe(SEND_COOLDOWN_S);
    expect(cooldownRemaining(sentAt, sentAt + 30_000)).toBe(SEND_COOLDOWN_S - 30);
    expect(cooldownRemaining(sentAt, sentAt + SEND_COOLDOWN_S * 1000)).toBe(0);
    expect(cooldownRemaining(sentAt, sentAt + 10 * 60_000)).toBe(0);
  });
});
