import { longusColliStudyReady } from './longus-colli';
import { longusColliAttachments, longusColliAttachmentReference, longusColliAttachmentNote } from '../content/longus-colli-attachments';
import type { BodyCatalog } from '../app/body-types';
import type { DissectionAction } from '../app/dissection-data';

const inRegion = (s: { regions: string[] }, region: string) => region === 'whole-body' || s.regions.includes(region);
/** Reuse the entire admitted source/context binding, never a name or FMA-only match. */
export function longusColliAttachmentInfo(catalog: BodyCatalog, region: string, side: string, selectedId: string, exam = false) {
  if (exam || !['both', 'left'].includes(side) || !['head-neck', 'spine', 'whole-body'].includes(region)) return null;
  const selected = catalog.structures.find(s => s.id === selectedId);
  const relationship = selected && longusColliAttachments.find(a => a.fmas.includes(selected.fmaId));
  if (!selected || !relationship || selected.laterality !== 'left' || !inRegion(selected, region)
    || !longusColliStudyReady(catalog, region, 'longus-colli-left', side)) return null;
  const rows = relationship.endpoints.map(endpoint => ({ ...endpoint, structures: endpoint.bones.map(fma => {
    // Study readiness has already validated every complete context record and bundle.
    const structure = catalog.structures.find(s => s.fmaId === fma)!;
    return { structure, availableHere: inRegion(structure, region) };
  }) }));
  return { selected, relationship, rows, completeHere: rows.every(row => row.structures.every(p => p.availableHere)),
    reference: longusColliAttachmentReference, note: longusColliAttachmentNote };
}
export function longusColliAttachmentPlan(...args: Parameters<typeof longusColliAttachmentInfo>): { action: DissectionAction; selectedId: string; completeHere: boolean; view: 'anterior' } | null {
  const info = longusColliAttachmentInfo(...args);
  if (!info) return null;
  const [catalog, region] = args;
  const keep = new Set([info.selected.id, ...info.rows.flatMap(row => row.structures.map(p => p.structure.id))]);
  return { selectedId: info.selected.id, completeHere: info.completeHere, view: 'anterior',
    action: { type: 'load-view', hiddenIds: catalog.structures.filter(s => inRegion(s, region) && !keep.has(s.id)).map(s => s.id) } };
}
