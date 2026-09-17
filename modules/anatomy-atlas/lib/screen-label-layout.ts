import { Vector3, type Camera } from 'three';

export type ScreenAnchor = { x: number; y: number };
export type ScreenLabel = ScreenAnchor & {
  id: string;
  width: number;
  height: number;
  selected?: boolean;
  priority?: number;
};
export type PlacedLabel = ScreenLabel & {
  side: 'left' | 'right';
  left: number;
  top: number;
  endX: number;
  endY: number;
};

/** Project the actual world anchor, after all parent/explode transforms.
 * The caller updates camera/world matrices once per frame. Anatomical laterality
 * is deliberately not involved: screen-right changes when the viewer rotates.
 */
export function projectLabelAnchor(
  world: Vector3,
  camera: Camera,
  width: number,
  height: number,
): ScreenAnchor | null {
  if (
    ![world.x, world.y, world.z, width, height].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0
  )
    return null;
  const eye = world.clone().applyMatrix4(camera.matrixWorldInverse);
  if (eye.z >= 0) return null;
  const ndc = world.clone().project(camera);
  if (
    ![ndc.x, ndc.y, ndc.z].every(Number.isFinite) ||
    Math.abs(ndc.x) > 1 ||
    Math.abs(ndc.y) > 1 ||
    Math.abs(ndc.z) > 1
  )
    return null;
  return { x: ((ndc.x + 1) * width) / 2, y: ((1 - ndc.y) * height) / 2 };
}

export const labelGutter = 10;
export function screenLabelMaxWidth(width: number) {
  if (!Number.isFinite(width) || width <= 0) return 0;
  // Keep the central model area open on narrow canvases. This is based on the
  // actual canvas (including an embedded panel), not the browser's width.
  const column = width < 560 ? Math.min(160, width * 0.3) : 216;
  // offsetWidth is integral. Avoid rejecting a valid browser-measured box whose
  // fractional CSS max-width rounded up by a pixel.
  return Math.max(0, Math.floor(Math.min(column, width / 2 - labelGutter * 2)));
}

export function screenLabelLimitPerSide(width: number, height: number) {
  if (![width, height].every(Number.isFinite) || width <= 40 || height <= 20)
    return 0;
  if (width < 560) return height < 320 ? 1 : 2;
  return height < 240 ? 2 : 8;
}

/** Two independent screen-side columns. Never rebalance to the opposite side.
 * Measured box sizes accommodate wrapping, text enlargement and touch targets.
 * Compact canvases show fewer landmarks to leave the anatomy visible. Crowded
 * columns keep the selected label, then the existing landmark priority. Omitted
 * labels remain selectable through their tissue or the structure list; no
 * anatomical item is hidden and no extra scrolling/control is introduced.
 */
export function layoutScreenLabels(
  labels: readonly ScreenLabel[],
  width: number,
  height: number,
): PlacedLabel[] {
  if (
    ![width, height].every(Number.isFinite) ||
    width <= labelGutter * 4 ||
    height <= labelGutter * 2
  )
    return [];
  const valid = labels.filter(
    (label, index) =>
      labels.findIndex((other) => other.id === label.id) === index &&
      [label.x, label.y, label.width, label.height].every(Number.isFinite) &&
      label.x >= 0 &&
      label.x <= width &&
      label.y >= 0 &&
      label.y <= height &&
      label.width > 0 &&
      label.width <= screenLabelMaxWidth(width) &&
      label.height > 0,
  );
  const result: PlacedLabel[] = [];
  const gap = 6,
    available = height - labelGutter * 2,
    limit = screenLabelLimitPerSide(width, height);
  for (const side of ['left', 'right'] as const) {
    const candidates = valid.filter(
      (label) => (label.x < width / 2 ? 'left' : 'right') === side,
    );
    candidates.sort(
      (a, b) =>
        Number(!!b.selected) - Number(!!a.selected) ||
        (a.priority ?? 0) - (b.priority ?? 0) ||
        a.id.localeCompare(b.id),
    );
    let used = 0;
    const accepted: ScreenLabel[] = [];
    for (const label of candidates) {
      if (accepted.length >= limit) break;
      const space = label.height + (accepted.length ? gap : 0);
      if (used + space <= available) {
        accepted.push(label);
        used += space;
      }
    }
    accepted.sort((a, b) => a.y - b.y || a.id.localeCompare(b.id));
    const tops: number[] = [];
    for (let i = 0; i < accepted.length; i++) {
      const label = accepted[i];
      const previousBottom = i
        ? tops[i - 1] + accepted[i - 1].height + gap
        : labelGutter;
      tops.push(Math.max(previousBottom, label.y - label.height / 2));
    }
    // Backward packing retains order while bringing the bottom row into view.
    let bottom = height - labelGutter;
    for (let i = accepted.length - 1; i >= 0; i--) {
      tops[i] = Math.min(tops[i], bottom - accepted[i].height);
      bottom = tops[i] - gap;
    }
    // An extracted or panned structure can enter a label gutter. Do not cover
    // its own anchor when this column has room above/below it. Preserve screen
    // side, selected-label priority, vertical order and all neighbouring boxes.
    // This protects an anchor, not a projected whole-tissue occlusion proof.
    for (let i = 0; i < accepted.length; i++) {
      const label = accepted[i];
      const left = side === 'left' ? labelGutter : width - labelGutter - label.width;
      const clearance = 12;
      if (label.x < left - clearance || label.x > left + label.width + clearance)
        continue;
      const low = i ? tops[i - 1] + accepted[i - 1].height + gap : labelGutter;
      const high = (i + 1 < accepted.length ? tops[i + 1] - gap : height - labelGutter) - label.height;
      const clear = (top: number) =>
        top + label.height <= label.y - clearance || top >= label.y + clearance;
      if (clear(tops[i])) continue;
      const options = [label.y - label.height - clearance, label.y + clearance]
        .map(top => Math.max(low, Math.min(high, top)))
        .filter(top => top >= low && top <= high && clear(top))
        .sort((a, b) => Math.abs(a - tops[i]) - Math.abs(b - tops[i]));
      if (options.length) tops[i] = options[0];
    }
    accepted.forEach((label, i) => {
      const left =
        side === 'left' ? labelGutter : width - labelGutter - label.width;
      result.push({
        ...label,
        side,
        left,
        top: tops[i],
        endX: side === 'left' ? left + label.width : left,
        endY: tops[i] + label.height / 2,
      });
    });
  }
  return result;
}
