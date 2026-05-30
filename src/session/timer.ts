export class SessionTimer {
  private totalSeconds: number;
  private remaining: number;
  private intervalId: number | null = null;
  private onTick: (remaining: number, elapsed: number) => void;
  private onComplete: () => void;

  constructor(
    totalSeconds: number,
    onTick: (remaining: number, elapsed: number) => void,
    onComplete: () => void,
  ) {
    this.totalSeconds = totalSeconds;
    this.remaining = totalSeconds;
    this.onTick = onTick;
    this.onComplete = onComplete;
  }

  start(): void {
    if (this.intervalId) return;
    this.onTick(this.remaining, this.totalSeconds - this.remaining);
    this.intervalId = window.setInterval(() => {
      this.remaining -= 1;
      if (this.remaining <= 0) {
        this.remaining = 0;
        this.stop();
        this.onComplete();
      }
      this.onTick(this.remaining, this.totalSeconds - this.remaining);
    }, 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getRemaining(): number {
    return this.remaining;
  }

  format(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}
