import { Box3, Vector3 } from 'three';
import type { AnatomyStructure } from '../app/anatomy-data';
import type { DissectionView } from '../app/dissection-data';
import manifest from '../public/models/bodyparts3d/manifest.json';
import { shoulderOffset, translatedBox } from './explode-layout.mjs';
import {
  arrangeBodyStructures,
  extractionOffsets,
  type ArrangementItem,
  type BodyLayout,
} from './body-arrangement';

/** Source bounds retain the existing inferior crop; no mesh or identity changes. */
export function shoulderArrangementItems(
  structures: AnatomyStructure[],
): ArrangementItem[] {
  return structures.flatMap((structure) => {
    const box = new Box3();
    for (const part of manifest.parts.filter(
      (part) => part.structureId === structure.id,
    )) {
      const source = new Box3(
        new Vector3().fromArray(part.bounds.min),
        new Vector3().fromArray(part.bounds.max),
      );
      source.min.y = Math.max(-3.15, source.min.y);
      if (!source.isEmpty()) box.union(source);
    }
    if (box.isEmpty()) return [];
    return [
      {
        id: structure.id,
        system: structure.system,
        bounds: { min: box.min.toArray(), max: box.max.toArray() },
        center: box.getCenter(new Vector3()).toArray(),
      },
    ];
  });
}

export function shoulderPresentationOffsets(
  items: ArrangementItem[],
  view: DissectionView,
  amount: number,
  layout: BodyLayout,
  selectedId: string | null,
  anchorSkeleton: boolean,
) {
  const value = Number.isFinite(amount)
    ? Math.max(0, Math.min(100, amount))
    : 0;
  const frame = new Box3();
  for (const item of items) frame.union(translatedBox(item.bounds));
  const targets =
    layout === 'tray'
      ? arrangeBodyStructures(items, frame.getCenter(new Vector3()), view)
          .offsets
      : layout === 'extract'
        ? extractionOffsets(items, selectedId, view)
        : undefined;
  return new Map(
    items.map((item) => {
      if (layout === 'extract')
        return [
          item.id,
          (targets?.get(item.id)?.clone() ?? new Vector3()).multiplyScalar(
            value / 100,
          ),
        ];
      const offset = shoulderOffset(
        item.id.split(':').at(-1)!,
        layout === 'tray' ? Math.min(100, value * 2.5) : value,
        layout === 'spatial' && anchorSkeleton && item.system === 'skeleton',
      );
      if (layout === 'tray' && value > 40)
        offset.lerp(targets?.get(item.id) ?? offset, (value - 40) / 60);
      return [item.id, offset];
    }),
  );
}
