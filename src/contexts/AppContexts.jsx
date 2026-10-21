import React, { createContext } from "react";
import { DateTime } from "luxon";

export const SidebarContext = createContext({
  sidebarWidth: 64,
  setSidebarWidth: () => {},
  mobileNavOpen: false,
  setMobileNavOpen: () => {},
});

export const TimeZoneContext = React.createContext({
  timeZone: DateTime.local().zoneName,
  setTimeZone: () => {},
});

export const CurrencyContext = React.createContext({
  currency: "USDT",
  setCurrency: () => {},
});

export const PlatformThemeContext = React.createContext({
  mode: "dark",
  setMode: () => {},
  palette: "classic",
  setPalette: () => {},
});

export const NotificationContext = React.createContext({
  notificationHistory: [],
  setNotificationHistory: () => {},
});
