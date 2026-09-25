/** Restore keyboard position after Set aside unmounts its focused button.
 * Never move focus from another control or scroll the model/outer document. */
function focusHistoryTarget(trigger: HTMLButtonElement, undo: HTMLButtonElement | null) {
  if (!undo?.isConnected || undo.disabled) return;
  const doc = trigger.ownerDocument;
  if (undo.ownerDocument !== doc ||
    (doc.activeElement !== doc.body && doc.activeElement !== trigger)) return;
  const panel = undo.closest<HTMLElement>('.eye-layer-controls');
  if (!panel?.isConnected) return;
  undo.focus({ preventScroll: true });
  const bounds = panel.getBoundingClientRect();
  const button = undo.getBoundingClientRect();
  if (button.top < bounds.top + 8)
    panel.scrollTop += button.top - bounds.top - 12;
  else if (button.bottom > bounds.bottom - 8)
    panel.scrollTop += button.bottom - bounds.bottom + 12;
}

export function restoreSpecimenRemovalFocus(
  trigger: HTMLButtonElement | null,
  undo: HTMLButtonElement | null,
) {
  if (!trigger || trigger.isConnected) return;
  focusHistoryTarget(trigger, undo);
}

/** Exhausting Undo/Redo disables its focused control; retain focus in history. */
export function restoreSpecimenHistoryFocus(
  trigger: HTMLButtonElement | null,
  alternate: HTMLButtonElement | null,
) {
  if (!trigger?.isConnected || !trigger.disabled) return;
  focusHistoryTarget(trigger, alternate);
}
