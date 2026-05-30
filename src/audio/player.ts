import { applyVolumeToElement, effectiveVolume } from '../lib/audio-settings';

let currentAudio: HTMLAudioElement | null = null;
let audioFilesAvailable: boolean | null = null;
let audioUnlocked = false;

const FILE_PLAY_TIMEOUT_MS = 600;
const FILE_PLAY_TIMEOUT_IOS_MS = 250;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function normalizeAudioSrc(src: string): string {
  if (!src.startsWith('/')) return src;
  const parts = src.split('/');
  return parts.map((part, index) => (index <= 1 || !part ? part : encodeURIComponent(part))).join('/');
}

/** Call once from a user gesture (tap) so iOS Safari allows playback/TTS later. */
export function unlockAudioPlayback(): void {
  if (audioUnlocked) return;
  audioUnlocked = true;

  try {
    const audio = new Audio(
      'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+1DEAAAHAAGf9AAAIAAANIAAAAQAAAaQAAAAE=',
    );
    audio.volume = 0.001;
    audio.setAttribute('playsinline', '');
    void audio.play().catch(() => {});
  } catch {
    // Ignore unlock failures.
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
  }
}

export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  window.speechSynthesis?.cancel();
}

export function updatePlaybackVolume(): void {
  if (currentAudio) {
    applyVolumeToElement(currentAudio);
  }
}

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      resolve([]);
      return;
    }

    const voices = synth.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    let settled = false;
    const finish = (list: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      synth.removeEventListener('voiceschanged', onChange);
      resolve(list);
    };

    const onChange = () => {
      finish(synth.getVoices());
    };

    synth.addEventListener('voiceschanged', onChange);
    synth.getVoices();
    window.setTimeout(() => finish(synth.getVoices()), 300);
  });
}

export function speakWithTTS(text: string, lang = 'ru-RU'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    if (effectiveVolume() === 0) {
      resolve();
      return;
    }

    void waitForVoices().then((voices) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.volume = effectiveVolume();
      const langPrefix = lang.slice(0, 2);
      const voice = voices.find((v) => v.lang.startsWith(langPrefix));
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error('TTS failed'));
      window.speechSynthesis.speak(utterance);

      // iOS Safari often starts speech in a paused state.
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    });
  });
}

async function tryPlayFile(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(normalizeAudioSrc(src));
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');
    applyVolumeToElement(audio);
    currentAudio = audio;

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (!ok) {
        audio.pause();
        if (currentAudio === audio) currentAudio = null;
      }
      resolve(ok);
    };

    const timer = window.setTimeout(
      () => finish(false),
      isIOS() ? FILE_PLAY_TIMEOUT_IOS_MS : FILE_PLAY_TIMEOUT_MS,
    );
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
      finish(true);
    };
    audio.onerror = () => finish(false);
    void audio.play().then(() => {}).catch(() => finish(false));
  });
}

export async function playAudio(
  src: string,
  fallbackText?: string,
  lang = 'ru-RU',
): Promise<void> {
  unlockAudioPlayback();
  stopAudio();

  if (effectiveVolume() === 0) return;

  const shouldTryFile = !!src && audioFilesAvailable !== false;

  if (shouldTryFile) {
    const played = await tryPlayFile(src);
    if (played) {
      audioFilesAvailable = true;
      return;
    }
    audioFilesAvailable = false;
  }

  if (fallbackText) {
    await speakWithTTS(fallbackText, lang);
  }
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
