/** Altura da bola acima do chão (px): cai do alto até o 1º toque, faz parábolas entre toques e fica no chão depois do último. */
export function ballHeight(frame: number, landings: readonly number[], peak: number): number {
  const first = landings[0];
  if (frame <= first) {
    const t = frame / first;
    return peak * (1 - t * t);
  }
  for (let i = 1; i < landings.length; i++) {
    const a = landings[i - 1];
    const b = landings[i];
    if (frame <= b) {
      const t = (frame - a) / (b - a);
      return peak * 4 * t * (1 - t);
    }
  }
  return 0;
}

/** Quanto a bola amassa: `amount` no quadro do toque, zero a partir de 3 quadros de distância. */
export function squash(frame: number, landings: readonly number[], amount = 0.2): number {
  const distance = Math.min(...landings.map((landing) => Math.abs(frame - landing)));
  return distance >= 3 ? 0 : amount * (1 - distance / 3);
}
