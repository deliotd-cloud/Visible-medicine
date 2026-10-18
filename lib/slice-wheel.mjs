/** Bind non-passive wheel handling to an image viewport, never the document. */
export function bindSliceWheel(target, {getSlice, sliceCount, onSlice, pagePixels = () => 320}) {
  let remainder = 0, lastTime = -Infinity;
  const wheel = event => {
    // Preserve browser zoom, modified gestures, and non-vertical input.
    if (event.ctrlKey || event.metaKey || event.shiftKey || !Number.isFinite(event.deltaY) || event.deltaY === 0 || Math.abs(event.deltaY) <= Math.abs(event.deltaX ?? 0)) return;
    event.preventDefault();
    event.stopPropagation();
    const time = event.timeStamp;
    const delta = event.deltaY * (event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? pagePixels() : 1);
    if (!Number.isFinite(delta)) return;
    if (time - lastTime > 180 || Math.sign(delta) !== Math.sign(remainder)) remainder = 0;
    lastTime = time;
    remainder += delta;
    const steps = Math.trunc(remainder / 80);
    if (!steps) return;
    remainder %= 80;
    const previous = getSlice();
    const next = Math.max(0, Math.min(sliceCount - 1, previous + Math.max(-6, Math.min(6, steps))));
    if (next !== previous) onSlice(next);
  };
  target.addEventListener('wheel', wheel, {passive: false});
  return () => target.removeEventListener('wheel', wheel);
}
