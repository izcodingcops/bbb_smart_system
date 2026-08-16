/**
 * Labels for Connected Elements options that are derived rather than stored.
 *
 * The maintenance form offers incidents as display labels, not ids. The
 * resolver that builds the option list and the quick-create sheet that
 * pre-selects a brand-new incident therefore have to produce byte-identical
 * strings — otherwise the sheet selects a value the dropdown doesn't list.
 * Both import from here so the two can't drift.
 */
export function incidentConnectedLabel(
  type: string,
  occurredAt: string,
): string {
  const date = new Date(occurredAt);
  return Number.isNaN(date.getTime())
    ? type
    : `${type} — ${date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      })}`;
}
