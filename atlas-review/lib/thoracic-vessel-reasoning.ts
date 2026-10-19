import type { BodyStructure } from '../app/body-types';
import type { ReasoningConcept } from './reasoning-questions';

// Pinned authored identities, independent of live catalogue lookup. Only these
// six surfaces qualify; neither display labels nor FMA alone admit a vessel.
const identities = [
  ['thoracic-ascending-aorta', 'ascending-aorta', 'FMA3736', 'midline', 'FJ3413', '764f23e432a9308e0780c586f9d1638db1fbcc52a5019ae61817b4b1de323870'],
  ['thoracic-aortic-arch', 'arch-of-aorta', 'FMA3768', 'midline', 'FJ3411', '9eeb5e5a627e8145f03961c661c9c66d8fdc55ed1234d04b84212b87a21d902c'],
  ['thoracic-descending-aorta', 'descending-thoracic-aorta', 'FMA87217', 'unspecified', 'FJ1931', 'b213c8178b48f9afae695254f7bcfb3e08d5781878a76724c353e7e6ea6269be'],
  ['thoracic-superior-vena-cava', 'superior-vena-cava', 'FMA4720', 'unspecified', 'FJ3645', '5cc007c2ea51255df641225630e83ddbf3e5c4545dffe4814b098c9199ceb26c'],
  ['thoracic-azygos', 'azygos-vein', 'FMA4838', 'unspecified', 'FJ3416', '88b374af13155c62ea5bcaad554a699d1d95e23948eeb810b62edb7467789dde'],
  ['thoracic-hemiazygos', 'hemiazygos-vein', 'FMA4944', 'midline', 'FJ3434', 'dcc2d6adb32cb84ffd91fd9104a3ba13986d6e9801231733086cbd8ab5ca2b26'],
] as const;

export function thoracicVesselReasoningSourceMatches(s: BodyStructure, key: string) {
  const identity = identities.find(([candidate]) => candidate === key);
  if (!identity) return false;
  const [, slug, fma, side, file, sha256] = identity;
  return s.id === `vm:anatomy:body:thorax:${side}:vessel:${slug}` &&
    s.fmaId === fma && s.nodeName === fma &&
    s.bundle === 'thorax-vessels-recovery' &&
    s.system === 'vessels' && s.category === 'vessel' &&
    s.sourceTree === 'isa' && s.region === 'thorax' &&
    s.regions.length === 1 && s.regions[0] === 'thorax' &&
    s.laterality === side && s.sources.length === 1 &&
    s.sources[0].file === file && s.sources[0].sha256 === sha256;
}

const arteryReference = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_thorax.html';
const veinReference = 'https://anatomy.ttuhscep.edu/anatomytables/veins_thorax.html';
const surfaceLimit = ' Source surface does not prove lumen continuity or patency.';
const drafts = [
  ['Which aortic segment gives rise to the coronary arteries?',
    'The ascending aorta gives the coronary branches near its root.', arteryReference],
  ['Which aortic segment usually gives the brachiocephalic, left common carotid and left subclavian branches?',
    'The aortic arch usually gives these three major branches; branching variants occur.', arteryReference],
  ['Which aortic segment normally supplies posterior intercostal arteries for spaces 3–11?',
    'The descending thoracic aorta gives these posterior intercostal branches. The upper spaces have a different usual source.', arteryReference],
  ['Which vein forms from the brachiocephalic veins, receives the azygos vein and enters the right atrium?',
    'The superior vena cava carries this upper-body venous return to the right atrium.', veinReference],
  ['Which vein arches over the right lung root before joining the superior vena cava?',
    'The azygos vein takes this usual route. Its unspecified catalogue side is retained, rather than inferred from the course.', veinReference],
  ['Which vein conveys lower-left posterior chest-wall drainage across to the azygos system?',
    'The hemiazygos vein carries this drainage; its crossing level varies. The catalogue midline tag does not claim that its anatomical course lies on the midline.', veinReference],
] as const;

// Two catalogue-side groups provide two same-side alternatives each. A third
// authored distractor belongs to the other group and remains runtime-filtered.
export const thoracicVesselReasoningConcepts: readonly ReasoningConcept[] = identities.map(
  ([key, , fma, side, file], index) => ({
    key,
    sourceTissue: 'vessel',
    sourceTree: 'isa',
    region: 'thorax',
    sourceRegions: ['thorax'],
    bindings: [{ fma, side, file }],
    prompt: drafts[index][0],
    explanation: drafts[index][1] + surfaceLimit,
    references: [{ title: 'Texas Tech University Health Sciences Center El Paso · thoracic vessel table', url: drafts[index][2] }],
    distractors: [
      ...identities.filter(([otherKey, , , otherSide]) => otherKey !== key && otherSide === side).map(([otherKey]) => otherKey),
      identities.find(([, , , otherSide]) => otherSide !== side)![0],
    ],
    readiness: 'draft',
    revision: 1,
  }),
);
