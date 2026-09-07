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
  return Math.max(0, Math.min(216, width / 2 - labelGutter * 2));
}

/** Two independent screen-side columns. Never rebalance to the opposite side.
 * Measured box sizes accommodate wrapping, text enlargement and touch targets.
 * Crowded columns keep the selected label, then the existing landmark priority;
 * only labels which cannot fit are omitted. No extra scrolling is introduced.
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
    available = height - labelGutter * 2;
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
