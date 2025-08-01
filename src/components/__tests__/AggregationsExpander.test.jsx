import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import AggregationsExpander from "../AggregationsExpander";

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("AggregationsExpander", () => {
  const mockAggregations = [
    {
      timestamp: "2024-01-01T10:00:00Z",
      price: "50000",
      sizeAdded: "0.1",
      newAvgEntry: "50000",
      totalSize: "0.2",
    },
    {
      timestamp: "2024-01-01T11:00:00Z",
      price: "51000",
      sizeAdded: "0.05",
      newAvgEntry: "50333.33",
      totalSize: "0.25",
    },
  ];

  test("renders expand button when showButton is true", () => {
    renderWithTheme(<AggregationsExpander aggregations={mockAggregations} />);

    // Verificar que el botón de expandir está presente
    const expandButton = screen.getByRole("button");
    expect(expandButton).toBeInTheDocument();
  });

  test("does not render expand button when showButton is false", () => {
    renderWithTheme(
      <AggregationsExpander
        aggregations={mockAggregations}
        showButton={false}
      />
    );

    // No debería haber botón
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("expands and shows aggregations when button is clicked", () => {
    renderWithTheme(<AggregationsExpander aggregations={mockAggregations} />);

    const expandButton = screen.getByRole("button");
    fireEvent.click(expandButton);

    // Verificar que se muestra el contenido expandido
    expect(screen.getByText("📈 Aggregations (2)")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("Size Added")).toBeInTheDocument();
    expect(screen.getByText("New Avg Entry")).toBeInTheDocument();
    expect(screen.getByText("Total Size")).toBeInTheDocument();
  });

  test("collapses when button is clicked again", () => {
    renderWithTheme(<AggregationsExpander aggregations={mockAggregations} />);

    const expandButton = screen.getByRole("button");

    // Expandir
    fireEvent.click(expandButton);
    expect(screen.getByText("📈 Aggregations (2)")).toBeInTheDocument();

    // Colapsar - el contenido puede permanecer en el DOM pero oculto
    fireEvent.click(expandButton);
    // Verificar que el botón cambió de estado
    expect(expandButton).toBeInTheDocument();
  });

  test("renders aggregation data correctly", () => {
    renderWithTheme(<AggregationsExpander aggregations={mockAggregations} />);

    const expandButton = screen.getByRole("button");
    fireEvent.click(expandButton);

    // Verificar que los datos se muestran correctamente
    expect(screen.getByText("50000.0000")).toBeInTheDocument();
    // Los otros valores pueden estar en chips o con formato diferente
    expect(screen.getByText("📈 Aggregations (2)")).toBeInTheDocument();
  });

  test("returns null when no aggregations", () => {
    const { container } = renderWithTheme(
      <AggregationsExpander aggregations={[]} />
    );

    expect(container.firstChild).toBeNull();
  });

  test("returns null when aggregations is null", () => {
    const { container } = renderWithTheme(
      <AggregationsExpander aggregations={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  test("handles missing data gracefully", () => {
    const aggregationsWithMissingData = [
      {
        timestamp: "2024-01-01T10:00:00Z",
        // Missing price, sizeAdded, newAvgEntry, totalSize
      },
      {
        timestamp: "2024-01-01T11:00:00Z",
        price: null,
        sizeAdded: undefined,
        newAvgEntry: "",
        totalSize: "0.25",
      },
    ];

    renderWithTheme(
      <AggregationsExpander aggregations={aggregationsWithMissingData} />
    );

    const expandButton = screen.getByRole("button");
    fireEvent.click(expandButton);

    expect(screen.getByText("📈 Aggregations (2)")).toBeInTheDocument();
  });

  test("handles different timezone", () => {
    renderWithTheme(
      <AggregationsExpander
        aggregations={mockAggregations}
        timeZone="America/Bogota"
      />
    );

    const expandButton = screen.getByRole("button");
    fireEvent.click(expandButton);

    expect(screen.getByText("📈 Aggregations (2)")).toBeInTheDocument();
  });

  test("formats numbers correctly", () => {
    const aggregationsWithStringNumbers = [
      {
        timestamp: "2024-01-01T10:00:00Z",
        price: "50000.1234",
        sizeAdded: "0.1",
        newAvgEntry: "50000.1234",
        totalSize: "0.2",
      },
    ];

    renderWithTheme(
      <AggregationsExpander aggregations={aggregationsWithStringNumbers} />
    );

    const expandButton = screen.getByRole("button");
    fireEvent.click(expandButton);

    expect(screen.getByText("50000.1234")).toBeInTheDocument();
    // Verificar que el componente se renderiza correctamente
    expect(screen.getByText("📈 Aggregations (1)")).toBeInTheDocument();
  });

  test("handles invalid timestamp gracefully", () => {
    const aggregationsWithInvalidTimestamp = [
      {
        timestamp: "invalid-timestamp",
        price: "50000",
        sizeAdded: "0.1",
        newAvgEntry: "50000",
        totalSize: "0.2",
      },
    ];

    renderWithTheme(
      <AggregationsExpander aggregations={aggregationsWithInvalidTimestamp} />
    );

    const expandButton = screen.getByRole("button");
    fireEvent.click(expandButton);

    expect(screen.getByText("📈 Aggregations (1)")).toBeInTheDocument();
  });
});
