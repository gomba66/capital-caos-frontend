import React, { createContext } from "react";
import { DateTime } from "luxon";

export const SidebarContext = createContext({
  sidebarWidth: 220,
  setSidebarWidth: () => {},
});

export const TimeZoneContext = React.createContext({
  timeZone: DateTime.local().zoneName,
  setTimeZone: () => {},
});

export const CurrencyContext = React.createContext({
  currency: "USDT",
  setCurrency: () => {},
});
