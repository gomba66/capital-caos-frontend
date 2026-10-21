export function selectNewSignalNotifications(
  events,
  currentSymbols,
  previouslyListedSymbols,
) {
  if (!previouslyListedSymbols) return [];

  return events.filter(
    (event) =>
      currentSymbols.has(event.symbol) &&
      !previouslyListedSymbols.has(event.symbol),
  );
}
