import type { DayPlan } from '../content/schema';
import { addDaysISO, daysBetweenISO, todayISO } from '../lib/storage';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

const HOME_BLOCK_COUNT = 4;
const HOME_BLOCK_SIZE = 11;
const HOME_DOTS_PER_BLOCK = HOME_BLOCK_SIZE * HOME_BLOCK_SIZE;
const HOME_TOTAL_DOTS = HOME_BLOCK_COUNT * HOME_DOTS_PER_BLOCK;

function activeMobileBlockIndex(dayIndex: number): number {
  if (dayIndex >= HOME_TOTAL_DOTS) return HOME_BLOCK_COUNT - 1;
  return Math.floor(dayIndex / HOME_DOTS_PER_BLOCK);
}

/** Calendar-day streak dots — each slot is a day since first visit; fills when a lesson was finished that day */
export function renderHomeProgressBlocks(
  firstVisitDate: string,
  completionDates: string[],
): HTMLElement {
  const completed = new Set(completionDates);
  const today = todayISO();
  const todayIndex = Math.max(0, daysBetweenISO(firstVisitDate, today));
  const mobileBlock = activeMobileBlockIndex(todayIndex);

  let dotIndex = 0;
  const wrapper = el('div', 'home-progress-blocks');

  for (let block = 0; block < HOME_BLOCK_COUNT; block++) {
    const blockClass =
      block === mobileBlock ? 'home-progress-block is-mobile-visible' : 'home-progress-block';
    const blockEl = el('div', blockClass);
    for (let i = 0; i < HOME_DOTS_PER_BLOCK; i++) {
      const dateForDot = addDaysISO(firstVisitDate, dotIndex);
      const filled = completed.has(dateForDot);
      const circle = el('span', `progress-circle${filled ? ' filled' : ''}`);
      circle.title = dateForDot;
      dotIndex += 1;
      blockEl.appendChild(circle);
    }
    wrapper.appendChild(blockEl);
  }

  return wrapper;
}

const STREAK_DOT_COUNT = 7;

/** Last 7 calendar days — N filled dots from the left, where N = days with a completed lesson in the window */
export function renderStreakProgressCircles(
  completionDates: string[],
  count = STREAK_DOT_COUNT,
): HTMLElement {
  const filledCount = streakDaysInWindow(completionDates, count);
  const wrapper = el('div', 'progress-dots');
  const rowEl = el('div', 'circle-row circle-row-days');

  for (let i = 0; i < count; i++) {
    const filled = i < filledCount;
    const circle = el('span', `progress-circle${filled ? ' filled' : ''}`);
    rowEl.appendChild(circle);
  }

  wrapper.appendChild(rowEl);
  return wrapper;
}

export function streakDaysInWindow(
  completionDates: string[],
  count = STREAK_DOT_COUNT,
): number {
  const completed = new Set(completionDates);
  const today = todayISO();
  let filled = 0;
  for (let i = 0; i < count; i++) {
    const dateForDot = addDaysISO(today, -(count - 1 - i));
    if (completed.has(dateForDot)) filled += 1;
  }
  return filled;
}

export function renderDayProgressCircles(completedDays: number[], days: DayPlan[]): HTMLElement {
  const completed = new Set(completedDays);
  const themes = new Map(days.map((d) => [d.day, d.theme]));
  const wrapper = el('div', 'progress-dots');
  const daysPerRow = 10;
  const rowCount = days.length / daysPerRow;

  for (let row = 0; row < rowCount; row++) {
    const rowEl = el('div', 'circle-row circle-row-days');
    const start = row * daysPerRow + 1;
    const end = (row + 1) * daysPerRow;
    for (let day = start; day <= end; day++) {
      const circle = el('span', `progress-circle${completed.has(day) ? ' filled' : ''}`);
      const theme = themes.get(day);
      if (theme) circle.title = theme;
      rowEl.appendChild(circle);
    }
    wrapper.appendChild(rowEl);
  }

  return wrapper;
}
