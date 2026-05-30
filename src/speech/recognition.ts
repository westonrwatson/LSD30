type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type SpeechResult = {
  transcript: string;
  confidence: number;
};

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognition() !== null;
}

export function listenForRussian(timeoutMs = 8000): Promise<SpeechResult> {
  return new Promise((resolve, reject) => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      reject(new Error('Speech recognition not supported in this browser'));
      return;
    }

    const recognition = new Ctor();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    let settled = false;

    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        recognition.stop();
        reject(new Error('Listening timed out'));
      }
    }, timeoutMs);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      const result = event.results[0]?.[0];
      if (!result) {
        reject(new Error('No speech detected'));
        return;
      }
      resolve({
        transcript: result.transcript,
        confidence: result.confidence,
      });
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(new Error(event.error || 'Speech recognition error'));
    };

    recognition.onend = () => {
      if (!settled) {
        settled = true;
        window.clearTimeout(timer);
        reject(new Error('No speech detected'));
      }
    };

    try {
      recognition.start();
    } catch (err) {
      settled = true;
      window.clearTimeout(timer);
      reject(err instanceof Error ? err : new Error('Failed to start recognition'));
    }
  });
}
