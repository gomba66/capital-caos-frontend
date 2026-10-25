import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { MemoryRouter } from "react-router-dom";
import Upgrade from "../Upgrade";

test("explains that billing is not available and links back to the dashboard", () => {
  render(
    <MemoryRouter initialEntries={["/upgrade"]}>
      <ThemeProvider theme={createTheme()}>
        <Upgrade />
      </ThemeProvider>
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Upgrade to Cosmos" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "Online payments are not available yet. Contact your administrator to request a plan change.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Back to dashboard" }),
  ).toHaveAttribute("href", "/");
});
