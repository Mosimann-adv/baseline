const prefix = (guardianId: string) => `baseline.cache.${guardianId}.`;
const blocked = new Set<string>();
const epochs = new Map<string, number>();
export const cacheEpoch = (guardianId: string) => epochs.get(guardianId) ?? 0;
export const accountCacheBlocked = (guardianId: string) => blocked.has(guardianId);
export function invalidateAccountReads(guardianId: string): void { epochs.set(guardianId, cacheEpoch(guardianId) + 1); }
export function openAccountDeviceCache(guardianId: string): void { blocked.delete(guardianId); }

export function readCached<T>(guardianId: string, scope: string): T | null {
  try {
    const value = JSON.parse(localStorage.getItem(`${prefix(guardianId)}${scope}`) ?? "null");
    return value?.version === 1 && value.data !== undefined ? value.data as T : null;
  } catch { return null; }
}

export function writeCached(guardianId: string, scope: string, data: unknown, expectedEpoch?: number): void {
  if (blocked.has(guardianId) || (expectedEpoch !== undefined && expectedEpoch !== cacheEpoch(guardianId))) return;
  try { localStorage.setItem(`${prefix(guardianId)}${scope}`, JSON.stringify({ version: 1, savedAt: Date.now(), data })); }
  catch { /* A interface continua com os dados em memória se o aparelho estiver cheio. */ }
}

/** Remove cópias de dados e rascunhos desta conta; preferências gerais de som ficam. */
export function clearAccountDeviceData(guardianId: string): void {
  blocked.add(guardianId);
  invalidateAccountReads(guardianId);
  try {
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => Boolean(key));
    for (const key of keys) if (key.startsWith(prefix(guardianId)) || key.startsWith(`baseline.resume.${guardianId}.`) ||
      key.startsWith(`baseline.testDraft.${guardianId}.`) || key.startsWith(`baseline.catalog.${guardianId}.`) || key === `baseline.athlete.${guardianId}`) localStorage.removeItem(key);
  } catch { /* Um storage indisponível também não expõe a cópia a outra sessão. */ }
}

export function clearProfilePreferences(guardianId: string, athleteId: string): void {
  try {
    for (const key of [`baseline.catalog.${guardianId}.${athleteId}`, `baseline.testDraft.${guardianId}.${athleteId}`, `${prefix(guardianId)}testIds.${athleteId}`]) localStorage.removeItem(key);
  } catch { /* armazenamento indisponível */ }
}
