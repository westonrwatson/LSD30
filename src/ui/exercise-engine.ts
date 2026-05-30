import type { Exercise, Word, WordOrderDirection } from '../content/schema';
import { playAudio, unlockAudioPlayback } from '../audio/player';
import {
  pickCorrectPhrase,
  playCorrectChime,
  showAnswerFeedback,
  CORRECT_AUTO_ADVANCE_MS,
  type AnswerFeedbackHandle,
} from '../lib/correct-feedback';
import { tokensMatch } from '../lib/tokenize';

export type ExerciseResult = {
  correct: boolean;
  userAnswer?: string;
  skipped?: boolean;
};

export type ExerciseCallbacks = {
  onSubmit: (result: ExerciseResult) => void;
  onSkip?: () => void;
  onBack?: () => void;
  onContinue?: () => void;
  onRedo?: () => void;
};

export type CompletedExerciseState = {
  correct: boolean;
  skipped?: boolean;
  userAnswer?: string;
};

export type ExerciseRenderOptions = {
  transliteration: boolean;
  wordAudio?: string;
  word?: Word;
  words?: Word[];
  phaseLabel?: string;
  /** Prior wrong attempts on this listening question (0 = first try). */
  wrongAttempts?: number;
  isRetry?: boolean;
  canGoBack?: boolean;
  completedState?: CompletedExerciseState;
};

const AUDIO_ICON =
  '<svg class="lesson-audio-icon" viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M4 9v6h4l5 5V4L8 9H4z" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"></path>' +
  '<path d="M16 8.82a4 4 0 010 6.36" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"></path>' +
  '</svg>';

const REDO_ICON =
  '<svg class="lesson-redo-icon" viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M1 4v6h6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>' +
  '<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>' +
  '</svg>';

const WORD_ORDER_CHIP_ANIM_MS = 350;
const WORD_ORDER_CHIP_STAGGER_MS = 50;
const WORD_ORDER_CHIP_START_MS = 40;
const SUCCESS_CONTENT_FADE_MS = 320;

function wordOrderHighlightDelayMs(chipCount: number): number {
  if (chipCount <= 0) return WORD_ORDER_CHIP_ANIM_MS;
  const lastChipStart =
    WORD_ORDER_CHIP_START_MS + (chipCount - 1) * WORD_ORDER_CHIP_STAGGER_MS;
  return lastChipStart + WORD_ORDER_CHIP_ANIM_MS + 120;
}

function successRevealTimings(chipCount: number): { highlightMs: number; fadeMs: number } {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { highlightMs: 0, fadeMs: 0 };
  }
  return {
    highlightMs: wordOrderHighlightDelayMs(chipCount),
    fadeMs: SUCCESS_CONTENT_FADE_MS,
  };
}

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

function lessonShell(
  phaseLabel: string,
  prompt: string,
  modifier?: string,
): { root: HTMLElement; body: HTMLElement; footer: HTMLElement } {
  const root = el('div', `exercise lesson-step${modifier ? ` ${modifier}` : ''}`);
  const header = el('header', 'lesson-step-header');
  header.appendChild(el('p', 'lesson-step-label', phaseLabel));
  header.appendChild(el('p', 'lesson-step-prompt', prompt));
  root.appendChild(header);

  const body = el('div', 'lesson-step-body');
  root.appendChild(body);

  const footer = el('footer', 'lesson-step-footer');
  root.appendChild(footer);

  return { root, body, footer };
}

function createPrimaryButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = el('button', 'btn-outline prominent block lesson-primary-btn', label);
  btn.type = 'button';
  btn.addEventListener('click', onClick);
  return btn;
}

function createAudioButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = el('button', 'lesson-audio-btn');
  btn.type = 'button';
  btn.innerHTML = `${AUDIO_ICON}<span>${label}</span>`;
  btn.addEventListener('click', onClick);
  return btn;
}

function createSecondaryButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = el('button', 'lesson-secondary-btn', label);
  btn.type = 'button';
  btn.addEventListener('click', onClick);
  return btn;
}

function createFlipCard(word: Word, compact = false): HTMLButtonElement {
  const card = el('button', compact ? 'flashcard flashcard-compact' : 'flashcard');
  card.type = 'button';
  card.setAttribute('aria-label', `Flip card for ${word.ru}`);

  const inner = el('div', 'flashcard-inner');
  const front = el('div', 'flashcard-face flashcard-front', word.ru);
  const back = el('div', 'flashcard-face flashcard-back', word.en);
  inner.appendChild(front);
  inner.appendChild(back);
  card.appendChild(inner);

  card.addEventListener('click', () => {
    card.classList.toggle('is-flipped');
  });

  return card;
}

function createModeToggle(
  options: { id: string; label: string }[],
  onChange: (id: string) => void,
): { el: HTMLElement; setActive: (id: string) => void } {
  const wrap = el('div', 'flashcard-mode');
  const buttons: HTMLButtonElement[] = [];

  for (const opt of options) {
    const btn = el('button', 'flashcard-mode-btn', opt.label);
    btn.type = 'button';
    btn.addEventListener('click', () => onChange(opt.id));
    wrap.appendChild(btn);
    buttons.push(btn);
  }

  return {
    el: wrap,
    setActive(id: string) {
      buttons.forEach((btn, i) => {
        btn.classList.toggle('is-active', options[i]!.id === id);
      });
    },
  };
}

function createIconAudioButton(onClick: () => void, label = 'Play'): HTMLButtonElement {
  const btn = el('button', 'lesson-icon-audio-btn');
  btn.type = 'button';
  btn.setAttribute('aria-label', label);
  btn.innerHTML = AUDIO_ICON;
  btn.addEventListener('click', onClick);
  return btn;
}

export function renderExercise(
  exercise: Exercise,
  callbacks: ExerciseCallbacks,
  options: ExerciseRenderOptions,
): HTMLElement {
  if (exercise.type === 'wordTable') {
    return renderWordTable(exercise, callbacks, options);
  }
  if (exercise.type === 'flashcardDeck') {
    return renderFlashcardDeck(exercise, callbacks, options);
  }
  if (exercise.type === 'wordOrder') {
    return renderWordOrder(exercise, callbacks, options);
  }
  if (exercise.type === 'pictureMatch') {
    return renderPictureMatch(exercise, callbacks, options);
  }

  const { root, body } = lessonShell(options.phaseLabel ?? 'Lesson', exercise.prompt);
  body.appendChild(el('p', 'lesson-error', 'This exercise type is not available.'));
  return root;
}

function renderWordTable(
  exercise: Extract<Exercise, { type: 'wordTable' }>,
  callbacks: ExerciseCallbacks,
  options: ExerciseRenderOptions,
): HTMLElement {
  const words = options.words ?? [];
  const { root, body, footer } = lessonShell(
    options.phaseLabel ?? 'Vocabulary',
    exercise.prompt,
    'lesson-step--vocab',
  );

  const list = el('ul', 'word-list');
  for (const word of words) {
    const item = el('li', 'word-list-item');
    const text = el('div', 'word-list-text');
    text.appendChild(el('span', 'word-list-ru', word.ru));
    text.appendChild(el('span', 'word-list-en', word.en));
    item.appendChild(text);
    item.appendChild(createIconAudioButton(() => playAudio(word.audio, word.ru), `Play ${word.ru}`));
    list.appendChild(item);
  }
  body.appendChild(list);

  footer.appendChild(
    createPrimaryButton('Continue', () => {
      callbacks.onSubmit({ correct: true });
    }),
  );

  return root;
}

function renderFlashcardDeck(
  exercise: Extract<Exercise, { type: 'flashcardDeck' }>,
  callbacks: ExerciseCallbacks,
  options: ExerciseRenderOptions,
): HTMLElement {
  const words = options.words ?? [];
  let index = 0;

  const { root, body, footer } = lessonShell(
    options.phaseLabel ?? 'Flashcards',
    exercise.prompt,
    'lesson-step--flashcards',
  );

  const modeToggle = createModeToggle(
    [
      { id: 'all', label: 'View all' },
      { id: 'step', label: 'Step through' },
    ],
    (id) => setMode(id as 'step' | 'all'),
  );
  body.appendChild(modeToggle.el);

  const stepView = el('div', 'flashcard-step-view');
  const counter = el('p', 'flashcard-counter', '');
  stepView.appendChild(counter);

  const card = createFlipCard(
    words[0] ?? { id: 'empty', ru: '—', en: '—', audio: '', sentences: [] },
  );
  stepView.appendChild(card);

  stepView.appendChild(el('p', 'flashcard-hint', 'Tap card to flip'));

  const controls = el('div', 'flashcard-controls');
  const audioBtn = createAudioButton('Play word', () => {
    const word = words[index];
    if (word) playAudio(word.audio, word.ru);
  });
  controls.appendChild(audioBtn);
  stepView.appendChild(controls);
  body.appendChild(stepView);

  const allView = el('div', 'flashcard-all-view hidden');
  const grid = el('div', 'flashcard-grid');
  for (const word of words) {
    const item = el('div', 'flashcard-grid-item');
    item.appendChild(createFlipCard(word, true));
    item.appendChild(
      createIconAudioButton(() => playAudio(word.audio, word.ru), `Play ${word.ru}`),
    );
    grid.appendChild(item);
  }
  allView.appendChild(grid);
  body.appendChild(allView);

  const nextBtn = createPrimaryButton('Next card', () => advanceCard());

  const linkRow = el('div', 'flashcard-link-row');
  const nextSectionBtn = createSecondaryButton('Next Section', () => {
    callbacks.onSubmit({ correct: true });
  });
  linkRow.appendChild(nextSectionBtn);

  const continueBtn = createPrimaryButton('Continue', () => {
    callbacks.onSubmit({ correct: true });
  });
  continueBtn.classList.add('hidden');

  footer.appendChild(nextBtn);
  footer.appendChild(linkRow);
  footer.appendChild(continueBtn);

  function renderCard() {
    const word = words[index];
    if (!word) return;

    card.classList.remove('is-flipped');
    counter.textContent = `${index + 1} of ${words.length}`;
    card.querySelector('.flashcard-front')!.textContent = word.ru;
    card.querySelector('.flashcard-back')!.textContent = word.en;
    card.setAttribute('aria-label', `Flip card for ${word.ru}`);
    nextBtn.textContent = index >= words.length - 1 ? 'Continue' : 'Next card';
  }

  function advanceCard() {
    if (index < words.length - 1) {
      index += 1;
      renderCard();
      return;
    }
    callbacks.onSubmit({ correct: true });
  }

  function setMode(next: 'step' | 'all') {
    modeToggle.setActive(next);
    root.classList.toggle('lesson-step--flashcards-all', next === 'all');
    stepView.classList.toggle('hidden', next !== 'step');
    allView.classList.toggle('hidden', next !== 'all');
    nextBtn.classList.toggle('hidden', next !== 'step');
    linkRow.classList.toggle('hidden', next !== 'step');
    continueBtn.classList.toggle('hidden', next !== 'all');
    if (next === 'step') renderCard();
  }

  renderCard();
  setMode('all');
  return root;
}

function renderPictureMatch(
  exercise: Extract<Exercise, { type: 'pictureMatch' }>,
  callbacks: ExerciseCallbacks,
  options: ExerciseRenderOptions,
): HTMLElement {
  const word = options.word;
  const { root, body, footer } = lessonShell(
    options.phaseLabel ?? 'Pictures',
    exercise.prompt,
    'lesson-step--pictures lesson-step--picture-match',
  );

  const layout = el('div', 'picture-match-layout');

  const visual = el('div', 'picture-match-visual');
  const frame = el('div', 'picture-match-frame');
  const img = document.createElement('img');
  img.className = 'picture-match-img';
  img.src = exercise.image;
  img.alt = word ? `Picture for ${word.en}` : '';
  img.loading = 'eager';
  frame.appendChild(img);
  visual.appendChild(frame);

  if (word?.imageCredit) {
    visual.appendChild(el('p', 'picture-match-credit', word.imageCredit));
  }
  layout.appendChild(visual);

  const panel = el('div', 'picture-match-panel');

  const optionsGrid = el('div', 'picture-options');
  panel.appendChild(optionsGrid);

  layout.appendChild(panel);
  body.appendChild(layout);

  const actionsRow = el('div', 'lesson-footer-actions');
  if (options.canGoBack) {
    const backBtn = el('button', 'btn-outline lesson-back-btn', 'Back');
    backBtn.type = 'button';
    backBtn.addEventListener('click', () => {
      dismissFeedback(true);
      callbacks.onBack?.();
    });
    actionsRow.appendChild(backBtn);
  }
  footer.appendChild(actionsRow);

  let checked = false;
  let lastAnswer = '';
  let feedbackOverlay: AnswerFeedbackHandle | null = null;

  function dismissFeedback(immediate = false) {
    feedbackOverlay?.dismiss(immediate);
    feedbackOverlay = null;
  }

  function pickOption(label: string, btn: HTMLButtonElement) {
    if (checked) return;
    checked = true;
    lastAnswer = label;
    const correct = label === exercise.options[exercise.correctIndex];

    Array.from(optionsGrid.querySelectorAll('.picture-option')).forEach((option) => {
      (option as HTMLButtonElement).disabled = true;
    });

    if (correct) {
      btn.classList.add('is-correct');
      optionsGrid.classList.add('is-resolved');
      root.classList.add('lesson-step--correct');
      playCorrectChime();
      feedbackOverlay = showAnswerFeedback(root, {
        variant: 'correct',
        headline: pickCorrectPhrase(),
        autoAdvanceMs: CORRECT_AUTO_ADVANCE_MS,
        onAutoAdvance: () => {
          feedbackOverlay = null;
          callbacks.onSubmit({ correct: true, userAnswer: label });
        },
      });
      return;
    }

    btn.classList.add('is-incorrect');
    optionsGrid.classList.add('is-resolved');
    root.classList.add('lesson-step--incorrect');
    feedbackOverlay = showAnswerFeedback(root, {
      variant: 'incorrect',
      headline: 'Not quite',
      detailLabel: 'Correct word',
      detailPrimary: word?.ru,
      detailSecondary: word?.en,
      playLabel: 'Play word',
      onPlayAudio: word
        ? () => {
            playAudio(word.audio, word.ru);
          }
        : undefined,
      primaryAction: {
        label: 'Next',
        onClick: () => {
          dismissFeedback(true);
          callbacks.onSubmit({ correct: false, userAnswer: lastAnswer });
        },
      },
    });
  }

  for (const label of exercise.options) {
    const btn = el('button', 'picture-option', label);
    btn.type = 'button';
    btn.addEventListener('click', () => pickOption(label, btn));
    optionsGrid.appendChild(btn);
  }

  return root;
}

function wordOrderPrompt(direction: WordOrderDirection | undefined, isRetry: boolean): string {
  if (isRetry) {
    if (direction === 'ru-to-en') return 'Try again — listen in Russian, tap English in order';
    if (direction === 'en-to-ru') return 'Try again — read the phrase, tap Russian in order';
    return 'Try again — listen and tap words in order';
  }
  if (direction === 'ru-to-en') return 'Listen in Russian, then tap the English words in order';
  if (direction === 'en-to-ru') return 'Read the phrase, then tap the Russian words in order';
  return 'Listen, then tap words in order';
}

function renderWordOrder(
  exercise: Extract<Exercise, { type: 'wordOrder' }>,
  callbacks: ExerciseCallbacks,
  options: ExerciseRenderOptions,
): HTMLElement {
  const direction = exercise.direction;
  const { root, body, footer } = lessonShell(
    options.phaseLabel ?? 'Listening',
    wordOrderPrompt(direction, options.isRetry ?? false),
    'lesson-step--listening',
  );

  const playPhrase = () => {
    unlockAudioPlayback();
    if (direction === 'en-to-ru') return;
    void playAudio(exercise.audio ?? options.wordAudio ?? '', exercise.sentence);
  };

  if (direction === 'en-to-ru') {
    body.appendChild(
      el('p', 'word-order-source-phrase', exercise.sentenceEn ?? exercise.sentence),
    );
  } else {
    body.appendChild(createAudioButton('Play phrase', playPhrase));
  }

  const layout = el('div', 'word-order-layout');

  const answerCol = el('div', 'word-order-col word-order-col-answer');
  answerCol.appendChild(el('p', 'word-order-label', 'Your answer'));
  const answerStrip = el('div', 'word-order-answer');
  answerCol.appendChild(answerStrip);
  layout.appendChild(answerCol);

  const poolCol = el('div', 'word-order-col word-order-col-pool');
  poolCol.appendChild(el('p', 'word-order-label', 'Word bank'));
  const pool = el('div', 'word-order-pool');
  poolCol.appendChild(pool);
  layout.appendChild(poolCol);

  body.appendChild(layout);

  const reveal = el('div', 'lesson-reveal word-order-reveal hidden');
  reveal.appendChild(el('p', 'lesson-reveal-label', 'Correct answer'));
  reveal.appendChild(el('p', 'lesson-reveal-ru', exercise.sentence));
  if (exercise.sentenceEn) {
    reveal.appendChild(el('p', 'lesson-reveal-en', exercise.sentenceEn));
  }
  reveal.appendChild(
    createAudioButton('Play phrase', () => {
      unlockAudioPlayback();
      playAudio(exercise.audio ?? options.wordAudio ?? '', exercise.sentence);
    }),
  );
  body.appendChild(reveal);

  const redoSlot = el('div', 'word-order-redo-slot hidden');
  body.appendChild(redoSlot);

  const checkBtn = createPrimaryButton('Check', () => check());
  const nextBtn = createPrimaryButton('Next', () => {
    if (options.completedState) {
      callbacks.onContinue?.();
      return;
    }
    callbacks.onSubmit({ correct: false, userAnswer: lastAnswer });
  });
  nextBtn.classList.add('hidden');

  const actionsRow = el(
    'div',
    `lesson-footer-actions${options.canGoBack ? ' lesson-footer-actions--split' : ''}`,
  );
  if (options.canGoBack) {
    const backBtn = el('button', 'btn-outline lesson-back-btn', 'Back');
    backBtn.type = 'button';
    backBtn.addEventListener('click', () => {
      dismissFeedback(true);
      callbacks.onBack?.();
    });
    actionsRow.appendChild(backBtn);
  }
  actionsRow.appendChild(checkBtn);
  actionsRow.appendChild(nextBtn);
  footer.appendChild(actionsRow);

  const skipBtn = createSecondaryButton('Skip this phrase', () => {
    callbacks.onSubmit({ correct: false, skipped: true, userAnswer: lastAnswer });
  });
  skipBtn.classList.add('hidden');
  footer.appendChild(skipBtn);

  type Chip = { id: number; text: string };
  const chips: Chip[] = exercise.pool.map((text, id) => ({ id, text }));
  const selected: Chip[] = [];
  let checked = false;
  let lastAnswer = '';
  let feedbackOverlay: AnswerFeedbackHandle | null = null;
  let successRevealTimer: ReturnType<typeof setTimeout> | null = null;

  function clearSuccessRevealTimer() {
    if (successRevealTimer != null) {
      window.clearTimeout(successRevealTimer);
      successRevealTimer = null;
    }
  }

  function dismissFeedback(immediate = false) {
    clearSuccessRevealTimer();
    root.classList.remove('lesson-step--success-fade');
    feedbackOverlay?.dismiss(immediate);
    feedbackOverlay = null;
  }

  function showCorrectSuccessFeedback() {
    feedbackOverlay = showAnswerFeedback(root, {
      variant: 'correct',
      headline: pickCorrectPhrase(),
      autoAdvanceMs: CORRECT_AUTO_ADVANCE_MS,
      onAutoAdvance: () => {
        feedbackOverlay = null;
        callbacks.onSubmit({ correct: true, userAnswer: lastAnswer });
      },
    });
  }

  function revealCorrectSuccess(chipCount: number) {
    const { highlightMs, fadeMs } = successRevealTimings(chipCount);

    successRevealTimer = window.setTimeout(() => {
      successRevealTimer = null;
      root.classList.add('lesson-step--success-fade');

      successRevealTimer = window.setTimeout(() => {
        successRevealTimer = null;
        showCorrectSuccessFeedback();
      }, fadeMs);
    }, highlightMs);
  }

  function playPhraseAudio() {
    unlockAudioPlayback();
    void playAudio(exercise.audio ?? options.wordAudio ?? '', exercise.sentence);
  }

  function showIncorrectFeedback() {
    const showSkip = (options.wrongAttempts ?? 0) >= 2;
    feedbackOverlay = showAnswerFeedback(root, {
      variant: 'incorrect',
      headline: 'Not quite',
      detailLabel: 'Correct answer',
      detailPrimary: exercise.sentence,
      detailSecondary: exercise.sentenceEn,
      playLabel: 'Play phrase',
      onPlayAudio: playPhraseAudio,
      primaryAction: {
        label: 'Next',
        onClick: () => {
          dismissFeedback(true);
          if (options.completedState) {
            callbacks.onContinue?.();
            return;
          }
          callbacks.onSubmit({ correct: false, userAnswer: lastAnswer });
        },
      },
      secondaryAction: showSkip
        ? {
            label: 'Skip this phrase',
            onClick: () => {
              dismissFeedback(true);
              callbacks.onSubmit({ correct: false, skipped: true, userAnswer: lastAnswer });
            },
          }
        : undefined,
    });
  }

  function playChipAudio(text: string) {
    if (direction === 'ru-to-en') return;

    unlockAudioPlayback();
    const vocab = options.words ?? (options.word ? [options.word] : []);
    const match = vocab.find((w) => w.ru === text);
    void playAudio(match?.audio ?? '', text, 'ru-RU');
  }

  function attachRedo() {
    if (!callbacks.onRedo) return;
    redoSlot.innerHTML = '';
    redoSlot.classList.remove('hidden');
    const row = el('div', 'lesson-redo-row');
    const btn = el('button', 'lesson-redo-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Redo question');
    btn.innerHTML = REDO_ICON;
    btn.addEventListener('click', () => {
      dismissFeedback(true);
      callbacks.onRedo?.();
    });
    row.appendChild(btn);
    redoSlot.appendChild(row);
  }

  function chipsFromAnswer(answer: string): Chip[] {
    const parts = answer.split(' ').filter(Boolean);
    const used = new Set<number>();
    const restored: Chip[] = [];
    for (const part of parts) {
      const chip = chips.find((c) => c.text === part && !used.has(c.id));
      if (chip) {
        restored.push(chip);
        used.add(chip.id);
      }
    }
    return restored;
  }

  function applyCompletedState(state: CompletedExerciseState) {
    selected.push(...chipsFromAnswer(state.userAnswer ?? ''));
    checked = true;
    lastAnswer = state.userAnswer ?? '';
    render();
    checkBtn.classList.add('hidden');
    lockInteraction();

    if (state.correct) {
      root.classList.add('lesson-step--correct', 'lesson-step--review');
      reveal.classList.remove('hidden');
      attachRedo();
      nextBtn.classList.remove('hidden');
      return;
    }

    root.classList.add('lesson-step--incorrect', 'lesson-step--review');
    reveal.classList.remove('hidden');
    attachRedo();
    nextBtn.classList.remove('hidden');
  }
  function renderPool() {
    pool.innerHTML = '';
    for (const chip of chips) {
      if (selected.some((s) => s.id === chip.id)) continue;
      const btn = el('button', 'word-order-chip', chip.text);
      btn.type = 'button';
      btn.addEventListener('click', () => {
        if (checked) return;
        playChipAudio(chip.text);
        selected.push(chip);
        render();
      });
      pool.appendChild(btn);
    }
  }

  function renderAnswer() {
    answerStrip.innerHTML = '';
    if (selected.length === 0) {
      answerStrip.appendChild(el('span', 'word-order-placeholder', 'Tap words from the bank'));
      answerStrip.classList.remove('has-words');
      return;
    }
    answerStrip.classList.add('has-words');
    for (const chip of selected) {
      const btn = el('button', 'word-order-chip word-order-chip-selected', chip.text);
      btn.type = 'button';
      btn.addEventListener('click', () => {
        if (checked) return;
        const idx = selected.findIndex((s) => s.id === chip.id);
        if (idx >= 0) selected.splice(idx, 1);
        render();
      });
      answerStrip.appendChild(btn);
    }
  }

  function render() {
    renderAnswer();
    renderPool();
    checkBtn.disabled = selected.length === 0 || checked;
  }

  function lockInteraction() {
    disableButtons(pool);
    disableButtons(answerStrip);
    const topAudio = body.querySelector(':scope > .lesson-audio-btn');
    if (topAudio) (topAudio as HTMLButtonElement).disabled = true;
  }

  function check() {
    if (checked || selected.length === 0) return;
    checked = true;
    lastAnswer = selected.map((c) => c.text).join(' ');
    const correct = tokensMatch(
      selected.map((c) => c.text),
      exercise.tokens,
    );

    if (correct) {
      answerStrip.classList.add('is-correct');
      pool.classList.add('is-dimmed');
      root.classList.add('lesson-step--correct');
      lockInteraction();
      checkBtn.classList.add('hidden');

      answerStrip.querySelectorAll('.word-order-chip-selected').forEach((chip, i) => {
        chip.classList.add('word-order-chip-locked');
        (chip as HTMLElement).style.animationDelay = `${0.04 + i * 0.05}s`;
      });

      playCorrectChime();
      revealCorrectSuccess(selected.length);
      return;
    }

    root.classList.add('lesson-step--incorrect');
    answerStrip.classList.add('is-incorrect');
    lockInteraction();
    checkBtn.classList.add('hidden');
    showIncorrectFeedback();
  }

  render();
  if (options.completedState) {
    applyCompletedState(options.completedState);
  } else if (direction !== 'en-to-ru') {
    window.setTimeout(playPhrase, 150);
  }
  return root;
}

function disableButtons(parent: HTMLElement): void {
  Array.from(parent.querySelectorAll('button')).forEach((b) => {
    b.disabled = true;
  });
}

export function blockLabel(block: string): string {
  const labels: Record<string, string> = {
    intro: 'Vocabulary',
    flashcards: 'Flashcards',
    listening: 'Listen/Read',
    pictures: 'Pictures',
  };
  return labels[block] ?? block.charAt(0).toUpperCase() + block.slice(1);
}
