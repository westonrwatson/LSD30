import type { DayPlan } from '../content/schema';
import { isDayPlan, validateDayPlan } from '../content/schema';

const dayModules = import.meta.glob('../../content/days/*.json', { eager: true });

export function loadAllDays(): DayPlan[] {
  const days: DayPlan[] = [];

  for (const mod of Object.values(dayModules)) {
    const data = (mod as { default?: DayPlan }).default ?? (mod as DayPlan);
    if (isDayPlan(data)) {
      days.push(data);
    }
  }

  return days.sort((a, b) => a.day - b.day);
}

export function loadDay(dayNumber: number): DayPlan | null {
  return loadAllDays().find((d) => d.day === dayNumber) ?? null;
}

export function buildWordIndex(days: DayPlan[]): Map<string, import('../content/schema').Word> {
  const map = new Map<string, import('../content/schema').Word>();
  for (const day of days) {
    for (const word of day.words) {
      map.set(word.id, word);
    }
  }
  return map;
}

export function validateAllDays(days: DayPlan[]): string[] {
  const errors: string[] = [];
  for (const day of days) {
    errors.push(...validateDayPlan(day));
  }
  return errors;
}

export function getDayNumbers(days: DayPlan[]): number[] {
  return days.map((d) => d.day);
}
