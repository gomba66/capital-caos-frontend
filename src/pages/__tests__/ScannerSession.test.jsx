import React from "react";
import { render, screen } from "@testing-library/react";
import { CurrentSessionTracker } from "../Scanner";

describe("CurrentSessionTracker", () => {
  const session = {
    name: "asia",
    opens_at: "2026-10-24T21:00:00.000Z",
    closes_at: "2026-10-25T08:00:00.000Z",
  };

  it("labels weekend sessions explicitly", () => {
    render(
      <CurrentSessionTracker
        currentSession={{ ...session, is_weekend: true }}
        nextSession={null}
      />,
    );

    expect(screen.getByText("Asia")).toBeInTheDocument();
    expect(screen.getByText("* WEEKEND")).toBeInTheDocument();
  });

  it("does not label the official Sunday-to-Monday Asia session as weekend", () => {
    render(
      <CurrentSessionTracker
        currentSession={{
          ...session,
          opens_at: "2026-10-25T21:00:00.000Z",
          closes_at: "2026-10-26T08:00:00.000Z",
          is_weekend: false,
        }}
        nextSession={null}
      />,
    );

    expect(screen.getByText("Asia")).toBeInTheDocument();
    expect(screen.queryByText("* WEEKEND")).not.toBeInTheDocument();
  });
});
