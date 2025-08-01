import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import MonthlyPerformanceChart from "../MonthlyPerformanceChart";

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("MonthlyPerformanceChart", () => {
  const mockOperations = [
    {
      closed_at: "2024-01-15T10:00:00Z",
      pnl: 100,
      result: "win",
    },
    {
      closed_at: "2024-01-20T10:00:00Z",
      pnl: -50,
      result: "loss",
    },
    {
      closed_at: "2024-02-10T10:00:00Z",
      pnl: 75,
      result: "win",
    },
  ];

  test("renders monthly performance chart with title", () => {
    renderWithTheme(<MonthlyPerformanceChart operations={mockOperations} />);

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      screen.getByText(/This chart shows total PnL by month of the year/)
    ).toBeInTheDocument();
  });

  test("renders chart with operations data", () => {
    renderWithTheme(<MonthlyPerformanceChart operations={mockOperations} />);

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    // Verificar que el chart se renderiza
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with closeTime instead of closed_at", () => {
    const operationsWithCloseTime = [
      {
        closeTime: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closeTime: "2024-02-10T10:00:00Z",
        pnl: 75,
        result: "win",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithCloseTime} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with string pnl values", () => {
    const operationsWithStringPnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: "100",
        result: "win",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: "-50.5",
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithStringPnl} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations without closed_at or closeTime", () => {
    const operationsWithoutCloseDate = [
      {
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
      <MonthlyPerformanceChart operations={operationsWithoutCloseDate} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with missing pnl", () => {
    const operationsWithMissingPnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        result: "win",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithMissingPnl} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with different timezone", () => {
    renderWithTheme(
      <MonthlyPerformanceChart
        operations={mockOperations}
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with invalid dates", () => {
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
      <MonthlyPerformanceChart operations={operationsWithInvalidDates} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with all wins", () => {
    const operationsWithAllWins = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: 50,
        result: "win",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithAllWins} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with all losses", () => {
    const operationsWithAllLosses = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: -100,
        result: "loss",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithAllLosses} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with zero pnl", () => {
    const operationsWithZeroPnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 0,
        result: "win",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: 0,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithZeroPnl} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles empty operations", () => {
    renderWithTheme(<MonthlyPerformanceChart operations={[]} />);

    expect(
      screen.getByText("No closed trades to display monthly performance.")
    ).toBeInTheDocument();
  });

  test("handles null operations", () => {
    renderWithTheme(<MonthlyPerformanceChart operations={null} />);

    expect(
      screen.getByText("No closed trades to display monthly performance.")
    ).toBeInTheDocument();
  });

  test("maneja filtros de operaciones (long/short)", () => {
    const operationsWithSides = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-02-10T10:00:00Z",
        pnl: 75,
        result: "win",
        side: "long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithSides} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
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
        closed_at: "2024-02-10 15:30:00",
        pnl: 75,
        result: "win",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithDifferentDateFormats}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
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
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithUndefinedResults} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl como número negativo", () => {
    const operationsWithNegativePnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: -100,
        result: "loss",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50.5,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithNegativePnl} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
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
        closed_at: "2024-01-20T10:00:00Z",
        pnl: "-50.5",
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithStringNegativePnl} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas fuera del rango actual", () => {
    const operationsWithOutOfRangeDates = [
      {
        closed_at: "2023-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2025-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithOutOfRangeDates} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
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
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "SHORT",
      },
      {
        closed_at: "2024-02-10T10:00:00Z",
        pnl: 75,
        result: "win",
        side: "long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithDifferentSideFormats}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl como null", () => {
    const operationsWithNullPnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: null,
        result: "win",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithNullPnl} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl como undefined", () => {
    const operationsWithUndefinedPnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: undefined,
        result: "win",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithUndefinedPnl} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
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
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithEmptyStringPnl} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes años", () => {
    const operationsWithDifferentYears = [
      {
        closed_at: "2023-12-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2025-02-10T10:00:00Z",
        pnl: 75,
        result: "win",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithDifferentYears} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en meses extremos", () => {
    const operationsWithExtremeMonths = [
      {
        closed_at: "2024-01-01T10:00:00Z", // Enero
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-12-31T10:00:00Z", // Diciembre
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithExtremeMonths} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato ISO sin zona horaria", () => {
    const operationsWithISODates = [
      {
        closed_at: "2024-01-15T10:00:00",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T15:30:00",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithISODates} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato de fecha simple", () => {
    const operationsWithSimpleDates = [
      {
        closed_at: "2024-01-15",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithSimpleDates} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con side en mayúsculas", () => {
    const operationsWithUpperCaseSide = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: "LONG",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "SHORT",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithUpperCaseSide} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con side mixto", () => {
    const operationsWithMixedSide = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "SHORT",
      },
      {
        closed_at: "2024-02-10T10:00:00Z",
        pnl: 75,
        result: "win",
        side: "Long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithMixedSide} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con side undefined", () => {
    const operationsWithUndefinedSide = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: undefined,
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: null,
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithUndefinedSide} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con side como string vacío", () => {
    const operationsWithEmptySide = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: "",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "   ",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithEmptySide} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl como número decimal", () => {
    const operationsWithDecimalPnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100.75,
        result: "win",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50.25,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithDecimalPnl} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl como string decimal", () => {
    const operationsWithStringDecimalPnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: "100.75",
        result: "win",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: "-50.25",
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithStringDecimalPnl} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes años", () => {
    const operationsWithDifferentYears = [
      {
        closed_at: "2023-12-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2025-02-10T10:00:00Z",
        pnl: 75,
        result: "win",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithDifferentYears} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en meses extremos", () => {
    const operationsWithExtremeMonths = [
      {
        closed_at: "2024-01-01T10:00:00Z", // Enero
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-12-31T10:00:00Z", // Diciembre
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithExtremeMonths} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato ISO sin zona horaria", () => {
    const operationsWithISODates = [
      {
        closed_at: "2024-01-15T10:00:00",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T15:30:00",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithISODates} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato de fecha simple", () => {
    const operationsWithSimpleDates = [
      {
        closed_at: "2024-01-15",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithSimpleDates} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con side en mayúsculas", () => {
    const operationsWithUpperCaseSide = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: "LONG",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "SHORT",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithUpperCaseSide} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con side mixto", () => {
    const operationsWithMixedSide = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "SHORT",
      },
      {
        closed_at: "2024-02-10T10:00:00Z",
        pnl: 75,
        result: "win",
        side: "Long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithMixedSide} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con side undefined", () => {
    const operationsWithUndefinedSide = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: undefined,
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: null,
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithUndefinedSide} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con side como string vacío", () => {
    const operationsWithEmptySide = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: "",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "   ",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithEmptySide} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl como número decimal", () => {
    const operationsWithDecimalPnl = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100.75,
        result: "win",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50.25,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithDecimalPnl} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
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
      <MonthlyPerformanceChart operations={operationsWithInvalidDates} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas que no coinciden con meses mostrados", () => {
    const operationsWithNonMatchingMonths = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-12-20T10:00:00Z", // Diciembre, fuera del rango normal
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithNonMatchingMonths} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
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
      <MonthlyPerformanceChart operations={operationsWithCloseTime} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
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
      <MonthlyPerformanceChart operations={operationsWithoutCloseDate} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con diferentes timezones", () => {
    renderWithTheme(
      <MonthlyPerformanceChart
        operations={mockOperations}
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con timezone UTC", () => {
    renderWithTheme(
      <MonthlyPerformanceChart operations={mockOperations} timeZone="UTC" />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con timezone Europe/London", () => {
    renderWithTheme(
      <MonthlyPerformanceChart
        operations={mockOperations}
        timeZone="Europe/London"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss", () => {
    const operationsWithCustomFormat = [
      {
        closed_at: "2024-01-15 10:00:00",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20 15:30:00",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithCustomFormat} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd", () => {
    const operationsWithDateOnly = [
      {
        closed_at: "2024-01-15",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithDateOnly} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato MM/dd/yyyy", () => {
    const operationsWithSlashFormat = [
      {
        closed_at: "01/15/2024",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "02/20/2024",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithSlashFormat} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato dd-MM-yyyy", () => {
    const operationsWithDashFormat = [
      {
        closed_at: "15-01-2024",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "20-02-2024",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithDashFormat} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato timestamp", () => {
    const operationsWithTimestamp = [
      {
        closed_at: "1705312800", // Unix timestamp
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "1708444800", // Unix timestamp
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithTimestamp} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato ISO con milisegundos", () => {
    const operationsWithMilliseconds = [
      {
        closed_at: "2024-01-15T10:00:00.000Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T15:30:00.500Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithMilliseconds} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes años específicos", () => {
    const operationsWithSpecificYears = [
      {
        closed_at: "2020-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2021-02-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2022-03-10T10:00:00Z",
        pnl: 75,
        result: "win",
      },
      {
        closed_at: "2023-04-15T10:00:00Z",
        pnl: -25,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithSpecificYears} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en meses bisiestos", () => {
    const operationsWithLeapYear = [
      {
        closed_at: "2024-02-29T10:00:00Z", // 29 de febrero en año bisiesto
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-28T10:00:00Z", // 28 de febrero en año bisiesto
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithLeapYear} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en meses no bisiestos", () => {
    const operationsWithNonLeapYear = [
      {
        closed_at: "2023-02-28T10:00:00Z", // 28 de febrero en año no bisiesto
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2023-02-27T10:00:00Z", // 27 de febrero en año no bisiesto
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithNonLeapYear} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en días especiales", () => {
    const operationsWithSpecialDays = [
      {
        closed_at: "2024-12-25T10:00:00Z", // Navidad
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-01T00:00:00Z", // Año nuevo
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2024-07-04T10:00:00Z", // 4 de julio
        pnl: 75,
        result: "win",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithSpecialDays} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes zonas horarias extremas", () => {
    const operationsWithExtremeTimezones = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithExtremeTimezones}
        timeZone="Pacific/Auckland"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en zona horaria Asia/Tokyo", () => {
    const operationsWithTokyoTimezone = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithTokyoTimezone}
        timeZone="Asia/Tokyo"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en zona horaria Australia/Sydney", () => {
    const operationsWithSydneyTimezone = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithSydneyTimezone}
        timeZone="Australia/Sydney"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en zona horaria Europe/Berlin", () => {
    const operationsWithBerlinTimezone = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithBerlinTimezone}
        timeZone="Europe/Berlin"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en zona horaria America/New_York", () => {
    const operationsWithNYTimezone = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithNYTimezone}
        timeZone="America/New_York"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en zona horaria America/Los_Angeles", () => {
    const operationsWithLATimezone = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithLATimezone}
        timeZone="America/Los_Angeles"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en zona horaria America/Sao_Paulo", () => {
    const operationsWithSaoPauloTimezone = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithSaoPauloTimezone}
        timeZone="America/Sao_Paulo"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en zona horaria Asia/Shanghai", () => {
    const operationsWithShanghaiTimezone = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithShanghaiTimezone}
        timeZone="Asia/Shanghai"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en zona horaria Asia/Dubai", () => {
    const operationsWithDubaiTimezone = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithDubaiTimezone}
        timeZone="Asia/Dubai"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con filtro de tipo long", () => {
    const operationsWithLongFilter = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-01-25T10:00:00Z",
        pnl: 75,
        result: "win",
        side: "long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithLongFilter} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con filtro de tipo short", () => {
    const operationsWithShortFilter = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-01-25T10:00:00Z",
        pnl: 75,
        result: "win",
        side: "short",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithShortFilter} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss", () => {
    const operationsWithCustomFormat = [
      {
        closed_at: "2024-01-15 10:00:00",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20 15:30:00",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithCustomFormat} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas inválidas en formato yyyy-MM-dd HH:mm:ss", () => {
    const operationsWithInvalidCustomFormat = [
      {
        closed_at: "invalid-date-format",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithInvalidCustomFormat} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes meses específicos", () => {
    const operationsWithSpecificMonths = [
      {
        closed_at: "2024-01-15T10:00:00Z", // Enero
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T10:00:00Z", // Febrero
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2024-03-10T10:00:00Z", // Marzo
        pnl: 75,
        result: "win",
      },
      {
        closed_at: "2024-04-15T10:00:00Z", // Abril
        pnl: -25,
        result: "loss",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // Mayo
        pnl: 150,
        result: "win",
      },
      {
        closed_at: "2024-06-25T10:00:00Z", // Junio
        pnl: -75,
        result: "loss",
      },
      {
        closed_at: "2024-07-30T10:00:00Z", // Julio
        pnl: 200,
        result: "win",
      },
      {
        closed_at: "2024-08-05T10:00:00Z", // Agosto
        pnl: -100,
        result: "loss",
      },
      {
        closed_at: "2024-09-10T10:00:00Z", // Septiembre
        pnl: 125,
        result: "win",
      },
      {
        closed_at: "2024-10-15T10:00:00Z", // Octubre
        pnl: -60,
        result: "loss",
      },
      {
        closed_at: "2024-11-20T10:00:00Z", // Noviembre
        pnl: 175,
        result: "win",
      },
      {
        closed_at: "2024-12-25T10:00:00Z", // Diciembre
        pnl: -80,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithSpecificMonths} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes años específicos", () => {
    const operationsWithSpecificYears = [
      {
        closed_at: "2020-01-15T10:00:00Z", // 2020
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2021-02-20T10:00:00Z", // 2021
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2022-03-10T10:00:00Z", // 2022
        pnl: 75,
        result: "win",
      },
      {
        closed_at: "2023-04-15T10:00:00Z", // 2023
        pnl: -25,
        result: "loss",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // 2024
        pnl: 150,
        result: "win",
      },
      {
        closed_at: "2025-06-25T10:00:00Z", // 2025
        pnl: -75,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithSpecificYears} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes años y meses", () => {
    const operationsWithDifferentYearsAndMonths = [
      {
        closed_at: "2020-01-15T10:00:00Z", // 2020 Enero
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2021-02-20T10:00:00Z", // 2021 Febrero
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2022-03-10T10:00:00Z", // 2022 Marzo
        pnl: 75,
        result: "win",
      },
      {
        closed_at: "2023-04-15T10:00:00Z", // 2023 Abril
        pnl: -25,
        result: "loss",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // 2024 Mayo
        pnl: 150,
        result: "win",
      },
      {
        closed_at: "2025-06-25T10:00:00Z", // 2025 Junio
        pnl: -75,
        result: "loss",
      },
      {
        closed_at: "2020-07-30T10:00:00Z", // 2020 Julio
        pnl: 200,
        result: "win",
      },
      {
        closed_at: "2021-08-05T10:00:00Z", // 2021 Agosto
        pnl: -100,
        result: "loss",
      },
      {
        closed_at: "2022-09-10T10:00:00Z", // 2022 Septiembre
        pnl: 125,
        result: "win",
      },
      {
        closed_at: "2023-10-15T10:00:00Z", // 2023 Octubre
        pnl: -60,
        result: "loss",
      },
      {
        closed_at: "2024-11-20T10:00:00Z", // 2024 Noviembre
        pnl: 175,
        result: "win",
      },
      {
        closed_at: "2025-12-25T10:00:00Z", // 2025 Diciembre
        pnl: -80,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithDifferentYearsAndMonths}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes años y meses con showAllMonths", () => {
    const operationsWithDifferentYearsAndMonths = [
      {
        closed_at: "2020-01-15T10:00:00Z", // 2020 Enero
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2021-02-20T10:00:00Z", // 2021 Febrero
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2022-03-10T10:00:00Z", // 2022 Marzo
        pnl: 75,
        result: "win",
      },
      {
        closed_at: "2023-04-15T10:00:00Z", // 2023 Abril
        pnl: -25,
        result: "loss",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // 2024 Mayo
        pnl: 150,
        result: "win",
      },
      {
        closed_at: "2025-06-25T10:00:00Z", // 2025 Junio
        pnl: -75,
        result: "loss",
      },
      {
        closed_at: "2020-07-30T10:00:00Z", // 2020 Julio
        pnl: 200,
        result: "win",
      },
      {
        closed_at: "2021-08-05T10:00:00Z", // 2021 Agosto
        pnl: -100,
        result: "loss",
      },
      {
        closed_at: "2022-09-10T10:00:00Z", // 2022 Septiembre
        pnl: 125,
        result: "win",
      },
      {
        closed_at: "2023-10-15T10:00:00Z", // 2023 Octubre
        pnl: -60,
        result: "loss",
      },
      {
        closed_at: "2024-11-20T10:00:00Z", // 2024 Noviembre
        pnl: 175,
        result: "win",
      },
      {
        closed_at: "2025-12-25T10:00:00Z", // 2025 Diciembre
        pnl: -80,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithDifferentYearsAndMonths}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes años y meses con showAllMonths y filtro long", () => {
    const operationsWithDifferentYearsAndMonths = [
      {
        closed_at: "2020-01-15T10:00:00Z", // 2020 Enero
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2021-02-20T10:00:00Z", // 2021 Febrero
        pnl: -50,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2022-03-10T10:00:00Z", // 2022 Marzo
        pnl: 75,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2023-04-15T10:00:00Z", // 2023 Abril
        pnl: -25,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // 2024 Mayo
        pnl: 150,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2025-06-25T10:00:00Z", // 2025 Junio
        pnl: -75,
        result: "loss",
        side: "long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithDifferentYearsAndMonths}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes años y meses con showAllMonths y filtro short", () => {
    const operationsWithDifferentYearsAndMonths = [
      {
        closed_at: "2020-01-15T10:00:00Z", // 2020 Enero
        pnl: 100,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2021-02-20T10:00:00Z", // 2021 Febrero
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2022-03-10T10:00:00Z", // 2022 Marzo
        pnl: 75,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2023-04-15T10:00:00Z", // 2023 Abril
        pnl: -25,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // 2024 Mayo
        pnl: 150,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2025-06-25T10:00:00Z", // 2025 Junio
        pnl: -75,
        result: "loss",
        side: "short",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithDifferentYearsAndMonths}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con showAllMonths activado", () => {
    const operationsWithAllMonths = [
      {
        closed_at: "2024-01-15T10:00:00Z", // Enero
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T10:00:00Z", // Febrero
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2024-03-10T10:00:00Z", // Marzo
        pnl: 75,
        result: "win",
      },
      {
        closed_at: "2024-04-15T10:00:00Z", // Abril
        pnl: -25,
        result: "loss",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // Mayo
        pnl: 150,
        result: "win",
      },
      {
        closed_at: "2024-06-25T10:00:00Z", // Junio
        pnl: -75,
        result: "loss",
      },
      {
        closed_at: "2024-07-30T10:00:00Z", // Julio
        pnl: 200,
        result: "win",
      },
      {
        closed_at: "2024-08-05T10:00:00Z", // Agosto
        pnl: -100,
        result: "loss",
      },
      {
        closed_at: "2024-09-10T10:00:00Z", // Septiembre
        pnl: 125,
        result: "win",
      },
      {
        closed_at: "2024-10-15T10:00:00Z", // Octubre
        pnl: -60,
        result: "loss",
      },
      {
        closed_at: "2024-11-20T10:00:00Z", // Noviembre
        pnl: 175,
        result: "win",
      },
      {
        closed_at: "2024-12-25T10:00:00Z", // Diciembre
        pnl: -80,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithAllMonths} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con showAllMonths activado y filtro long", () => {
    const operationsWithAllMonthsAndLongFilter = [
      {
        closed_at: "2024-01-15T10:00:00Z", // Enero
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-02-20T10:00:00Z", // Febrero
        pnl: -50,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-03-10T10:00:00Z", // Marzo
        pnl: 75,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2024-04-15T10:00:00Z", // Abril
        pnl: -25,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // Mayo
        pnl: 150,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-06-25T10:00:00Z", // Junio
        pnl: -75,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-07-30T10:00:00Z", // Julio
        pnl: 200,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2024-08-05T10:00:00Z", // Agosto
        pnl: -100,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-09-10T10:00:00Z", // Septiembre
        pnl: 125,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-10-15T10:00:00Z", // Octubre
        pnl: -60,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-11-20T10:00:00Z", // Noviembre
        pnl: 175,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2024-12-25T10:00:00Z", // Diciembre
        pnl: -80,
        result: "loss",
        side: "short",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithAllMonthsAndLongFilter}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con showAllMonths activado y filtro short", () => {
    const operationsWithAllMonthsAndShortFilter = [
      {
        closed_at: "2024-01-15T10:00:00Z", // Enero
        pnl: 100,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2024-02-20T10:00:00Z", // Febrero
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-03-10T10:00:00Z", // Marzo
        pnl: 75,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-04-15T10:00:00Z", // Abril
        pnl: -25,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // Mayo
        pnl: 150,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2024-06-25T10:00:00Z", // Junio
        pnl: -75,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-07-30T10:00:00Z", // Julio
        pnl: 200,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-08-05T10:00:00Z", // Agosto
        pnl: -100,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-09-10T10:00:00Z", // Septiembre
        pnl: 125,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2024-10-15T10:00:00Z", // Octubre
        pnl: -60,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-11-20T10:00:00Z", // Noviembre
        pnl: 175,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-12-25T10:00:00Z", // Diciembre
        pnl: -80,
        result: "loss",
        side: "long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithAllMonthsAndShortFilter}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con showAllMonths activado y diferentes años", () => {
    const operationsWithAllMonthsAndDifferentYears = [
      {
        closed_at: "2020-01-15T10:00:00Z", // 2020 Enero
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2021-02-20T10:00:00Z", // 2021 Febrero
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2022-03-10T10:00:00Z", // 2022 Marzo
        pnl: 75,
        result: "win",
      },
      {
        closed_at: "2023-04-15T10:00:00Z", // 2023 Abril
        pnl: -25,
        result: "loss",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // 2024 Mayo
        pnl: 150,
        result: "win",
      },
      {
        closed_at: "2025-06-25T10:00:00Z", // 2025 Junio
        pnl: -75,
        result: "loss",
      },
      {
        closed_at: "2020-07-30T10:00:00Z", // 2020 Julio
        pnl: 200,
        result: "win",
      },
      {
        closed_at: "2021-08-05T10:00:00Z", // 2021 Agosto
        pnl: -100,
        result: "loss",
      },
      {
        closed_at: "2022-09-10T10:00:00Z", // 2022 Septiembre
        pnl: 125,
        result: "win",
      },
      {
        closed_at: "2023-10-15T10:00:00Z", // 2023 Octubre
        pnl: -60,
        result: "loss",
      },
      {
        closed_at: "2024-11-20T10:00:00Z", // 2024 Noviembre
        pnl: 175,
        result: "win",
      },
      {
        closed_at: "2025-12-25T10:00:00Z", // 2025 Diciembre
        pnl: -80,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithAllMonthsAndDifferentYears}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con showAllMonths activado y diferentes años con filtro long", () => {
    const operationsWithAllMonthsAndDifferentYearsLong = [
      {
        closed_at: "2020-01-15T10:00:00Z", // 2020 Enero
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2021-02-20T10:00:00Z", // 2021 Febrero
        pnl: -50,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2022-03-10T10:00:00Z", // 2022 Marzo
        pnl: 75,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2023-04-15T10:00:00Z", // 2023 Abril
        pnl: -25,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // 2024 Mayo
        pnl: 150,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2025-06-25T10:00:00Z", // 2025 Junio
        pnl: -75,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2020-07-30T10:00:00Z", // 2020 Julio
        pnl: 200,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2021-08-05T10:00:00Z", // 2021 Agosto
        pnl: -100,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2022-09-10T10:00:00Z", // 2022 Septiembre
        pnl: 125,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2023-10-15T10:00:00Z", // 2023 Octubre
        pnl: -60,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-11-20T10:00:00Z", // 2024 Noviembre
        pnl: 175,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2025-12-25T10:00:00Z", // 2025 Diciembre
        pnl: -80,
        result: "loss",
        side: "short",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithAllMonthsAndDifferentYearsLong}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con showAllMonths activado y diferentes años con filtro short", () => {
    const operationsWithAllMonthsAndDifferentYearsShort = [
      {
        closed_at: "2020-01-15T10:00:00Z", // 2020 Enero
        pnl: 100,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2021-02-20T10:00:00Z", // 2021 Febrero
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2022-03-10T10:00:00Z", // 2022 Marzo
        pnl: 75,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2023-04-15T10:00:00Z", // 2023 Abril
        pnl: -25,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // 2024 Mayo
        pnl: 150,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2025-06-25T10:00:00Z", // 2025 Junio
        pnl: -75,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2020-07-30T10:00:00Z", // 2020 Julio
        pnl: 200,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2021-08-05T10:00:00Z", // 2021 Agosto
        pnl: -100,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2022-09-10T10:00:00Z", // 2022 Septiembre
        pnl: 125,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2023-10-15T10:00:00Z", // 2023 Octubre
        pnl: -60,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-11-20T10:00:00Z", // 2024 Noviembre
        pnl: 175,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2025-12-25T10:00:00Z", // 2025 Diciembre
        pnl: -80,
        result: "loss",
        side: "long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithAllMonthsAndDifferentYearsShort}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con showAllMonths activado y diferentes años con filtro short y timezone específico", () => {
    const operationsWithAllMonthsAndDifferentYearsShort = [
      {
        closed_at: "2020-01-15T10:00:00Z", // 2020 Enero
        pnl: 100,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2021-02-20T10:00:00Z", // 2021 Febrero
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2022-03-10T10:00:00Z", // 2022 Marzo
        pnl: 75,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2023-04-15T10:00:00Z", // 2023 Abril
        pnl: -25,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // 2024 Mayo
        pnl: 150,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2025-06-25T10:00:00Z", // 2025 Junio
        pnl: -75,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2020-07-30T10:00:00Z", // 2020 Julio
        pnl: 200,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2021-08-05T10:00:00Z", // 2021 Agosto
        pnl: -100,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2022-09-10T10:00:00Z", // 2022 Septiembre
        pnl: 125,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2023-10-15T10:00:00Z", // 2023 Octubre
        pnl: -60,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-11-20T10:00:00Z", // 2024 Noviembre
        pnl: 175,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2025-12-25T10:00:00Z", // 2025 Diciembre
        pnl: -80,
        result: "loss",
        side: "long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithAllMonthsAndDifferentYearsShort}
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con filtro long y timezone específico", () => {
    const operationsWithLongFilterAndTimezone = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-02-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-03-10T10:00:00Z",
        pnl: 75,
        result: "win",
        side: "long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithLongFilterAndTimezone}
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con filtro short y timezone específico", () => {
    const operationsWithShortFilterAndTimezone = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2024-02-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-03-10T10:00:00Z",
        pnl: 75,
        result: "win",
        side: "short",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithShortFilterAndTimezone}
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con showAllMonths activado y timezone específico", () => {
    const operationsWithAllMonthsAndTimezone = [
      {
        closed_at: "2024-01-15T10:00:00Z", // Enero
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T10:00:00Z", // Febrero
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2024-03-10T10:00:00Z", // Marzo
        pnl: 75,
        result: "win",
      },
      {
        closed_at: "2024-04-15T10:00:00Z", // Abril
        pnl: -25,
        result: "loss",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // Mayo
        pnl: 150,
        result: "win",
      },
      {
        closed_at: "2024-06-25T10:00:00Z", // Junio
        pnl: -75,
        result: "loss",
      },
      {
        closed_at: "2024-07-30T10:00:00Z", // Julio
        pnl: 200,
        result: "win",
      },
      {
        closed_at: "2024-08-05T10:00:00Z", // Agosto
        pnl: -100,
        result: "loss",
      },
      {
        closed_at: "2024-09-10T10:00:00Z", // Septiembre
        pnl: 125,
        result: "win",
      },
      {
        closed_at: "2024-10-15T10:00:00Z", // Octubre
        pnl: -60,
        result: "loss",
      },
      {
        closed_at: "2024-11-20T10:00:00Z", // Noviembre
        pnl: 175,
        result: "win",
      },
      {
        closed_at: "2024-12-25T10:00:00Z", // Diciembre
        pnl: -80,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithAllMonthsAndTimezone}
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss", () => {
    const operationsWithCustomFormat = [
      {
        closed_at: "2024-01-15 10:00:00",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20 15:30:00",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithCustomFormat} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas inválidas en formato yyyy-MM-dd HH:mm:ss", () => {
    const operationsWithInvalidCustomFormat = [
      {
        closed_at: "invalid-date-format",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart operations={operationsWithInvalidCustomFormat} />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss y filtro long", () => {
    const operationsWithCustomFormatAndLongFilter = [
      {
        closed_at: "2024-01-15 10:00:00",
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-02-20 15:30:00",
        pnl: -50,
        result: "loss",
        side: "short",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithCustomFormatAndLongFilter}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss y filtro short", () => {
    const operationsWithCustomFormatAndShortFilter = [
      {
        closed_at: "2024-01-15 10:00:00",
        pnl: 100,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2024-02-20 15:30:00",
        pnl: -50,
        result: "loss",
        side: "long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithCustomFormatAndShortFilter}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, filtro long y timezone específico", () => {
    const operationsWithCustomFormatAndLongFilterAndTimezone = [
      {
        closed_at: "2024-01-15 10:00:00",
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-02-20 15:30:00",
        pnl: -50,
        result: "loss",
        side: "short",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithCustomFormatAndLongFilterAndTimezone}
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, filtro short y timezone específico", () => {
    const operationsWithCustomFormatAndShortFilterAndTimezone = [
      {
        closed_at: "2024-01-15 10:00:00",
        pnl: 100,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2024-02-20 15:30:00",
        pnl: -50,
        result: "loss",
        side: "long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithCustomFormatAndShortFilterAndTimezone}
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showAllMonths y timezone específico", () => {
    const operationsWithCustomFormatAndShowAllMonthsAndTimezone = [
      {
        closed_at: "2024-01-15 10:00:00",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20 15:30:00",
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2024-03-25 20:45:00",
        pnl: 75,
        result: "win",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithCustomFormatAndShowAllMonthsAndTimezone}
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showAllMonths, filtro long y timezone específico", () => {
    const operationsWithCustomFormatAndShowAllMonthsAndLongFilterAndTimezone = [
      {
        closed_at: "2024-01-15 10:00:00",
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-02-20 15:30:00",
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-03-25 20:45:00",
        pnl: 75,
        result: "win",
        side: "long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndShowAllMonthsAndLongFilterAndTimezone
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showAllMonths, filtro short y timezone específico", () => {
    const operationsWithCustomFormatAndShowAllMonthsAndShortFilterAndTimezone =
      [
        {
          closed_at: "2024-01-15 10:00:00",
          pnl: 100,
          result: "win",
          side: "short",
        },
        {
          closed_at: "2024-02-20 15:30:00",
          pnl: -50,
          result: "loss",
          side: "long",
        },
        {
          closed_at: "2024-03-25 20:45:00",
          pnl: 75,
          result: "win",
          side: "short",
        },
      ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndShowAllMonthsAndShortFilterAndTimezone
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja interacción con el checkbox All Months", async () => {
    const operations = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
    ];

    renderWithTheme(<MonthlyPerformanceChart operations={operations} />);

    const allMonthsCheckbox = screen.getByRole("checkbox", {
      name: /all months/i,
    });
    expect(allMonthsCheckbox).toBeInTheDocument();
    expect(allMonthsCheckbox).not.toBeChecked();

    // Simular click en el checkbox
    fireEvent.click(allMonthsCheckbox);
    expect(allMonthsCheckbox).toBeChecked();
  });

  test("maneja interacción con el CustomSwitch", async () => {
    const operations = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "short",
      },
    ];

    renderWithTheme(<MonthlyPerformanceChart operations={operations} />);

    // Verificar que el CustomSwitch está presente usando getAllByText para manejar múltiples elementos
    expect(screen.getAllByText("General").length).toBeGreaterThan(0);
    expect(screen.getByText("Longs")).toBeInTheDocument();
    expect(screen.getByText("Shorts")).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss y showAllMonths activado", () => {
    const operationsWithCustomFormatAndShowAllMonths = [
      {
        closed_at: "2024-01-15 10:00:00",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20 15:30:00",
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2024-03-25 20:45:00",
        pnl: 75,
        result: "win",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithCustomFormatAndShowAllMonths}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showAllMonths activado y filtro long", () => {
    const operationsWithCustomFormatAndShowAllMonthsAndLongFilter = [
      {
        closed_at: "2024-01-15 10:00:00",
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-02-20 15:30:00",
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-03-25 20:45:00",
        pnl: 75,
        result: "win",
        side: "long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithCustomFormatAndShowAllMonthsAndLongFilter}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showAllMonths activado y filtro short", () => {
    const operationsWithCustomFormatAndShowAllMonthsAndShortFilter = [
      {
        closed_at: "2024-01-15 10:00:00",
        pnl: 100,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2024-02-20 15:30:00",
        pnl: -50,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-03-25 20:45:00",
        pnl: 75,
        result: "win",
        side: "short",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={operationsWithCustomFormatAndShowAllMonthsAndShortFilter}
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showAllMonths activado, filtro long y timezone específico", () => {
    const operationsWithCustomFormatAndShowAllMonthsAndLongFilterAndTimezone = [
      {
        closed_at: "2024-01-15 10:00:00",
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-02-20 15:30:00",
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-03-25 20:45:00",
        pnl: 75,
        result: "win",
        side: "long",
      },
    ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndShowAllMonthsAndLongFilterAndTimezone
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showAllMonths activado, filtro short y timezone específico", () => {
    const operationsWithCustomFormatAndShowAllMonthsAndShortFilterAndTimezone =
      [
        {
          closed_at: "2024-01-15 10:00:00",
          pnl: 100,
          result: "win",
          side: "short",
        },
        {
          closed_at: "2024-02-20 15:30:00",
          pnl: -50,
          result: "loss",
          side: "long",
        },
        {
          closed_at: "2024-03-25 20:45:00",
          pnl: 75,
          result: "win",
          side: "short",
        },
      ];

    renderWithTheme(
      <MonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndShowAllMonthsAndShortFilterAndTimezone
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });
});
