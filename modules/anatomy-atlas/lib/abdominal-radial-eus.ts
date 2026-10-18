import pins from '../content/abdominal-branch-imaging-pins.json' with { type: 'json' };
import { abdominalRadialEusTopics, abdominalRadialEusReference } from '../content/abdominal-radial-eus';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const expected = [
  ['vm:anatomy:body:abdomen:left:vessel:left-gastroepiploic-vein', 'FMA15390', 'left', 'FJ3502', '8fbff4b304815200c09017d46d9537b0cd3f699ed13d79c0ac35bd122f24decb'],
  ['vm:anatomy:body:abdomen:right:vessel:right-gastroepiploic-vein', 'FMA15397', 'right', 'FJ3597', 'c3d9e308cc410cacf95ca9336bc80ba221af8ec6a555b3111881289d326e8523'],
  ['vm:anatomy:body:abdomen:right:vessel:right-colic-vein', 'FMA15407', 'right', 'FJ3591', '9bae25c069450677e645493c0b2e987c65ccaf984f7a441d126db6335601ec73'],
  ['vm:anatomy:body:abdomen:midline:vessel:middle-colic-vein', 'FMA15406', 'midline', 'FJ3543', '001af4e63182ebd20eb8ae9b15e51d85302d56f4eb9134a78cd44e2a5047a9bf'],
] as const;

const bindings: ReadonlyMap<string, { signature: string; fmaId: keyof typeof abdominalRadialEusTopics }> = new Map(expected.map(([id, fmaId, laterality, file, sha256]) => {
  const matches = pins.entries.filter(entry => entry.identity.id === id);
  if (matches.length !== 1) throw Error('Unexpected abdominal radial EUS source count.');
  const source = matches[0].identity;
  if (source.fmaId !== fmaId || source.nodeName !== fmaId || source.laterality !== laterality ||
      source.region !== 'abdomen' || source.regions.length !== 1 || source.regions[0] !== 'abdomen' ||
      source.system !== 'vessels' || source.category !== 'vessel' || source.sourceTree !== 'isa' ||
      source.sources.length !== 1 || source.sources[0].file !== file || source.sources[0].sha256 !== sha256 ||
      source.validation.status !== 'unvalidated' || source.validation.anatomicalReview !== false)
    throw Error('Unexpected abdominal radial EUS source identity.');
  return [id, { signature: sourceCanonical(source), fmaId }] as const;
}));

/** Exact retained source selections only; no patient-space correspondence. */
export function abdominalRadialEusLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const binding = bindings.get(structure.id);
  if (!binding || binding.signature !== sourceCanonical(structure)) return undefined;
  const topic = abdominalRadialEusTopics[binding.fmaId];
  return {
    readiness: 'draft',
    title: `${structure.name} · radial endoscopic ultrasound (EUS) orientation · draft`,
    body: topic.body,
    bullets: [topic.bullet,
      'These specific EUS observations do not establish routine transabdominal visibility, a detection rate, vessel patency or a complete patient-specific course.',
      'Compare the reassembled atlas with the acquired view only after checking orientation and vessel continuity; no patient-space registration is provided.'],
    citations: [abdominalRadialEusReference],
    note: 'Original source-bound educational draft; revision-bound radiologist review pending. No publisher image or text, patient scan, diagnostic threshold, procedural route or clinical approval is supplied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
