/** A frame can omit a label after projection or compact-layout changes.
 * Move its current keyboard focus before hiding/disabling it, never from
 * another control and never to a different document or inactive model. */
export function returnHiddenLabelFocus(
  label: HTMLButtonElement,
  canvas: HTMLCanvasElement,
) {
  if (!label.isConnected || !canvas.isConnected || canvas.tabIndex < 0 ||
      label.ownerDocument !== canvas.ownerDocument ||
      label.ownerDocument.activeElement !== label ||
      canvas.closest('[inert], [hidden], [aria-hidden="true"]')) return;
  canvas.focus({ preventScroll: true });
}
