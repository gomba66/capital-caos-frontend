import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Home from "../Home";

vi.mock("../Scanner", () => ({
  default: () => <section aria-label="Cipher Desk live scanner" />,
}));

describe("Home", () => {
  test("shows only the Cipher Desk scanner page", () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>,
    );

    expect(screen.getByLabelText("Cipher Desk live scanner")).toBeInTheDocument();
  });
});
