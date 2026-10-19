import pins from '../content/pharyngeal-muscle-teaching-pins.json' with { type: 'json' };
import {
  salpingopharyngeusMriReference,
  salpingopharyngeusMriTopic,
} from '../content/salpingopharyngeus-mri';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const expectedSources = new Map([
  ['FMA46670', { side: 'left', file: 'FJ2745', sha256: '81c70a6f8ab2de5d20a715cdf5339d756ca7171c473adc645231929b2732bf31' }],
  ['FMA46669', { side: 'right', file: 'FJ2757', sha256: 'b10e40d550d6208c907df65d844403071233d8088a109b2be5f925cd5d9e6c36' }],
]);

const bindings = new Map(
  pins.entries.flatMap(entry => {
    const expected = expectedSources.get(entry.identity.fmaId);
    const identity = entry.identity;
    if (entry.family !== 'salpingo' || !expected ||
      identity.laterality !== expected.side ||
      identity.sources.length !== 1 ||
      identity.sources[0].file !== expected.file ||
      identity.sources[0].sha256 !== expected.sha256) return [];
    return [[identity.id, sourceCanonical(identity)] as const];
  }),
);

/** Draft MRI education for the two exact source-pinned salpingopharyngeus records. */
export function salpingopharyngeusMriLesson(
  structure: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (tab !== 'mri') return undefined;
  const signature = bindings.get(structure.id);
  if (!signature ||
    structure.bundle !== 'head-neck-muscles' ||
    structure.region !== 'head-neck' ||
    structure.system !== 'muscles' ||
    structure.category !== 'muscle' ||
    !expectedSources.has(structure.fmaId) ||
    sourceCanonical(structure) !== signature) return undefined;

  return {
    readiness: 'draft',
    title: `${structure.name} · MRI research orientation · draft`,
    body: salpingopharyngeusMriTopic.body,
    bullets: [...salpingopharyngeusMriTopic.bullets],
    citations: [salpingopharyngeusMriReference],
    note: 'Independent anatomical and revision-bound radiologist review pending. This source mesh has no MRI signal, patient-specific mask, registration or validated muscle boundary. No scan identification, diagnosis or clinical approval is supplied. Atlas, imaging-case and lecture access remain independent.',
  };
}
