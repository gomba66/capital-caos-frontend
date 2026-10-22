import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Home from "../Home";

vi.mock("../Dashboard", () => ({
  default: ({ interactiveSection }) => (
    <>
      <section aria-label="Capital dashboard" />
      {interactiveSection}
    </>
  ),
}));

vi.mock("../Scanner", () => ({
  default: () => <section aria-label="Cipher Desk live scanner" />,
}));

describe("Home", () => {
  test("shows Capital Caos dashboard and Cipher Desk scanner on one page", () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>,
    );

    expect(screen.getByLabelText("Capital dashboard")).toBeInTheDocument();
    expect(screen.getByLabelText("Cipher Desk live scanner")).toBeInTheDocument();
  });
});
