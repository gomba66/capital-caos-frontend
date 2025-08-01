import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), "");

  // Lee la variable de entorno para la base de la API
  const API_BASE_URL = env.VITE_API_BASE_URL || "http://localhost:8000";

  // Debug: Mostrar qué valor está tomando (opcional)
  // console.log("🔧 Vite Config - API_BASE_URL:", API_BASE_URL);

  // https://vite.dev/config/
  return {
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
  };
});
