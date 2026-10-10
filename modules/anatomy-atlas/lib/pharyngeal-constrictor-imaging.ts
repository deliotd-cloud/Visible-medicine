import pins from '../content/pharyngeal-muscle-teaching-pins.json' with { type: 'json' };
import {
  pharyngealConstrictorImagingReferences,
  pharyngealConstrictorImagingTopics,
  type PharyngealConstrictorGroup,
  type PharyngealConstrictorModality,
} from '../content/pharyngeal-constrictor-imaging';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const allowedFmaIds = new Set(['FMA46631', 'FMA46632', 'FMA46635', 'FMA46636']);
const bindings = new Map(
  pins.entries
    .filter(entry =>
      (entry.family === 'superior' || entry.family === 'inferior') &&
      allowedFmaIds.has(entry.identity.fmaId),
    )
    .map(entry => [
      entry.identity.id,
      {
        signature: sourceCanonical(entry.identity),
        group: entry.family as PharyngealConstrictorGroup,
      },
    ]),
);

/** Only the four existing, exactly pinned superior/inferior source records. */
export function pharyngealConstrictorImagingLesson(
  structure: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (tab !== 'ct' && tab !== 'mri') return undefined;
  const binding = bindings.get(structure.id);
  if (!binding ||
    structure.bundle !== 'head-neck-muscles' ||
    structure.region !== 'head-neck' ||
    structure.system !== 'muscles' ||
    structure.category !== 'muscle' ||
    !allowedFmaIds.has(structure.fmaId) ||
    sourceCanonical(structure) !== binding.signature) return undefined;

  const modality = tab as PharyngealConstrictorModality;
  const topic = pharyngealConstrictorImagingTopics[binding.group][modality];
  return {
    readiness: 'draft',
    title: `${structure.name} · ${modality.toUpperCase()} pharyngeal orientation · draft`,
    body: topic.body,
    bullets: [...topic.bullets],
    citations: topic.references.map(key => pharyngealConstrictorImagingReferences[key]),
    note: 'Independent anatomical and revision-bound radiologist review pending. Research contour conventions are not proof of fine muscle boundaries on routine scans. These static exterior surfaces do not validate muscle attachments, the missing middle constrictor, a separate cricopharyngeus, tissue continuity, patient registration or dynamic swallowing. No acquired image, diagnosis, treatment plan or procedural route is supplied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
