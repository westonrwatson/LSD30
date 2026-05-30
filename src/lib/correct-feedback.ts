import { effectiveVolume, shouldPlaySoundEffects } from './audio-settings';

const CORRECT_PHRASES = [
  'Nice!',
  'Great!',
  'Perfect',
  'Well done',
  'Got it',
  'Exactly',
];

export const CORRECT_AUTO_ADVANCE_MS = 1800;

export function pickCorrectPhrase(): string {
  return CORRECT_PHRASES[Math.floor(Math.random() * CORRECT_PHRASES.length)]!;
}

/** Short two-tone chime — no audio file required. */
export function playCorrectChime(): void {
  if (!shouldPlaySoundEffects()) return;

  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    const level = effectiveVolume() * 0.1;

    const tone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(level, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };

    tone(523.25, t, 0.1);
    tone(659.25, t + 0.09, 0.16);

    window.setTimeout(() => {
      void ctx.close();
    }, 400);
  } catch {
    // Audio unavailable — visual feedback still applies.
  }
}

const SUCCESS_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12"></circle>' +
  '<path d="M8 12.5l2.5 2.5L16 9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"></path>' +
  '</svg>';

const FAIL_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12"></circle>' +
  '<path d="M9 9l6 6M15 9l-6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"></path>' +
  '</svg>';

const AUDIO_ICON =
  '<svg class="lesson-audio-icon" viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor"></path>' +
  '<path d="M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square"></path>' +
  '</svg>';

export type AnswerFeedbackAction = {
  label: string;
  onClick: () => void;
};

export type AnswerFeedbackOptions = {
  variant: 'correct' | 'incorrect';
  headline: string;
  detailLabel?: string;
  detailPrimary?: string;
  detailSecondary?: string;
  playLabel?: string;
  onPlayAudio?: () => void;
  primaryAction?: AnswerFeedbackAction;
  secondaryAction?: AnswerFeedbackAction;
  autoAdvanceMs?: number;
  onAutoAdvance?: () => void;
};

export type AnswerFeedbackHandle = {
  dismiss: (immediate?: boolean) => void;
};

let activeFeedback: AnswerFeedbackHandle | null = null;

export function dismissActiveAnswerFeedback(immediate = true): void {
  activeFeedback?.dismiss(immediate);
  activeFeedback = null;
}

export function showAnswerFeedback(
  container: HTMLElement,
  options: AnswerFeedbackOptions,
): AnswerFeedbackHandle {
  dismissActiveAnswerFeedback(true);

  const overlay = document.createElement('div');
  overlay.className = 'answer-feedback-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-live', 'polite');

  const backdrop = document.createElement('div');
  backdrop.className = 'answer-feedback-backdrop';
  overlay.appendChild(backdrop);

  const card = document.createElement('div');
  card.className = `answer-feedback-card answer-feedback-card--${options.variant}`;
  overlay.appendChild(card);

  const icon = document.createElement('div');
  icon.className = 'answer-feedback-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = options.variant === 'correct' ? SUCCESS_ICON : FAIL_ICON;
  card.appendChild(icon);

  const headline = document.createElement('h2');
  headline.className = 'answer-feedback-headline';
  headline.textContent = options.headline;
  card.appendChild(headline);

  const hasDetails =
    options.detailLabel ||
    options.detailPrimary ||
    options.detailSecondary ||
    options.onPlayAudio;

  if (hasDetails) {
    const details = document.createElement('div');
    details.className = 'answer-feedback-details';

    if (options.detailLabel) {
      const label = document.createElement('p');
      label.className = 'answer-feedback-detail-label';
      label.textContent = options.detailLabel;
      details.appendChild(label);
    }

    if (options.detailPrimary) {
      const primary = document.createElement('p');
      primary.className = 'answer-feedback-detail-primary';
      primary.textContent = options.detailPrimary;
      details.appendChild(primary);
    }

    if (options.detailSecondary) {
      const secondary = document.createElement('p');
      secondary.className = 'answer-feedback-detail-secondary';
      secondary.textContent = options.detailSecondary;
      details.appendChild(secondary);
    }

    if (options.onPlayAudio) {
      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'lesson-audio-btn answer-feedback-audio-btn';
      playBtn.innerHTML = `${AUDIO_ICON}<span>${options.playLabel ?? 'Play'}</span>`;
      playBtn.addEventListener('click', options.onPlayAudio);
      details.appendChild(playBtn);
    }

    card.appendChild(details);
  }

  if (options.autoAdvanceMs != null && options.autoAdvanceMs > 0) {
    const progress = document.createElement('div');
    progress.className = 'answer-feedback-progress';
    progress.style.setProperty('--advance-ms', `${options.autoAdvanceMs}ms`);
    card.appendChild(progress);
  }

  if (options.primaryAction || options.secondaryAction) {
    const actions = document.createElement('div');
    actions.className = 'answer-feedback-actions';

    if (options.primaryAction) {
      const primaryBtn = document.createElement('button');
      primaryBtn.type = 'button';
      primaryBtn.className = 'btn-outline prominent block lesson-primary-btn';
      primaryBtn.textContent = options.primaryAction.label;
      primaryBtn.addEventListener('click', options.primaryAction.onClick);
      actions.appendChild(primaryBtn);
    }

    if (options.secondaryAction) {
      const secondaryBtn = document.createElement('button');
      secondaryBtn.type = 'button';
      secondaryBtn.className = 'lesson-secondary-btn answer-feedback-secondary-btn';
      secondaryBtn.textContent = options.secondaryAction.label;
      secondaryBtn.addEventListener('click', options.secondaryAction.onClick);
      actions.appendChild(secondaryBtn);
    }

    card.appendChild(actions);
  }

  container.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('is-visible');
  });

  let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  let removeTimer: ReturnType<typeof setTimeout> | null = null;

  const dismiss = (immediate = false) => {
    if (autoAdvanceTimer != null) {
      window.clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
    if (removeTimer != null) {
      window.clearTimeout(removeTimer);
      removeTimer = null;
    }
    if (activeFeedback === handle) {
      activeFeedback = null;
    }
    if (immediate || !overlay.isConnected) {
      overlay.remove();
      return;
    }
    overlay.classList.remove('is-visible');
    removeTimer = window.setTimeout(() => {
      overlay.remove();
      removeTimer = null;
    }, 280);
  };

  const handle: AnswerFeedbackHandle = { dismiss };
  activeFeedback = handle;

  if (options.autoAdvanceMs != null && options.autoAdvanceMs > 0) {
    autoAdvanceTimer = window.setTimeout(() => {
      autoAdvanceTimer = null;
      dismiss(true);
      options.onAutoAdvance?.();
    }, options.autoAdvanceMs);
  }

  return handle;
}
