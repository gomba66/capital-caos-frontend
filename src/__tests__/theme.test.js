import createAppTheme from "../theme";

describe("Cipher Desk application theme", () => {
  test("uses the dark Cipher Desk palette by default", () => {
    const theme = createAppTheme();

    expect(theme.palette.mode).toBe("dark");
    expect(theme.palette.primary.main).toBe("#71d6ae");
    expect(theme.palette.background.default).toBe("#141a17");
    expect(theme.palette.background.paper).toBe("#202925");
    expect(theme.typography.fontFamily).toContain("Manrope");
  });

  test("creates matching dark tokens when dark mode is selected", () => {
    const theme = createAppTheme("dark");

    expect(theme.palette.mode).toBe("dark");
    expect(theme.palette.primary.main).toBe("#71d6ae");
    expect(theme.palette.background.default).toBe("#141a17");
    expect(theme.palette.background.paper).toBe("#202925");
  });

  test.each([
    ["ocean", "#58c7d3", "#101b20"],
    ["graphite", "#e6b15d", "#1b1a18"],
    ["violet", "#b6a2ff", "#191724"],
  ])("creates the %s palette in dark mode", (palette, accent, background) => {
    const theme = createAppTheme("dark", palette);

    expect(theme.palette.mode).toBe("dark");
    expect(theme.palette.primary.main).toBe(accent);
    expect(theme.palette.background.default).toBe(background);
  });

  test.each([
    ["ocean", "#087e91", "#eef5f7"],
    ["graphite", "#a96c22", "#f4f0e9"],
    ["violet", "#6654b0", "#f2f0f8"],
  ])("creates the %s palette in light mode", (palette, accent, background) => {
    const theme = createAppTheme("light", palette);

    expect(theme.palette.mode).toBe("light");
    expect(theme.palette.primary.main).toBe(accent);
    expect(theme.palette.background.default).toBe(background);
  });

  test("uses neutral, low-emphasis surfaces and consistent table colors", () => {
    const theme = createAppTheme();

    expect(theme.components.MuiCard.styleOverrides.root.border).toBe(
      "1px solid #35433d",
    );
    expect(
      theme.components.MuiTableCell.styleOverrides.head.background,
    ).toBe("#141a17");
    expect(theme.components.MuiCard.styleOverrides.root.borderRadius).toBe(2);
    expect(theme.components.MuiCard.styleOverrides.root.boxShadow).toBe("none");
    expect(theme.components.MuiButton.styleOverrides.root.boxShadow).toBe(
      "none",
    );
    expect(theme.components.MuiButton.styleOverrides.contained.background).toBe(
      theme.palette.primary.main,
    );
    expect(theme.components.MuiButton.styleOverrides.outlined.color).toBe(
      theme.palette.text.primary,
    );
  });

  test("styles toggle switches with compact Cipher Desk geometry and colors", () => {
    const theme = createAppTheme();

    expect(theme.components.MuiSwitch.styleOverrides.root.width).toBe(38);
    expect(theme.components.MuiSwitch.styleOverrides.thumb.borderRadius).toBe(2);
    expect(
      theme.components.MuiSwitch.styleOverrides.switchBase[
        "&.Mui-checked"
      ]["& + .MuiSwitch-track"].backgroundColor,
    ).toBe(theme.palette.success.main);
  });
});
