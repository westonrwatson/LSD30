import type { DayPlan } from '../content/schema';
import { addDaysISO, daysBetweenISO, todayISO } from '../lib/storage';
import { HOME_PIXEL_BLOCK_COUNT, HOME_PIXEL_BLOCKS, homePixelFilledAtRowOffset } from './home-pixel-art';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

const HOME_BLOCK_COUNT = HOME_PIXEL_BLOCK_COUNT;
const HOME_BLOCK_SIZE = 11;
const HOME_DOTS_PER_BLOCK = HOME_BLOCK_SIZE * HOME_BLOCK_SIZE;
const HOME_TOTAL_DOTS = HOME_BLOCK_COUNT * HOME_DOTS_PER_BLOCK;

function activeMobileBlockIndex(dayIndex: number): number {
  if (dayIndex >= HOME_TOTAL_DOTS) return HOME_BLOCK_COUNT - 1;
  return Math.floor(dayIndex / HOME_DOTS_PER_BLOCK);
}

const HEART_BOB_CYCLE_MS = 2800;
const HEART_BOB_PHASE_MS = HEART_BOB_CYCLE_MS / 4;
const HEART_BOB_STAGGER_MS = 180;

function heartRowOffsetAt(timeMs: number, blockIndex: number): number {
  const phase = (timeMs + blockIndex * HEART_BOB_STAGGER_MS) % HEART_BOB_CYCLE_MS;
  if (phase < HEART_BOB_PHASE_MS) return 0;
  if (phase < HEART_BOB_PHASE_MS * 2) return -1;
  if (phase < HEART_BOB_PHASE_MS * 3) return 0;
  return 1;
}

function startHomePixelAnimation(wrapper: HTMLElement): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const blockEls = [...wrapper.querySelectorAll<HTMLElement>('.home-progress-block')];

  const tick = (now: number) => {
    if (!wrapper.isConnected) return;

    blockEls.forEach((blockEl) => {
      const blockIndex = Number(blockEl.dataset.blockIndex);
      const rowOffset = heartRowOffsetAt(now, blockIndex);
      blockEl.querySelectorAll<HTMLElement>('.progress-circle').forEach((circle) => {
        const dotIndex = Number(circle.dataset.dotIndex);
        const streakFilled = circle.dataset.streakFilled === 'true';
        const artFilled = homePixelFilledAtRowOffset(blockIndex, dotIndex, rowOffset);
        circle.classList.toggle('filled', artFilled || streakFilled);
      });
    });

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
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
    const art = HOME_PIXEL_BLOCKS[block]!;
    const blockClass =
      block === mobileBlock ? 'home-progress-block is-mobile-visible' : 'home-progress-block';
    const blockEl = el('div', blockClass);
    blockEl.setAttribute('aria-label', art.title);
    blockEl.dataset.blockIndex = String(block);
    for (let i = 0; i < HOME_DOTS_PER_BLOCK; i++) {
      const dateForDot = addDaysISO(firstVisitDate, dotIndex);
      const filled = completed.has(dateForDot);
      const artFilled = homePixelFilledAtRowOffset(block, i, 0);
      const classes = ['progress-circle'];
      if (artFilled || filled) classes.push('filled');
      const circle = el('span', classes.join(' '));
      circle.dataset.dotIndex = String(i);
      circle.dataset.streakFilled = filled ? 'true' : 'false';
      circle.title = dateForDot;
      dotIndex += 1;
      blockEl.appendChild(circle);
    }
    wrapper.appendChild(blockEl);
  }

  startHomePixelAnimation(wrapper);

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
