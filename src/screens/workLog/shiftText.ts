/**
 * Every piece of shift-specific text the module shows, in one place. The
 * source mockup hardcodes all of this to "Cleaning" — this is the single seam
 * that generalizes it across every MOCK_SHIFT_TYPES entry.
 */
export function workLogCopy(shiftTypeName: string) {
  return {
    createTitle: `Add ${shiftTypeName} Work`,
    entryBadgeLabel: `${shiftTypeName} · Entry Type`,
    saveDialogTitle: (reference: string) =>
      `Save ${shiftTypeName} Work ${reference}`,
    saveDialogMessage: (reference: string, entryType: string) =>
      `Do you want to save this ${shiftTypeName} Work — ${entryType}? You can edit it later from the Work Log.`,
    discardDialogTitle: `Discard this ${shiftTypeName} Work?`,
    discardDialogMessage: `Your entries won't be saved and this ${shiftTypeName} Work won't be added to your Work Log. This can't be undone.`,
    toastTitle: 'Saved to Work Log',
    toastMessage: (entryType: string) =>
      `${shiftTypeName} · ${entryType} was logged successfully.`,
    queuedToastTitle: 'Saved — will upload when back online',
    queuedToastMessage: (entryType: string) =>
      `${shiftTypeName} · ${entryType} is queued and will upload automatically once you're back online.`,
    viewTitle: shiftTypeName,
    deleteDialogTitle: `Delete this ${shiftTypeName} Work?`,
    deleteDialogMessage: (reference: string) =>
      `${shiftTypeName} Work ${reference} will be permanently deleted. This action cannot be undone.`,
    deletedToastTitle: `${shiftTypeName} Work deleted`,
    deletedToastMessage: (reference: string) =>
      `${reference} was removed from your Work Log.`,
    updatedToastTitle: `${shiftTypeName} Work updated`,
    updatedToastMessage: (reference: string) =>
      `${reference} was saved successfully.`,
  };
}
