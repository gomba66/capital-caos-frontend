import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import StickyTradeSummary from "../StickyTradeSummary";

describe("StickyTradeSummary", () => {
  let header;

  beforeEach(() => {
    header = document.createElement("header");
    header.className = "platform-header";
    header.getBoundingClientRect = () => ({
      bottom: 72,
      height: 72,
      top: 0,
      left: 0,
      right: 1000,
      width: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    document.body.append(header);
  });

  afterEach(() => {
    header.remove();
  });

  test("appears as a non-interactive region after the header fully covers the closed summary", () => {
    const anchorRef = createRef();
    const onVisibilityChange = vi.fn();
    let anchorTop = 100;
    const { rerender } = render(
      <>
        <div
          ref={anchorRef}
          data-testid="summary-anchor"
        />
        <StickyTradeSummary
          anchorRef={anchorRef}
          expanded={false}
          label="Open Trades summary"
          onVisibilityChange={onVisibilityChange}
        >
          <span>2 open · Long 1 · Short 1</span>
        </StickyTradeSummary>
      </>,
    );
    anchorRef.current.getBoundingClientRect = () => ({
      bottom: anchorTop + 48,
      height: 48,
      top: anchorTop,
      left: 0,
      right: 1000,
      width: 1000,
      x: 0,
      y: anchorTop,
      toJSON: () => {},
    });

    expect(
      screen.queryByRole("button", { name: "Open Trades summary" }),
    ).not.toBeInTheDocument();

    anchorTop = 60;
    act(() => {
      fireEvent.scroll(window);
    });
    expect(
      screen.queryByRole("region", { name: "Open Trades summary" }),
    ).not.toBeInTheDocument();

    anchorTop = 24;
    act(() => {
      fireEvent.scroll(window);
    });

    const stickySummary = screen.getByRole("region", {
      name: "Open Trades summary",
    });
    expect(stickySummary).toHaveTextContent("2 open · Long 1 · Short 1");
    expect(onVisibilityChange).toHaveBeenLastCalledWith(true);
    expect(
      screen.queryByRole("button", { name: "Open Trades summary" }),
    ).not.toBeInTheDocument();

    rerender(
      <StickyTradeSummary
        anchorRef={anchorRef}
        expanded
        label="Open Trades summary"
        onVisibilityChange={onVisibilityChange}
      >
        <span>2 open · Long 1 · Short 1</span>
      </StickyTradeSummary>,
    );
    expect(
      screen.queryByRole("button", { name: "Open Trades summary" }),
    ).not.toBeInTheDocument();
    expect(onVisibilityChange).toHaveBeenLastCalledWith(false);
  });
});
