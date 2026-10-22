import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import CustomSwitch from "../CustomSwitch";

describe("CustomSwitch", () => {
  const options = ["General", "Longs", "Shorts"];

  test("renders the options as a compact accessible segmented control", () => {
    render(<CustomSwitch value={0} onChange={vi.fn()} options={options} />);

    expect(
      screen.getByRole("group", { name: "Chart display mode" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "General" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Longs" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: "Shorts" }),
    ).toBeInTheDocument();
  });

  test("changes the selected option when a segment is clicked", () => {
    const onChange = vi.fn();
    render(<CustomSwitch value={0} onChange={onChange} options={options} />);

    fireEvent.click(screen.getByRole("button", { name: "Longs" }));

    expect(onChange).toHaveBeenCalledWith(1);
  });

  test("supports a single option and custom accessible labels", () => {
    render(
      <CustomSwitch
        value={0}
        onChange={vi.fn()}
        options={["Single"]}
        ariaLabel="Time interval"
      />,
    );

    expect(screen.getByRole("group", { name: "Time interval" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Single" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
