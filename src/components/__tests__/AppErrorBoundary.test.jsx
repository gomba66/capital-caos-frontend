import { render, screen } from "@testing-library/react";
import AppErrorBoundary from "../AppErrorBoundary";

function BrokenView() {
  throw new Error("render failed");
}

describe("AppErrorBoundary", () => {
  test("keeps a render failure from blanking the application", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <AppErrorBoundary>
        <BrokenView />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This section could not load",
    );
    expect(
      screen.getByRole("button", { name: "Retry section" }),
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
