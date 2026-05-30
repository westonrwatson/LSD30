import type { DayPlan, PersistedState } from '../content/schema';
import { getPlanSections } from '../session/orchestrator';
import { saveState } from '../lib/storage';
import { renderDayProgressCircles, renderStreakProgressCircles, streakDaysInWindow } from './progress-dots';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export type PlanViewCallbacks = {
  onStartDay: (day: number) => void;
  onStateChange: (state: PersistedState) => void;
};

const PIN_STAR_OUTLINE =
  '<svg class="pin-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.8 6.3.55-4.8 4.15 1.45 6.15L12 17.2l-5.55 3.05 1.45-6.15L3.1 9.55l6.3-.55L12 3.2z" fill="none" stroke="currentColor" stroke-width="0.75" stroke-linejoin="round"></path></svg>';

const PIN_STAR_FILLED =
  '<svg class="pin-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.8 6.3.55-4.8 4.15 1.45 6.15L12 17.2l-5.55 3.05 1.45-6.15L3.1 9.55l6.3-.55L12 3.2z" fill="currentColor"></path></svg>';

const PLAN_COLLAPSED_KEY = 'povtori-plan-collapsed';

function sectionId(label: string): string {
  if (label === 'Current Lesson') return 'current';
  if (label === 'Starred') return 'starred';
  if (label === 'All Lessons') return 'all-lessons';
  if (label === 'Past Lessons') return 'past-lessons';
  if (label === 'Completed') return 'completed';
  return label.toLowerCase().replace(/\s+/g, '-');
}

function readCollapsedSections(): Record<string, boolean> {
  try {
    const raw = sessionStorage.getItem(PLAN_COLLAPSED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeCollapsedSection(id: string, collapsed: boolean): void {
  const next = { ...readCollapsedSections(), [id]: collapsed };
  sessionStorage.setItem(PLAN_COLLAPSED_KEY, JSON.stringify(next));
}

function createCollapsibleSection(
  id: string,
  label: string,
  content: HTMLElement,
  extraClass = '',
  defaultCollapsed = false,
): HTMLElement {
  const collapsed = readCollapsedSections()[id] ?? defaultCollapsed;
  const isOpen = !collapsed;
  const section = el(
    'section',
    `plan-section plan-section--collapsible${extraClass ? ` ${extraClass}` : ''}${isOpen ? ' is-open' : ''}`,
  );

  const toggle = el('button', 'plan-section-toggle');
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.appendChild(el('span', 'plan-section-label', label));
  const chevron = el('span', 'plan-section-chevron');
  chevron.setAttribute('aria-hidden', 'true');
  toggle.appendChild(chevron);
  toggle.addEventListener('click', () => {
    const open = section.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    writeCollapsedSection(id, !open);
  });

  const panel = el('div', 'plan-section-panel');
  panel.appendChild(content);
  section.appendChild(toggle);
  section.appendChild(panel);
  return section;
}

function createStaticSection(
  label: string,
  content: HTMLElement,
  extraClass = '',
): HTMLElement {
  const section = el(
    'section',
    `plan-section plan-section--static${extraClass ? ` ${extraClass}` : ''}`,
  );
  section.appendChild(el('h4', 'plan-section-label', label));
  section.appendChild(content);
  return section;
}

function orderAfterPinnedBlock(
  planOrder: number[],
  planDays: PersistedState['planDays'],
  day: number,
): number[] {
  const order = planOrder.filter((d) => d !== day);
  let insertAt = 0;
  for (let i = 0; i < order.length; i++) {
    if (planDays[order[i]!]?.pinned) {
      insertAt = i + 1;
    }
  }
  order.splice(insertAt, 0, day);
  return order;
}

function appendPlanSection(
  container: HTMLElement,
  label: string,
  dayNums: number[],
  dayMap: Map<number, DayPlan>,
  state: PersistedState,
  callbacks: PlanViewCallbacks,
  sectionsRoot: HTMLElement,
  defaultCollapsed = false,
): void {
  if (dayNums.length === 0) return;

  const list = el('ul', 'plan-list');
  for (const dayNum of dayNums) {
    const day = dayMap.get(dayNum);
    if (!day) continue;
    list.appendChild(createPlanItem(day, state, callbacks, list, sectionsRoot));
  }

  const extraClass =
    label === 'Current Lesson' ? 'plan-section--current' : '';
  if (label === 'Current Lesson') {
    container.appendChild(createStaticSection(label, list, extraClass));
  } else {
    container.appendChild(
      createCollapsibleSection(sectionId(label), label, list, extraClass, defaultCollapsed),
    );
  }
}

export function renderPlanView(
  days: DayPlan[],
  state: PersistedState,
  callbacks: PlanViewCallbacks,
): HTMLElement {
  const root = el('div', 'plan-view');

  const sectionsRoot = el('div', 'plan-sections');
  const dayMap = new Map(days.map((d) => [d.day, d]));
  const { current, starred, pool, past } = getPlanSections(state);

  const blocks: { label: string; days: number[]; defaultCollapsed?: boolean }[] = [];
  if (current != null) {
    blocks.push({ label: 'Current Lesson', days: [current] });
  }
  if (starred.length > 0) {
    blocks.push({ label: 'Starred', days: starred });
  }
  if (pool.length > 0) {
    blocks.push({ label: 'All Lessons', days: pool });
  }
  if (past.length > 0) {
    blocks.push({ label: 'Past Lessons', days: past, defaultCollapsed: true });
  }

  for (let i = 0; i < blocks.length; i++) {
    if (i > 0) {
      sectionsRoot.appendChild(el('hr', 'plan-section-divider'));
    }
    appendPlanSection(
      sectionsRoot,
      blocks[i]!.label,
      blocks[i]!.days,
      dayMap,
      state,
      callbacks,
      sectionsRoot,
      blocks[i]!.defaultCollapsed ?? false,
    );
  }

  root.appendChild(sectionsRoot);

  root.appendChild(el('hr', 'plan-section-divider'));

  const trackersRow = el('div', 'plan-trackers');

  const completedTracker = el('div', 'plan-completed-tracker');
  completedTracker.appendChild(
    el(
      'p',
      'plan-tracker-count',
      `${state.completedDays.length} / ${days.length} lessons`,
    ),
  );
  completedTracker.appendChild(renderDayProgressCircles(state.completedDays, days));
  trackersRow.appendChild(
    createStaticSection('Completed', completedTracker, 'plan-section--completed'),
  );

  const streakTracker = el('div', 'plan-streak-tracker');
  streakTracker.appendChild(
    el(
      'p',
      'plan-tracker-count',
      `${streakDaysInWindow(state.completionDates ?? [])} / 7 days`,
    ),
  );
  streakTracker.appendChild(
    renderStreakProgressCircles(state.completionDates ?? []),
  );
  trackersRow.appendChild(
    createStaticSection('Streak', streakTracker, 'plan-section--streak'),
  );

  root.appendChild(trackersRow);

  return root;
}

function createPlanItem(
  day: DayPlan,
  state: PersistedState,
  callbacks: PlanViewCallbacks,
  list: HTMLElement,
  sectionsRoot: HTMLElement,
): HTMLElement {
  const entry = state.planDays[day.day] ?? { day: day.day, pinned: false, status: 'available' };
  const item = el('li', `plan-item content-block status-${entry.status}`);
  item.draggable = true;
  item.dataset.day = String(day.day);
  let suppressClick = false;

  item.addEventListener('dragstart', (e) => {
    suppressClick = true;
    e.dataTransfer?.setData('text/plain', String(day.day));
    item.classList.add('dragging');
  });
  item.addEventListener('dragend', () => {
    item.classList.remove('dragging');
    window.setTimeout(() => {
      suppressClick = false;
    }, 0);
  });
  item.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragging = sectionsRoot.querySelector('.dragging');
    if (dragging && dragging !== item) {
      const rect = item.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        list.insertBefore(dragging, item);
      } else {
        list.insertBefore(dragging, item.nextSibling);
      }
    }
  });
  item.addEventListener('drop', () => {
    const newOrder = Array.from(sectionsRoot.querySelectorAll('.plan-item')).map((node) =>
      Number((node as HTMLElement).dataset.day),
    );
    const next = { ...state, planOrder: newOrder };
    saveState(next);
    callbacks.onStateChange(next);
  });
  item.addEventListener('click', () => {
    if (suppressClick) return;
    callbacks.onStartDay(day.day);
  });

  const row = el('div', 'plan-row');

  const pinBtn = el('button', `pin-btn${entry.pinned ? ' pinned' : ''}`);
  pinBtn.type = 'button';
  pinBtn.title = 'Star to prioritize';
  pinBtn.innerHTML = entry.pinned ? PIN_STAR_FILLED : PIN_STAR_OUTLINE;
  pinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const next = {
      ...state,
      planDays: {
        ...state.planDays,
        [day.day]: { ...entry, pinned: !entry.pinned },
      },
    };
    next.planOrder = orderAfterPinnedBlock(next.planOrder, next.planDays, day.day);
    saveState(next);
    callbacks.onStateChange(next);
  });
  row.appendChild(pinBtn);

  const label = el('div', 'plan-label');
  label.appendChild(el('span', 'plan-title', day.theme));
  label.appendChild(
    el('span', 'plan-detail', `${day.grammarFocus} · ${day.words.length} words`),
  );
  row.appendChild(label);

  const arrow = el('span', 'nav-arrow plan-item-arrow');
  arrow.setAttribute('aria-hidden', 'true');
  row.appendChild(arrow);

  item.appendChild(row);
  return item;
}
