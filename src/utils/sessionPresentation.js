const SESSION_PRESENTATIONS = {
  us: { name: "us_brinks", parent: "new_york" },
  us_brinks: { name: "us_brinks", parent: "new_york" },
  europe: { name: "eu_brinks", parent: "asia" },
  eu_brinks: { name: "eu_brinks", parent: "asia" },
};
const US_BRINKS_TO_NEW_YORK_MS = 30 * 60 * 1000;
export const SESSION_URGENT_WINDOW_MS = 5 * 60 * 1000;
export const SESSION_CRITICAL_WINDOW_MS = 60 * 1000;

export function getSessionPresentation(name) {
  const normalizedName = String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return SESSION_PRESENTATIONS[normalizedName] || {
    name: normalizedName,
    parent: null,
  };
}

export function isParentSessionOpening(currentSessionName, nextSessionName) {
  const parent = getSessionPresentation(currentSessionName).parent;
  return parent !== null && getSessionPresentation(nextSessionName).name === parent;
}

export function getUpcomingParentSessionOpening(currentSession, now) {
  const presentation = getSessionPresentation(currentSession?.name);
  if (presentation.name !== "us_brinks" || presentation.parent !== "new_york") {
    return null;
  }

  const brinksOpensAt = Date.parse(currentSession.opens_at);
  const opensAt = brinksOpensAt + US_BRINKS_TO_NEW_YORK_MS;
  if (!Number.isFinite(brinksOpensAt) || opensAt <= now) return null;

  return { name: presentation.parent, opens_at: new Date(opensAt).toISOString() };
}

export function getSessionCountdownClass(milliseconds) {
  if (milliseconds <= SESSION_CRITICAL_WINDOW_MS) {
    return "session-countdown--critical";
  }
  if (milliseconds <= SESSION_URGENT_WINDOW_MS) {
    return "session-countdown--urgent";
  }
  return "";
}
