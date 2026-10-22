import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./cipher-desk.css";
import "./i18n.js";
import AppRoot from "./AppRoot";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
