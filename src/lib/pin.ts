// PIN da Área do responsável. É uma trava contra a criança no aparelho da família,
// não uma proteção criptográfica: 4 dígitos com hash local se quebram por força bruta.
const storageKey = (guardianId: string) => `baseline.pin.${guardianId}`;

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function hasPin(guardianId: string): boolean {
  return localStorage.getItem(storageKey(guardianId)) !== null;
}

export async function savePin(guardianId: string, pin: string): Promise<void> {
  const salt = crypto.randomUUID();
  const hash = await sha256(`${salt}:${pin}`);
  localStorage.setItem(storageKey(guardianId), JSON.stringify({ salt, hash }));
}

export async function checkPin(guardianId: string, pin: string): Promise<boolean> {
  const raw = localStorage.getItem(storageKey(guardianId));
  if (!raw) return false;
  const { salt, hash } = JSON.parse(raw) as { salt: string; hash: string };
  return (await sha256(`${salt}:${pin}`)) === hash;
}

export function clearPin(guardianId: string): void {
  localStorage.removeItem(storageKey(guardianId));
}
