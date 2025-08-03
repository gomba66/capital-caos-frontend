import theme from "../theme";

describe("theme", () => {
  test("tiene configuración de paleta correcta", () => {
    expect(theme.palette.mode).toBe("dark");
    expect(theme.palette.background.default).toBe(
      "linear-gradient(135deg, #181c2f 0%, #2a174e 100%)"
    );
    expect(theme.palette.background.paper).toBe("#23243a");
  });

  test("tiene colores primarios correctos", () => {
    expect(theme.palette.primary.main).toBe("#ffe156");
    expect(theme.palette.primary.contrastText).toBe("#181c2f");
  });

  test("tiene colores secundarios correctos", () => {
    expect(theme.palette.secondary.main).toBe("#2de2e6");
  });

  test("tiene colores de estado correctos", () => {
    expect(theme.palette.info.main).toBe("#3a86ff");
    expect(theme.palette.warning.main).toBe("#ff6fff");
    expect(theme.palette.error.main).toBe("#ff2e63");
    expect(theme.palette.success.main).toBe("#7c3aed");
  });

  test("tiene configuración de texto correcta", () => {
    expect(theme.palette.text.primary).toBe("#fff");
    expect(theme.palette.text.secondary).toBe("#bdbdbd");
  });

  test("tiene tipografía configurada", () => {
    expect(theme.typography.fontFamily).toBe(
      "Rajdhani, Orbitron, Roboto, Arial, sans-serif"
    );
  });

  test("tiene estilos de h4 configurados", () => {
    const h4Styles = theme.typography.h4;
    expect(h4Styles.color).toBe("#ffe156");
    expect(h4Styles.fontWeight).toBe(700);
    expect(h4Styles.letterSpacing).toBe(2);
    expect(h4Styles.textShadow).toBe("0 0 8px #ffe156, 0 0 2px #fff");
  });

  test("tiene estilos de h6 configurados", () => {
    const h6Styles = theme.typography.h6;
    expect(h6Styles.color).toBe("#2de2e6");
    expect(h6Styles.fontWeight).toBe(600);
    expect(h6Styles.letterSpacing).toBe(1);
    expect(h6Styles.textShadow).toBe("0 0 6px #2de2e6");
  });

  test("tiene estilos de body configurados", () => {
    expect(theme.typography.body1.color).toBe("#fff");
    expect(theme.typography.body2.color).toBe("#fff");
  });

  test("tiene estilos de caption configurados", () => {
    expect(theme.typography.caption.color).toBe("#bdbdbd");
  });

  test("tiene configuración de CssBaseline", () => {
    const cssBaseline = theme.components.MuiCssBaseline.styleOverrides;

    expect(cssBaseline.body.background).toBe(
      "linear-gradient(135deg, #181c2f 0%, #2a174e 100%)"
    );
    expect(cssBaseline.body.backgroundAttachment).toBe("fixed");
    expect(cssBaseline.body.backgroundSize).toBe("cover");
    expect(cssBaseline.body.minHeight).toBe("100vh");
    expect(cssBaseline.body.padding).toBe(0);
    expect(cssBaseline.body.margin).toBe(0);
    expect(cssBaseline.body.overflowX).toBe("hidden");
  });

  test("tiene configuración de html", () => {
    const cssBaseline = theme.components.MuiCssBaseline.styleOverrides;

    expect(cssBaseline.html.height).toBe("100%");
    expect(cssBaseline.html.margin).toBe(0);
    expect(cssBaseline.html.padding).toBe(0);
  });

  test("tiene configuración de root", () => {
    const cssBaseline = theme.components.MuiCssBaseline.styleOverrides;

    expect(cssBaseline["#root"].padding).toBe(0);
    expect(cssBaseline["#root"].margin).toBe(0);
    expect(cssBaseline["#root"].minHeight).toBe("100vh");
    expect(cssBaseline["#root"].background).toBe(
      "linear-gradient(135deg, #181c2f 0%, #2a174e 100%)"
    );
    expect(cssBaseline["#root"].backgroundAttachment).toBe("fixed");
    expect(cssBaseline["#root"].backgroundSize).toBe("cover");
  });

  test("tiene configuración de MuiCard", () => {
    const cardStyles = theme.components.MuiCard.styleOverrides.root;

    expect(cardStyles.background).toBe(
      "linear-gradient(135deg, #23243a 80%, #1e1e2f 100%)"
    );
    expect(cardStyles.border).toBe("1.5px solid #ffe156");
    expect(cardStyles.boxShadow).toBe("0 0 16px 2px #2de2e655");
    expect(cardStyles.borderRadius).toBe(18);
  });

  test("tiene configuración de MuiPaper", () => {
    const paperStyles = theme.components.MuiPaper.styleOverrides.root;

    expect(paperStyles.background).toBe("#23243a");
    expect(paperStyles.borderRadius).toBe(18);
    expect(paperStyles.boxShadow).toBe("0 0 16px 2px #3a86ff33");
  });

  test("tiene configuración de MuiTableCell", () => {
    const cellStyles = theme.components.MuiTableCell.styleOverrides;

    expect(cellStyles.root.borderBottom).toBe("1px solid #2de2e6");
    expect(cellStyles.root.color).toBe("#fff");
    expect(cellStyles.root.fontSize).toBe("1rem");

    expect(cellStyles.head.color).toBe("#2de2e6");
    expect(cellStyles.head.fontWeight).toBe(700);
    expect(cellStyles.head.background).toBe("rgba(45,226,230,0.08)");
    expect(cellStyles.head.fontSize).toBe("1.05rem");
  });

  test("tiene configuración de MuiButton", () => {
    const buttonStyles = theme.components.MuiButton.styleOverrides.root;

    expect(buttonStyles.background).toBe(
      "linear-gradient(90deg, #ffe156 60%, #2de2e6 100%)"
    );
    expect(buttonStyles.color).toBe("#181c2f");
    expect(buttonStyles.fontWeight).toBe(700);
    expect(buttonStyles.boxShadow).toBe("0 0 8px #ffe156");
    expect(buttonStyles.borderRadius).toBe(10);
  });

  test("tiene configuración de MuiCheckbox", () => {
    const checkboxStyles = theme.components.MuiCheckbox.styleOverrides.root;

    expect(checkboxStyles.color).toBe("#3a86ff");
    expect(checkboxStyles["&.Mui-checked"].color).toBe("#ffe156");
    expect(checkboxStyles["&.Mui-checked"].textShadow).toBe("0 0 6px #ffe156");
  });

  test("es un tema válido de Material-UI", () => {
    expect(theme).toBeDefined();
    expect(typeof theme).toBe("object");
    expect(theme.palette).toBeDefined();
    expect(theme.typography).toBeDefined();
    expect(theme.components).toBeDefined();
  });

  test("tiene estructura completa de componentes", () => {
    const components = theme.components;

    expect(components.MuiCssBaseline).toBeDefined();
    expect(components.MuiCard).toBeDefined();
    expect(components.MuiPaper).toBeDefined();
    expect(components.MuiTableCell).toBeDefined();
    expect(components.MuiButton).toBeDefined();
    expect(components.MuiCheckbox).toBeDefined();
  });

  test("tiene configuración de gradientes consistentes", () => {
    const backgroundGradient =
      "linear-gradient(135deg, #181c2f 0%, #2a174e 100%)";

    expect(theme.palette.background.default).toBe(backgroundGradient);
    expect(theme.components.MuiCssBaseline.styleOverrides.body.background).toBe(
      backgroundGradient
    );
    expect(
      theme.components.MuiCssBaseline.styleOverrides["#root"].background
    ).toBe(backgroundGradient);
  });

  test("tiene configuración de colores de marca", () => {
    const brandColors = {
      primary: "#ffe156",
      secondary: "#2de2e6",
      background: "#23243a",
      text: "#fff",
    };

    expect(theme.palette.primary.main).toBe(brandColors.primary);
    expect(theme.palette.secondary.main).toBe(brandColors.secondary);
    expect(theme.palette.background.paper).toBe(brandColors.background);
    expect(theme.palette.text.primary).toBe(brandColors.text);
  });
});
