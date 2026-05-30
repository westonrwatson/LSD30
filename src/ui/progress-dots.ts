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

function activeMobileBlockIndex(filledCount: number): number {
  if (filledCount >= HOME_TOTAL_DOTS) return HOME_BLOCK_COUNT - 1;
  return Math.floor(filledCount / HOME_DOTS_PER_BLOCK);
}

export function renderHomeProgressBlocks(completedCount: number, totalDays = 30): HTMLElement {
  const filledCount =
    totalDays > 0 ? Math.round((completedCount / totalDays) * HOME_TOTAL_DOTS) : 0;
  const mobileBlock = activeMobileBlockIndex(filledCount);

  let dotIndex = 0;
  const wrapper = el('div', 'home-progress-blocks');

  for (let block = 0; block < HOME_BLOCK_COUNT; block++) {
    const blockClass =
      block === mobileBlock ? 'home-progress-block is-mobile-visible' : 'home-progress-block';
    const blockEl = el('div', blockClass);
    for (let i = 0; i < HOME_DOTS_PER_BLOCK; i++) {
      const circle = el('span', `progress-circle${dotIndex < filledCount ? ' filled' : ''}`);
      dotIndex += 1;
      blockEl.appendChild(circle);
    }
    wrapper.appendChild(blockEl);
  }

  return wrapper;
}

export function renderDayProgressCircles(completedDays: number[], totalDays = 30): HTMLElement {
  const completed = new Set(completedDays);
  const wrapper = el('div', 'progress-dots');
  const daysPerRow = 10;
  const rowCount = totalDays / daysPerRow;

  for (let row = 0; row < rowCount; row++) {
    const rowEl = el('div', 'circle-row circle-row-days');
    const start = row * daysPerRow + 1;
    const end = (row + 1) * daysPerRow;
    for (let day = start; day <= end; day++) {
      const circle = el('span', `progress-circle${completed.has(day) ? ' filled' : ''}`);
      circle.title = `Day ${day}`;
      rowEl.appendChild(circle);
    }
    wrapper.appendChild(rowEl);
  }

  return wrapper;
}
