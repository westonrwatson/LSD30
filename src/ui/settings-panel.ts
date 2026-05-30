import type { AppSettings } from '../content/schema';
import { clampVolume, initAudioSettings, patchAudioPrefs } from '../lib/audio-settings';
import { updatePlaybackVolume } from '../audio/player';

const GEAR_ICON =
  '<svg class="study-settings-icon" viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="none" stroke="currentColor" stroke-width="1.25"></path>' +
  '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" ' +
  'fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"></path>' +
  '</svg>';

const SPEAKER_ON_ICON =
  '<svg class="study-settings-icon" viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M4 9v6h4l5 5V4L8 9H4z" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"></path>' +
  '<path d="M16 8.82a4 4 0 010 6.36M18.5 6.5a7 7 0 010 11" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"></path>' +
  '</svg>';

const SPEAKER_OFF_ICON =
  '<svg class="study-settings-icon" viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M4 9v6h4l5 5V4L8 9H4z" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"></path>' +
  '<path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"></path>' +
  '</svg>';

export type SettingsPanelCallbacks = {
  getSettings: () => AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
};

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

export function createSettingsControl(callbacks: SettingsPanelCallbacks): HTMLElement {
  const wrap = el('div', 'study-settings');
  wrap.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  const gearBtn = el('button', 'study-settings-btn');
  gearBtn.type = 'button';
  gearBtn.setAttribute('aria-label', 'Settings');
  gearBtn.setAttribute('aria-expanded', 'false');
  gearBtn.setAttribute('aria-haspopup', 'true');
  gearBtn.innerHTML = GEAR_ICON;

  const panel = el('div', 'study-settings-panel hidden');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Study settings');

  const volumeField = el('div', 'study-settings-field');
  volumeField.appendChild(el('span', 'study-settings-field-label', 'Volume'));

  const volumeRow = el('div', 'study-settings-volume');
  const muteBtn = el('button', 'study-settings-mute-btn');
  muteBtn.type = 'button';
  muteBtn.setAttribute('aria-label', 'Mute audio');

  const volumeSlider = document.createElement('input');
  volumeSlider.type = 'range';
  volumeSlider.className = 'study-settings-volume-slider';
  volumeSlider.min = '0';
  volumeSlider.max = '100';
  volumeSlider.step = '1';
  volumeSlider.setAttribute('aria-label', 'Volume');

  volumeRow.appendChild(muteBtn);
  volumeRow.appendChild(volumeSlider);
  volumeField.appendChild(volumeRow);
  panel.appendChild(volumeField);

  const effectsField = el('div', 'study-settings-field');
  effectsField.appendChild(el('span', 'study-settings-field-label', 'Sound effects'));
  const effectsToggle = el('button', 'study-settings-toggle', 'On');
  effectsToggle.type = 'button';
  effectsToggle.setAttribute('aria-label', 'Sound effects');
  effectsField.appendChild(effectsToggle);
  panel.appendChild(effectsField);

  wrap.appendChild(gearBtn);
  wrap.appendChild(panel);

  function syncFromSettings() {
    const settings = callbacks.getSettings();
    initAudioSettings(settings);

    const volumePct = Math.round(clampVolume(settings.volume) * 100);
    volumeSlider.value = String(volumePct);

    muteBtn.innerHTML = settings.muted ? SPEAKER_OFF_ICON : SPEAKER_ON_ICON;
    muteBtn.setAttribute('aria-label', settings.muted ? 'Unmute audio' : 'Mute audio');
    muteBtn.classList.toggle('is-muted', settings.muted);

    effectsToggle.textContent = settings.soundEffects ? 'On' : 'Off';
    effectsToggle.classList.toggle('is-on', settings.soundEffects);
    effectsToggle.setAttribute('aria-pressed', settings.soundEffects ? 'true' : 'false');
  }

  function closePanel() {
    panel.classList.add('hidden');
    gearBtn.setAttribute('aria-expanded', 'false');
  }

  function openPanel() {
    syncFromSettings();
    panel.classList.remove('hidden');
    gearBtn.setAttribute('aria-expanded', 'true');
  }

  function togglePanel() {
    if (panel.classList.contains('hidden')) {
      openPanel();
    } else {
      closePanel();
    }
  }

  function updateSettings(patch: Partial<AppSettings>) {
    patchAudioPrefs(patch);
    updatePlaybackVolume();
    callbacks.onChange(patch);
    syncFromSettings();
  }

  gearBtn.addEventListener('click', () => {
    togglePanel();
  });

  muteBtn.addEventListener('click', () => {
    const settings = callbacks.getSettings();
    updateSettings({ muted: !settings.muted });
  });

  volumeSlider.addEventListener('input', () => {
    const volume = clampVolume(Number(volumeSlider.value) / 100);
    const patch: Partial<AppSettings> = { volume };
    if (volume > 0 && callbacks.getSettings().muted) {
      patch.muted = false;
    }
    updateSettings(patch);
  });

  effectsToggle.addEventListener('click', () => {
    const settings = callbacks.getSettings();
    updateSettings({ soundEffects: !settings.soundEffects });
  });

  const onDocumentClick = () => {
    closePanel();
  };

  const onDocumentKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closePanel();
    }
  };

  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeydown);

  const disconnectObserver = new MutationObserver(() => {
    if (!wrap.isConnected) {
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onDocumentKeydown);
      disconnectObserver.disconnect();
    }
  });
  disconnectObserver.observe(document.body, { childList: true, subtree: true });

  syncFromSettings();

  return wrap;
}
