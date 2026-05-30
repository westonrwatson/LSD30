import type { DayPlan, PersistedState } from '../content/schema';
import { saveState } from '../lib/storage';
import { renderDayProgressCircles } from './progress-dots';

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

export function renderPlanView(
  days: DayPlan[],
  state: PersistedState,
  callbacks: PlanViewCallbacks,
): HTMLElement {
  const root = el('div', 'plan-view');

  const introBlock = el('div', 'content-block');
  introBlock.appendChild(el('h3', 'section-heading', 'Curriculum'));
  introBlock.appendChild(
    el(
      'p',
      'section-lead',
      'Drag to reorder. Pin to prioritize. Each day is ~30 minutes.',
    ),
  );
  root.appendChild(introBlock);

  const list = el('ul', 'plan-list');
  list.addEventListener('dragover', (e) => e.preventDefault());

  const dayMap = new Map(days.map((d) => [d.day, d]));

  for (const dayNum of state.planOrder) {
    const day = dayMap.get(dayNum);
    if (!day) continue;
    list.appendChild(createPlanItem(day, state, callbacks, list));
  }

  root.appendChild(list);

  const statsBlock = el('div', 'content-block plan-stats');
  const statsRow = el('div', 'plan-stats-row');
  statsRow.appendChild(
    el(
      'span',
      'plan-stats-label',
      `Completed — ${state.completedDays.length} / ${days.length}`,
    ),
  );
  statsRow.appendChild(renderDayProgressCircles(state.completedDays));
  statsBlock.appendChild(statsRow);
  root.appendChild(statsBlock);

  return root;
}

function createPlanItem(
  day: DayPlan,
  state: PersistedState,
  callbacks: PlanViewCallbacks,
  list: HTMLElement,
): HTMLElement {
  const entry = state.planDays[day.day] ?? { day: day.day, pinned: false, status: 'locked' };
  const item = el('li', `plan-item content-block status-${entry.status}`);
  item.draggable = true;
  item.dataset.day = String(day.day);

  item.addEventListener('dragstart', (e) => {
    e.dataTransfer?.setData('text/plain', String(day.day));
    item.classList.add('dragging');
  });
  item.addEventListener('dragend', () => item.classList.remove('dragging'));
  item.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragging = list.querySelector('.dragging');
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
    const newOrder = Array.from(list.querySelectorAll('.plan-item')).map((node) =>
      Number((node as HTMLElement).dataset.day),
    );
    const next = { ...state, planOrder: newOrder };
    saveState(next);
    callbacks.onStateChange(next);
  });

  const row = el('div', 'plan-row');

  const pinBtn = el('button', `pin-btn${entry.pinned ? ' pinned' : ''}`);
  pinBtn.type = 'button';
  pinBtn.title = 'Pin priority';
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
    if (!entry.pinned) {
      const order = [...next.planOrder.filter((d) => d !== day.day)];
      order.unshift(day.day);
      next.planOrder = order;
    }
    saveState(next);
    callbacks.onStateChange(next);
  });
  row.appendChild(pinBtn);

  const label = el('div', 'plan-label');
  const dayNum = String(day.day).padStart(2, '0');
  label.appendChild(el('span', 'plan-title', `${dayNum} — ${day.theme}`));
  label.appendChild(
    el('span', 'plan-detail', `${day.grammarFocus} · ${day.words.length} words`),
  );
  row.appendChild(label);

  if (entry.status === 'available' || entry.status === 'in_progress' || entry.status === 'completed') {
    const startBtn = el(
      'button',
      'btn-outline',
      entry.status === 'completed' ? 'Review' : 'Start',
    );
    startBtn.type = 'button';
    startBtn.addEventListener('click', () => callbacks.onStartDay(day.day));
    row.appendChild(startBtn);
  } else {
    row.appendChild(el('span', 'row-muted', 'Locked'));
  }

  item.appendChild(row);
  return item;
}
