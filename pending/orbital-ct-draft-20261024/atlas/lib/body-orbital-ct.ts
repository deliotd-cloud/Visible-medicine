import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';
import sourcePins from '../content/orbital-nerve-quiz-pins.json' with { type: 'json' };
import { sourceCanonical } from './body-source-additions';

// The pre-existing quiz pins supply complete geometry identities only, never CT
// claims, readiness, question content or approval. CT evidence is cited below.
const sources = {
  acr: 'https://acsearch.acr.org/docs/69509/Narrative/',
  orbit: 'https://acsearch.acr.org/docs/69486/Narrative/',
  fat: 'https://pubmed.ncbi.nlm.nih.gov/30446949/',
  foramina: 'https://pubmed.ncbi.nlm.nih.gov/25422512/',
  variant: 'https://pubmed.ncbi.nlm.nih.gov/31301129/',
} as const;

type Side = 'left' | 'right';
type Family = 'ophthalmic' | 'supraorbital';
type Pin = { id: string; fmaId: string; name: string; sourceName: string; side: Side; file: string; sha256: string; family: Family };
const pins: readonly Pin[] = [
  { id: 'vm:anatomy:body:head-neck:left:nerve:left-ophthalmic-nerve', fmaId: 'FMA52623', name: 'Left ophthalmic nerve', sourceName: 'left ophthalmic nerve', side: 'left', file: 'FJ1312', sha256: '4af03a35f39e75f07c43d63c0561d78f37e98b92381cd4d01a2c3fe53afd561c', family: 'ophthalmic' },
  { id: 'vm:anatomy:body:head-neck:right:nerve:right-ophthalmic-nerve', fmaId: 'FMA52622', name: 'Right ophthalmic nerve', sourceName: 'right ophthalmic nerve', side: 'right', file: 'FJ1363', sha256: '05f71831dc54303ffc740a4e38f35475f60c72e4e7348b797acfeac4a1d6d29d', family: 'ophthalmic' },
  { id: 'vm:anatomy:body:head-neck:left:nerve:left-supra-orbital-nerve', fmaId: 'FMA52657', name: 'Left supra-orbital nerve', sourceName: 'left supra-orbital nerve', side: 'left', file: 'FJ1325', sha256: 'c37ecf086b1049ac3b8acbd0b50ac5eb4c14a58e3a7c56b9d952f463b183853a', family: 'supraorbital' },
  { id: 'vm:anatomy:body:head-neck:right:nerve:right-supra-orbital-nerve', fmaId: 'FMA52656', name: 'Right supra-orbital nerve', sourceName: 'right supra-orbital nerve', side: 'right', file: 'FJ1376', sha256: '18a71e5cefbb6c68e1daf6147fedfa0943ee3044725ea7eccbe5ca62db4c15e4', family: 'supraorbital' },
];
const signatures = new Map(pins.map(pin => {
  const matches = sourcePins.entries.filter(entry => entry.identity.id === pin.id);
  if (matches.length !== 1 || matches[0].identity.fmaId !== pin.fmaId)
    throw Error('Unexpected orbital CT source identity');
  return [pin.id, sourceCanonical(matches[0].identity)] as const;
}));

/** Draft CT context for four exact original model roots; never a scan or registration. */
export function bodyOrbitalCtLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ct') return undefined;
  const pin = pins.find(p => p.id === s.id);
  if (!pin || sourceCanonical(s) !== signatures.get(pin.id)) return undefined;
  if (!pin || s.fmaId !== pin.fmaId || s.name !== pin.name || s.sourceName !== pin.sourceName ||
      s.laterality !== pin.side || s.region !== 'head-neck' || s.bundle !== 'head-neck-nerves' ||
      s.nodeName !== pin.fmaId || s.sourceTree !== 'isa' || s.coverageNote !== null ||
      s.system !== 'nerves' || s.category !== 'nerve' ||
      s.regions.length !== 1 || s.regions[0] !== 'head-neck' ||
      s.provenance?.method !== 'licensed-source-mesh' ||
      s.provenance.license !== 'CC-BY-4.0' || s.provenance.sourceVersion !== '4.0' ||
      s.provenance.recovered !== false || s.validation?.status !== 'unvalidated' ||
      s.validation.anatomicalReview !== false || s.sources.length !== 1 ||
      s.sources[0].file !== pin.file || s.sources[0].sha256 !== pin.sha256) return undefined;

  const ophthalmic = pin.family === 'ophthalmic';
  return {
    readiness: 'draft',
    title: `${s.name} · CT orientation · draft`,
    body: ophthalmic
      ? 'For this selected ophthalmic division (V1), CT teaching starts with the orbital apex, superior orbital fissure and surrounding fat as regional landmarks. A visible space or fat plane does not trace a normal individual nerve.'
      : 'For this selected supra-orbital nerve, thin-section orbital or facial CT can orient the supraorbital rim and its notch or foramen. This bony exit is a landmark, not a segmented view of the nerve.',
    bullets: ophthalmic ? [
      'On an appropriate dedicated orbit or skull-base study, loss of normal fat, abnormal soft tissue or bone change can raise concern in the right clinical setting; none identifies the affected nerve by itself.',
      'A routine head CT does not imply dedicated orbital coverage, contrast enhancement or direct V1 depiction. Suspected cranial neuropathy requires clinical localization and an appropriate imaging pathway.',
      'Compare the named side with the generic 3D source at zero separation; this model has no patient-space registration or validated nerve boundary.',
    ] : [
      'The notch or foramen varies, sometimes even between sides. Its presence and shape do not prove normal nerve calibre, continuity or function.',
      'Inspect soft-tissue change only in the context of the actual acquisition and history; routine head CT is not a dedicated contrast orbit or face examination.',
      'Compare the named side with the generic 3D source at zero separation; the displayed nerve is not a registered CT segmentation or procedural map.',
    ],
    citations: ophthalmic ? [sources.acr, sources.orbit, sources.fat] : [sources.foramina, sources.variant, sources.orbit],
    note: 'Anatomy and radiology review pending for this exact source and lesson revision. Confirm patient, side, orientation, series and protocol in Didanix Education/light. This draft does not diagnose disease, prescribe acquisition, establish patient-space registration or grant clinical approval. Atlas, case and lecture access remain independent.',
  };
}
