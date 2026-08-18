/**
 * Labels for Connected Elements options that are derived rather than stored.
 *
 * A Connected Elements field offers other modules' records as display
 * labels, not ids. The resolver that builds a module's option list and the
 * quick-create overlay that pre-selects a brand-new record therefore have to
 * produce byte-identical strings — otherwise the overlay selects a value the
 * dropdown doesn't list. Every module reaches into here so none of them can
 * drift from each other.
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

export function maintenanceConnectedLabel(reference: string): string {
  return `Maintenance ${reference}`;
}
