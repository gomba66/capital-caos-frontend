import React from "react";
import { afterEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Sidebar from "../Sidebar";
import { SidebarContext } from "../../contexts/AppContexts";

const renderSidebar = ({
  isMobile = false,
  mobileNavOpen = false,
  setMobileNavOpen = vi.fn(),
} = {}) => {
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: isMobile && query.includes("max-width"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  return {
    setMobileNavOpen,
    ...render(
    <BrowserRouter>
      <ThemeProvider theme={createTheme()}>
        <SidebarContext.Provider
          value={{
            sidebarWidth: 220,
            setSidebarWidth: vi.fn(),
            mobileNavOpen,
            setMobileNavOpen,
          }}
        >
          <Sidebar />
        </SidebarContext.Provider>
      </ThemeProvider>
    </BrowserRouter>,
    ),
  };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Sidebar", () => {
  test("starts compact and expands navigation on desktop", () => {
    renderSidebar();

    expect(
      screen.getByRole("button", { name: "Expand navigation" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Expand navigation" }),
    );
    expect(
      screen.getByRole("button", { name: "Collapse navigation" }),
    ).toBeInTheDocument();
  });

  test("renders navigation without duplicating the shared header", () => {
    renderSidebar();

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Charts")).toBeInTheDocument();
    expect(screen.queryByText("Trading Chart")).not.toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Live Scanner" }),
    ).toHaveAttribute("href", "/#scanner");
    expect(screen.queryByText("CAPITAL CAOS")).not.toBeInTheDocument();
    expect(screen.queryByText("UTC")).not.toBeInTheDocument();
  });

  test("opens as a temporary drawer and closes after navigation on mobile", () => {
    const setMobileNavOpen = vi.fn();
    renderSidebar({ isMobile: true, mobileNavOpen: true, setMobileNavOpen });

    fireEvent.click(screen.getByRole("link", { name: "Dashboard" }));

    expect(setMobileNavOpen).toHaveBeenCalledWith(false);
  });
});
