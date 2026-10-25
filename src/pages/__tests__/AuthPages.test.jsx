import { afterEach, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import i18n from "../../i18n";
import { AuthContext } from "../../contexts/authState";
import Login from "../Login";
import Account from "../Account";
import AdminUsers from "../AdminUsers";

afterEach(async () => {
  cleanup();
  vi.unstubAllGlobals();
  await i18n.changeLanguage("en");
});

describe("localized account pages", () => {
  test.each([
    ["en", "Sign in", "Email address", "Sign in with the account provided by your administrator."],
    ["es", "Iniciar sesión", "Correo electrónico", "Accede con la cuenta que te proporcionó el administrador."],
  ])("renders the login page in %s", async (language, title, email, description) => {
    await i18n.changeLanguage(language);
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: new RegExp(email) }),
    ).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  test.each([
    ["en", "Your session has expired. Please sign in again."],
    ["es", "Tu sesión expiró. Inicia sesión nuevamente."],
  ])("explains an expired session in %s", async (language, message) => {
    await i18n.changeLanguage(language);
    render(
      <BrowserRouter>
        <Login sessionExpired />
      </BrowserRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(message);
  });

  test("allows changing language before signing in", async () => {
    await i18n.changeLanguage("en");
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Language" }), {
      target: { value: "es" },
    });

    expect(
      screen.getByRole("heading", { name: "Iniciar sesión" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Correo electrónico/ }),
    ).toBeInTheDocument();
  });

  test.each([
    ["en", "Account & settings", "Current plan", "Change password"],
    ["es", "Cuenta y ajustes", "Plan actual", "Cambiar contraseña"],
  ])("renders account details in %s", async (language, title, planLabel, passwordLabel) => {
    await i18n.changeLanguage(language);
    render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            user: {
              id: 1,
              role: "admin",
              email: "trader@example.com",
              display_name: "Trader",
              plan_code: "complete",
              notification_sounds: null,
            },
            updateNotificationSoundPreferences: vi.fn(),
          }}
        >
          <Account />
        </AuthContext.Provider>
      </BrowserRouter>,
    );

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(planLabel)).toBeInTheDocument();
    expect(
      screen.getByTestId("account-plan-badge").querySelector(".plan-identity-name"),
    ).toHaveTextContent("Cosmos");
    expect(screen.getByTestId("account-plan-badge")).toHaveClass(
      "plan-identity-badge--cosmos",
    );
    expect(screen.getByRole("heading", { name: passwordLabel })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", {
        name: language === "es" ? "Sistema" : "System",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", {
        name: language === "es" ? "Operación abierta" : "Trade opened",
      }),
    ).toBeInTheDocument();
  });

  test.each([
    ["signals", ["signals"], false],
    ["whatsapp", ["signals", "kairos", "trade_notifications"], true],
  ])(
    "shows notification settings for plan %s only when included",
    async (planCode, features, canConfigureNotifications) => {
      await i18n.changeLanguage("en");
      render(
        <BrowserRouter>
          <AuthContext.Provider
            value={{
              user: {
                id: 2,
                role: "member",
                email: "member@example.com",
                plan_code: planCode,
                features,
              },
              updateNotificationSoundPreferences: vi.fn(),
            }}
          >
            <Account />
          </AuthContext.Provider>
        </BrowserRouter>,
      );

      if (canConfigureNotifications) {
        expect(
          screen.getByRole("heading", { name: "Notification sounds" }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("combobox", { name: "Kairos index peak" }),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole("combobox", { name: "Trade opened" }),
        ).not.toBeInTheDocument();
      } else {
        expect(
          screen.queryByRole("heading", { name: "Notification sounds" }),
        ).not.toBeInTheDocument();
      }
    },
  );

  test("opens system settings in the admin account tab", async () => {
    await i18n.changeLanguage("en");
    render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            user: { id: 1, role: "admin", plan_code: "complete" },
            updateNotificationSoundPreferences: vi.fn(),
          }}
        >
          <Account />
        </AuthContext.Provider>
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "System" }));

    expect(
      screen.getByRole("tab", { name: "System" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("System configuration")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Change password" }),
    ).not.toBeInTheDocument();
  });

  test("blurs account identity by default and reveals it on demand", async () => {
    await i18n.changeLanguage("en");
    render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            user: {
              id: 1,
              email: "trader@example.com",
              display_name: "Trader",
              plan_code: "complete",
              notification_sounds: null,
            },
            updateNotificationSoundPreferences: vi.fn(),
          }}
        >
          <Account />
        </AuthContext.Provider>
      </BrowserRouter>,
    );

    expect(screen.queryByRole("tab", { name: "System" })).not.toBeInTheDocument();
    expect(screen.getByTestId("account-profile-details")).toHaveStyle({
      filter: "blur(5px)",
    });
    fireEvent.click(screen.getByRole("button", { name: "Show account details" }));
    expect(screen.getByTestId("account-profile-details")).toHaveStyle({
      filter: "none",
    });
    fireEvent.click(screen.getByRole("button", { name: "Hide account details" }));
    expect(screen.getByTestId("account-profile-details")).toHaveStyle({
      filter: "blur(5px)",
    });
  });

  test.each([
    ["en", "User management", "Create user", "Administrator"],
    ["es", "Gestión de usuarios", "Crear usuario", "Administrador"],
  ])("renders user management in %s", async (language, title, createLabel, roleLabel) => {
    await i18n.changeLanguage(language);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          users: [
            {
              id: 2,
              email: "trader@example.com",
              display_name: "Trader",
              role: "member",
              plan_code: "signals",
              is_active: true,
              created_at: "2026-10-21T00:00:00Z",
            },
            {
              id: 3,
              email: "admin@example.com",
              display_name: "Admin",
              role: "admin",
              plan_code: "complete",
              is_active: true,
              created_at: "2026-10-21T00:00:00Z",
            },
          ],
        }),
      }),
    );

    render(
      <AuthContext.Provider value={{ user: { id: 1, role: "admin" } }}>
        <AdminUsers />
      </AuthContext.Provider>,
    );

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: createLabel })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(roleLabel)).toBeInTheDocument();
    });
    const memberDetails = screen.getByTestId("user-details-2");
    const adminDetails = screen.getByTestId("user-details-3");
    expect(memberDetails).toHaveStyle({ filter: "blur(5px)" });
    expect(adminDetails).toHaveStyle({ filter: "blur(5px)" });
    fireEvent.click(
      screen.getByRole("button", {
        name: language === "es" ? "Mostrar correos de usuarios" : "Show user emails",
      }),
    );
    expect(memberDetails).toHaveStyle({ filter: "none" });
    expect(adminDetails).toHaveStyle({ filter: "blur(5px)" });
    fireEvent.click(
      screen.getByRole("button", {
        name:
          language === "es"
            ? "Mostrar datos de admin@example.com"
            : "Show details for admin@example.com",
      }),
    );
    expect(adminDetails).toHaveStyle({ filter: "none" });
  });
});
