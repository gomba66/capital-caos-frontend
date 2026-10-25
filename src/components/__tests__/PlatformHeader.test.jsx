import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PlatformHeader from "../PlatformHeader";
import NotificationProvider, {
  NOTIFICATION_HISTORY_STORAGE_KEY,
} from "../../contexts/NotificationProvider";
import {
  CurrencyContext,
  PlatformThemeContext,
  TimeZoneContext,
} from "../../contexts/AppContexts";
import { AuthContext } from "../../contexts/authState";
import { APP_PALETTES } from "../../theme";
import i18n from "../../i18n";

const renderHeader = ({
  user = {
    role: "member",
    features: ["signals", "bot_trades"],
  },
  updateLanguagePreference = vi.fn(),
  mode = "dark",
  setMode = vi.fn(),
  palette = "classic",
  setPalette = vi.fn(),
  timeZone = "America/Bogota",
  setTimeZone = vi.fn(),
  currency = "USDT",
  setCurrency = vi.fn(),
} = {}) =>
  render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user, updateLanguagePreference }}>
        <PlatformThemeContext.Provider
          value={{ mode, setMode, palette, setPalette }}
        >
          <TimeZoneContext.Provider
            value={{ timeZone, setTimeZone }}
          >
            <CurrencyContext.Provider
              value={{ currency, setCurrency }}
            >
              <NotificationProvider>
                <PlatformHeader />
              </NotificationProvider>
            </CurrencyContext.Provider>
          </TimeZoneContext.Provider>
        </PlatformThemeContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>,
  );

describe("PlatformHeader", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("renders Cipher Desk identity and shared platform controls", () => {
    renderHeader();

    expect(screen.getByText("CIPHER DESK")).toBeInTheDocument();
    expect(screen.queryByText("ADMIN")).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Time zone" }),
    ).toHaveValue("America/Bogota");
    expect(
      screen.getByRole("option", { name: "UTC-05:00 · Bogota" }),
    ).toBeInTheDocument();
    expect(screen.getByText("USDT")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Language" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Color theme: Classic Green" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch to light mode" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open notification history" }),
    ).toBeInTheDocument();
  });

  test("shows a concise ADMIN badge only for administrators", () => {
    renderHeader({ user: { role: "admin", features: [] } });

    expect(screen.getByText("ADMIN")).toBeInTheDocument();
    expect(screen.queryByText("ADMIN MODE")).not.toBeInTheDocument();
  });

  test("hides platform data and sections for a no-access account", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderHeader({
      user: { role: "member", plan_code: "no_access", features: [] },
    });

    expect(screen.getByText("CIPHER DESK")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Language" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Color theme: Classic Green" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Time zone" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Capital currency" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open notification history" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Platform status")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("updates and persists the shared timezone selection", () => {
    const setTimeZone = vi.fn();
    renderHeader({ setTimeZone });

    fireEvent.change(screen.getByRole("combobox", { name: "Time zone" }), {
      target: { value: "Asia/Tokyo" },
    });

    expect(setTimeZone).toHaveBeenCalledWith("Asia/Tokyo");
    expect(window.localStorage.getItem("timeZone")).toBe("Asia/Tokyo");
  });

  test("saves language changes to the signed-in account", async () => {
    const updateLanguagePreference = vi.fn().mockResolvedValue({
      language_preference: "es",
    });
    renderHeader({ updateLanguagePreference });

    fireEvent.change(screen.getByRole("combobox", { name: "Language" }), {
      target: { value: "es" },
    });

    await waitFor(() =>
      expect(updateLanguagePreference).toHaveBeenCalledWith("es"),
    );
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Idioma" })).toHaveValue("es"),
    );
    await i18n.changeLanguage("en");
  });

  test("updates the shared currency selection from the header", () => {
    const setCurrency = vi.fn();
    renderHeader({ setCurrency });

    fireEvent.change(
      screen.getByRole("combobox", { name: "Capital currency" }),
      { target: { value: "COP" } },
    );

    expect(setCurrency).toHaveBeenCalledWith("COP");
    expect(screen.getByRole("option", { name: "MXN" })).toBeInTheDocument();
  });

  test("selects a color palette from the header menu", () => {
    const setPalette = vi.fn();
    renderHeader({ setPalette });

    fireEvent.click(
      screen.getByRole("button", { name: "Color theme: Classic Green" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ocean" }));

    expect(setPalette).toHaveBeenCalledWith("ocean");
    expect(
      screen.getByRole("button", { name: "Color theme: Classic Green" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  test("shows all admin palettes only to administrators", () => {
    const adminPalettes = APP_PALETTES.filter(({ adminOnly }) => adminOnly);
    renderHeader();
    fireEvent.click(
      screen.getByRole("button", { name: "Color theme: Classic Green" }),
    );
    for (const { id } of adminPalettes) {
      const name = i18n.t(`theme.palettes.${id}`);
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
    expect(
      screen.getByRole("button", { name: "Classic Green" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ocean" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Violet" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Graphite" })).not.toBeInTheDocument();

    cleanup();
    const setPalette = vi.fn();
    const setMode = vi.fn();
    renderHeader({ user: { role: "admin" }, setPalette, setMode });
    fireEvent.click(
      screen.getByRole("button", { name: "Color theme: Classic Green" }),
    );
    for (const { id } of adminPalettes) {
      const name = i18n.t(`theme.palettes.${id}`);
      fireEvent.click(screen.getByRole("button", { name }));
      expect(setPalette).toHaveBeenCalledWith(id);
      fireEvent.click(
        screen.getByRole("button", { name: /^Color theme:/ }),
      );
    }
  });

  test.each(["admin-monochrome", "admin-lime", "admin-arctic"])(
    "forces dark mode and disables the mode switch for %s",
    (palette) => {
      const setPalette = vi.fn();
      const setMode = vi.fn();
      const selectedName = i18n.t(`theme.palettes.${palette}`);
      renderHeader({
        user: { role: "admin" },
        palette: "classic",
        setPalette,
        setMode,
      });

      fireEvent.click(
        screen.getByRole("button", { name: "Color theme: Classic Green" }),
      );
      fireEvent.click(screen.getByRole("button", { name: selectedName }));
      expect(setPalette).toHaveBeenCalledWith(palette);
      expect(setMode).toHaveBeenCalledWith("dark");

      cleanup();
      renderHeader({ user: { role: "admin" }, palette, mode: "dark" });
      expect(
        screen.getByRole("button", { name: "This theme is available in dark mode only" }),
      ).toBeDisabled();
    },
  );

  test("shows scanner status and active signal count from the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          scanner_status: "scanning",
          last_scan: {
            active_signals: Array.from({ length: 7 }, (_, index) => ({
              symbol: `PAIR${index}/USDT:USDT`,
            })),
          },
        }),
      }),
    );
    renderHeader();

    expect(await screen.findByText("API ONLINE")).toBeInTheDocument();
    const scannerStatus = screen.getByText("SCANNING").closest("span");
    expect(scannerStatus).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Cipher Desk by Siglo Capital home" })
        .querySelector(".brand-icon svg"),
    ).toHaveClass(
      "activity-wave-icon--live",
    );
    expect(screen.queryByText("7 ACTIVE")).not.toBeInTheDocument();
  });

  test("shows the active market session and time until it ends", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          current_session: {
            name: "asia",
            closes_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          },
        }),
      }),
    );
    renderHeader();

    const session = await screen.findByText("Asia");
    expect(session).toBeInTheDocument();
    expect(session.closest(".header-market-session")).toHaveClass(
      "header-market-session--active",
    );
    expect(screen.getByText(/ENDS IN/)).toBeInTheDocument();
  });

  test("marks an active weekend session explicitly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          current_session: {
            name: "new_york",
            closes_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            is_weekend: true,
          },
        }),
      }),
    );
    renderHeader();

    expect(await screen.findByText("* WEEKEND")).toBeInTheDocument();
    expect(screen.getByText("New York")).toBeInTheDocument();
  });

  test("explicitly shows when the market is out of session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          next_session: {
            name: "asia",
            opens_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
          },
        }),
      }),
    );
    renderHeader();

    expect(await screen.findByText("OUT OF SESSION")).toBeInTheDocument();
    expect(screen.getByText("Asia")).toBeInTheDocument();
    expect(screen.getByText(/Opens in/)).toBeInTheDocument();
    expect(
      screen.getByLabelText("OUT OF SESSION").closest(".header-market-session"),
    ).toHaveClass("header-market-session--next");
  });

  test("shows the New York opening countdown during US Brinks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          current_session: {
            name: "us",
            opens_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            closes_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
          },
        }),
      }),
    );
    renderHeader();

    expect(await screen.findByText("US Brinks")).toBeInTheDocument();
    expect(screen.getByText("Within New York")).toBeInTheDocument();
    expect(
      screen.getByText(/^New York opens in \d+m$/),
    ).toBeInTheDocument();
  });

  test("highlights imminent session openings and closings in the header", async () => {
    const now = Date.now();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          current_session: {
            name: "us",
            opens_at: new Date(now - 25 * 60 * 1000).toISOString(),
            closes_at: new Date(now + 4 * 60 * 1000).toISOString(),
          },
        }),
      }),
    );
    renderHeader();

    await screen.findByText("US Brinks");

    expect(screen.getByText(/ENDS IN/)).toHaveClass(
      "session-countdown--urgent",
    );
    expect(
      screen.getByText(/^New York opens in \d+m$/),
    ).toHaveClass("session-countdown--urgent");
  });

  test("shares theme control and notification history outside the scanner page", async () => {
    window.localStorage.setItem(
      NOTIFICATION_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          id: "BTCUSDT:LONG:1000",
          symbol: "BTCUSDT",
          side: "LONG",
          signal_type: "HTF_2H, LO_ADR_D",
          timestamp_ms: 1000,
          read: false,
        },
      ]),
    );
    const setMode = vi.fn();
    renderHeader({ setMode });

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to light mode" }),
    );
    expect(setMode).toHaveBeenCalledWith("light");

    fireEvent.click(
      screen.getByRole("button", { name: "1 unread notifications" }),
    );
    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.queryByText(/HTF_2H|LO_ADR_D/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View BTCUSDT chart" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        JSON.parse(
          window.localStorage.getItem(NOTIFICATION_HISTORY_STORAGE_KEY),
        )[0].read,
      ).toBe(true);
    });
  });

  test("shows accumulated Kairos events in notification history", async () => {
    window.localStorage.setItem(
      NOTIFICATION_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          id: "kairos-peak:1000",
          category: "kairos",
          type: "peak",
          symbol: "Cipher Kairos",
          score: 78,
          timestamp_ms: 1000,
          read: false,
        },
        {
          id: "kairos-surge:2000",
          category: "kairos",
          type: "surge",
          symbol: "Cipher Kairos",
          score: 82,
          timestamp_ms: 2000,
          read: true,
        },
      ]),
    );
    renderHeader();

    fireEvent.click(
      screen.getByRole("button", { name: "1 unread notifications" }),
    );

    expect(screen.getByText("Kairos index peak")).toBeInTheDocument();
    expect(
      screen.getByText("Signal convergence confirmed"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Cipher Kairos")).toHaveLength(2);
    expect(screen.getByText(/Index reached 78/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /View Cipher Kairos chart/ }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      const history = JSON.parse(
        window.localStorage.getItem(NOTIFICATION_HISTORY_STORAGE_KEY),
      );
      expect(history.every((event) => event.read)).toBe(true);
    });
  });

  test("opens a TradingView chart from a notification", () => {
    window.localStorage.setItem(
      NOTIFICATION_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          id: "BTCUSDT:LONG:1000",
          symbol: "BTCUSDT",
          side: "LONG",
          timestamp_ms: 1000,
          read: true,
        },
      ]),
    );
    renderHeader();

    fireEvent.click(
      screen.getByRole("button", { name: "Open notification history" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "View BTCUSDT chart" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "BTCUSDT" })).toBeInTheDocument();
  });
});
