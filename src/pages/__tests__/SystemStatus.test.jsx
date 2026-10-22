import React from "react";
import { afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { MemoryRouter } from "react-router-dom";
import SystemStatus from "../SystemStatus";
import { getSystemStatus } from "../../api/systemStatus";

vi.mock("../../api/systemStatus", () => ({
  getSystemStatus: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

const report = {
  status: "degraded",
  checked_at: "2026-10-21T22:00:00Z",
  api: { status: "healthy", uptime_seconds: 3600, version: "1.0.0" },
  database: { status: "healthy" },
  history: { available: true, retention_days: 183 },
  services: [
    {
      id: "main_loop",
      status: "running",
      activity: "active",
      uptime_percent: 99.8,
      uptime_seconds: 123456,
      downtime_seconds: 300,
      observed_seconds: 123756,
    },
    {
      id: "auto_trader",
      status: "stopped",
      uptime_percent: 85,
      uptime_seconds: 100000,
      downtime_seconds: 1800,
      observed_seconds: 101800,
    },
    {
      id: "scanner_service",
      status: "running",
      activity: "scanning",
      uptime_percent: 99,
      uptime_seconds: 120000,
      downtime_seconds: 500,
      observed_seconds: 120500,
    },
    {
      id: "telegram_bot",
      status: "unknown",
      uptime_percent: null,
      uptime_seconds: 0,
      downtime_seconds: 0,
      observed_seconds: 0,
    },
  ],
  incidents: [
    {
      service_id: "auto_trader",
      started_at: "2026-10-20T10:00:00Z",
      ended_at: "2026-10-20T10:30:00Z",
      duration_seconds: 1800,
      ongoing: false,
    },
  ],
  endpoints: [
    { method: "GET", path: "/health", status: "registered" },
    { method: "GET", path: "/api/state", status: "registered" },
  ],
};

function renderPage({ publicView = false } = {}) {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={createTheme()}>
        <SystemStatus publicView={publicView} />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

test("shows API, database, four service, uptime, and incident status", async () => {
  getSystemStatus.mockResolvedValue(report);
  renderPage();

  expect(await screen.findByText("Main protection loop")).toBeInTheDocument();
  expect(screen.getAllByText("Auto trader")).toHaveLength(2);
  expect(screen.getByText("Scanner service")).toBeInTheDocument();
  expect(screen.getByText("Telegram bot")).toBeInTheDocument();
  expect(screen.getByText("/api/state")).toBeInTheDocument();
  expect(screen.getAllByText("Running")).toHaveLength(2);
  expect(screen.getByText("Stopped")).toBeInTheDocument();
  expect(
    screen.getByText("Uptime: 99.8% (of monitored time)"),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Recorded downtime incidents (last 183 days)"),
  ).toBeInTheDocument();
  expect(screen.queryByText("Process ID")).not.toBeInTheDocument();
});

test("public view uses sanitized service labels and omits admin-only status", async () => {
  getSystemStatus.mockResolvedValue({
    status: "degraded",
    checked_at: report.checked_at,
    api: { status: "healthy", uptime_seconds: 500 },
    history: { available: true, retention_days: 183 },
    services: [
      {
        id: "trading_engine",
        status: "running",
        uptime_percent: 100,
        uptime_seconds: 500,
        downtime_seconds: 0,
        observed_seconds: 500,
      },
      {
        id: "trade_evaluation",
        status: "stopped",
        uptime_percent: 90,
        uptime_seconds: 450,
        downtime_seconds: 50,
        observed_seconds: 500,
      },
      {
        id: "market_scanner",
        status: "running",
        uptime_percent: 100,
        uptime_seconds: 500,
        downtime_seconds: 0,
        observed_seconds: 500,
      },
      {
        id: "notifications",
        status: "unknown",
        uptime_percent: null,
        uptime_seconds: 0,
        downtime_seconds: 0,
        observed_seconds: 0,
      },
    ],
    incidents: [
      {
        service_id: "trade_evaluation",
        started_at: "2026-10-20T10:00:00Z",
        ended_at: null,
        duration_seconds: 60,
        ongoing: true,
      },
    ],
  });

  renderPage({ publicView: true });

  expect(await screen.findByText("Trading engine")).toBeInTheDocument();
  expect(screen.getAllByText("Trade evaluation")).toHaveLength(2);
  expect(screen.getByText("Notifications")).toBeInTheDocument();
  expect(screen.queryByText("Auto trader")).not.toBeInTheDocument();
  expect(screen.queryByText("Database")).not.toBeInTheDocument();
  expect(screen.queryByText("Core API endpoints")).not.toBeInTheDocument();
  expect(getSystemStatus).toHaveBeenCalledWith({ publicView: true });
});

test("announces when the status API cannot be reached", async () => {
  getSystemStatus.mockRejectedValue(new Error("offline"));
  renderPage();

  await waitFor(() => {
    expect(
      screen.getByText(
        "The status API could not be reached. Other service states are unavailable.",
      ),
    ).toBeInTheDocument();
  });
  expect(screen.getByText("Unavailable")).toBeInTheDocument();
});
