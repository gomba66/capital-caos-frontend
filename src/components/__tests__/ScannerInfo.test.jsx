import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ScannerInfo from "../ScannerInfo";

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("ScannerInfo", () => {
  const mockScannerInfo = {
    scanner: "aggressive",
    scanner_type: "MOMENTUM_AGGRESSIVE",
    momentum_data: {
      change_5m: 3.5,
      volume: 1000000,
      change_30m: 5.2,
    },
  };

  test("renders scanner information when provided", () => {
    renderWithProviders(<ScannerInfo scannerInfo={mockScannerInfo} />);

    expect(screen.getByText("aggressive")).toBeInTheDocument();
    expect(screen.getByText("MOMENTUM_AGGRESSIVE")).toBeInTheDocument();
    expect(screen.getByText("Cambio 5m: 3.5%")).toBeInTheDocument();
    expect(screen.getByText("Volumen: 1,000,000")).toBeInTheDocument();
    expect(screen.getByText("Cambio 30m: 5.2%")).toBeInTheDocument();
  });

  test("renders compact version when compact prop is true", () => {
    renderWithProviders(
      <ScannerInfo scannerInfo={mockScannerInfo} compact={true} />
    );

    expect(screen.getByText("AGGRESSIVE")).toBeInTheDocument();
    expect(screen.getByText("MOMENTUM_AGGRESSIVE")).toBeInTheDocument();
    // En modo compacto no se muestran los detalles de momentum_data
    expect(screen.queryByText("Cambio 5m: 3.5%")).not.toBeInTheDocument();
  });

  test("renders dash when no scanner info is provided", () => {
    renderWithProviders(<ScannerInfo scannerInfo={null} />);

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  test("renders dash when scanner info is empty", () => {
    renderWithProviders(<ScannerInfo scannerInfo={{}} />);

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  test("renders scanner without momentum data", () => {
    const scannerInfoWithoutMomentum = {
      scanner: "original",
      scanner_type: "MOMENTUM_ORIGINAL",
    };

    renderWithProviders(
      <ScannerInfo scannerInfo={scannerInfoWithoutMomentum} />
    );

    expect(screen.getByText("original")).toBeInTheDocument();
    expect(screen.getByText("MOMENTUM_ORIGINAL")).toBeInTheDocument();
    // No debería mostrar detalles de momentum
    expect(screen.queryByText("Cambio 5m:")).not.toBeInTheDocument();
  });
});
