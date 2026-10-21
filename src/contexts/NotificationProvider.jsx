import { useEffect, useState } from "react";
import { NotificationContext } from "./AppContexts";

export const NOTIFICATION_HISTORY_STORAGE_KEY =
  "market-watch-notification-history";
export const NOTIFICATION_HISTORY_LIMIT = 100;

function readNotificationHistory() {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(NOTIFICATION_HISTORY_STORAGE_KEY) || "[]",
    );
    return Array.isArray(stored)
      ? stored
          .filter(
            (event) =>
              event &&
              typeof event.id === "string" &&
              typeof event.symbol === "string" &&
              Number.isFinite(Number(event.timestamp_ms)),
          )
          .slice(0, NOTIFICATION_HISTORY_LIMIT)
      : [];
  } catch {
    return [];
  }
}

export default function NotificationProvider({ children }) {
  const [notificationHistory, setNotificationHistory] = useState(
    readNotificationHistory,
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        NOTIFICATION_HISTORY_STORAGE_KEY,
        JSON.stringify(notificationHistory),
      );
    } catch {
      // Storage may be unavailable or full.
    }
  }, [notificationHistory]);

  useEffect(() => {
    const syncNotificationHistory = (event) => {
      if (event.key === NOTIFICATION_HISTORY_STORAGE_KEY) {
        setNotificationHistory(readNotificationHistory());
      }
    };
    window.addEventListener("storage", syncNotificationHistory);
    return () => window.removeEventListener("storage", syncNotificationHistory);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notificationHistory, setNotificationHistory }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
