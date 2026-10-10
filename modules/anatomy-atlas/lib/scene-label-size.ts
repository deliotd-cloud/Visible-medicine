/** Measure the unshortened name in the button's actual content width.
 * The off-layout copy never changes size when the visible name is clamped.
 */
export function selectedLabelNeedsCompact(button: HTMLButtonElement, available: number) {
  if (typeof button.querySelector !== 'function') return false;
  const name = button.querySelector<HTMLElement>('.scene-label-measure');
  if (!name || !Number.isFinite(available)) return false;
  const style = getComputedStyle(button);
  const horizontal = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const contentWidth = Math.max(1, button.clientWidth - horizontal);
  const width = `${contentWidth}px`;
  if (name.style.width !== width) name.style.width = width;
  const depth = button.querySelector<HTMLElement>('.scene-label-depth');
  const depthStyle = depth ? getComputedStyle(depth) : null;
  const depthHeight = depth && depthStyle && depthStyle.display !== 'none'
    ? depth.offsetHeight + parseFloat(depthStyle.marginTop) : 0;
  const naturalHeight = name.offsetHeight + depthHeight +
    parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) +
    parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
  return naturalHeight > available;
}
