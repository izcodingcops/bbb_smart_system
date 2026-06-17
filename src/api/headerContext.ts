/**
 * Small, transient request-context store for header values that need to be
 * present on outgoing requests BEFORE the corresponding redux state can be
 * committed. The classic case: `/shifts/add` needs the `program_id` header,
 * but dispatching `selectProgram(program)` to populate it also triggers
 * navigation to the home stack (AppNavigator gates on `selectedProgram`),
 * which would happen even when the request fails.
 *
 * Set the override right before the request, clear it after.
 */

let activeProgramId: string | number | undefined;

export function setActiveProgramId(id: string | number | undefined): void {
  activeProgramId = id;
}

export function getActiveProgramId(): string | number | undefined {
  return activeProgramId;
}
