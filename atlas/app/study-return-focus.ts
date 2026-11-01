/** Restore the current Atlas mode only when closing a study has left focus behind. */
export function restoreStudyFocus(root: HTMLElement | null): boolean {
  if (!root?.isConnected) return false;
  const doc = root.ownerDocument;
  const visible = (element: Element) => {
    if (!element.getClientRects().length) return false;
    const style = doc.defaultView?.getComputedStyle(element);
    return style?.visibility !== 'hidden' && style?.visibility !== 'collapse' && style?.display !== 'none';
  };
  const active = doc.activeElement;
  if (active && active !== doc.body && active.isConnected && visible(active))
    return false;

  const target = root.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]');
  if (!target?.isConnected || !visible(target) ||
      target.closest('[hidden], [inert], [aria-hidden="true"], [aria-disabled="true"]') ||
      target.matches(':disabled, [disabled]')) return false;
  target.focus({ preventScroll: true });
  return true;
}
