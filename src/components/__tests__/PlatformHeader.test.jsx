import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const renderHeader = ({
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

  test("updates and persists the shared timezone selection", () => {
    const setTimeZone = vi.fn();
    renderHeader({ setTimeZone });

    fireEvent.change(screen.getByRole("combobox", { name: "Time zone" }), {
      target: { value: "Asia/Tokyo" },
    });

    expect(setTimeZone).toHaveBeenCalledWith("Asia/Tokyo");
    expect(window.localStorage.getItem("timeZone")).toBe("Asia/Tokyo");
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
    await waitFor(() => {
      expect(
        JSON.parse(
          window.localStorage.getItem(NOTIFICATION_HISTORY_STORAGE_KEY),
        )[0].read,
      ).toBe(true);
    });
  });
});
