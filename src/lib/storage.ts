import type { AppSettings, PersistedState, PlanDayEntry } from '../content/schema';

const STORAGE_KEY = 'povtori-state-v1';
const LEGACY_STORAGE_KEY = 'lsd30-state-v1';

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
      status: 'available',
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
    firstVisitDate: null,
    completionDates: [],
    completedDays: [],
    settings: { ...DEFAULT_SETTINGS },
    currentDay: null,
  };
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetweenISO(startISO: string, endISO: string): number {
  const start = new Date(`${startISO}T12:00:00`);
  const end = new Date(`${endISO}T12:00:00`);
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

export function ensureFirstVisit(state: PersistedState): PersistedState {
  if (state.firstVisitDate) return state;
  const next = { ...state, firstVisitDate: todayISO() };
  saveState(next);
  return next;
}

export function loadState(dayNumbers: number[]): PersistedState {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        raw = legacy;
      }
    }
    if (!raw) return createDefaultState(dayNumbers);

    const parsed = JSON.parse(raw) as PersistedState;
    const merged: PersistedState = {
      ...createDefaultState(dayNumbers),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };

    for (const day of dayNumbers) {
      if (!merged.planDays[day]) {
        merged.planDays[day] = { day, pinned: false, status: 'available' };
      } else if (merged.planDays[day].status === 'locked') {
        merged.planDays[day] = { ...merged.planDays[day], status: 'available' };
      }
      if (!merged.planOrder.includes(day)) {
        merged.planOrder.push(day);
      }
    }

    merged.planOrder = merged.planOrder.filter((d) => dayNumbers.includes(d));
    for (const day of dayNumbers) {
      if (!merged.planOrder.includes(day)) merged.planOrder.push(day);
    }

    if (!merged.firstVisitDate) {
      merged.firstVisitDate = merged.lastStudyDate ?? todayISO();
    }
    if (!merged.completionDates) {
      merged.completionDates = [];
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
