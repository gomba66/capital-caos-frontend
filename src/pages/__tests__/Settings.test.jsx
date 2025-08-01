import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import Settings from "../Settings";

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </BrowserRouter>
  );
};

describe("Settings", () => {
  test("renders settings page with title", () => {
    renderWithProviders(<Settings />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  test("renders timezone selector", () => {
    renderWithProviders(<Settings />);
    expect(screen.getByLabelText("Time zone")).toBeInTheDocument();
  });
});
