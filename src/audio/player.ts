import { applyVolumeToElement, effectiveVolume } from '../lib/audio-settings';

let currentAudio: HTMLAudioElement | null = null;

export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  window.speechSynthesis.cancel();
}

export function updatePlaybackVolume(): void {
  if (currentAudio) {
    applyVolumeToElement(currentAudio);
  }
}

export function speakWithTTS(text: string, lang = 'ru-RU'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.volume = effectiveVolume();
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = lang.slice(0, 2);
    const voice = voices.find((v) => v.lang.startsWith(langPrefix));
    if (voice) utterance.voice = voice;
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error('TTS failed'));
    window.speechSynthesis.speak(utterance);
  });
}

export async function playAudio(
  src: string,
  fallbackText?: string,
  lang = 'ru-RU',
): Promise<void> {
  stopAudio();

  if (src) {
    try {
      await new Promise<void>((resolve, reject) => {
        const audio = new Audio(src);
        currentAudio = audio;
        applyVolumeToElement(audio);
        audio.onended = () => {
          currentAudio = null;
          resolve();
        };
        audio.onerror = () => {
          currentAudio = null;
          reject(new Error('Audio file not found'));
        };
        audio.play().catch(reject);
      });
      return;
    } catch {
      // fall through to TTS
    }
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
