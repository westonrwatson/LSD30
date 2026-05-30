import type { AppSettings } from '../content/schema';

type AudioPrefs = Pick<AppSettings, 'volume' | 'muted' | 'soundEffects'>;

let prefs: AudioPrefs = {
  volume: 1,
  muted: false,
  soundEffects: true,
};

export function initAudioSettings(settings: AppSettings): void {
  prefs = {
    volume: clampVolume(settings.volume),
    muted: settings.muted,
    soundEffects: settings.soundEffects,
  };
}

export function getAudioPrefs(): AudioPrefs {
  return { ...prefs };
}

export function effectiveVolume(): number {
  return prefs.muted ? 0 : prefs.volume;
}

export function shouldPlaySoundEffects(): boolean {
  return prefs.soundEffects && !prefs.muted && prefs.volume > 0;
}

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

export function patchAudioPrefs(patch: Partial<AudioPrefs>): AudioPrefs {
  if (patch.volume != null) {
    prefs.volume = clampVolume(patch.volume);
  }
  if (patch.muted != null) {
    prefs.muted = patch.muted;
  }
  if (patch.soundEffects != null) {
    prefs.soundEffects = patch.soundEffects;
  }
  return getAudioPrefs();
}

export function applyVolumeToElement(audio: HTMLAudioElement): void {
  audio.volume = effectiveVolume();
}
