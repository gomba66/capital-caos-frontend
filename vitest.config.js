import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    // Configuración adicional para manejar problemas de crypto
    deps: {
      inline: ["vitest"],
    },
  },
  // Configuración para manejar problemas de Node.js
  define: {
    global: "globalThis",
  },
});
