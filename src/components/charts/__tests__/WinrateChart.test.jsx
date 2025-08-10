import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import WinrateChart from "../WinrateChart";

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("WinrateChart", () => {
  const mockWinrates = {
    total: 50.0,
    long: 66.7,
    short: 33.3,
  };

  test("renders winrate chart with title", () => {
    renderWithTheme(<WinrateChart winrates={mockWinrates} />);
    expect(screen.getByText("Winrate")).toBeInTheDocument();
  });

  test("renders description when hideDescription is false", () => {
    renderWithTheme(<WinrateChart winrates={mockWinrates} />);
    expect(
      screen.getByText(/Winrate is the percentage of profitable trades/)
    ).toBeInTheDocument();
  });

  test("hides description when hideDescription is true", () => {
    renderWithTheme(<WinrateChart winrates={mockWinrates} hideDescription />);
    expect(
      screen.queryByText(/Winrate is the percentage of profitable trades/)
    ).not.toBeInTheDocument();
  });

  test("displays total winrate correctly", () => {
    renderWithTheme(<WinrateChart winrates={mockWinrates} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  test("displays long winrate correctly", () => {
    renderWithTheme(<WinrateChart winrates={mockWinrates} />);
    expect(screen.getByText("66.7%")).toBeInTheDocument();
  });

  test("displays short winrate correctly", () => {
    renderWithTheme(<WinrateChart winrates={mockWinrates} />);
    expect(screen.getByText("33.3%")).toBeInTheDocument();
  });

  test("displays dash when no winrates provided", () => {
    renderWithTheme(<WinrateChart />);
    expect(screen.getAllByText("-")).toHaveLength(3); // Total, Long, Short
  });

  test("displays dash when winrates are null", () => {
    renderWithTheme(<WinrateChart winrates={null} />);
    expect(screen.getAllByText("-")).toHaveLength(3); // Total, Long, Short
  });

  test("displays dash when winrates are undefined", () => {
    renderWithTheme(<WinrateChart winrates={undefined} />);
    expect(screen.getAllByText("-")).toHaveLength(3); // Total, Long, Short
  });

  test("displays dash when winrates are empty object", () => {
    renderWithTheme(<WinrateChart winrates={{}} />);
    expect(screen.getAllByText("-")).toHaveLength(3); // Total, Long, Short
  });

  test("displays all three sections: Total, Longs, Shorts", () => {
    renderWithTheme(<WinrateChart winrates={mockWinrates} />);
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Longs")).toBeInTheDocument();
    expect(screen.getByText("Shorts")).toBeInTheDocument();
  });

  test("uses backend winrates when provided", () => {
    const backendWinrates = {
      total: 75.0,
      long: 80.0,
      short: 70.0,
    };

    renderWithTheme(<WinrateChart winrates={backendWinrates} />);

    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  test("handles partial winrates data", () => {
    const partialWinrates = {
      total: 60.0,
      // long and short are missing
    };

    renderWithTheme(<WinrateChart winrates={partialWinrates} />);

    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getAllByText("-")).toHaveLength(2); // Long and Short
  });

  test("handles winrates with zero values", () => {
    const zeroWinrates = {
      total: 0.0,
      long: 0.0,
      short: 0.0,
    };

    renderWithTheme(<WinrateChart winrates={zeroWinrates} />);

    expect(screen.getAllByText("0%")).toHaveLength(3);
  });
});
