/** Draft concept navigation between CT and MRI images of separate, unregistered subjects.
 * These three concepts have no exact matching 3D part or spatial correspondence.
 */
import {
  HEAD_LINK_REVISION,
  headAtlasConcept,
  headConceptById,
  resolveHeadConcept,
  type HeadConceptLink,
  type HeadEntry,
  type HeadModality,
} from './head-atlas-links.ts';

export type HeadImageConceptLink = Omit<HeadConceptLink, 'atlasHref'> & {atlasHref?: string};

type ImageOnlyConcept = {
  conceptId: string;
  label: string;
  suffix: string;
  side: 'left' | 'right' | 'midline_or_unpaired';
  nativeName: string;
  mriRepresentation: 'mask' | 'partial-mask';
};

const imageOnlyConcepts: readonly ImageOnlyConcept[] = [
  {conceptId: 'cerebellum-left-hemisphere', label: 'Left cerebellar hemisphere', suffix: 'Left cerebellar hemisphere', side: 'left', nativeName: 'cerebellar_hemisphere.left', mriRepresentation: 'mask'},
  {conceptId: 'cerebellum-right-hemisphere', label: 'Right cerebellar hemisphere', suffix: 'Right cerebellar hemisphere', side: 'right', nativeName: 'cerebellar_hemisphere.right', mriRepresentation: 'mask'},
  {conceptId: 'cerebellum-vermis', label: 'Cerebellar vermis', suffix: 'Cerebellar vermis', side: 'midline_or_unpaired', nativeName: 'cerebellar_vermis', mriRepresentation: 'partial-mask'},
];

function nativeId(concept: ImageOnlyConcept, modality: HeadModality): string {
  return `${modality === 'CT' ? 'cth' : 'mrb'}.cer.${concept.nativeName}`;
}

function matches(entry: HeadEntry, concept: ImageOnlyConcept, modality: HeadModality): boolean {
  return !!entry && entry.id === nativeId(concept, modality) &&
    entry.label === `${concept.suffix} — regional mask` &&
    entry.laterality === concept.side &&
    entry.representation === (modality === 'MRI' ? concept.mriRepresentation : 'mask');
}

function imageOnlyLink(concept: ImageOnlyConcept): HeadImageConceptLink {
  return {
    conceptId: concept.conceptId,
    label: concept.label,
    ctHref: `/atlas/ct-head?concept=${concept.conceptId}`,
    mriHref: `/atlas/mri-head?concept=${concept.conceptId}`,
    scopeNote: concept.mriRepresentation === 'partial-mask'
      ? 'Draft image-only anatomy concept link. The MRI vermis mask has partial coverage; CT and MRI are separate, unregistered subjects. No exact matching 3D part, spatial correspondence or clinical approval.'
      : 'Draft image-only anatomy concept link. CT and MRI are separate, unregistered subjects. No exact matching 3D part, spatial correspondence or clinical approval.',
    headRevision: HEAD_LINK_REVISION,
  };
}

/** Existing 3D links retain their complete source-pinned contract. */
export function headImageConceptById(id: string): HeadImageConceptLink | null {
  const existing = headConceptById(id);
  if (existing) return existing;
  const concept = imageOnlyConcepts.find(item => item.conceptId === id);
  return concept ? imageOnlyLink(concept) : null;
}

export function headImageConcept(entry: HeadEntry, modality: HeadModality): HeadImageConceptLink | null {
  const existing = headAtlasConcept(entry, modality);
  if (existing) return existing;
  if (modality !== 'CT' && modality !== 'MRI') return null;
  const concept = imageOnlyConcepts.find(item => matches(entry, item, modality));
  return concept ? imageOnlyLink(concept) : null;
}

/** Resolve an image-only identity only when exactly one current entry matches. */
export function resolveHeadImageConcept(entries: readonly HeadEntry[], id: string, modality: HeadModality): HeadEntry | null {
  const existing = resolveHeadConcept(entries, id, modality);
  if (existing) return existing;
  if (!Array.isArray(entries) || (modality !== 'CT' && modality !== 'MRI')) return null;
  const concept = imageOnlyConcepts.find(item => item.conceptId === id);
  if (!concept) return null;
  const matchesInStudy = entries.filter(entry => matches(entry, concept, modality));
  return matchesInStudy.length === 1 ? matchesInStudy[0] : null;
}

/** Metadata for a future, independent clinical review; no review is implied. */
export function headImageOnlyComparisonPacket() {
  return {
    schema: 'vm-head-image-only-comparison-1',
    headRevision: HEAD_LINK_REVISION,
    status: 'draft' as const,
    clinicalApproval: false as const,
    patientRegistration: false as const,
    bindings: imageOnlyConcepts.map(concept => ({
      conceptId: concept.conceptId,
      ct: {id: nativeId(concept, 'CT'), label: `${concept.suffix} — regional mask`, laterality: concept.side, representation: 'mask' as const},
      mri: {id: nativeId(concept, 'MRI'), label: `${concept.suffix} — regional mask`, laterality: concept.side, representation: concept.mriRepresentation},
    })),
  };
}
