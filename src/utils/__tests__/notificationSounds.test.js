import { afterEach, expect, test, vi } from "vitest";
import {
  DEFAULT_NOTIFICATION_SOUNDS,
  NOTIFICATION_SOUND_OPTIONS,
  normalizeNotificationSoundPreferences,
  notificationSoundForType,
  playNotificationSound,
} from "../notificationSounds";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("uses a distinct default sound for trade openings", () => {
  expect(DEFAULT_NOTIFICATION_SOUNDS.trade_opened).not.toBe(
    DEFAULT_NOTIFICATION_SOUNDS.trade_closed,
  );
  expect(
    normalizeNotificationSoundPreferences({ trade_opened: "none" })
      .trade_opened,
  ).toBe("none");
});

test("offers each new sound and preserves it when normalizing preferences", () => {
  const newSounds = [
    "soft",
    "ascending",
    "descending",
    "alert",
    "sonar",
    "pop",
  ];
  const optionIds = NOTIFICATION_SOUND_OPTIONS.map(({ id }) => id);
  const normalized = normalizeNotificationSoundPreferences({
    trade_opened: "alert",
  });

  expect(newSounds.every((sound) => optionIds.includes(sound))).toBe(true);
  expect(normalized.trade_opened).toBe("alert");
});

test("maps each toast type to its account-specific sound preference", () => {
  const preferences = {
    trade_opened: "bell",
    trade_closed: "retro",
    kairos_peak: "double",
    kairos_surge: "chime",
  };

  expect(notificationSoundForType("opened", preferences)).toBe("bell");
  expect(notificationSoundForType("closed", preferences)).toBe("retro");
  expect(notificationSoundForType("peak", preferences)).toBe("double");
  expect(notificationSoundForType("surge", preferences)).toBe("chime");
  expect(notificationSoundForType("unknown", preferences)).toBe("none");
});

test("plays no audio when the selected notification sound is muted", () => {
  const AudioContext = vi.fn();
  vi.stubGlobal("window", { AudioContext });

  playNotificationSound("none");

  expect(AudioContext).not.toHaveBeenCalled();
});

test("resumes a suspended audio context before playing a selected sound", async () => {
  const start = vi.fn();
  const stop = vi.fn();
  const setValueAtTime = vi.fn();
  const exponentialRampToValueAtTime = vi.fn();
  const audioContext = {
    currentTime: 1,
    state: "suspended",
    destination: {},
    resume: vi.fn(async () => {
      audioContext.state = "running";
    }),
    createOscillator: vi.fn(() => ({
      type: "",
      frequency: { setValueAtTime },
      connect: vi.fn(),
      start,
      stop,
    })),
    createGain: vi.fn(() => ({
      gain: { setValueAtTime, exponentialRampToValueAtTime },
      connect: vi.fn(),
    })),
  };
  const AudioContext = vi.fn(() => audioContext);
  vi.stubGlobal("window", { AudioContext });

  playNotificationSound("soft");
  await vi.waitFor(() => expect(start).toHaveBeenCalledOnce());

  expect(audioContext.resume).toHaveBeenCalledOnce();
  expect(stop).toHaveBeenCalledOnce();
});
