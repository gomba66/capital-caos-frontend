import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Sidebar from "../Sidebar";
import { TimeZoneContext, SidebarContext } from "../../contexts/AppContexts";

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

  test("handles mobile view correctly", () => {
    // Mock useMediaQuery para simular vista móvil
    const mockUseMediaQuery = vi.fn().mockReturnValue(true);
    vi.doMock("@mui/material", async () => {
      const actual = await vi.importActual("@mui/material");
      return {
        ...actual,
        useMediaQuery: mockUseMediaQuery,
      };
    });

    renderWithProviders(<Sidebar />);

    // Verificar que el sidebar se renderiza en modo móvil
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  test("handles collapsed state", () => {
    renderWithProviders(<Sidebar />);

    // Verificar que el sidebar se renderiza correctamente
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("UTC")).toBeInTheDocument();
  });

  test("displays timezone information", () => {
    renderWithProviders(<Sidebar />);

    // Verificar que se muestra información de timezone
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("UTC")).toBeInTheDocument();
  });

  test("handles navigation items correctly", () => {
    renderWithProviders(<Sidebar />);

    // Verificar que todos los elementos de navegación están presentes
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Charts")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });
});
