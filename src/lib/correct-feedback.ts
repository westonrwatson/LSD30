const CORRECT_PHRASES = [
  'Nice!',
  'Great!',
  'Perfect',
  'Well done',
  'Got it',
  'Exactly',
];

export function pickCorrectPhrase(): string {
  return CORRECT_PHRASES[Math.floor(Math.random() * CORRECT_PHRASES.length)]!;
}

/** Short two-tone chime — no audio file required. */
export function playCorrectChime(): void {
  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;

    const tone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.1, start + 0.015);
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

export function createCorrectBanner(message: string): HTMLElement {
  const banner = document.createElement('div');
  banner.className = 'answer-success';
  banner.setAttribute('aria-live', 'polite');

  const mark = document.createElement('span');
  mark.className = 'answer-success-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2.5"></path>' +
    '</svg>';

  const text = document.createElement('span');
  text.className = 'answer-success-text';
  text.textContent = message;

  banner.appendChild(mark);
  banner.appendChild(text);
  return banner;
}
