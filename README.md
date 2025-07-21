# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## 🖥️ Cómo correr el frontend en local (desarrollo)

1. Entra a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Lanza el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en la URL que aparece en consola (usualmente http://localhost:5173 o similar).

- El frontend se recargará automáticamente ante cambios en los archivos.
- Asegúrate de que el backend esté corriendo y accesible desde el frontend (ajusta las URLs de la API si es necesario).
