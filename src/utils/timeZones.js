import { DateTime } from "luxon";

export const COMMON_TIME_ZONES = [
  "UTC",
  "America/Bogota",
  "America/Mexico_City",
  "America/New_York",
  "Europe/Madrid",
  "Europe/London",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "America/Argentina/Buenos_Aires",
];

export function formatUtcOffset(timeZone, timestamp = Date.now()) {
  const dateTime = DateTime.fromMillis(timestamp, { zone: timeZone });
  if (!dateTime.isValid) return "UTC";

  const offsetMinutes = dateTime.offset;
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
  const minutes = String(absoluteMinutes % 60).padStart(2, "0");
  return `UTC${sign}${hours}:${minutes}`;
}

export function formatTimeZoneOption(timeZone, timestamp = Date.now()) {
  const city = timeZone.split("/").at(-1).replaceAll("_", " ");
  return `${formatUtcOffset(timeZone, timestamp)} · ${city}`;
}
