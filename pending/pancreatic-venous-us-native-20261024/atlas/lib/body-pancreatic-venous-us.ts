import pins from '../content/abdominal-branch-imaging-pins.json' with { type: 'json' };
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const sourceId = 'vm:anatomy:body:abdomen:unspecified:vessel:pancreaticoduodenal-vein';
const fmaId = 'FMA15398';
const sourceComponents = [
  ['FJ3545', '87919e391f53ec7e464f7379c422bc6e6bdcf022db8ea7007176e38a00cc1a3c'],
  ['FJ3646', '2c059c7ad26689513bbc41e13b913ed07c5bbd0696e59f85afb2a577b88f240f'],
  ['FJ3655', 'c1d02f38a45db4b4504fcc453837fab56fb18a81178a62f5b7da9a4f6758c72f'],
] as const;
const matches = pins.entries.filter(entry => entry.identity.id === sourceId);
if (matches.length !== 1) throw Error('Unexpected pancreaticoduodenal venous source count.');
const source = matches[0].identity;
if (source.fmaId !== fmaId || source.nodeName !== fmaId ||
    source.name !== 'Pancreaticoduodenal vein' || source.sourceName !== 'pancreaticoduodenal vein' ||
    source.system !== 'vessels' || source.category !== 'vessel' ||
    source.region !== 'abdomen' || source.regions.length !== 1 || source.regions[0] !== 'abdomen' ||
    source.laterality !== 'unspecified' || source.bundle !== 'abdomen-vessels-visceral-detail' ||
    source.sourceTree !== 'isa' || source.sources.length !== sourceComponents.length ||
    source.sources.some((part, index) => part.file !== sourceComponents[index][0] || part.sha256 !== sourceComponents[index][1]) ||
    source.validation.status !== 'unvalidated' || source.validation.anatomicalReview !== false)
  throw Error('Unexpected pancreaticoduodenal venous source identity.');
const signature = sourceCanonical(source);

/** Exact grouped source only; no component-to-branch or patient-space correspondence. */
export function bodyPancreaticVenousUsLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound' || structure.id !== sourceId || sourceCanonical(structure) !== signature) return undefined;
  return {
    readiness: 'draft',
    title: 'Pancreaticoduodenal vein · transabdominal ultrasound orientation · draft',
    body: 'In a prospective study of 50 consecutive subjects selected because the pancreatic head was well seen, the posterior superior pancreaticoduodenal vein was identified on transabdominal sonography in all 50. This conditional result does not give an unselected population detection rate or identify any of the three source components as that named branch.',
    bullets: [
      'The studied vein joined the portal vein. The nearby common bile duct could instead be followed toward the porta hepatis; this continuity helped distinguish the two tubular structures.',
      'Doppler demonstrated venous flow in 40% overall, despite visualization of the vein in all selected subjects. Lack of a Doppler signal alone did not establish absence of the vessel in that study.',
      'The three unvalidated source components remain one broad pancreaticoduodenal-vein selection. Their branch identities, complete course, and correspondence to any acquired image are unconfirmed.',
    ],
    citations: ['https://pubmed.ncbi.nlm.nih.gov/8470571/'],
    note: 'Original source-bound educational draft; revision-bound radiologist review pending. No publisher image or text, patient scan, diagnostic threshold, procedural route, patient-space registration or clinical approval is supplied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
