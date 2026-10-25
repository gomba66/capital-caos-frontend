import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { AuthProvider } from "../AuthContext";
import { useAuth } from "../authState";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function ThemePreferenceProbe() {
  const { user, updateThemePreferences } = useAuth();
  return (
    <>
      <span>{user?.theme_mode || "unset"}</span>
      <button
        type="button"
        onClick={() =>
          updateThemePreferences({ mode: "light", palette: "ocean" })
        }
      >
        Save theme
      </button>
    </>
  );
}

function NotificationPreferenceProbe() {
  const { user, updateNotificationSoundPreferences } = useAuth();
  const preferences = {
    trade_opened: "bell",
    trade_closed: "retro",
    kairos_peak: "double",
    kairos_surge: "chime",
  };
  return (
    <>
      <span>{user?.notification_sounds?.trade_opened || "unset"}</span>
      <button
        type="button"
        onClick={() => updateNotificationSoundPreferences(preferences)}
      >
        Save notification sounds
      </button>
    </>
  );
}

function LanguagePreferenceProbe() {
  const { user, updateLanguagePreference } = useAuth();
  return (
    <>
      <span>{user?.language_preference || "unset"}</span>
      <button
        type="button"
        onClick={() => updateLanguagePreference("es")}
      >
        Save language
      </button>
    </>
  );
}

test("saves theme preferences to the signed-in account", async () => {
  const user = {
    id: 7,
    role: "member",
    theme_mode: null,
    theme_palette: null,
  };
  const fetchMock = vi.fn(async (url) => {
    if (url === "/api/auth/me") {
      return { ok: true, status: 200, json: async () => user };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ theme_mode: "light", theme_palette: "ocean" }),
    };
  });
  vi.stubGlobal("fetch", fetchMock);

  render(
    <AuthProvider>
      <ThemePreferenceProbe />
    </AuthProvider>,
  );

  await waitFor(() => expect(screen.getByText("unset")).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "Save theme" }));

  await waitFor(() => expect(screen.getByText("light")).toBeInTheDocument());
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/auth/preferences",
    expect.objectContaining({
      method: "PUT",
      credentials: "same-origin",
      body: JSON.stringify({ mode: "light", palette: "ocean" }),
    }),
  );
});

test("saves notification sound preferences to the signed-in account", async () => {
  const user = { id: 18, role: "member", notification_sounds: null };
  const savedPreferences = {
    trade_opened: "bell",
    trade_closed: "retro",
    kairos_peak: "double",
    kairos_surge: "chime",
  };
  const fetchMock = vi.fn(async (url) => {
    if (url === "/api/auth/me") {
      return { ok: true, status: 200, json: async () => user };
    }
    return { ok: true, status: 200, json: async () => savedPreferences };
  });
  vi.stubGlobal("fetch", fetchMock);

  render(
    <AuthProvider>
      <NotificationPreferenceProbe />
    </AuthProvider>,
  );

  await waitFor(() => expect(screen.getByText("unset")).toBeInTheDocument());
  fireEvent.click(
    screen.getByRole("button", { name: "Save notification sounds" }),
  );

  await waitFor(() => expect(screen.getByText("bell")).toBeInTheDocument());
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/auth/notification-preferences",
    expect.objectContaining({
      method: "PUT",
      credentials: "same-origin",
      body: JSON.stringify(savedPreferences),
    }),
  );
});

test("saves language preference to the signed-in account", async () => {
  const user = { id: 23, role: "member", language_preference: null };
  const fetchMock = vi.fn(async (url) => {
    if (url === "/api/auth/me") {
      return { ok: true, status: 200, json: async () => user };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ language_preference: "es" }),
    };
  });
  vi.stubGlobal("fetch", fetchMock);

  render(
    <AuthProvider>
      <LanguagePreferenceProbe />
    </AuthProvider>,
  );

  await waitFor(() => expect(screen.getByText("unset")).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "Save language" }));

  await waitFor(() => expect(screen.getByText("es")).toBeInTheDocument());
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/auth/language-preference",
    expect.objectContaining({
      method: "PUT",
      credentials: "same-origin",
      body: JSON.stringify({ language: "es" }),
    }),
  );
});
