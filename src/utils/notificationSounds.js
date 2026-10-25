export const NOTIFICATION_SOUND_TYPES = [
  "trade_opened",
  "trade_closed",
  "kairos_peak",
  "kairos_surge",
];

export const NOTIFICATION_SOUND_OPTIONS = [
  { id: "none", labelKey: "notificationSounds.muted" },
  { id: "retro", labelKey: "notificationSounds.retro" },
  { id: "chime", labelKey: "notificationSounds.chime" },
  { id: "double", labelKey: "notificationSounds.double" },
  { id: "bell", labelKey: "notificationSounds.bell" },
  { id: "soft", labelKey: "notificationSounds.soft" },
  { id: "ascending", labelKey: "notificationSounds.ascending" },
  { id: "descending", labelKey: "notificationSounds.descending" },
  { id: "alert", labelKey: "notificationSounds.alert" },
  { id: "sonar", labelKey: "notificationSounds.sonar" },
  { id: "pop", labelKey: "notificationSounds.pop" },
];

const SOUND_IDS = new Set(NOTIFICATION_SOUND_OPTIONS.map(({ id }) => id));
let audioContext = null;
let audioUnlockListenersInstalled = false;

export const DEFAULT_NOTIFICATION_SOUNDS = {
  trade_opened: "chime",
  trade_closed: "retro",
  kairos_peak: "double",
  kairos_surge: "bell",
};

export function normalizeNotificationSoundPreferences(preferences) {
  return Object.fromEntries(
    NOTIFICATION_SOUND_TYPES.map((type) => [
      type,
      SOUND_IDS.has(preferences?.[type])
        ? preferences[type]
        : DEFAULT_NOTIFICATION_SOUNDS[type],
    ]),
  );
}

export function notificationSoundForType(type, preferences) {
  const preferenceKey =
    type === "opened" || type === "closed"
      ? `trade_${type}`
      : type === "peak" || type === "surge"
        ? `kairos_${type}`
        : null;
  return preferenceKey ? preferences[preferenceKey] || "none" : "none";
}

function getAudioContext() {
  if (audioContext) return audioContext;
  const AudioContextConstructor =
    typeof window !== "undefined"
      ? window.AudioContext || window.webkitAudioContext
      : null;
  if (!AudioContextConstructor) return null;
  audioContext = new AudioContextConstructor();
  return audioContext;
}

export function unlockNotificationAudio() {
  try {
    const context = getAudioContext();
    if (context?.state === "running") {
      document.removeEventListener("pointerdown", unlockNotificationAudio);
      document.removeEventListener("keydown", unlockNotificationAudio);
      audioUnlockListenersInstalled = false;
      return;
    }
    if (context?.state === "suspended") {
      context
        .resume()
        .then(() => {
          if (context.state !== "running") return;
          document.removeEventListener("pointerdown", unlockNotificationAudio);
          document.removeEventListener("keydown", unlockNotificationAudio);
          audioUnlockListenersInstalled = false;
        })
        .catch((error) => {
          console.warn("Could not unlock notification audio:", error);
        });
    }
  } catch (error) {
    console.warn("Could not initialize notification audio:", error);
  }
}

function installAudioUnlockListeners() {
  if (audioUnlockListenersInstalled || typeof document === "undefined") return;
  audioUnlockListenersInstalled = true;
  document.addEventListener("pointerdown", unlockNotificationAudio);
  document.addEventListener("keydown", unlockNotificationAudio);
}

export function playNotificationSound(soundId) {
  if (soundId === "none") return;

  const presets = {
    retro: {
      frequencies: [880, 1320],
      duration: 0.09,
      spacing: 0.08,
      waveform: "square",
    },
    chime: {
      frequencies: [660, 990],
      duration: 0.16,
      spacing: 0.08,
      waveform: "sine",
    },
    double: {
      frequencies: [740, 1040],
      duration: 0.08,
      spacing: 0.14,
      waveform: "triangle",
    },
    bell: {
      frequencies: [1040],
      duration: 0.24,
      spacing: 0.08,
      waveform: "sine",
    },
    soft: {
      frequencies: [523],
      duration: 0.22,
      spacing: 0.08,
      waveform: "sine",
    },
    ascending: {
      frequencies: [523, 659, 784],
      duration: 0.12,
      spacing: 0.08,
      waveform: "triangle",
    },
    descending: {
      frequencies: [784, 659, 523],
      duration: 0.12,
      spacing: 0.08,
      waveform: "triangle",
    },
    alert: {
      frequencies: [880, 660, 880],
      duration: 0.1,
      spacing: 0.12,
      waveform: "square",
    },
    sonar: {
      frequencies: [440, 660],
      duration: 0.2,
      spacing: 0.22,
      waveform: "sine",
    },
    pop: {
      frequencies: [520, 780],
      duration: 0.07,
      spacing: 0.06,
      waveform: "square",
    },
  };
  const preset = presets[soundId];
  if (!preset) return;

  try {
    const context = getAudioContext();
    if (!context) return;
    const scheduleSound = () => {
      const startAt = context.currentTime;
      preset.frequencies.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const noteStart = startAt + index * preset.spacing;
        oscillator.type = preset.waveform;
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        gain.gain.setValueAtTime(0.08, noteStart);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          noteStart + preset.duration,
        );
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + preset.duration + 0.01);
      });
    };
    if (context.state === "suspended") {
      context.resume().then(scheduleSound).catch((error) => {
        console.warn("Could not resume notification audio:", error);
      });
    } else {
      scheduleSound();
    }
  } catch (error) {
    console.warn("Could not play notification sound:", error);
  }
}

installAudioUnlockListeners();
