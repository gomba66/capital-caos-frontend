import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Sidebar from "../Sidebar";
import { TimeZoneContext, SidebarContext } from "../../App";

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <TimeZoneContext.Provider
          value={{ timeZone: "UTC", setTimeZone: vi.fn() }}
        >
          <SidebarContext.Provider
            value={{ sidebarWidth: 220, setSidebarWidth: vi.fn() }}
          >
            {component}
          </SidebarContext.Provider>
        </TimeZoneContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe("Sidebar", () => {
  test("renders sidebar with navigation items", () => {
    renderWithProviders(<Sidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Charts")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  test("renders timezone information", () => {
    renderWithProviders(<Sidebar />);

    expect(screen.getByText("UTC")).toBeInTheDocument();
  });

  test("renders logo image", () => {
    renderWithProviders(<Sidebar />);

    const logo = screen.getByAltText("Capital Caos");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "/logo.jpg");
  });
});
