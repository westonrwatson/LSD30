import type { DayPlan, PersistedState, SessionBlock } from '../content/schema';
import { SESSION_BLOCKS, SESSION_DURATION_SECONDS } from '../content/schema';
import { SessionTimer } from '../session/timer';
import {
  buildSessionQueue,
  completeDay,
  createEmptyStats,
  updateSRSAfterAnswer,
  type QueuedExercise,
} from '../session/orchestrator';
import { saveState } from '../lib/storage';
import { renderExercise, blockLabel, type CompletedExerciseState, type ExerciseResult } from './exercise-engine';
import { renderHomeProgressBlocks } from './progress-dots';

const PLAY_RING_LENGTH = 261;

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

export type StudyViewCallbacks = {
  onComplete: (state: PersistedState) => void;
  onExit: (state: PersistedState) => void;
};

export function renderStudyView(
  dayPlan: DayPlan,
  state: PersistedState,
  _allWords: Map<string, import('../content/schema').Word>,
  callbacks: StudyViewCallbacks,
): HTMLElement {
  let currentState = { ...state };
  const stats = createEmptyStats();
  const baseQueue = buildSessionQueue(dayPlan);
  const sectionStarts = new Map<SessionBlock, number>();
  for (let i = 0; i < baseQueue.length; i++) {
    const block = baseQueue[i]!.block;
    if (!sectionStarts.has(block)) sectionStarts.set(block, i);
  }
  const listeningStartIndex = sectionStarts.get('listening') ?? baseQueue.length;
  const picturesStartIndex = sectionStarts.get('pictures') ?? baseQueue.length;
  const baseListeningCount = baseQueue.filter((q) => q.block === 'listening').length;

  function indexForListeningProgress(progress: number): number {
    if (baseListeningCount === 0) return 0;
    const offset = Math.min(
      Math.floor(progress * baseListeningCount),
      Math.max(0, baseListeningCount - 1),
    );
    let count = 0;
    for (let i = 0; i < baseQueue.length; i++) {
      if (baseQueue[i]!.block === 'listening') {
        if (count === offset) return i;
        count += 1;
      }
    }
    return listeningStartIndex;
  }

  function savedListeningProgress(atIndex: number): number {
    if (baseListeningCount === 0) return 1;
    let completed = 0;
    for (let i = listeningStartIndex; i < atIndex && i < baseQueue.length; i++) {
      if (baseQueue[i]!.block === 'listening') completed += 1;
    }
    return Math.min(completed / baseListeningCount, 1);
  }

  function listeningStepMetrics(atIndex: number) {
    let current = 0;
    for (let i = listeningStartIndex; i <= atIndex && i < queue.length; i++) {
      if (queue[i]?.block === 'listening') current += 1;
    }
    const total = queue.filter((q) => q.block === 'listening').length;
    return {
      current,
      total,
      progress: total > 0 ? current / total : 0,
    };
  }

  let queue: QueuedExercise[] = [...baseQueue];
  const pendingRetries = new Map<string, QueuedExercise>();
  const wrongCounts = new Map<string, number>();
  const completedListening = new Map<number, CompletedExerciseState>();
  const entry = currentState.planDays[dayPlan.day];
  let index =
    entry?.status === 'in_progress' && entry.progress != null && entry.progress > 0
      ? indexForListeningProgress(entry.progress)
      : 0;
  let listeningBookmark =
    index >= listeningStartIndex ? index : listeningStartIndex;
  let picturesBookmark =
    index >= picturesStartIndex ? index : picturesStartIndex;
  let pictureCompleted = 0;
  let pictureCorrect = 0;
  let timer: SessionTimer | null = null;

  const root = el('div', 'study-view');

  const chrome = el('div', 'study-chrome');

  const statusBar = el('div', 'status-bar study-status-bar');
  const dayNum = String(dayPlan.day).padStart(2, '0');

  const exitBtn = el('button', 'study-exit-btn');
  exitBtn.type = 'button';
  exitBtn.setAttribute('aria-label', 'Exit session');
  exitBtn.innerHTML =
    '<span class="study-exit-label">Back</span><span class="nav-arrow nav-arrow-back" aria-hidden="true"></span>';
  exitBtn.addEventListener('click', () => {
    timer?.stop();
    const progress = savedListeningProgress(index);
    currentState = {
      ...currentState,
      currentDay: dayPlan.day,
      planDays: {
        ...currentState.planDays,
        [dayPlan.day]: {
          ...currentState.planDays[dayPlan.day],
          status: 'in_progress',
          progress,
        },
      },
    };
    saveState(currentState);
    callbacks.onExit(currentState);
  });
  statusBar.appendChild(exitBtn);

  const timerEl = el('span', 'timer', '30:00');
  statusBar.appendChild(timerEl);

  const sessionMeta = el('div', 'study-session-meta');
  sessionMeta.appendChild(el('span', 'study-session-day', `Day ${dayNum}`));

  const sectionSelect = document.createElement('select');
  sectionSelect.className = 'study-section-select';
  sectionSelect.setAttribute('aria-label', 'Jump to section');
  for (const block of SESSION_BLOCKS) {
    const option = document.createElement('option');
    option.value = block.id;
    option.textContent = block.label;
    sectionSelect.appendChild(option);
  }
  sectionSelect.addEventListener('change', () => {
    const block = sectionSelect.value as SessionBlock;
    const currentBlock = queue[index]?.block;

    if (currentBlock === 'listening') {
      listeningBookmark = index;
    }
    if (currentBlock === 'pictures') {
      picturesBookmark = index;
    }

    if (block === 'listening') {
      if (currentBlock === 'listening') return;
      index = listeningBookmark;
      showExercise();
      return;
    }

    if (block === 'pictures') {
      if (currentBlock === 'pictures') return;
      index = picturesBookmark;
      showExercise();
      return;
    }

    const targetIndex = sectionStarts.get(block);
    if (targetIndex == null || (currentBlock === block && index === targetIndex)) return;
    index = targetIndex;
    showExercise();
  });
  sessionMeta.appendChild(sectionSelect);
  statusBar.appendChild(sessionMeta);
  chrome.appendChild(statusBar);

  const progressRow = el('div', 'progress-row study-progress-row');
  const progressEl = el('div', 'progress-bar');
  const progressFill = el('div', 'progress-fill');
  progressEl.appendChild(progressFill);
  const counterEl = el('span', 'progress-label', '');
  progressRow.appendChild(progressEl);
  progressRow.appendChild(counterEl);
  chrome.appendChild(progressRow);
  root.appendChild(chrome);

  const exerciseHost = el('div', 'study-body exercise-host');
  root.appendChild(exerciseHost);

  function updateProgress() {
    const item = queue[Math.min(index, Math.max(0, queue.length - 1))];
    const inListening = item?.block === 'listening';

    progressRow.classList.toggle('study-progress-row--idle', !inListening);

    if (inListening) {
      const { current, total, progress } = listeningStepMetrics(index);
      progressFill.style.width = `${progress * 100}%`;
      counterEl.textContent = `${current} / ${total}`;
    } else {
      progressFill.style.width = '0%';
      counterEl.textContent = '';
    }

    if (item?.block) sectionSelect.value = item.block;
  }

  function appendRetries() {
    const retries = Array.from(pendingRetries.values()).map((item) => ({
      ...item,
      isRetry: true,
    }));
    queue.push(...retries);
  }

  function handleListeningAnswer(item: QueuedExercise, result: ExerciseResult) {
    const id = item.exercise.id;
    stats.exercisesCompleted += 1;

    if (result.skipped) {
      pendingRetries.delete(id);
      return;
    }

    if (result.correct) {
      stats.exercisesCorrect += 1;
      pendingRetries.delete(id);
      return;
    }

    wrongCounts.set(id, (wrongCounts.get(id) ?? 0) + 1);
    pendingRetries.set(id, item);
  }

  function finishOrRetry() {
    if (pendingRetries.size > 0) {
      appendRetries();
      showExercise();
      return;
    }
    showSummary();
  }

  function advanceStep(result: ExerciseResult) {
    const item = queue[index] as QueuedExercise | undefined;
    const type = item?.exercise.type;

    if (type === 'wordOrder') {
      completedListening.set(index, {
        correct: result.correct,
        skipped: result.skipped,
        userAnswer: result.userAnswer,
      });
      handleListeningAnswer(item!, result);
      if (item!.exercise.wordId) {
        currentState = updateSRSAfterAnswer(
          currentState,
          item!.exercise.wordId,
          result.correct && !result.skipped,
        );
      }
    } else if (item?.exercise.wordId) {
      currentState = updateSRSAfterAnswer(
        currentState,
        item.exercise.wordId,
        result.correct,
      );
    }

    if (type === 'pictureMatch') {
      pictureCompleted += 1;
      if (result.correct) pictureCorrect += 1;
    }

    if (type === 'wordOrder' && result.correct) {
      progressRow.classList.add('study-progress-row--success');
      window.setTimeout(() => progressRow.classList.remove('study-progress-row--success'), 450);
    }

    if (type === 'pictureMatch' && result.correct) {
      progressRow.classList.add('study-progress-row--success');
      window.setTimeout(() => progressRow.classList.remove('study-progress-row--success'), 450);
    }

    index += 1;

    if (queue[index]?.block === 'listening') {
      listeningBookmark = index;
    }
    if (queue[index]?.block === 'pictures') {
      picturesBookmark = index;
    }

    if (index >= queue.length) {
      finishOrRetry();
      return;
    }

    if (type === 'wordOrder') {
      showExercise();
      return;
    }

    if (type === 'pictureMatch') {
      showExercise();
      return;
    }

    window.setTimeout(() => {
      showExercise();
    }, 350);
  }

  function showSummary() {
    timer?.stop();
    exerciseHost.innerHTML = '';
    exerciseHost.appendChild(el('div', 'study-summary'));
    const summary = exerciseHost.querySelector('.study-summary')!;
    summary.appendChild(el('h3', 'section-heading study-summary-heading', 'Session complete'));
    summary.appendChild(
      el('p', 'summary-line', `Listening — ${stats.exercisesCorrect} / ${stats.exercisesCompleted}`),
    );
    if (pictureCompleted > 0) {
      summary.appendChild(
        el('p', 'summary-line', `Pictures — ${pictureCorrect} / ${pictureCompleted}`),
      );
    }
    summary.appendChild(el('p', 'summary-line', `New words — ${dayPlan.words.length}`));
    summary.appendChild(el('p', 'summary-line', `Streak — ${currentState.streak} days`));

    const wordIds = dayPlan.words.map((w) => w.id);
    currentState = completeDay(currentState, dayPlan.day, wordIds);
    stats.newWords = dayPlan.words.length;

    const doneBtn = el('button', 'btn-outline prominent study-done-btn', 'Back to study');
    doneBtn.type = 'button';
    doneBtn.addEventListener('click', () => callbacks.onComplete(currentState));
    summary.appendChild(doneBtn);
  }

  function advanceWithoutRecording() {
    index += 1;

    if (queue[index]?.block === 'listening') {
      listeningBookmark = index;
    }
    if (queue[index]?.block === 'pictures') {
      picturesBookmark = index;
    }

    if (index >= queue.length) {
      finishOrRetry();
      return;
    }

    showExercise();
  }

  function redoListeningQuestion() {
    const item = queue[index];
    if (!item || item.block !== 'listening') return;

    const previous = completedListening.get(index);
    if (previous) {
      stats.exercisesCompleted = Math.max(0, stats.exercisesCompleted - 1);
      if (previous.correct) {
        stats.exercisesCorrect = Math.max(0, stats.exercisesCorrect - 1);
      }
      pendingRetries.delete(item.exercise.id);
      if (!previous.correct && !previous.skipped) {
        wrongCounts.delete(item.exercise.id);
      }
      completedListening.delete(index);
    }

    showExercise();
  }

  function goBackListening() {
    if (index <= listeningStartIndex) return;
    index -= 1;
    listeningBookmark = index;
    showExercise();
  }

  function goBackPictures() {
    if (index <= picturesStartIndex) return;
    index -= 1;
    picturesBookmark = index;
    showExercise();
  }

  function goBackStep() {
    const block = queue[index]?.block;
    if (block === 'listening') goBackListening();
    else if (block === 'pictures') goBackPictures();
  }

  function showExercise() {
    if (index >= queue.length) {
      finishOrRetry();
      return;
    }

    const item = queue[index] as QueuedExercise;
    updateProgress();

    exerciseHost.innerHTML = '';

    if (item.isRetry) {
      exerciseHost.appendChild(el('p', 'review-badge', 'Retry'));
    }

    const exEl = renderExercise(
      item.exercise,
      {
        onSubmit: (result) => {
          advanceStep(result);
        },
        onBack: goBackStep,
        onContinue: advanceWithoutRecording,
        onRedo: redoListeningQuestion,
      },
      {
        transliteration: currentState.settings.transliteration,
        wordAudio: item.word?.audio,
        word: item.word,
        words: item.words,
        phaseLabel: blockLabel(item.block),
        wrongAttempts: wrongCounts.get(item.exercise.id) ?? 0,
        isRetry: item.isRetry,
        canGoBack:
          (item.block === 'listening' && index > listeningStartIndex) ||
          (item.block === 'pictures' && index > picturesStartIndex),
        completedState: item.isRetry ? undefined : completedListening.get(index),
      },
    );

    exerciseHost.appendChild(exEl);
  }

  timer = new SessionTimer(
    SESSION_DURATION_SECONDS,
    (remaining) => {
      timerEl.textContent = timer!.format(remaining);
    },
    () => {
      showSummary();
    },
  );
  timer.start();
  showExercise();

  return root;
}

function homeDayStatus(day: number, status: string, progress = 0): string {
  if (status === 'completed') return `Day ${day}`;
  if (status === 'in_progress') {
    const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
    if (pct === 0) return `Day ${day} — Now Live`;
    return `Day ${day} — ${pct}%`;
  }
  return `Day ${day} — Now Live`;
}

export function renderHome(
  nextDay: DayPlan | null,
  state: PersistedState,
  onStart: () => void,
): HTMLElement {
  const root = el('div', 'home-view');

  const hero = el('section', 'home-hero');

  if (nextDay) {
    const playBtn = el('button', 'home-play-btn');
    playBtn.type = 'button';
    playBtn.setAttribute('aria-label', 'Start lesson');
    playBtn.innerHTML =
      '<svg class="home-play-svg" viewBox="0 0 88 88" aria-hidden="true">' +
      '<circle class="home-play-ring-base" cx="44" cy="44" r="41.5"></circle>' +
      '<circle class="home-play-ring-progress" cx="44" cy="44" r="41.5" transform="rotate(-90 44 44)"></circle>' +
      '<circle class="home-play-ring-draw" cx="44" cy="44" r="41.5" transform="rotate(-90 44 44)"></circle>' +
      '</svg>' +
      '<svg class="home-play-icon" viewBox="0 0 24 24" aria-hidden="true">' +
      '<polygon class="home-play-triangle" points="9,6 18,12 9,18"></polygon>' +
      '</svg>';
    playBtn.addEventListener('click', onStart);
    hero.appendChild(playBtn);

    const heroMeta = el('div', 'home-hero-meta');
    const entry = state.planDays[nextDay.day];
    const status = entry?.status ?? 'available';
    const lessonProgress =
      status === 'in_progress'
        ? Math.max(0, Math.min(1, entry?.progress ?? 0))
        : 0;

    const progressRing = playBtn.querySelector('.home-play-ring-progress') as SVGCircleElement | null;
    if (progressRing) {
      progressRing.style.strokeDasharray = `${PLAY_RING_LENGTH}`;
      progressRing.style.strokeDashoffset = `${PLAY_RING_LENGTH * (1 - lessonProgress)}`;
    }
    if (lessonProgress > 0) {
      playBtn.classList.add('home-play-btn--resume');
    }

    heroMeta.appendChild(
      el(
        'p',
        'home-hero-status',
        homeDayStatus(nextDay.day, status, lessonProgress),
      ),
    );
    heroMeta.appendChild(el('h1', 'home-hero-title', nextDay.theme));
    const detail = el('div', 'home-hero-detail');
    detail.appendChild(el('span', 'home-hero-category', '~30 min'));
    detail.appendChild(el('span', 'home-hero-grammar', nextDay.grammarFocus));
    heroMeta.appendChild(detail);
    hero.appendChild(heroMeta);
  } else {
    const heroMeta = el('div', 'home-hero-meta home-hero-meta-complete');
    heroMeta.appendChild(el('p', 'home-hero-status', 'All 30 days — Complete'));
    heroMeta.appendChild(el('h1', 'home-hero-title', 'Curriculum finished'));
    heroMeta.appendChild(
      el(
        'p',
        'home-hero-complete-lead',
        'Pick any day from Plan to review.',
      ),
    );
    hero.appendChild(heroMeta);
  }

  const fold = el('section', 'home-fold');
  const foldContent = el('div', 'home-fold-content');

  foldContent.appendChild(hero);

  const progressSection = el('section', 'home-progress');
  progressSection.appendChild(
    renderHomeProgressBlocks(state.completedDays.length, state.planOrder.length),
  );
  foldContent.appendChild(progressSection);

  fold.appendChild(foldContent);
  fold.appendChild(el('hr', 'home-divider home-fold-divider'));
  root.appendChild(fold);

  const aboutSection = el('section', 'home-about');

  const aboutSquares = el('div', 'home-about-squares');
  for (let i = 0; i < 4; i++) {
    aboutSquares.appendChild(el('span', 'home-square'));
  }
  aboutSection.appendChild(aboutSquares);

  const aboutText = el('div', 'home-about-text');
  const aboutChunks = [
    'Most language apps are built around intensity — streaks, XP, and the pressure to do more every day. LSD30 takes a different approach. It is designed for a single, repeatable session you can show up to without negotiating with yourself first.',
    'Thirty minutes is the whole point. It is long enough to move past warm-up, encounter new vocabulary, and actually use what you learned — but short enough that life does not have to stop. You can fit it between work, dinner, or a walk, and still feel like you made real progress.',
    'Language sticks when you return to it regularly, not when you cram and disappear for a week. Small daily exposure beats heroic sessions every time. That is the habit this site is built around — slow, steady, and meant to last past day thirty.',
  ];
  for (const copy of aboutChunks) {
    aboutText.appendChild(el('p', 'home-about-copy', copy));
  }
  aboutSection.appendChild(aboutText);

  root.appendChild(aboutSection);

  return root;
}
