export type ImagingPane = 'index' | 'image' | 'learning';

/** Move keyboard focus only: never select anatomy, change a route or place a quiz answer. */
export function focusImagingPane(origin: HTMLElement, pane: ImagingPane): boolean {
  if (!['index', 'image', 'learning'].includes(pane)) return false;
  const workspace = origin.closest('.imaging-workspace-page');
  const target = workspace?.querySelector<HTMLElement>(`[data-imaging-pane="${pane}"]`);
  if (!target) return false;
  target.focus({preventScroll: true});
  // Desktop panes are already visible. On a stacked layout, reveal an off-screen
  // pane deliberately, without resetting its independently scrolled contents.
  const viewport = target.ownerDocument.defaultView;
  const box = target.getBoundingClientRect();
  if (viewport && (box.bottom <= 0 || box.top >= viewport.innerHeight || box.right <= 0 || box.left >= viewport.innerWidth)) {
    target.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'instant'});
  }
  return true;
}
