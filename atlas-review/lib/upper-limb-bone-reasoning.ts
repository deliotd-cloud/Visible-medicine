import type { BodyStructure } from '../app/body-types';
import type { ReasoningConcept } from './reasoning-questions';

// Explicit original ISA surfaces. Never admit a bone by its display label or
// FMA alone, and preserve the legacy right-shoulder IDs used by existing links.
const identities = [
  ['clavicle', 'right', 'FMA13322', 'FJ3362', '9a111cac8351e79dd1315aea90108fe56f78e4bf0159473e6ad727ba91b60e6d'],
  ['clavicle', 'left', 'FMA13323', 'FJ3237', '2491009d53eaed99ccb2a802b29402eec715eb8d207fb819fad67b0720195cf2'],
  ['scapula', 'right', 'FMA13395', 'FJ3384', '1641b04e55f9d75bdd6f1f4f07ea596e5dea0a8cb6b348bff47281b8a0bc6e5d'],
  ['scapula', 'left', 'FMA13396', 'FJ3279', 'e63a5675c6cdbe942322305920241b4a63762d7a65879572400f444fa3d42739'],
  ['humerus', 'right', 'FMA23130', 'FJ3368', '85f5445a11ecb029b027db0b9b34933982836d442b19ff531d1ca35a3bc3a237'],
  ['humerus', 'left', 'FMA23131', 'FJ3262', '4a07066d7c7f17dfeb61797dc31c529d0d6fd3fda8136912ebd8a92ccc1ac6fc'],
  ['radius', 'right', 'FMA23464', 'FJ3349', '0f824e639b13ea02959734a0d9bd8d7ca67d0b51f531a138d769e1d3b22e0c98'],
  ['radius', 'left', 'FMA23465', 'FJ3277', 'c41a7de7eddf5b91543fb22cf34c7dcad50241ffe1faae6ae22e1be30ca9390a'],
  ['ulna', 'right', 'FMA23467', 'FJ3391', '0aad73148e036c980ab24dfa675fcc1f109e5c60d82c12f3696420cf93cb4a98'],
  ['ulna', 'left', 'FMA23468', 'FJ3286', '0e3c48a4b664ffc37ef11eb4754c6c7f4adc8fd1d3e54d1286307432c7d04bfc'],
] as const;
type Bone = typeof identities[number][0];
const regionFor = (bone: Bone) => bone === 'radius' || bone === 'ulna' ? 'forearm' as const : 'shoulder-arm' as const;
const regionsFor = (bone: Bone) => bone === 'humerus' ? ['shoulder-arm', 'forearm'] : [regionFor(bone)];

export function upperLimbBoneReasoningSourceMatches(s: BodyStructure, key: string) {
  const row = identities.find(([bone, side]) => key === `upper-limb-bone-${bone}` && s.laterality === side);
  if (!row) return false;
  const [bone, side, fma, file, sha256] = row, region = regionFor(bone), regions = regionsFor(bone);
  const id = side === 'right' && region === 'shoulder-arm'
    ? `vm:anatomy:upper-limb:shoulder:right:bone:${bone}`
    : `vm:anatomy:body:${region}:${side}:bone:${side}-${bone}`;
  return s.id === id && s.fmaId === fma && s.nodeName === fma &&
    s.bundle === `${region}-skeleton` && s.system === 'skeleton' && s.category === 'bone' &&
    s.sourceTree === 'isa' && s.region === region && s.regions.length === regions.length &&
    s.regions.every((value, index) => value === regions[index]) && s.sources.length === 1 &&
    s.sources[0].file === file && s.sources[0].sha256 === sha256;
}

const drafts = [
  ['clavicle', 'Which bone links the manubrium to the acromion?',
    'The clavicle provides the bony connection between the axial skeleton and shoulder girdle.'],
  ['scapula', 'Which bone bears the glenoid cavity that receives the humeral head?',
    'The scapular glenoid forms the socket of the glenohumeral joint.'],
  ['humerus', 'Which bone has a posterior shaft groove related to the radial nerve?',
    'The humeral radial groove explains why shaft injury can affect this nerve. The nerve itself is not represented by the bone mesh.'],
  ['radius', 'Which forearm bone crosses the other during pronation?',
    'The radius moves across the ulna; its head remains at the elbow.'],
  ['ulna', 'Which bone has the olecranon that receives the triceps tendon?',
    'The proximal ulna bears the olecranon; the humerus has the corresponding olecranon fossa.'],
] as const;
export const upperLimbBoneReasoningConcepts: readonly ReasoningConcept[] = drafts.map(([bone, prompt, explanation]) => ({
  key: `upper-limb-bone-${bone}`, sourceTissue: 'bone', region: regionFor(bone), sourceRegions: regionsFor(bone),
  bindings: identities.filter(([name]) => name === bone).map(([, side, fma, file]) => ({ fma, side, file })),
  prompt, explanation,
  references: [{ title: 'Texas Tech University Health Sciences Center El Paso · upper-limb bones', url: 'https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html' }],
  // Four authored alternatives allow three bone choices in each regional scope
  // (the humerus belongs to both), and five choices in the whole-body scope.
  distractors: drafts.filter(([name]) => name !== bone).map(([name]) => `upper-limb-bone-${name}`),
  readiness: 'draft', revision: 1,
}));
