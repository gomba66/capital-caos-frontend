import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
        "scripts/",
        "src/App.jsx",
        "src/main.jsx",
      ],
    },
    // Suprimir warnings de act() en la consola
    onConsoleLog(log, type) {
      if (type === "stderr" && log.includes("act(...)")) {
        return false; // Suprimir el log
      }
      return true; // Mostrar otros logs
    },
  },
  server: {
    deps: {
      inline: ["@testing-library/react"],
    },
  },
});
