import type { BodyStructure } from '../app/body-types';
import type { ReasoningConcept } from './reasoning-questions';

// Pinned original ISA surfaces, not name-based admission or live catalogue lookup.
const identities = [
  ['femur', 'left', 'FMA24475', 'FJ3259', 'd291cc3619c32c68edb9d29e0b755634c2cb85e3db89f0d0b63a316f879ef86d'],
  ['femur', 'right', 'FMA24474', 'FJ3365', '5eff0f92905dd45bd0e79b1de0144dc15988c73c683468163255ba1452d58037'],
  ['patella', 'left', 'FMA24487', 'FJ3275', '768362d04f0f91cea9a28f4aeae9d9f63f3c82450b68d185fa4afefe75d75cc1'],
  ['patella', 'right', 'FMA24486', 'FJ3381', 'b513b8cb6b37e3eb4211fd35a4469efdf79de37887a0af8c582efc836a6f6307'],
  ['tibia', 'left', 'FMA24478', 'FJ3282', '40e55d7d28f060be61815603ee5eb1c0ba4c2e93af6fed6b5db7ca88d4ed82ef'],
  ['tibia', 'right', 'FMA24477', 'FJ3387', '01879d7310938e82eecc02e1115332497e94085ff5cc1fa8eeee47ad1f5d3578'],
  ['fibula', 'left', 'FMA24481', 'FJ3260', 'b5fbb694e1d881033ec8318b97c41e9d9bedc89a8df9845573b1aac528829331'],
  ['fibula', 'right', 'FMA24480', 'FJ3366', 'd03fee02cf8eefad1ecfcb9246e3f43ad3c4615c21ce08dc5e2b6901c6395a86'],
  ['talus', 'left', 'FMA24483', 'FJ3280', '56b40cfe8944df25ebed250dbcc80794ee5435e6ab667edddabf4324553bdb3c'],
  ['talus', 'right', 'FMA24482', 'FJ3385', '8b35f0132c1a05b64f26746fdd0496a2495280cd0c2ac90dbf637fd74f79f54f'],
  ['calcaneus', 'left', 'FMA24498', 'FJ3256', '5424e3e394e233213071fbf46f178ed9123da4763d6b64125f32e7b8af1803d8'],
  ['calcaneus', 'right', 'FMA24497', 'FJ3360', 'b53e7970e822e997e1b05f94f42514d07a3f98edcc63ec7dd7219354ce1d8176'],
  ['navicular', 'left', 'FMA24501', 'FJ3307', 'a9608a209e96492213275d1592554855a6acbf0d3a5ec8b05fb5fadfceb5df6c'],
  ['navicular', 'right', 'FMA24500', 'FJ3308', '0e08f1570755a9675e2556013eda861f00f31fe7ae2139e24584129dfe78d2c2'],
  ['cuboid', 'left', 'FMA24529', 'FJ3258', '1d9269949005e15c6a39fc30cbe5499468e99c074d5ccf48e1032c8689e12664'],
  ['cuboid', 'right', 'FMA24528', 'FJ3364', 'd5ac55e9aa466b0e14d8d7760f7ef2a6edb0d95cfea56205557f647c451a8079'],
] as const;
type Bone = typeof identities[number][0];
const footBones: readonly Bone[] = ['talus', 'calcaneus', 'navicular', 'cuboid'];
const regionFor = (bone: Bone) => bone === 'femur' ? 'thigh' as const : footBones.includes(bone) ? 'foot' as const : 'leg' as const;
const regionsFor = (bone: Bone) => bone === 'femur' ? ['thigh', 'pelvis', 'leg'] : [regionFor(bone)];

export function lowerLimbBoneReasoningSourceMatches(s: BodyStructure, key: string) {
  const row = identities.find(([bone, side]) => key === `lower-limb-bone-${bone}` && s.laterality === side);
  if (!row) return false;
  const [bone, side, fma, file, sha256] = row, region = regionFor(bone), regions = regionsFor(bone);
  const suffix = bone === 'navicular' ? `navicular-bone-of-${side}-foot` : `${side}-${bone}${bone === 'cuboid' ? '-bone' : ''}`;
  return s.id === `vm:anatomy:body:${region}:${side}:bone:${suffix}` && s.fmaId === fma && s.nodeName === fma &&
    s.bundle === `${region}-skeleton` && s.system === 'skeleton' && s.category === 'bone' &&
    s.sourceTree === 'isa' && s.region === region && s.regions.length === regions.length &&
    s.regions.every((value, index) => value === regions[index]) && s.sources.length === 1 &&
    s.sources[0].file === file && s.sources[0].sha256 === sha256;
}

const drafts = [
  ['femur', 'Which bone has the lesser trochanter for iliopsoas attachment?',
    'Iliopsoas inserts on this posteromedial proximal femoral prominence.'],
  ['patella', 'Which bone develops within the quadriceps tendon?',
    'The patella is a sesamoid bone articulating with the anterior distal femur.'],
  ['tibia', 'Which bone forms the medial malleolus at the ankle?',
    'The tibia provides the medial malleolus; the fibula provides the lateral one.'],
  ['fibula', 'Which bone has a neck vulnerable to common fibular nerve injury?',
    'The nerve is related to the fibular neck. This bone mesh does not depict it.'],
  ['talus', 'Which tarsal bone fits between the two ankle malleoli?',
    'The talar trochlea lies within the ankle mortise above the calcaneus.'],
  ['calcaneus', 'Which bone receives the Achilles tendon posteriorly?',
    'The calcaneal tuberosity receives this tendon at the back of the heel.'],
  ['navicular', 'Which bone lies between the talar head and the cuneiforms?',
    'The navicular connects these articular surfaces in the medial midfoot.'],
  ['cuboid', 'Which tarsal bone articulates with both lateral metatarsal bases?',
    'The cuboid meets the fourth and fifth metatarsals distally and calcaneus proximally.'],
] as const;
export const lowerLimbBoneReasoningConcepts: readonly ReasoningConcept[] = drafts.map(([bone, prompt, explanation]) => ({
  key: `lower-limb-bone-${bone}`, sourceTissue: 'bone', region: regionFor(bone), sourceRegions: regionsFor(bone),
  bindings: identities.filter(([name]) => name === bone).map(([, side, fma, file]) => ({ fma, side, file })),
  prompt, explanation,
  references: [{ title: 'Texas Tech University Health Sciences Center El Paso · lower-limb bones', url: 'https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html' }],
  // Same-side alternatives stay in the knee/leg or tarsal group. Do not invent
  // regional membership to make a thigh-only or pelvis-only femur quiz possible.
  distractors: drafts.filter(([name]) => name !== bone && footBones.includes(name) === footBones.includes(bone)).map(([name]) => `lower-limb-bone-${name}`),
  readiness: 'draft', revision: 1,
}));
