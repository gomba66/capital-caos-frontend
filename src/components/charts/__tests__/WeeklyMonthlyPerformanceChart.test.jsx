import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import WeeklyMonthlyPerformanceChart from "../WeeklyMonthlyPerformanceChart";

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("WeeklyMonthlyPerformanceChart", () => {
  const mockOperations = [
    {
      closed_at: "2024-01-05T10:00:00Z", // Semana 1
      pnl: 100,
      result: "win",
      side: "long",
    },
    {
      closed_at: "2024-01-12T10:00:00Z", // Semana 2
      pnl: -50,
      result: "loss",
      side: "short",
    },
    {
      closed_at: "2024-01-20T10:00:00Z", // Semana 3
      pnl: 75,
      result: "win",
      side: "long",
    },
    {
      closed_at: "2024-01-25T10:00:00Z", // Semana 4
      pnl: 25,
      result: "win",
      side: "long",
    },
    {
      closed_at: "2024-01-30T10:00:00Z", // Semana 5
      pnl: -30,
      result: "loss",
      side: "short",
    },
  ];

  test("renderiza el chart con título y descripción", () => {
    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={mockOperations} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      screen.getByText(/This chart shows total PnL by week of the month/)
    ).toBeInTheDocument();
  });

  test("renderiza el chart con datos de operaciones", () => {
    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={mockOperations} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones vacías", () => {
    renderWithTheme(<WeeklyMonthlyPerformanceChart operations={[]} />);

    expect(
      screen.getByText(
        "No closed trades to display weekly monthly performance."
      )
    ).toBeInTheDocument();
  });

  test("maneja operaciones null", () => {
    renderWithTheme(<WeeklyMonthlyPerformanceChart operations={null} />);

    expect(
      screen.getByText(
        "No closed trades to display weekly monthly performance."
      )
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithInvalidDates} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl como string", () => {
    const operationsWithStringPnl = [
      {
        closed_at: "2024-01-05T10:00:00Z",
        pnl: "100",
        result: "win",
      },
      {
        closed_at: "2024-01-12T10:00:00Z",
        pnl: "-50.5",
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithStringPnl} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl null o undefined", () => {
    const operationsWithNullPnl = [
      {
        closed_at: "2024-01-05T10:00:00Z",
        pnl: null,
        result: "win",
      },
      {
        closed_at: "2024-01-12T10:00:00Z",
        pnl: undefined,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithNullPnl} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con resultados undefined", () => {
    const operationsWithUndefinedResults = [
      {
        closed_at: "2024-01-05T10:00:00Z",
        pnl: 100,
        result: undefined,
      },
      {
        closed_at: "2024-01-12T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithUndefinedResults}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato diferente", () => {
    const operationsWithDifferentDateFormats = [
      {
        closed_at: "2024-01-05 10:00:00",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-12 15:30:00",
        pnl: 75,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithDifferentDateFormats}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con diferentes timezones", () => {
    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={mockOperations}
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con side en diferentes formatos", () => {
    const operationsWithDifferentSideFormats = [
      {
        closed_at: "2024-01-05T10:00:00Z",
        pnl: 100,
        result: "win",
        side: "LONG",
      },
      {
        closed_at: "2024-01-12T10:00:00Z",
        pnl: -50,
        result: "loss",
        side: "SHORT",
      },
      {
        closed_at: "2024-01-20T10:00:00Z",
        pnl: 75,
        result: "win",
        side: "long",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithDifferentSideFormats}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl negativo", () => {
    const operationsWithNegativePnl = [
      {
        closed_at: "2024-01-05T10:00:00Z",
        pnl: -100,
        result: "loss",
      },
      {
        closed_at: "2024-01-12T10:00:00Z",
        pnl: -50.5,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithNegativePnl} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl como string negativo", () => {
    const operationsWithStringNegativePnl = [
      {
        closed_at: "2024-01-05T10:00:00Z",
        pnl: "-100",
        result: "loss",
      },
      {
        closed_at: "2024-01-12T10:00:00Z",
        pnl: "-50.5",
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithStringNegativePnl}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl como string vacío", () => {
    const operationsWithEmptyStringPnl = [
      {
        closed_at: "2024-01-05T10:00:00Z",
        pnl: "",
        result: "win",
      },
      {
        closed_at: "2024-01-12T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithEmptyStringPnl}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas fuera del rango", () => {
    const operationsWithOutOfRangeDates = [
      {
        closed_at: "2023-01-05T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2025-01-12T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithOutOfRangeDates}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con closeTime en lugar de closed_at", () => {
    const operationsWithCloseTime = [
      {
        closeTime: "2024-01-05T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closeTime: "2024-01-12T10:00:00Z",
        pnl: 75,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithCloseTime} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
        closed_at: "2024-01-20T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithoutCloseDate} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con pnl cero", () => {
    const operationsWithZeroPnl = [
      {
        closed_at: "2024-01-05T10:00:00Z",
        pnl: 0,
        result: "win",
      },
      {
        closed_at: "2024-01-12T10:00:00Z",
        pnl: 0,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithZeroPnl} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con todas ganadoras", () => {
    const operationsWithAllWins = [
      {
        closed_at: "2024-01-05T10:00:00Z",
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-12T10:00:00Z",
        pnl: 50,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithAllWins} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con todas perdedoras", () => {
    const operationsWithAllLosses = [
      {
        closed_at: "2024-01-05T10:00:00Z",
        pnl: -100,
        result: "loss",
      },
      {
        closed_at: "2024-01-12T10:00:00Z",
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithAllLosses} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithDifferentYears}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithISODates} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithSimpleDates} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithUpperCaseSide} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithMixedSide} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithUndefinedSide} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithEmptySide} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithDecimalPnl} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithStringDecimalPnl}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes", () => {
    const operationsWithDifferentWeeks = [
      {
        closed_at: "2024-01-01T10:00:00Z", // Semana 1 (día 1-7)
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-10T10:00:00Z", // Semana 2 (día 8-14)
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2024-01-15T10:00:00Z", // Semana 3 (día 15-21)
        pnl: 75,
        result: "win",
      },
      {
        closed_at: "2024-01-25T10:00:00Z", // Semana 4 (día 22-28)
        pnl: -25,
        result: "loss",
      },
      {
        closed_at: "2024-01-30T10:00:00Z", // Semana 5 (día 29+)
        pnl: 200,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithDifferentWeeks}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithExtremeMonths} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithOutOfRangeDates}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithCloseTime} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con diferentes timezones", () => {
    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={mockOperations}
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con timezone UTC", () => {
    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={mockOperations}
        timeZone="UTC"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con timezone Europe/London", () => {
    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={mockOperations}
        timeZone="Europe/London"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithCustomFormat} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithDateOnly} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithSlashFormat} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithDashFormat} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithTimestamp} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithMilliseconds} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithInvalidDates} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithNonMatchingMonths}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 1)", () => {
    const operationsWithWeek1 = [
      {
        closed_at: "2024-01-01T10:00:00Z", // Día 1 - Semana 1
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-07T10:00:00Z", // Día 7 - Semana 1
        pnl: 50,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithWeek1} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 2)", () => {
    const operationsWithWeek2 = [
      {
        closed_at: "2024-01-08T10:00:00Z", // Día 8 - Semana 2
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-14T10:00:00Z", // Día 14 - Semana 2
        pnl: 50,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithWeek2} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 3)", () => {
    const operationsWithWeek3 = [
      {
        closed_at: "2024-01-15T10:00:00Z", // Día 15 - Semana 3
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-21T10:00:00Z", // Día 21 - Semana 3
        pnl: 50,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithWeek3} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 4)", () => {
    const operationsWithWeek4 = [
      {
        closed_at: "2024-01-22T10:00:00Z", // Día 22 - Semana 4
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-28T10:00:00Z", // Día 28 - Semana 4
        pnl: 50,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithWeek4} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 5)", () => {
    const operationsWithWeek5 = [
      {
        closed_at: "2024-01-29T10:00:00Z", // Día 29 - Semana 5
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-31T10:00:00Z", // Día 31 - Semana 5
        pnl: 50,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithWeek5} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithSpecificYears} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithLeapYear} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithNonLeapYear} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithSpecialDays} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithExtremeTimezones}
        timeZone="Pacific/Auckland"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithTokyoTimezone}
        timeZone="Asia/Tokyo"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithSydneyTimezone}
        timeZone="Australia/Sydney"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithBerlinTimezone}
        timeZone="Europe/Berlin"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithNYTimezone}
        timeZone="America/New_York"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithLATimezone}
        timeZone="America/Los_Angeles"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithSaoPauloTimezone}
        timeZone="America/Sao_Paulo"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithShanghaiTimezone}
        timeZone="Asia/Shanghai"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithDubaiTimezone}
        timeZone="Asia/Dubai"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en zona horaria Pacific/Auckland", () => {
    const operationsWithAucklandTimezone = [
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithAucklandTimezone}
        timeZone="Pacific/Auckland"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithLongFilter} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithShortFilter} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithCustomFormat} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithInvalidCustomFormat}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 1)", () => {
    const operationsWithWeek1 = [
      {
        closed_at: "2024-01-01T10:00:00Z", // Día 1 - Semana 1
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-07T10:00:00Z", // Día 7 - Semana 1
        pnl: 50,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithWeek1} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 2)", () => {
    const operationsWithWeek2 = [
      {
        closed_at: "2024-01-08T10:00:00Z", // Día 8 - Semana 2
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-14T10:00:00Z", // Día 14 - Semana 2
        pnl: 50,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithWeek2} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 3)", () => {
    const operationsWithWeek3 = [
      {
        closed_at: "2024-01-15T10:00:00Z", // Día 15 - Semana 3
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-21T10:00:00Z", // Día 21 - Semana 3
        pnl: 50,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithWeek3} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 4)", () => {
    const operationsWithWeek4 = [
      {
        closed_at: "2024-01-22T10:00:00Z", // Día 22 - Semana 4
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-28T10:00:00Z", // Día 28 - Semana 4
        pnl: 50,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithWeek4} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 5)", () => {
    const operationsWithWeek5 = [
      {
        closed_at: "2024-01-29T10:00:00Z", // Día 29 - Semana 5
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-01-31T10:00:00Z", // Día 31 - Semana 5
        pnl: 50,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithWeek5} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 5 en febrero bisiesto)", () => {
    const operationsWithWeek5LeapYear = [
      {
        closed_at: "2024-02-29T10:00:00Z", // Día 29 - Semana 5 en febrero bisiesto
        pnl: 100,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithWeek5LeapYear} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 5 en febrero no bisiesto)", () => {
    const operationsWithWeek5NonLeapYear = [
      {
        closed_at: "2023-02-28T10:00:00Z", // Día 28 - Semana 5 en febrero no bisiesto
        pnl: 100,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithWeek5NonLeapYear}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 5 en meses de 30 días)", () => {
    const operationsWithWeek5ThirtyDays = [
      {
        closed_at: "2024-04-30T10:00:00Z", // Día 30 - Semana 5 en abril (30 días)
        pnl: 100,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithWeek5ThirtyDays}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 5 en meses de 31 días)", () => {
    const operationsWithWeek5ThirtyOneDays = [
      {
        closed_at: "2024-03-31T10:00:00Z", // Día 31 - Semana 5 en marzo (31 días)
        pnl: 100,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithWeek5ThirtyOneDays}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 5 en diciembre)", () => {
    const operationsWithWeek5December = [
      {
        closed_at: "2024-12-31T10:00:00Z", // Día 31 - Semana 5 en diciembre
        pnl: 100,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithWeek5December} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes semanas del mes (semana 5 en enero)", () => {
    const operationsWithWeek5January = [
      {
        closed_at: "2024-01-31T10:00:00Z", // Día 31 - Semana 5 en enero
        pnl: 100,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithWeek5January} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithSpecificYears} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes años específicos con filtro long", () => {
    const operationsWithSpecificYearsAndLongFilter = [
      {
        closed_at: "2020-01-15T10:00:00Z", // 2020
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2021-02-20T10:00:00Z", // 2021
        pnl: -50,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2022-03-10T10:00:00Z", // 2022
        pnl: 75,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2023-04-15T10:00:00Z", // 2023
        pnl: -25,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // 2024
        pnl: 150,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2025-06-25T10:00:00Z", // 2025
        pnl: -75,
        result: "loss",
        side: "long",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithSpecificYearsAndLongFilter}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes años específicos con filtro short", () => {
    const operationsWithSpecificYearsAndShortFilter = [
      {
        closed_at: "2020-01-15T10:00:00Z", // 2020
        pnl: 100,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2021-02-20T10:00:00Z", // 2021
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2022-03-10T10:00:00Z", // 2022
        pnl: 75,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2023-04-15T10:00:00Z", // 2023
        pnl: -25,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // 2024
        pnl: 150,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2025-06-25T10:00:00Z", // 2025
        pnl: -75,
        result: "loss",
        side: "short",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithSpecificYearsAndShortFilter}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes años específicos con filtro short y timezone específico", () => {
    const operationsWithSpecificYearsAndShortFilter = [
      {
        closed_at: "2020-01-15T10:00:00Z", // 2020
        pnl: 100,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2021-02-20T10:00:00Z", // 2021
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2022-03-10T10:00:00Z", // 2022
        pnl: 75,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2023-04-15T10:00:00Z", // 2023
        pnl: -25,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // 2024
        pnl: 150,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2025-06-25T10:00:00Z", // 2025
        pnl: -75,
        result: "loss",
        side: "short",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithSpecificYearsAndShortFilter}
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en diferentes años específicos con filtro long y timezone específico", () => {
    const operationsWithSpecificYearsAndLongFilter = [
      {
        closed_at: "2020-01-15T10:00:00Z", // 2020
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2021-02-20T10:00:00Z", // 2021
        pnl: -50,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2022-03-10T10:00:00Z", // 2022
        pnl: 75,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2023-04-15T10:00:00Z", // 2023
        pnl: -25,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-05-20T10:00:00Z", // 2024
        pnl: 150,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2025-06-25T10:00:00Z", // 2025
        pnl: -75,
        result: "loss",
        side: "long",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithSpecificYearsAndLongFilter}
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con selectedMonth específico", () => {
    const operationsWithSelectedMonth = [
      {
        closed_at: "2024-01-15T10:00:00Z", // Enero
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T10:00:00Z", // Febrero (no debería aparecer)
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithSelectedMonth} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con selectedYear específico", () => {
    const operationsWithSelectedYear = [
      {
        closed_at: "2024-01-15T10:00:00Z", // 2024
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2023-02-20T10:00:00Z", // 2023 (no debería aparecer)
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart operations={operationsWithSelectedYear} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con selectedMonth y selectedYear específicos", () => {
    const operationsWithSelectedMonthAndYear = [
      {
        closed_at: "2024-01-15T10:00:00Z", // 2024 Enero
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20T10:00:00Z", // 2024 Febrero (mes diferente)
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2023-01-20T10:00:00Z", // 2023 Enero (año diferente)
        pnl: 75,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithSelectedMonthAndYear}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con selectedMonth y selectedYear específicos con filtro long", () => {
    const operationsWithSelectedMonthAndYearAndLongFilter = [
      {
        closed_at: "2024-01-15T10:00:00Z", // 2024 Enero
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-01-20T10:00:00Z", // 2024 Enero
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-02-20T10:00:00Z", // 2024 Febrero (mes diferente)
        pnl: 75,
        result: "win",
        side: "long",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithSelectedMonthAndYearAndLongFilter}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con selectedMonth y selectedYear específicos con filtro short", () => {
    const operationsWithSelectedMonthAndYearAndShortFilter = [
      {
        closed_at: "2024-01-15T10:00:00Z", // 2024 Enero
        pnl: 100,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2024-01-20T10:00:00Z", // 2024 Enero
        pnl: -50,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-02-20T10:00:00Z", // 2024 Febrero (mes diferente)
        pnl: 75,
        result: "win",
        side: "short",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithSelectedMonthAndYearAndShortFilter}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithInvalidCustomFormat}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart operations={operationsWithCustomFormat} />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithCustomFormatAndLongFilter}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithCustomFormatAndShortFilter}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss y selectedMonth", () => {
    const operationsWithCustomFormatAndSelectedMonth = [
      {
        closed_at: "2024-01-15 10:00:00", // Enero
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20 15:30:00", // Febrero (no debería aparecer)
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithCustomFormatAndSelectedMonth}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss y selectedYear", () => {
    const operationsWithCustomFormatAndSelectedYear = [
      {
        closed_at: "2024-01-15 10:00:00", // 2024
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2023-02-20 15:30:00", // 2023 (no debería aparecer)
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithCustomFormatAndSelectedYear}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, selectedMonth y selectedYear", () => {
    const operationsWithCustomFormatAndSelectedMonthAndYear = [
      {
        closed_at: "2024-01-15 10:00:00", // 2024 Enero
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2023-01-20 15:30:00", // 2023 Enero (año diferente)
        pnl: 75,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithCustomFormatAndSelectedMonthAndYear}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, selectedMonth, selectedYear y filtro long", () => {
    const operationsWithCustomFormatAndSelectedMonthAndYearAndLongFilter = [
      {
        closed_at: "2024-01-15 10:00:00", // 2024 Enero
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-01-20 15:30:00", // 2024 Enero
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
        pnl: 75,
        result: "win",
        side: "long",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndSelectedMonthAndYearAndLongFilter
        }
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, selectedMonth, selectedYear y filtro short", () => {
    const operationsWithCustomFormatAndSelectedMonthAndYearAndShortFilter = [
      {
        closed_at: "2024-01-15 10:00:00", // 2024 Enero
        pnl: 100,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2024-01-20 15:30:00", // 2024 Enero
        pnl: -50,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
        pnl: 75,
        result: "win",
        side: "short",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndSelectedMonthAndYearAndShortFilter
        }
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, selectedMonth, selectedYear, filtro long y timezone específico", () => {
    const operationsWithCustomFormatAndSelectedMonthAndYearAndLongFilterAndTimezone =
      [
        {
          closed_at: "2024-01-15 10:00:00", // 2024 Enero
          pnl: 100,
          result: "win",
          side: "long",
        },
        {
          closed_at: "2024-01-20 15:30:00", // 2024 Enero
          pnl: -50,
          result: "loss",
          side: "short",
        },
        {
          closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
          pnl: 75,
          result: "win",
          side: "long",
        },
      ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndSelectedMonthAndYearAndLongFilterAndTimezone
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, selectedMonth, selectedYear, filtro short y timezone específico", () => {
    const operationsWithCustomFormatAndSelectedMonthAndYearAndShortFilterAndTimezone =
      [
        {
          closed_at: "2024-01-15 10:00:00", // 2024 Enero
          pnl: 100,
          result: "win",
          side: "short",
        },
        {
          closed_at: "2024-01-20 15:30:00", // 2024 Enero
          pnl: -50,
          result: "loss",
          side: "long",
        },
        {
          closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
          pnl: 75,
          result: "win",
          side: "short",
        },
      ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndSelectedMonthAndYearAndShortFilterAndTimezone
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss y selectedMonth específico", () => {
    const operationsWithCustomFormatAndSelectedMonth = [
      {
        closed_at: "2024-01-15 10:00:00", // Enero
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20 15:30:00", // Febrero (no debería aparecer)
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithCustomFormatAndSelectedMonth}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss y selectedYear específico", () => {
    const operationsWithCustomFormatAndSelectedYear = [
      {
        closed_at: "2024-01-15 10:00:00", // 2024
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2023-02-20 15:30:00", // 2023 (no debería aparecer)
        pnl: -50,
        result: "loss",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithCustomFormatAndSelectedYear}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, selectedMonth y selectedYear específicos", () => {
    const operationsWithCustomFormatAndSelectedMonthAndYear = [
      {
        closed_at: "2024-01-15 10:00:00", // 2024 Enero
        pnl: 100,
        result: "win",
      },
      {
        closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
        pnl: -50,
        result: "loss",
      },
      {
        closed_at: "2023-01-20 15:30:00", // 2023 Enero (año diferente)
        pnl: 75,
        result: "win",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithCustomFormatAndSelectedMonthAndYear}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, selectedMonth, selectedYear y filtro long", () => {
    const operationsWithCustomFormatAndSelectedMonthAndYearAndLongFilter = [
      {
        closed_at: "2024-01-15 10:00:00", // 2024 Enero
        pnl: 100,
        result: "win",
        side: "long",
      },
      {
        closed_at: "2024-01-20 15:30:00", // 2024 Enero
        pnl: -50,
        result: "loss",
        side: "short",
      },
      {
        closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
        pnl: 75,
        result: "win",
        side: "long",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndSelectedMonthAndYearAndLongFilter
        }
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, selectedMonth, selectedYear y filtro short", () => {
    const operationsWithCustomFormatAndSelectedMonthAndYearAndShortFilter = [
      {
        closed_at: "2024-01-15 10:00:00", // 2024 Enero
        pnl: 100,
        result: "win",
        side: "short",
      },
      {
        closed_at: "2024-01-20 15:30:00", // 2024 Enero
        pnl: -50,
        result: "loss",
        side: "long",
      },
      {
        closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
        pnl: 75,
        result: "win",
        side: "short",
      },
    ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndSelectedMonthAndYearAndShortFilter
        }
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, selectedMonth, selectedYear, filtro long y timezone específico", () => {
    const operationsWithCustomFormatAndSelectedMonthAndYearAndLongFilterAndTimezone =
      [
        {
          closed_at: "2024-01-15 10:00:00", // 2024 Enero
          pnl: 100,
          result: "win",
          side: "long",
        },
        {
          closed_at: "2024-01-20 15:30:00", // 2024 Enero
          pnl: -50,
          result: "loss",
          side: "short",
        },
        {
          closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
          pnl: 75,
          result: "win",
          side: "long",
        },
      ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndSelectedMonthAndYearAndLongFilterAndTimezone
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, selectedMonth, selectedYear, filtro short y timezone específico", () => {
    const operationsWithCustomFormatAndSelectedMonthAndYearAndShortFilterAndTimezone =
      [
        {
          closed_at: "2024-01-15 10:00:00", // 2024 Enero
          pnl: 100,
          result: "win",
          side: "short",
        },
        {
          closed_at: "2024-01-20 15:30:00", // 2024 Enero
          pnl: -50,
          result: "loss",
          side: "long",
        },
        {
          closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
          pnl: 75,
          result: "win",
          side: "short",
        },
      ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndSelectedMonthAndYearAndShortFilterAndTimezone
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, selectedMonth, selectedYear, filtro long y timezone específico con showDateSelectors", () => {
    const operationsWithCustomFormatAndSelectedMonthAndYearAndLongFilterAndTimezoneAndShowDateSelectors =
      [
        {
          closed_at: "2024-01-15 10:00:00", // 2024 Enero
          pnl: 100,
          result: "win",
          side: "long",
        },
        {
          closed_at: "2024-01-20 15:30:00", // 2024 Enero
          pnl: -50,
          result: "loss",
          side: "short",
        },
        {
          closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
          pnl: 75,
          result: "win",
          side: "long",
        },
      ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndSelectedMonthAndYearAndLongFilterAndTimezoneAndShowDateSelectors
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, selectedMonth, selectedYear, filtro short y timezone específico con showDateSelectors", () => {
    const operationsWithCustomFormatAndSelectedMonthAndYearAndShortFilterAndTimezoneAndShowDateSelectors =
      [
        {
          closed_at: "2024-01-15 10:00:00", // 2024 Enero
          pnl: 100,
          result: "win",
          side: "short",
        },
        {
          closed_at: "2024-01-20 15:30:00", // 2024 Enero
          pnl: -50,
          result: "loss",
          side: "long",
        },
        {
          closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
          pnl: 75,
          result: "win",
          side: "short",
        },
      ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndSelectedMonthAndYearAndShortFilterAndTimezoneAndShowDateSelectors
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, selectedMonth, selectedYear, filtro long y timezone específico sin showDateSelectors", () => {
    const operationsWithCustomFormatAndSelectedMonthAndYearAndLongFilterAndTimezoneWithoutShowDateSelectors =
      [
        {
          closed_at: "2024-01-15 10:00:00", // 2024 Enero
          pnl: 100,
          result: "win",
          side: "long",
        },
        {
          closed_at: "2024-01-20 15:30:00", // 2024 Enero
          pnl: -50,
          result: "loss",
          side: "short",
        },
        {
          closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
          pnl: 75,
          result: "win",
          side: "long",
        },
      ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndSelectedMonthAndYearAndLongFilterAndTimezoneWithoutShowDateSelectors
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, selectedMonth, selectedYear, filtro short y timezone específico sin showDateSelectors", () => {
    const operationsWithCustomFormatAndSelectedMonthAndYearAndShortFilterAndTimezoneWithoutShowDateSelectors =
      [
        {
          closed_at: "2024-01-15 10:00:00", // 2024 Enero
          pnl: 100,
          result: "win",
          side: "short",
        },
        {
          closed_at: "2024-01-20 15:30:00", // 2024 Enero
          pnl: -50,
          result: "loss",
          side: "long",
        },
        {
          closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
          pnl: 75,
          result: "win",
          side: "short",
        },
      ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndSelectedMonthAndYearAndShortFilterAndTimezoneWithoutShowDateSelectors
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja interacción con el checkbox Show Date Selectors", async () => {
    const operations = [
      {
        closed_at: "2024-01-15T10:00:00Z",
        pnl: 100,
        result: "win",
      },
    ];

    renderWithTheme(<WeeklyMonthlyPerformanceChart operations={operations} />);

    const showDateSelectorsCheckbox = screen.getByRole("checkbox", {
      name: /date/i,
    });
    expect(showDateSelectorsCheckbox).toBeInTheDocument();
    expect(showDateSelectorsCheckbox).not.toBeChecked();

    // Simular click en el checkbox
    fireEvent.click(showDateSelectorsCheckbox);
    expect(showDateSelectorsCheckbox).toBeChecked();
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

    renderWithTheme(<WeeklyMonthlyPerformanceChart operations={operations} />);

    // Verificar que el CustomSwitch está presente usando getAllByText para manejar múltiples elementos
    expect(screen.getAllByText("General").length).toBeGreaterThan(0);
    expect(screen.getByText("Longs")).toBeInTheDocument();
    expect(screen.getByText("Shorts")).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss y showDateSelectors activado", () => {
    const operationsWithCustomFormatAndShowDateSelectors = [
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithCustomFormatAndShowDateSelectors}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showDateSelectors activado y filtro long", () => {
    const operationsWithCustomFormatAndShowDateSelectorsAndLongFilter = [
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
      <WeeklyMonthlyPerformanceChart
        operations={operationsWithCustomFormatAndShowDateSelectorsAndLongFilter}
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showDateSelectors activado y filtro short", () => {
    const operationsWithCustomFormatAndShowDateSelectorsAndShortFilter = [
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
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndShowDateSelectorsAndShortFilter
        }
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showDateSelectors activado, filtro long y timezone específico", () => {
    const operationsWithCustomFormatAndShowDateSelectorsAndLongFilterAndTimezone =
      [
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
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndShowDateSelectorsAndLongFilterAndTimezone
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showDateSelectors activado, filtro short y timezone específico", () => {
    const operationsWithCustomFormatAndShowDateSelectorsAndShortFilterAndTimezone =
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
      ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndShowDateSelectorsAndShortFilterAndTimezone
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showDateSelectors activado, selectedMonth y selectedYear", () => {
    const operationsWithCustomFormatAndShowDateSelectorsAndSelectedMonthAndYear =
      [
        {
          closed_at: "2024-01-15 10:00:00", // 2024 Enero
          pnl: 100,
          result: "win",
        },
        {
          closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
          pnl: -50,
          result: "loss",
        },
        {
          closed_at: "2023-01-20 15:30:00", // 2023 Enero (año diferente)
          pnl: 75,
          result: "win",
        },
      ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndShowDateSelectorsAndSelectedMonthAndYear
        }
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showDateSelectors activado, selectedMonth, selectedYear y filtro long", () => {
    const operationsWithCustomFormatAndShowDateSelectorsAndSelectedMonthAndYearAndLongFilter =
      [
        {
          closed_at: "2024-01-15 10:00:00", // 2024 Enero
          pnl: 100,
          result: "win",
          side: "long",
        },
        {
          closed_at: "2024-01-20 15:30:00", // 2024 Enero
          pnl: -50,
          result: "loss",
          side: "short",
        },
        {
          closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
          pnl: 75,
          result: "win",
          side: "long",
        },
      ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndShowDateSelectorsAndSelectedMonthAndYearAndLongFilter
        }
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showDateSelectors activado, selectedMonth, selectedYear y filtro short", () => {
    const operationsWithCustomFormatAndShowDateSelectorsAndSelectedMonthAndYearAndShortFilter =
      [
        {
          closed_at: "2024-01-15 10:00:00", // 2024 Enero
          pnl: 100,
          result: "win",
          side: "short",
        },
        {
          closed_at: "2024-01-20 15:30:00", // 2024 Enero
          pnl: -50,
          result: "loss",
          side: "long",
        },
        {
          closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
          pnl: 75,
          result: "win",
          side: "short",
        },
      ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndShowDateSelectorsAndSelectedMonthAndYearAndShortFilter
        }
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showDateSelectors activado, selectedMonth, selectedYear, filtro long y timezone específico", () => {
    const operationsWithCustomFormatAndShowDateSelectorsAndSelectedMonthAndYearAndLongFilterAndTimezone =
      [
        {
          closed_at: "2024-01-15 10:00:00", // 2024 Enero
          pnl: 100,
          result: "win",
          side: "long",
        },
        {
          closed_at: "2024-01-20 15:30:00", // 2024 Enero
          pnl: -50,
          result: "loss",
          side: "short",
        },
        {
          closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
          pnl: 75,
          result: "win",
          side: "long",
        },
      ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndShowDateSelectorsAndSelectedMonthAndYearAndLongFilterAndTimezone
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("maneja operaciones con fechas en formato yyyy-MM-dd HH:mm:ss, showDateSelectors activado, selectedMonth, selectedYear, filtro short y timezone específico", () => {
    const operationsWithCustomFormatAndShowDateSelectorsAndSelectedMonthAndYearAndShortFilterAndTimezone =
      [
        {
          closed_at: "2024-01-15 10:00:00", // 2024 Enero
          pnl: 100,
          result: "win",
          side: "short",
        },
        {
          closed_at: "2024-01-20 15:30:00", // 2024 Enero
          pnl: -50,
          result: "loss",
          side: "long",
        },
        {
          closed_at: "2024-02-20 15:30:00", // 2024 Febrero (mes diferente)
          pnl: 75,
          result: "win",
          side: "short",
        },
      ];

    renderWithTheme(
      <WeeklyMonthlyPerformanceChart
        operations={
          operationsWithCustomFormatAndShowDateSelectorsAndSelectedMonthAndYearAndShortFilterAndTimezone
        }
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Weekly Monthly Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });
});
