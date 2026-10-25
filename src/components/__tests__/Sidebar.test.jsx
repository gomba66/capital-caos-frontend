import React from "react";
import { afterEach, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Sidebar from "../Sidebar";
import { SidebarContext } from "../../contexts/AppContexts";
import { AuthContext } from "../../contexts/authState";

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
          <AuthContext.Provider
            value={{
              user: { role: "admin", features: ["bot_trades"] },
              logout: vi.fn(),
            }}
          >
            <Sidebar />
          </AuthContext.Provider>
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
    expect(screen.getByText("System status")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "System status" }),
    ).toHaveAttribute("href", "/system-status");
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Live Scanner" }),
    ).toHaveAttribute("href", "/#scanner");
    expect(screen.queryByText("CAPITAL CAOS")).not.toBeInTheDocument();
    expect(screen.queryByText("UTC")).not.toBeInTheDocument();
    expect(
      within(screen.getByText("Account & settings").closest("a")).getByTestId(
        "admin-astronaut-icon",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Account & settings" }),
    ).toHaveAttribute("href", "/account");
  });

  test("limits a signals account to scanner and account navigation", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    render(
      <BrowserRouter>
        <ThemeProvider theme={createTheme()}>
          <SidebarContext.Provider
            value={{
              sidebarWidth: 220,
              setSidebarWidth: vi.fn(),
              mobileNavOpen: false,
              setMobileNavOpen: vi.fn(),
            }}
          >
            <AuthContext.Provider
              value={{
                user: { role: "member", features: ["signals"] },
                logout: vi.fn(),
              }}
            >
              <Sidebar />
            </AuthContext.Provider>
          </SidebarContext.Provider>
        </ThemeProvider>
      </BrowserRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Account & settings")).toBeInTheDocument();
    expect(
      within(screen.getByText("Account & settings").closest("a")).queryByTestId(
        "admin-astronaut-icon",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Charts")).not.toBeInTheDocument();
    expect(screen.queryByText("System status")).not.toBeInTheDocument();
    expect(screen.queryByText("Evaluations")).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });

  test("limits a no-access account to account navigation", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    render(
      <BrowserRouter>
        <ThemeProvider theme={createTheme()}>
          <SidebarContext.Provider
            value={{
              sidebarWidth: 220,
              setSidebarWidth: vi.fn(),
              mobileNavOpen: false,
              setMobileNavOpen: vi.fn(),
            }}
          >
            <AuthContext.Provider
              value={{
                user: { role: "member", plan_code: "no_access", features: [] },
                logout: vi.fn(),
              }}
            >
              <Sidebar />
            </AuthContext.Provider>
          </SidebarContext.Provider>
        </ThemeProvider>
      </BrowserRouter>,
    );

    expect(screen.getByText("Account & settings")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Charts")).not.toBeInTheDocument();
    expect(screen.queryByText("System status")).not.toBeInTheDocument();
    expect(screen.queryByText("Live Scanner")).not.toBeInTheDocument();
    expect(screen.queryByText("Evaluations")).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });

  test("opens as a temporary drawer and closes after navigation on mobile", () => {
    const setMobileNavOpen = vi.fn();
    renderSidebar({ isMobile: true, mobileNavOpen: true, setMobileNavOpen });

    fireEvent.click(screen.getByRole("link", { name: "Dashboard" }));

    expect(setMobileNavOpen).toHaveBeenCalledWith(false);
  });
});
