import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import WeeklyPerformanceChart from "../WeeklyPerformanceChart";

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("WeeklyPerformanceChart", () => {
  const mockOperations = [
    {
      closed_at: "2024-01-15T10:00:00Z", // Monday
      pnl: 100,
      result: "win",
      side: "LONG",
    },
    {
      closed_at: "2024-01-16T10:00:00Z", // Tuesday
      pnl: -50,
      result: "loss",
      side: "SHORT",
    },
  ];

  test("renders weekly performance chart with title", () => {
    renderWithTheme(<WeeklyPerformanceChart operations={mockOperations} />);

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      screen.getByText(/This chart shows total PnL by day of the week/)
    ).toBeInTheDocument();
  });

  test("renders chart with operations data", () => {
    renderWithTheme(<WeeklyPerformanceChart operations={mockOperations} />);

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    // Verificar que el chart se renderiza
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles empty operations", () => {
    renderWithTheme(<WeeklyPerformanceChart operations={[]} />);

    expect(
      screen.getByText("No closed trades to display weekly performance.")
    ).toBeInTheDocument();
  });

  test("handles null operations", () => {
    renderWithTheme(<WeeklyPerformanceChart operations={null} />);

    expect(
      screen.getByText("No closed trades to display weekly performance.")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas inválidas", () => {
    const operationsWithInvalidDates = [
      {
        closed_at: "invalid-date",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithInvalidDates} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl como string", () => {
    const operationsWithStringPnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: "100",
        result: "win",
      },
      {
        closed_at: "2024-01-16T10:00:00Z",
        pnl: "-50.5",
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithStringPnl} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl null o undefined", () => {
    const operationsWithNullPnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: null,
        result: "win",
      },
      {
        closed_at: "2024-01-16T10:00:00Z",
        pnl: undefined,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithNullPnl} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con resultados undefined", () => {
    const operationsWithUndefinedResults = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: undefined,
      },
      {
        closed_at: "2024-01-16T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithUndefinedResults} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato diferente", () => {
    const operationsWithDifferentDateFormats = [
      {
        closed_at: "2024-01-15 10:00:00",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-16 15:30:00",
        pnl: 75,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithDifferentDateFormats} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con diferentes timezones", () => {
    renderWithTheme(
      <WeeklyPerformanceChart
        operations={mockOperations}
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con side en diferentes formatos", () => {
    const operationsWithDifferentSideFormats = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: "LONG",
      },
      {
        closed_at: "2024-01-16T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "SHORT",
      },
      {
        closed_at: "2024-01-17T10:00:00Z",
        pnl: 75,
        result: "win",
        side: "long",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithDifferentSideFormats} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl negativo", () => {
    const operationsWithNegativePnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: -100,
        result: "loss",
      },
      {
        closed_at: "2024-01-16T10:00:00Z",
        pnl: -50.5,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithNegativePnl} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl como string negativo", () => {
    const operationsWithStringNegativePnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: "-100",
        result: "loss",
      },
      {
        closed_at: "2024-01-16T10:00:00Z",
        pnl: "-50.5",
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithStringNegativePnl} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl como string vacío", () => {
    const operationsWithEmptyStringPnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: "",
        result: "win",
      },
      {
        closed_at: "2024-01-16T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithEmptyStringPnl} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas fuera del rango", () => {
    const operationsWithOutOfRangeDates = [
      {
        closed_at: "2023-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2025-01-16T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithOutOfRangeDates} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con closeTime en lugar de closed_at", () => {
    const operationsWithCloseTime = [
      {
        closeTime: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closeTime: "2024-01-16T10:00:00Z",
        pnl: 75,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithCloseTime} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones sin closed_at o closeTime", () => {
    const operationsWithoutCloseDate = [
      {
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-16T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithoutCloseDate} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl cero", () => {
    const operationsWithZeroPnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 0,
        result: "win",
      },
      {
        closed_at: "2024-01-16T10:00:00Z",
        pnl: 0,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithZeroPnl} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con todas ganadoras", () => {
    const operationsWithAllWins = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-16T10:00:00Z",
        pnl: 50,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithAllWins} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con todas perdedoras", () => {
    const operationsWithAllLosses = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: -100,
        result: "loss",
      },
      {
        closed_at: "2024-01-16T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyPerformanceChart operations={operationsWithAllLosses} />
    );

    expect(screen.getByText("Weekly Performance by Day")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });
});
