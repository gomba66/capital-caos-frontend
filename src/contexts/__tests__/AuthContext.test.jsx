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
