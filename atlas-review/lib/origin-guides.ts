import type { BodyStructure, Vec3 } from '@/atlas-review/app/body-types';
import type { BodyLayout } from './body-arrangement';
import { systemOpacity, type InspectionState } from './inspection-state';

export type OriginGuide = {
  id: string;
  start: Vec3;
  end: Vec3;
  bounds: BodyStructure['bounds'];
};

/** A display annotation, never a tissue connection or an anatomical route. */
export function selectedOriginGuide({
  enabled,
  exam,
  layout,
  explode,
  selectedId,
  structures,
  hiddenIds,
  contextIds = [],
  inspection,
  offsets,
  appearance,
}: {
  enabled: boolean;
  exam: boolean;
  layout: BodyLayout;
  explode: number;
  selectedId: string | null;
  structures: BodyStructure[];
  hiddenIds: string[];
  contextIds?: string[];
  inspection: InspectionState;
  offsets: Map<string, { x: number; y: number; z: number }>;
  appearance?: Record<string, { opacity: number }>;
}): OriginGuide | null {
  if (
    !enabled ||
    exam ||
    layout === 'tray' ||
    !Number.isFinite(explode) ||
    explode <= 0 ||
    inspection.plane !== 'off' ||
    !selectedId ||
    hiddenIds.includes(selectedId) ||
    contextIds.includes(selectedId)
  )
    return null;
  const structure = structures.find((s) => s.id === selectedId);
  const offset = offsets.get(selectedId);
  if (!structure || !offset) return null;
  const displacement = [offset.x, offset.y, offset.z];
  const opacity =
    systemOpacity(inspection, structure.system, true) *
    (appearance?.[selectedId]?.opacity ?? 1);
  if (
    !displacement.every(Number.isFinite) ||
    !structure.anchor.every(Number.isFinite) ||
    displacement.every((n) => n === 0) ||
    !Number.isFinite(opacity) ||
    opacity < 0.2
  )
    return null;
  return {
    id: selectedId,
    start: [...structure.anchor],
    end: structure.anchor.map((n, i) => n + displacement[i]) as Vec3,
    bounds: structure.bounds,
  };
}
