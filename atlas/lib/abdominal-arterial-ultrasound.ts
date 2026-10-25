import pins from '../content/abdominal-branch-imaging-pins.json' with { type: 'json' };
import { abdominalArterialUltrasoundTopics, abdominalArterialUltrasoundNote } from '../content/abdominal-arterial-ultrasound';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const expected = [
  ['FMA14805', 'inferior-pancreaticoduodenal-artery', 'FJ3446', '619cb0ffc120396dc6ffee3b97d083e8bbcda9d4ab6dcf1ff9a13b0aaf63ac73', 'unspecified', 'abdomen-vessels-visceral-detail'],
  ['FMA14784', 'posterior-superior-pancreaticoduodenal-artery', 'FJ3557', 'eadce1bc7a5cccc096b050e2738aac098c8194487bb8b20ab49aaa05cbfd3a0c', 'unspecified', 'abdomen-vessels-visceral-detail'],
  ['FMA14826', 'left-colic-artery', 'FJ3494', 'ee66dc3feb19c5b6c8500420c2e67a04f593045ddcdcfd24ac1faf1412a52bd1', 'left', 'abdomen-vessels-mesenteric'],
  ['FMA14824', 'marginal-colic-artery', 'FJ2025', '963b07fc664a9bfdeaab8c9d813a90b415aa6c97fe89c7db5713b5600a406400', 'midline', 'abdomen-vessels-mesenteric'],
] as const;

if (Object.keys(abdominalArterialUltrasoundTopics).length !== expected.length ||
    new Set(expected.map(row => row[0])).size !== expected.length)
  throw Error('Unexpected abdominal arterial ultrasound topic count.');

const bindings: ReadonlyMap<string, { signature: string; fmaId: keyof typeof abdominalArterialUltrasoundTopics }> = new Map(
  expected.map(([fmaId, slug, file, sha256, laterality, bundle]) => {
    const matches = pins.entries.filter(entry => entry.identity.fmaId === fmaId);
    if (matches.length !== 1) throw Error('Unexpected abdominal arterial ultrasound source count.');
    const source = matches[0].identity;
    if (source.id !== `vm:anatomy:body:abdomen:${laterality}:vessel:${slug}` ||
        source.fmaId !== fmaId || source.nodeName !== fmaId ||
        source.sourceName !== slug.replaceAll('-', ' ') ||
        source.laterality !== laterality || source.bundle !== bundle ||
        source.region !== 'abdomen' || sourceCanonical(source.regions) !== sourceCanonical(['abdomen']) ||
        source.system !== 'vessels' || source.category !== 'vessel' || source.sourceTree !== 'isa' ||
        source.sources.length !== 1 || source.sources[0].file !== file || source.sources[0].sha256 !== sha256 ||
        source.validation.status !== 'unvalidated' || source.validation.anatomicalReview !== false)
      throw Error('Unexpected abdominal arterial ultrasound source identity.');
    return [source.id, { signature: sourceCanonical(source), fmaId }] as const;
  }),
);
if (bindings.size !== 4) throw Error('Unexpected abdominal arterial ultrasound binding count.');

/** Four exact donor identities, ultrasound tab only; no patient-image correspondence. */
export function abdominalArterialUltrasoundLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'ultrasound') return undefined;
  const binding = bindings.get(structure.id);
  if (!binding || sourceCanonical(structure) !== binding.signature) return undefined;
  const topic = abdominalArterialUltrasoundTopics[binding.fmaId];
  return {
    readiness: 'draft',
    title: `${structure.name} · ${topic.method} orientation · draft`,
    body: topic.body,
    bullets: [...topic.bullets],
    citations: [...topic.citations],
    note: abdominalArterialUltrasoundNote,
  };
}
