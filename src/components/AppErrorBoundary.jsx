import React from "react";

export default class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled application rendering error:", error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const language = document.documentElement.lang;
    const isSpanish = language === "es";

    return (
      <main
        role="alert"
        style={{
          alignItems: "center",
          background: "var(--canvas, #111916)",
          color: "var(--ink, #e5eee9)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          justifyContent: "center",
          minHeight: "50vh",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1>{isSpanish ? "Esta sección no se pudo cargar" : "This section could not load"}</h1>
        <p>
          {isSpanish
            ? "La navegación sigue disponible. Puedes reintentar esta sección."
            : "Navigation is still available. You can retry this section."}
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          {isSpanish ? "Reintentar sección" : "Retry section"}
        </button>
      </main>
    );
  }
}
