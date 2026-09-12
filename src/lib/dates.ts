// Datas no fuso do aparelho: toISOString() usa UTC e vira o dia às 21h no Brasil.
export function localIsoDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Segunda-feira da semana da data, em AAAA-MM-DD. */
export function startOfWeekIso(date = new Date()): string {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return localIsoDate(day);
}

export function formatDayMonth(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}
