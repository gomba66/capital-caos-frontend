import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Lee la variable de entorno para la base de la API
const API_BASE_URL = process.env.VITE_API_BASE_URL || "http://localhost:8000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: API_BASE_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
