import { Box3, Vector3 } from 'three';
import type { BodyStructure } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import { bodyOffset, translatedBox } from './explode-layout.mjs';

export type BodyLayout = 'spatial' | 'tray';
const order = [
  'skeleton',
  'muscles',
  'organs',
  'nerves',
  'vessels',
  'connective',
];
export function arrangementAxes(view: DissectionView) {
  const direction = new Vector3(
    ...({
      anterior: [0, 0, 1],
      posterior: [0, 0, -1],
      right: [-1, 0, 0],
      left: [1, 0, 0],
      inferior: [0, -1, 0],
      superior: [0, 1, 0],
    }[view] as [number, number, number]),
  );
  const up = new Vector3(
    0,
    Math.abs(direction.y) === 1 ? 0 : 1,
    view === 'superior' ? -1 : view === 'inferior' ? 1 : 0,
  );
  return { direction, up, right: new Vector3().crossVectors(up, direction) };
}

/** A deterministic, same-scale catalogue tray. Only translations are returned.
 * Source groups remain one selectable entry. Rectangles are conservative projected
 * bounds, not measurements, segmentations or reconstructed tissue surfaces.
 */
export function arrangeBodyStructures(
  items: BodyStructure[],
  origin: Vector3,
  view: DissectionView,
) {
  const axes = arrangementAxes(view);
  const rectangles = items.map((item) => {
    const box = translatedBox(item.bounds);
    let xmin = Infinity,
      xmax = -Infinity,
      ymin = Infinity,
      ymax = -Infinity;
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y])
        for (const z of [box.min.z, box.max.z]) {
          const point = new Vector3(x, y, z);
          const px = point.dot(axes.right),
            py = point.dot(axes.up);
          xmin = Math.min(xmin, px);
          xmax = Math.max(xmax, px);
          ymin = Math.min(ymin, py);
          ymax = Math.max(ymax, py);
        }
    return {
      item,
      center: box.getCenter(new Vector3()),
      width: Math.max(0.001, xmax - xmin),
      height: Math.max(0.001, ymax - ymin),
    };
  });
  if (!rectangles.length)
    return { offsets: new Map<string, Vector3>(), gap: 0.04 };
  const dimensions = rectangles
    .map((r) => Math.sqrt(r.width * r.height))
    .sort((a, b) => a - b);
  const gap = Math.max(
    0.02,
    Math.min(0.12, dimensions[Math.floor(dimensions.length / 2)] * 0.15),
  );
  const area = rectangles.reduce(
    (sum, r) => sum + (r.width + gap) * (r.height + gap),
    0,
  );
  const width = Math.max(
    ...rectangles.map((r) => r.width + gap),
    Math.sqrt(area * 1.45),
  );
  rectangles.sort(
    (a, b) =>
      order.indexOf(a.item.system) - order.indexOf(b.item.system) ||
      b.height - a.height ||
      b.width - a.width ||
      (a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0),
  );
  const placed: Array<{
    rectangle: (typeof rectangles)[number];
    x: number;
    y: number;
  }> = [];
  let x = 0,
    y = 0,
    rowHeight = 0,
    previousSystem = '',
    actualWidth = 0;
  for (const rectangle of rectangles) {
    if (
      x > 0 &&
      (x + rectangle.width > width || previousSystem !== rectangle.item.system)
    ) {
      y += rowHeight + gap * (previousSystem !== rectangle.item.system ? 3 : 1);
      x = 0;
      rowHeight = 0;
    }
    placed.push({ rectangle, x, y });
    actualWidth = Math.max(actualWidth, x + rectangle.width);
    x += rectangle.width + gap;
    rowHeight = Math.max(rowHeight, rectangle.height);
    previousSystem = rectangle.item.system;
  }
  const height = y + rowHeight;
  const offsets = new Map<string, Vector3>();
  for (const { rectangle: r, x: px, y: py } of placed) {
    const destination = origin
      .clone()
      .addScaledVector(axes.right, px + r.width / 2 - actualWidth / 2)
      .addScaledVector(axes.up, height / 2 - py - r.height / 2);
    offsets.set(r.item.id, destination.sub(r.center));
  }
  return { offsets, gap };
}

/** 0–40: spatial expansion. 40–100: transition into the tray.
 * Only the 100% tray endpoint guarantees projected bounding-box clearance.
 * The spatial mode is exactly the existing expansion, including anchored bones.
 */
export function bodyPresentationOffset(
  item: BodyStructure,
  origin: Vector3,
  amount: number,
  layout: BodyLayout,
  anchorSkeleton: boolean,
  tray?: Map<string, Vector3>,
) {
  const value = Number.isFinite(amount)
    ? Math.max(0, Math.min(100, amount))
    : 0;
  if (layout === 'spatial')
    return bodyOffset(
      item.center,
      origin,
      value,
      anchorSkeleton && item.system === 'skeleton',
    );
  const radial = bodyOffset(item.center, origin, Math.min(100, value * 2.5));
  return value <= 40
    ? radial
    : radial.lerp(tray?.get(item.id) ?? radial, (value - 40) / 60);
}

export function arrangementBounds(
  items: BodyStructure[],
  offsets: Map<string, Vector3>,
) {
  const box = new Box3();
  for (const item of items)
    box.union(translatedBox(item.bounds, offsets.get(item.id)));
  return box;
}
