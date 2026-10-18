import type { AxialGroup, AxialStudy } from './axial-anatomy';

const references = [
  'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html',
];
const caution =
  'Unvalidated source-labelled arteries, not a verified continuous vascular tree. Branch count, numbering, origins, endpoints, calibre, lumen, connections and variants require specialist review. No perfusion, surgical plane or patient registration is simulated. Missing counterparts and digital nerves are not invented.';
export const handVascularGroups: AxialGroup[] = [
  {
    id: 'palmar-arch-detail',
    name: 'Superficial palmar arterial arches',
    fmaIds: ['FMA22835', 'FMA22837'],
    anatomy:
      'The superficial palmar arch is predominantly supplied by the ulnar artery and gives rise to common palmar digital arteries.',
    function:
      'It contributes to arterial supply of the superficial palm and fingers.',
    caution,
    references,
  },
  {
    id: 'palmar-metacarpal-detail',
    name: 'Palmar metacarpal arterial source',
    fmaIds: ['FMA22864', 'FMA22865'],
    anatomy:
      'Palmar metacarpal arteries arise from the deep palmar arch. Each hand has one supplied selectable source identity here; the model does not assign independently numbered branches.',
    function:
      'These arteries contribute to the supply of the deep hand and interosseous tissues.',
    caution,
    references,
  },
  {
    id: 'thumb-index-arterial-detail',
    name: 'Thumb and radial index arterial sources',
    fmaIds: ['FMA22905', 'FMA22907', 'FMA22777', 'FMA22778'],
    anatomy:
      'Princeps pollicis contributes to thumb supply; radialis indicis supplies the radial side of the index finger. Both arise from the radial arterial system.',
    function:
      'Compare the supplied thumb and index-finger arterial surfaces. Each selected source identity groups two mesh components rather than assigning new branch names.',
    caution,
    references,
  },
  {
    id: 'common-digital-arterial-detail',
    name: 'Common palmar digital source branches',
    fmaIds: [
      'FMA22856',
      'FMA85118',
      'FMA85119',
      'FMA85120',
      'FMA85121',
      'FMA85122',
      'FMA85123',
      'FMA85124',
    ],
    anatomy:
      'Common palmar digital arteries lead towards proper digital branches. This source labels first through fourth entries on each hand; those labels are retained without treating the source numbering as a validated standard.',
    function:
      'Compare the supplied common-branch surfaces with the arches and proper digital sources.',
    caution,
    references,
  },
  {
    id: 'proper-digital-arterial-detail',
    name: 'Proper palmar digital source branches',
    fmaIds: [
      'FMA22858',
      'FMA22860',
      'FMA23050',
      'FMA23051',
      'FMA23052',
      'FMA23054',
      'FMA23055',
      'FMA85112',
      'FMA85115',
      'FMA85116',
    ],
    anatomy:
      'Proper palmar digital arteries supply the fingers. The supplied subset includes six right and four left source identities, not a complete paired set.',
    function:
      'Use source labels and neighbouring landmarks to compare the available finger arterial segments; absent medial-side counterparts are not mirrored into existence.',
    caution,
    references,
  },
];
export const handVascularGroupFor = (fmaId: string) =>
  handVascularGroups.find((group) => group.fmaIds.includes(fmaId));
const allIds = handVascularGroups.flatMap((group) => group.fmaIds);
const deepArches = ['FMA22839', 'FMA22840'];
const superficialArches = handVascularGroups[0].fmaIds;
const metacarpals = [
  'FMA24464',
  'FMA24465',
  'FMA24466',
  'FMA24467',
  'FMA24468',
  'FMA24469',
  'FMA24470',
  'FMA24471',
  'FMA24472',
  'FMA24473',
];
export const handVascularStudySets: AxialStudy[] = [
  {
    id: 'palmar-arch-window',
    title: 'Palmar arches & metacarpal vessels',
    regions: ['hand'],
    targetFmaIds: [...superficialArches, ...handVascularGroups[1].fmaIds],
    context: [
      { fmaIds: [...deepArches, ...metacarpals, 'FMA40120', 'FMA40121'] },
    ],
    view: 'anterior',
    description:
      'Compare the supplied superficial arches and metacarpal arteries with deep arches, metacarpal bones and wrist flexor retinacula.',
    inspect:
      'Set a retinaculum or bone aside and Undo to restore it. Source surfaces do not establish a complete arch or a safe dissection plane. Use a single-side view for a closer comparison.',
    landmarks: [
      'superficial palmar arterial arch',
      'palmar metacarpal artery',
      'deep palmar arch',
    ],
  },
  {
    id: 'palmar-digital-arteries-window',
    title: 'Common & proper digital arteries',
    regions: ['hand'],
    targetFmaIds: [
      ...handVascularGroups[3].fmaIds,
      ...handVascularGroups[4].fmaIds,
    ],
    context: [{ fmaIds: [...superficialArches, ...deepArches] }],
    view: 'anterior',
    description:
      'Expose the common and proper palmar digital source branches with arterial arches, without bones or muscle surfaces.',
    inspect:
      'Frame a small branch, isolate it or compare it with the group. Source numbering is unvalidated; the two hands have unequal supplied proper-branch subsets. Focus-only practice excludes the arch context.',
    landmarks: ['common palmar digital artery', 'proper palmar digital artery'],
  },
  {
    id: 'thumb-index-arteries-window',
    title: 'Thumb & index arterial detail',
    regions: ['hand'],
    targetFmaIds: handVascularGroups[2].fmaIds,
    context: [
      {
        fmaIds: [
          'FMA24464',
          'FMA24465',
          'FMA24466',
          'FMA24467',
          'FMA24450',
          'FMA65470',
          'FMA24451',
          'FMA71915',
        ],
      },
    ],
    view: 'anterior',
    description:
      'Study princeps pollicis and radialis indicis beside first/second metacarpals and thumb/index proximal phalanges.',
    inspect:
      'Hide a bone or fade other entries to trace the supplied surface, then Undo. Each arterial source contains two components; no missing segment is bridged or renamed.',
    landmarks: [
      'arteria princeps pollicis',
      'arteria radialis indicis',
      'first metacarpal bone',
    ],
  },
  {
    id: 'hand-arterial-detail-exposed',
    title: 'Hand arterial detail exposed',
    regions: ['hand'],
    targetFmaIds: allIds,
    context: [{ fmaIds: deepArches }],
    view: 'anterior',
    description:
      'An exposed comparison of all twenty-six new hand arterial identities and the existing deep arches.',
    inspect:
      'Switch sides, select and frame individual arteries, or arrange the entries for source-name practice. Explode and tray translations are study aids, not physiological movement, surgical planes or proof of patent connections.',
    landmarks: [
      'superficial palmar arterial arch',
      'arteria princeps pollicis',
      'proper palmar digital artery',
    ],
  },
];
