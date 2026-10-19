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

/** Move focus, not selection, through the current visible screen-side columns.
 * Read the rendered positions on demand, so orbit, explode and resize never
 * leave a stale keyboard order. Tab/Enter/Space keep their native behaviour. */
export function navigateSceneLabels(
  event: Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' |
    'defaultPrevented' | 'preventDefault' | 'stopPropagation'> & {isComposing?: boolean},
  current: HTMLButtonElement,
  buttons: Iterable<HTMLButtonElement>,
) {
  if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey ||
      event.metaKey || event.shiftKey ||
      !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) ||
      current.ownerDocument.activeElement !== current) return;
  const visible = [...buttons].filter(button => button.isConnected && !button.disabled &&
    button.ownerDocument === current.ownerDocument &&
    (button.dataset.side === 'left' || button.dataset.side === 'right') &&
    !button.closest('[inert], [hidden], [aria-hidden="true"]') &&
    getComputedStyle(button).visibility === 'visible' && button.getClientRects().length > 0)
    .map(button => ({button, y: button.getBoundingClientRect().top + button.offsetHeight / 2}));
  if (!visible.some(item => item.button === current)) return;
  const column = visible.filter(item => item.button.dataset.side === current.dataset.side)
    .sort((a, b) => a.y - b.y);
  const index = column.findIndex(item => item.button === current);
  let target: HTMLButtonElement | undefined;
  if (event.key === 'Home') target = column[0]?.button;
  else if (event.key === 'End') target = column.at(-1)?.button;
  else if (event.key === 'ArrowUp') target = column[index - 1]?.button;
  else if (event.key === 'ArrowDown') target = column[index + 1]?.button;
  else {
    const side = event.key === 'ArrowLeft' ? 'left' : 'right';
    if (side !== current.dataset.side) {
      const y = column[index].y;
      target = visible.filter(item => item.button.dataset.side === side)
        .sort((a, b) => Math.abs(a.y - y) - Math.abs(b.y - y) || a.y - b.y)[0]?.button;
    }
  }
  // At a column edge stay put; do not scroll the page or rotate the model.
  event.preventDefault();
  event.stopPropagation();
  if (target && target !== current) target.focus({ preventScroll: true });
}
