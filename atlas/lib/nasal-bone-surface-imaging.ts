import pins from '../content/cranial-bone-imaging-pins.json' with {type: 'json'};
import {sourceCanonical} from './body-source-additions';
import {
  nasalBoneSurfaceImagingTopics,
  nasalBoneSurfaceImagingReferences,
  nasalBoneSurfaceImagingNote,
  type NasalBoneSurfaceModality,
} from '../content/nasal-bone-surface-imaging';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const expected = [
  {id: 'vm:anatomy:body:head-neck:right:bone:right-nasal-bone', fmaId: 'FMA53647', side: 'right', sourceFile: 'FJ3378', sourceHash: '933e8c8de3b4eaa2a4d784862388cac53da48309a29fd3ae04e9ac10da543c5f'},
  {id: 'vm:anatomy:body:head-neck:left:bone:left-nasal-bone', fmaId: 'FMA53648', side: 'left', sourceFile: 'FJ3272', sourceHash: '43a73088376ae4179e8edd2f5d296d5c573cd1078379a0e3e8eeb90920ba9dc5'},
] as const;

const signatures = new Map<string, string>(expected.map(({id, fmaId, side, sourceFile, sourceHash}) => {
  const matches = pins.entries.filter(({identity}) => identity.id === id);
  if (matches.length !== 1) throw Error(`Expected one exact nasal-bone source: ${id}`);
  const s = matches[0].identity;
  if (s.fmaId !== fmaId || s.nodeName !== fmaId || s.laterality !== side ||
      s.system !== 'skeleton' || s.category !== 'bone' || s.region !== 'head-neck' ||
      s.bundle !== 'head-neck-skeleton' || s.sourceTree !== 'isa' ||
      s.sources.length !== 1 || s.sources[0].file !== sourceFile ||
      s.sources[0].sha256 !== sourceHash || s.coverageNote !== null ||
      s.provenance.method !== 'licensed-source-mesh' ||
      s.provenance.license !== 'CC-BY-4.0' || s.provenance.sourceVersion !== '4.0' ||
      s.validation.status !== 'unvalidated' || s.validation.anatomicalReview !== false)
    throw Error(`Nasal-bone source condition changed: ${id}`);
  return [id, sourceCanonical(s)] as const;
}));

/** Exactly two pinned source records and two teaching modalities. */
export function nasalBoneSurfaceImagingLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (tab !== 'xray' && tab !== 'ultrasound') return undefined;
  if (signatures.get(s.id) !== sourceCanonical(s)) return undefined;
  const topic = nasalBoneSurfaceImagingTopics[tab as NasalBoneSurfaceModality];
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'xray' ? 'X-ray' : 'Ultrasound'} orientation · draft`,
    body: topic.body,
    bullets: [...topic.bullets],
    citations: topic.references.map(key => nasalBoneSurfaceImagingReferences[key]),
    note: nasalBoneSurfaceImagingNote,
  };
}
