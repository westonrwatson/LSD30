import type { AppSettings, PersistedState, PlanDayEntry } from '../content/schema';

const STORAGE_KEY = 'lsd30-state-v1';

const DEFAULT_SETTINGS: AppSettings = {
  transliteration: true,
  sessionMinutes: 30,
};

export function defaultPlanDays(dayNumbers: number[]): Record<number, PlanDayEntry> {
  const entries: Record<number, PlanDayEntry> = {};
  for (const day of dayNumbers) {
    entries[day] = {
      day,
      pinned: false,
      status: day === 1 ? 'available' : 'locked',
    };
  }
  return entries;
}

export function createDefaultState(dayNumbers: number[]): PersistedState {
  return {
    planOrder: [...dayNumbers],
    planDays: defaultPlanDays(dayNumbers),
    srs: {},
    streak: 0,
    lastStudyDate: null,
    completedDays: [],
    settings: { ...DEFAULT_SETTINGS },
    currentDay: null,
  };
}

export function loadState(dayNumbers: number[]): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState(dayNumbers);

    const parsed = JSON.parse(raw) as PersistedState;
    const merged: PersistedState = {
      ...createDefaultState(dayNumbers),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };

    for (const day of dayNumbers) {
      if (!merged.planDays[day]) {
        merged.planDays[day] = { day, pinned: false, status: 'locked' };
      }
      if (!merged.planOrder.includes(day)) {
        merged.planOrder.push(day);
      }
    }

    merged.planOrder = merged.planOrder.filter((d) => dayNumbers.includes(d));
    for (const day of dayNumbers) {
      if (!merged.planOrder.includes(day)) merged.planOrder.push(day);
    }

    return merged;
  } catch {
    return createDefaultState(dayNumbers);
  }
}

export function saveState(state: PersistedState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isYesterday(dateISO: string | null): boolean {
  if (!dateISO) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateISO === yesterday.toISOString().slice(0, 10);
}

export function isToday(dateISO: string | null): boolean {
  return dateISO === todayISO();
}
