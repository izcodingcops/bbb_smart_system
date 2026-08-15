import {useCallback, useState} from 'react';

/**
 * Owns the close/discard/submit-failure scaffolding shared by every
 * custody-style create form (Equipment's Check-Out, Check-In and Add
 * Upkeep screens): a `touched` flag that gates whether closing needs a
 * discard confirmation, the two confirm dialogs' visibility, and whether
 * the last submit attempt failed.
 *
 * The hook owns state and the close decision only — it does not know the
 * dialogs' copy or a screen's field-level touch logic. Each screen still
 * calls `setTouched(true)` from its own field handlers, still renders its
 * own `ConfirmDialog`/`Toast` copy, and still drives its own submit flow
 * (clearing `confirmSubmit` and setting `submitFailed` around the mutation
 * call). This just de-duplicates the identical bookkeeping around them.
 */
export function useFormDiscardState(onClose: () => void) {
  // Set the first time the user changes any field — an untouched form can
  // close directly, a touched one confirms the discard first.
  const [touched, setTouched] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  /** Set when the submit mutation rejects, so the form can report it without navigating away. */
  const [submitFailed, setSubmitFailed] = useState(false);

  const handleClose = useCallback(() => {
    if (touched) {
      setConfirmDiscard(true);
    } else {
      onClose();
    }
  }, [touched, onClose]);

  /** The discard dialog's own onConfirm: dismiss it, then actually close. */
  const confirmDiscardAndClose = useCallback(() => {
    setConfirmDiscard(false);
    onClose();
  }, [onClose]);

  return {
    setTouched,
    confirmSubmit,
    setConfirmSubmit,
    confirmDiscard,
    setConfirmDiscard,
    submitFailed,
    setSubmitFailed,
    handleClose,
    confirmDiscardAndClose,
  };
}
