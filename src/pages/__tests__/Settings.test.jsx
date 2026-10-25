import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import Settings from "../Settings";
import { TimeZoneContext, SidebarContext } from "../../contexts/AppContexts";
import { AuthContext } from "../../contexts/authState";

const theme = createTheme();

const renderWithProviders = (component, user = null) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={{ user }}>
          <TimeZoneContext.Provider
            value={{ timeZone: "UTC", setTimeZone: vi.fn() }}
          >
            <SidebarContext.Provider
              value={{ sidebarWidth: 220, setSidebarWidth: vi.fn() }}
            >
              {component}
            </SidebarContext.Provider>
          </TimeZoneContext.Provider>
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe("Settings", () => {
  test("renders settings page with title", () => {
    renderWithProviders(<Settings />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  test("does not duplicate shared header timezone and currency selectors", () => {
    renderWithProviders(<Settings />);
    expect(screen.queryByLabelText("Time zone")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Capital currency")).not.toBeInTheDocument();
  });

  test("keeps account-specific notification sound controls out of system settings", () => {
    renderWithProviders(<Settings />);
    expect(
      screen.queryByRole("combobox", { name: "Trade opened" }),
    ).not.toBeInTheDocument();
  });

  test("shows weekend session controls to administrators", () => {
    renderWithProviders(<Settings />, { role: "admin" });
    expect(
      screen.getByRole("checkbox", {
        name: "Enable Asia and New York sessions on weekends",
      }),
    ).toBeInTheDocument();
  });

  test("hides weekend session controls from non-administrators", () => {
    renderWithProviders(<Settings />);
    expect(
      screen.queryByRole("checkbox", {
        name: "Enable Asia and New York sessions on weekends",
      }),
    ).not.toBeInTheDocument();
  });
});
