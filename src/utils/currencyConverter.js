/**
 * Currency conversion utilities
 * Converts USDT to fiat currencies (USD, COP, MXN)
 */

// Tasas de cambio por defecto (fallback si no se puede obtener de la API)
// USDT ≈ 1 USD
const DEFAULT_EXCHANGE_RATES = {
  USD: 1.0, // USDT ≈ USD
  COP: 4000, // Aproximadamente 1 USDT = 4000 COP
  MXN: 17.0, // Aproximadamente 1 USDT = 17 MXN
  USDT: 1.0,
};

// Claves para localStorage
const STORAGE_KEY = "exchangeRates";
const STORAGE_TIMESTAMP_KEY = "exchangeRatesTimestamp";

// API pública gratuita para obtener tasas de cambio
// Hacemos solicitudes separadas para cada moneda ya que algunas APIs no soportan todas las monedas en una sola solicitud
// Usamos exchangerate-api.com que tiene un endpoint público gratuito
const EXCHANGE_RATE_API_BASE = "https://api.exchangerate-api.com/v4/latest/USD";

// Tasas de cambio actuales (se actualizan desde la API)
// Inicializar con tasas desde localStorage si existen, sino usar defaults
function loadStoredRates() {
  try {
    const storedRates = localStorage.getItem(STORAGE_KEY);
    if (storedRates) {
      const rates = JSON.parse(storedRates);
      return { ...DEFAULT_EXCHANGE_RATES, ...rates };
    }
  } catch (error) {
    console.warn("Error loading stored exchange rates:", error);
  }
  return { ...DEFAULT_EXCHANGE_RATES };
}

// Inicializar tasas desde localStorage inmediatamente (síncrono)
let EXCHANGE_RATES = loadStoredRates();

/**
 * Verifica si las tasas de cambio almacenadas necesitan actualización.
 * Las tasas se actualizan una vez al día.
 * @returns {boolean} True si necesita actualización
 */
function needsUpdate() {
  const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
  if (!timestamp) return true;

  const lastUpdate = new Date(timestamp);
  const now = new Date();
  const daysDifference = (now - lastUpdate) / (1000 * 60 * 60 * 24);

  // Actualizar si ha pasado más de 1 día
  return daysDifference >= 1;
}

/**
 * Obtiene las tasas de cambio desde la API.
 * @returns {Promise<Object|null>} Tasas de cambio o null si hay error
 */
async function fetchExchangeRates() {
  try {
    // Intentar con exchangerate-api.com primero (tiene mejor soporte para COP)
    const response = await fetch(EXCHANGE_RATE_API_BASE);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // exchangerate-api.com devuelve: { base: "USD", date: "...", rates: { COP: ..., MXN: ..., ... } }
    if (data.rates) {
      const rates = {
        USD: 1.0,
        USDT: 1.0,
        COP: data.rates.COP || DEFAULT_EXCHANGE_RATES.COP,
        MXN: data.rates.MXN || DEFAULT_EXCHANGE_RATES.MXN,
      };

      // Guardar en localStorage con timestamp
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());

      return rates;
    } else {
      throw new Error("Invalid response from API");
    }
  } catch (error) {
    console.warn("Error fetching exchange rates from primary API:", error);

    // Fallback: intentar con Frankfurter (solo para MXN si está disponible)
    try {
      const fallbackResponse = await fetch(
        "https://api.frankfurter.app/latest?from=USD&to=MXN"
      );
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.rates && fallbackData.rates.MXN) {
          const rates = {
            USD: 1.0,
            USDT: 1.0,
            COP: DEFAULT_EXCHANGE_RATES.COP, // Usar default para COP
            MXN: fallbackData.rates.MXN,
          };

          // Guardar en localStorage con timestamp
          localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
          localStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());

          return rates;
        }
      }
    } catch (fallbackError) {
      console.warn("Error fetching from fallback API:", fallbackError);
    }

    return null;
  }
}

/**
 * Carga las tasas de cambio desde la API si es necesario.
 * Las tasas ya están cargadas desde localStorage de forma síncrona.
 * Esta función solo actualiza si es necesario (una vez al día).
 * @returns {Promise<void>}
 */
async function loadExchangeRates() {
  // Si no necesita actualización, las tasas ya están cargadas
  if (!needsUpdate()) {
    return;
  }

  // Intentar obtener tasas actualizadas desde la API
  const rates = await fetchExchangeRates();
  if (rates) {
    EXCHANGE_RATES = { ...DEFAULT_EXCHANGE_RATES, ...rates };
  }
  // Si falla la API, las tasas guardadas ya están en EXCHANGE_RATES
}

/**
 * Inicializa las tasas de cambio. Debe ser llamado al inicio de la aplicación.
 * @returns {Promise<void>}
 */
export async function initializeExchangeRates() {
  await loadExchangeRates();
}

// Símbolos de moneda
const CURRENCY_SYMBOLS = {
  USD: "$",
  USDT: "$",
  COP: "$",
  MXN: "$",
};

/**
 * Convierte un valor en USDT a otra moneda.
 * @param {number} usdtAmount - Cantidad en USDT
 * @param {string} targetCurrency - Moneda objetivo (USD, COP, MXN, USDT)
 * @returns {number} Cantidad convertida
 */
export function convertFromUSDT(usdtAmount, targetCurrency) {
  if (!usdtAmount || isNaN(usdtAmount)) return 0;

  const currency = targetCurrency.toUpperCase();
  const rate = EXCHANGE_RATES[currency];

  if (!rate) {
    console.warn(`Tasa de cambio no encontrada para ${currency}, usando USDT`);
    return usdtAmount;
  }

  return usdtAmount * rate;
}

/**
 * Fuerza la actualización de las tasas de cambio desde la API.
 * Útil para actualizar manualmente las tasas.
 * @returns {Promise<boolean>} True si la actualización fue exitosa
 */
export async function refreshExchangeRates() {
  const rates = await fetchExchangeRates();
  if (rates) {
    EXCHANGE_RATES = { ...DEFAULT_EXCHANGE_RATES, ...rates };
    return true;
  }
  return false;
}

/**
 * Obtiene el número de decimales apropiado para una moneda.
 * @param {string} currency - Código de la moneda
 * @returns {number} Número de decimales
 */
export function getCurrencyDecimals(currency) {
  const currencyUpper = currency.toUpperCase();
  switch (currencyUpper) {
    case "COP":
    case "MXN":
      return 0; // Monedas fiat generalmente sin decimales
    case "USD":
    case "USDT":
      return 2;
    default:
      return 2;
  }
}

/**
 * Obtiene el símbolo de una moneda.
 * @param {string} currency - Código de la moneda
 * @returns {string} Símbolo de la moneda
 */
export function getCurrencySymbol(currency) {
  const currencyUpper = currency.toUpperCase();
  return CURRENCY_SYMBOLS[currencyUpper] || "$";
}

/**
 * Formatea un valor según la moneda con símbolo.
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de la moneda
 * @param {boolean} showSymbol - Si es true, muestra solo el símbolo. Si es false, muestra el código completo
 * @returns {string} Valor formateado con símbolo de moneda
 */
export function formatCurrency(amount, currency, showSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    const symbol = showSymbol ? getCurrencySymbol(currency) : currency;
    const decimals = getCurrencyDecimals(currency);
    return `${symbol}${(0).toFixed(decimals)}`;
  }

  const decimals = getCurrencyDecimals(currency);
  const symbol = showSymbol ? getCurrencySymbol(currency) : currency;

  // Para COP y MXN, sin decimales y con separadores de miles
  if (currency === "COP" || currency === "MXN") {
    const intValue = Math.round(amount);
    // Usar formato en-US para punto como separador decimal (aunque no hay decimales)
    // y comas para separador de miles
    return `${symbol}${intValue.toLocaleString("en-US")}`;
  }

  // Para USD y USDT, con decimales y separadores de miles
  // Usar formato en-US: comas para miles, punto para decimales
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${symbol}${formatted}`;
}
