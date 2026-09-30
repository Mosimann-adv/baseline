import { startOfWeekIso } from "./dates";

export type GoalHistory = Record<string, number>;

export function goalForWeek(history: GoalHistory | undefined, week: string, fallback: number): number {
  const key = Object.keys(history ?? {}).filter((date) => date <= week).sort().at(-1);
  const value = key ? history?.[key] : fallback;
  return Number.isInteger(value) && value! >= 1 && value! <= 7 ? value! : fallback;
}

export function changedGoalHistory(history: GoalHistory | undefined, previous: number, next: number, today = new Date()): GoalHistory {
  return { "0001-01-01": previous, ...history, [startOfWeekIso(today)]: next };
}
