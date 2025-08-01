import { vi } from "vitest";
import "@testing-library/jest-dom";

// Suprimir warnings de act() en la consola
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("Warning: An update to") &&
    args[0].includes("inside a test was not wrapped in act(...)")
  ) {
    return; // Suprimir el warning
  }
  originalConsoleError(...args);
};

// Mock de las variables de entorno para tests
process.env.VITE_API_BASE_URL = "http://localhost:8000";

// Mock de window.matchMedia para tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock de IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
