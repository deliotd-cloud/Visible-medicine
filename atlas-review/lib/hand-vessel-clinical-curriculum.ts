import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';
type HandVesselClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'vessel',
];
interface HandVesselClinicalGroup {
  key: string;
  identities: readonly HandVesselClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
// Original factual teaching bound to exact represented source identities; no publisher assets imported.
export const handVesselClinicalGroups: readonly HandVesselClinicalGroup[] = [
  {
    key: 'deep-palmar-arterial-arches',
    identities: [
      ['FMA22839', 'right', 'isa', ['FJ2279'], 'hand', ['hand'], 'vessel'],
      ['FMA22840', 'left', 'isa', ['FJ2227'], 'hand', ['hand'], 'vessel'],
    ],
    scope:
      'Separate right/left deep arterial arches; no complete collateral circuit, validated lumen, injured wall or patient perfusion. Surface depth and connections still require review.',
    pathology: {
      body: 'A deep palmar arch pseudoaneurysm has been reported after penetrating hand injury, presenting as a painful swelling on the back of the hand. The visible location of a mass may therefore differ from the injured artery beneath it.',
      bullets: [
        'A pseudoaneurysm is a contained arterial leak, not a normal arch branch.',
        'This case demonstrates a possible injury pattern, not its frequency or a preferred treatment.',
      ],
    },
    clinical: {
      body: 'Persistent or enlarging swelling after a hand wound warrants reassessment. A pulsatile mass needs vascular evaluation; clinical imaging can establish whether it communicates with an artery.',
      bullets: [
        'Do not use a normal-looking surface to exclude arterial injury.',
        'No aspiration, compression, injection, operative route or claim of collateral adequacy is supplied.',
      ],
    },
    references: ['https://pubmed.ncbi.nlm.nih.gov/28856301/'],
  },
  {
    key: 'superficial-palmar-arterial-arches',
    identities: [
      ['FMA22835', 'right', 'isa', ['FJ2300'], 'hand', ['hand'], 'vessel'],
      ['FMA22837', 'left', 'isa', ['FJ2248'], 'hand', ['hand'], 'vessel'],
    ],
    scope:
      'Original superficial arterial arch identities and source warnings remain; no validated normal branching pattern, complete arch, clot or palmar mass is represented.',
    pathology: {
      body: 'A reported superficial palmar arch pseudoaneurysm developed after a palm laceration, with delayed painful, pulsatile swelling. An apparently treated wound can still be associated with an underlying vascular complication.',
      bullets: [
        'The cited adult case is not a population risk estimate.',
        'A pulsatile palmar swelling is not automatically a cyst, and a source arch is not an image of that lesion.',
      ],
    },
    clinical: {
      body: 'Assess new swelling, bleeding or altered finger circulation after palm trauma clinically. Sudden severe pain with a cold, pale, numb or weak hand needs emergency assessment; suspected acute limb ischaemia is an emergency.',
      bullets: [
        'The superficial and deep arterial arches have variable contributions and connections.',
        'No Allen-test result, wound exploration plan or guarantee of radial/ulnar collateral sufficiency is inferred.',
      ],
    },
    references: [
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC4461624/',
      'https://pubmed.ncbi.nlm.nih.gov/3418051/',
      'https://vascular.org/patients-and-referring-physicians/conditions/acute-limb-ischemia',
    ],
  },
  {
    key: 'palmar-metacarpal-arteries',
    identities: [
      ['FMA22864', 'right', 'isa', ['FJ2289'], 'hand', ['hand'], 'vessel'],
      ['FMA22865', 'left', 'isa', ['FJ2237'], 'hand', ['hand'], 'vessel'],
    ],
    scope:
      'One source-labelled palmar metacarpal arterial identity per hand, not a complete set of independently numbered branches or a validated flap pedicle.',
    pathology: {
      body: 'Deep palmar metacarpal pathways form part of a variable network of hand arterial connections. A focal interruption cannot be translated into a fixed area of tissue loss from a named surface alone.',
      bullets: [
        'Cadaver arteriography describes different dorsal-to-palmar pathways, not measured flow in this model.',
        'The arterial selection is distinct from the separately grouped palmar metacarpal veins.',
      ],
    },
    clinical: {
      body: 'Reconstructive planning considers connected inflow and the particular tissue being transferred, not only a parent artery label. Use this selection to compare deep palmar pathways with the arches and digital branches.',
      bullets: [
        'Anatomical network continuity and usable perfusion must be established in the patient.',
        'No flap outline, guaranteed territory, branch-sacrifice rule or safe operative distance is supplied.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/3418051/',
      'https://pubmed.ncbi.nlm.nih.gov/36051780/',
    ],
  },
  {
    key: 'princeps-pollicis-arteries',
    identities: [
      [
        'FMA22905',
        'right',
        'isa',
        ['FJ2371', 'FJ2372'],
        'hand',
        ['hand'],
        'vessel',
      ],
      [
        'FMA22907',
        'left',
        'isa',
        ['FJ2338', 'FJ2339'],
        'hand',
        ['hand'],
        'vessel',
      ],
    ],
    scope:
      'Each princeps pollicis identity keeps two ordered source components; those components are not newly diagnosed duplication, individually named thumb branches or a complete thumb arterial tree.',
    pathology: {
      body: 'Thumb arterial supply varies in both source and connections. A study of 30 cadaveric right hands described several communicating palmar and dorsal routes; the name princeps pollicis does not define one universal pattern.',
      bullets: [
        'An anatomical variation is not itself thrombosis or an aneurysm.',
        'The cited cadavers do not establish the circulation of either displayed hand or predict survival after injury.',
      ],
    },
    clinical: {
      body: 'Thumb injury and reconstruction require assessment of actual inflow, outflow and tissue damage. Relate this source to the first web space while keeping the adjacent index artery a separate identity.',
      bullets: [
        'Study findings are not a guarantee that a thumb will tolerate arterial injury.',
        'No pinch-force prediction, graft choice, safe pin trajectory or reconstructive technique is supplied.',
      ],
    },
    references: ['https://pubmed.ncbi.nlm.nih.gov/22373995/'],
  },
  {
    key: 'radialis-indicis-arteries',
    identities: [
      [
        'FMA22777',
        'right',
        'isa',
        ['FJ2342', 'FJ2363'],
        'hand',
        ['hand'],
        'vessel',
      ],
      [
        'FMA22778',
        'left',
        'isa',
        ['FJ2314', 'FJ2332'],
        'hand',
        ['hand'],
        'vessel',
      ],
    ],
    scope:
      'Each radialis indicis source retains two ordered components. Mesh count is not evidence of duplicated arteries; no complete index-finger circulation or digital nerve is created.',
    pathology: {
      body: 'A cadaver case described duplicate radialis indicis and princeps pollicis pathways arising from superficial and deep arches. Unexpected vessels in the first web space can matter clinically, but a published variant is not assigned to this model.',
      bullets: [
        'The report describes one right hand, not a population frequency or a mirrored left-sided finding.',
        'Radialis indicis refers to the index-side arterial supply, not the thumb artery.',
      ],
    },
    clinical: {
      body: 'First-web-space surgery or injury assessment requires patient-specific vascular relationships. A vessel near the expected course may have a different origin, and a source label alone cannot establish which pathway is present.',
      bullets: [
        'Keep variant anatomy separate from a diagnosis of arterial disease.',
        'No release plane, needle/pin corridor or permission to divide an apparent accessory vessel is supplied.',
      ],
    },
    references: ['https://pubmed.ncbi.nlm.nih.gov/34109082/'],
  },
  {
    key: 'common-palmar-digital-arteries',
    identities: [
      ['FMA22856', 'right', 'isa', ['FJ2343'], 'hand', ['hand'], 'vessel'],
      ['FMA85118', 'left', 'isa', ['FJ2315'], 'hand', ['hand'], 'vessel'],
      ['FMA85119', 'right', 'isa', ['FJ2344'], 'hand', ['hand'], 'vessel'],
      ['FMA85120', 'left', 'isa', ['FJ2316'], 'hand', ['hand'], 'vessel'],
      ['FMA85121', 'right', 'isa', ['FJ2345'], 'hand', ['hand'], 'vessel'],
      ['FMA85122', 'left', 'isa', ['FJ2317'], 'hand', ['hand'], 'vessel'],
      ['FMA85123', 'right', 'isa', ['FJ2370'], 'hand', ['hand'], 'vessel'],
      ['FMA85124', 'left', 'isa', ['FJ2337'], 'hand', ['hand'], 'vessel'],
    ],
    scope:
      'Eight source-numbered common branches: first through fourth on each hand. The numbering is retained, not equated automatically with published web-space numbering or a complete standard arterial pattern.',
    pathology: {
      body: 'Common digital arteries can have atypical origins and courses relative to finger flexor tendons. A 33-hand cadaver study found deeper variants supplying the second and fourth web spaces, illustrating why an unexpected vessel can be vulnerable during surgery.',
      bullets: [
        'A variant course is not an occlusion; neither its frequency nor its exact source-label counterpart is inferred here.',
        'The source-numbered common branch remains distinct from a proper artery on a finger.',
      ],
    },
    clinical: {
      body: 'Compare common branches with nearby tendons and proper digital selections, but interpret the source numbering cautiously. Clinical planning needs the actual origin and course of the vessel, not a presumed branch map.',
      bullets: [
        'The study does not establish that any displayed first–fourth source follows the reported variant.',
        'No safe tendon-release level, pollicization plan or incision corridor is supplied.',
      ],
    },
    references: ['https://pubmed.ncbi.nlm.nih.gov/29558847/'],
  },
  {
    key: 'proper-palmar-digital-arteries',
    identities: [
      ['FMA22858', 'right', 'isa', ['FJ2365'], 'hand', ['hand'], 'vessel'],
      ['FMA22860', 'left', 'isa', ['FJ2334'], 'hand', ['hand'], 'vessel'],
      ['FMA23050', 'right', 'isa', ['FJ2364'], 'hand', ['hand'], 'vessel'],
      ['FMA23051', 'left', 'isa', ['FJ2333'], 'hand', ['hand'], 'vessel'],
      ['FMA23052', 'right', 'isa', ['FJ2369'], 'hand', ['hand'], 'vessel'],
      ['FMA23054', 'right', 'isa', ['FJ2368'], 'hand', ['hand'], 'vessel'],
      ['FMA23055', 'left', 'isa', ['FJ2336'], 'hand', ['hand'], 'vessel'],
      ['FMA85112', 'right', 'isa', ['FJ2367'], 'hand', ['hand'], 'vessel'],
      ['FMA85115', 'right', 'isa', ['FJ2366'], 'hand', ['hand'], 'vessel'],
      ['FMA85116', 'left', 'isa', ['FJ2335'], 'hand', ['hand'], 'vessel'],
    ],
    scope:
      'Ten represented proper arterial identities: six right and four left. Missing counterparts are not mirrored. Anatomical medial/lateral is a source label, not the current screen side.',
    pathology: {
      body: 'A finger wound can damage a digital artery together with nearby nerves. The effect on circulation depends on the remaining blood supply; an artery injury and a sensory deficit are related but separate clinical questions.',
      bullets: [
        'A small retrospective study compared one- and two-artery supply in selected well-perfused fingers.',
        'Its findings are not a rule that an injured artery may always be left unrepaired or divided.',
      ],
    },
    clinical: {
      body: 'Assess finger circulation, sensation and movement after trauma. A newly cold, pale or severely painful finger, especially with numbness or weakness, requires urgent emergency assessment rather than reassurance from a second artery on a diagram.',
      bullets: [
        'Treatment decisions depend on the actual injury and specialist assessment.',
        'No repair threshold, nerve test score, tourniquet instruction or perfusion simulation is supplied.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/37762830/',
      'https://vascular.org/patients-and-referring-physicians/conditions/acute-limb-ischemia',
    ],
  },
  {
    key: 'deep-palmar-venous-arches',
    identities: [
      ['FMA22912', 'right', 'isa', ['FJ2281'], 'hand', ['hand'], 'vessel'],
      ['FMA22913', 'left', 'isa', ['FJ2229'], 'hand', ['hand'], 'vessel'],
    ],
    scope:
      'Separate deep venous arch identities are not arterial arches. Source depth, paired channels, valves and complete outflow connections are not independently validated.',
    pathology: {
      body: 'Impaired venous return is a different problem from loss of arterial inflow after hand reconstruction. Venous congestion can occur in a replanted digit before an obvious colour change, so appearance alone is not a reliable clearance test.',
      bullets: [
        'The cited clinical observation concerns replantation, not a diagnosis of isolated deep-palmar-arch thrombosis.',
        'A fixed blue surface cannot show venous pressure, clot or tissue congestion.',
      ],
    },
    clinical: {
      body: 'Deep palmar venous anatomy includes more than one arch: a 12-specimen dissection study distinguished several functional arrangements. Use the arch to orient the drainage discussion without assuming every relevant pathway is displayed.',
      bullets: [
        'Actual outflow and tissue viability require specialist assessment.',
        'No historical compression test, leech treatment, drainage manoeuvre or anticoagulant regimen is supplied.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/501049/',
      'https://pubmed.ncbi.nlm.nih.gov/1780719/',
    ],
  },
  {
    key: 'superficial-palmar-venous-arches',
    identities: [
      ['FMA22915', 'right', 'isa', ['FJ2301'], 'hand', ['hand'], 'vessel'],
      ['FMA22916', 'left', 'isa', ['FJ2249'], 'hand', ['hand'], 'vessel'],
    ],
    scope:
      'Source-labelled superficial venous arches only. The name does not establish a subcutaneous plane, benign superficial thrombosis, or a complete connection to the forearm.',
    pathology: {
      body: 'Injury to palmar venous pathways can affect the drainage needed after tissue transfer or replantation. A source labelled superficial venous arch should not be used to classify a swollen hand as having a minor superficial-vein condition.',
      bullets: [
        'Venous architecture and clinical severity are separate questions.',
        'The arterial arch and the venous arch must not be interchanged when discussing inflow and drainage.',
      ],
    },
    clinical: {
      body: 'Anatomical mapping of the hand distinguishes dorsal, superficial volar and deep venous systems. This selection helps compare their positions, while actual vessel planes and return pathways still need clinical validation.',
      bullets: [
        'New postoperative swelling or colour change should be reported promptly to the treating team.',
        'No incision map, vessel-division rule or assurance of complete venous return is supplied.',
      ],
    },
    references: ['https://pubmed.ncbi.nlm.nih.gov/36051780/'],
  },
  {
    key: 'dorsal-hand-venous-networks',
    identities: [
      ['FMA62506', 'right', 'isa', ['FJ2280'], 'hand', ['hand'], 'vessel'],
      ['FMA62507', 'left', 'isa', ['FJ2228'], 'hand', ['hand'], 'vessel'],
    ],
    scope:
      'One network identity per hand, not separately named tributaries. No individual cannulation site, valve, thrombus, central line route or complete cephalic/basilic connection is validated.',
    pathology: {
      body: 'A cannula or injection can be followed by inflammation of a superficial hand vein, causing tenderness, warmth and swelling. Such symptoms need assessment rather than being diagnosed from a visible dorsal-vein pattern.',
      bullets: [
        'Redness may be less obvious on darker skin; pain and swelling also matter.',
        'A blue vein display cannot distinguish phlebitis, a clot, infection or fluid leakage.',
      ],
    },
    clinical: {
      body: 'New painful swelling or a hard, tender vein warrants prompt clinical advice; NHS 111 can advise in the UK. If symptoms develop around an infusion, alert the treating team so they can assess the line and the hand.',
      bullets: [
        'The network is an orientation aid, not a recommendation of a vein for access.',
        'No cannula size, insertion technique, flushing routine or self-removal instruction is supplied.',
      ],
    },
    references: ['https://www.nhs.uk/conditions/phlebitis/'],
  },
  {
    key: 'palmar-metacarpal-veins',
    identities: [
      [
        'FMA22920',
        'right',
        'isa',
        ['FJ2290', 'FJ2350', 'FJ2353'],
        'hand',
        ['hand'],
        'vessel',
      ],
      [
        'FMA22921',
        'left',
        'isa',
        ['FJ2238', 'FJ2320', 'FJ2323'],
        'hand',
        ['hand'],
        'vessel',
      ],
    ],
    scope:
      'Each palmar metacarpal venous identity contains three ordered components. These are not independently numbered tributaries or a validated continuous drainage route.',
    pathology: {
      body: 'After complex hand injury, restoring arterial inflow does not by itself demonstrate adequate venous return. The selected palmar veins provide a useful contrast to the deep arterial pathways when considering drainage rather than tissue inflow.',
      bullets: [
        'Venous congestion is a clinical state, not the default meaning of a blue model surface.',
        'No isolated metacarpal-vein clot or fixed oedema territory is diagnosed here.',
      ],
    },
    clinical: {
      body: 'Cadaver work identifies deep axial, web-space and communicating venous arrangements beyond a simple arch diagram. Relate the grouped source components to that wider concept without assigning unverified tributary names or connections.',
      bullets: [
        'The extent of injury and usable outflow must be established in the patient.',
        'No reconstruction route, vessel calibre, clot length or normal Doppler value is supplied.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/1780719/',
      'https://pubmed.ncbi.nlm.nih.gov/501049/',
    ],
  },
  {
    key: 'proper-palmar-digital-veins',
    identities: [
      [
        'FMA85096',
        'right',
        'isa',
        ['FJ2354', 'FJ2355'],
        'hand',
        ['hand'],
        'vessel',
      ],
      [
        'FMA85097',
        'left',
        'isa',
        ['FJ2324', 'FJ2325'],
        'hand',
        ['hand'],
        'vessel',
      ],
      [
        'FMA85098',
        'right',
        'isa',
        ['FJ2356', 'FJ2357'],
        'hand',
        ['hand'],
        'vessel',
      ],
      [
        'FMA85099',
        'left',
        'isa',
        ['FJ2326', 'FJ2340'],
        'hand',
        ['hand'],
        'vessel',
      ],
      [
        'FMA85100',
        'right',
        'isa',
        ['FJ2358', 'FJ2359'],
        'hand',
        ['hand'],
        'vessel',
      ],
      [
        'FMA85101',
        'left',
        'isa',
        ['FJ2327', 'FJ2328'],
        'hand',
        ['hand'],
        'vessel',
      ],
    ],
    scope:
      'Index, middle and ring finger venous identities only, each with two grouped components. Their side-of-finger tributaries, missing digits and drainage continuity are not newly assigned.',
    pathology: {
      body: 'Palmar digital vein thrombosis can present as a small tender lump on a finger or palm. A reported thrombosed varix was skin-coloured, so neither a blue colour nor a particular digit is required for clinical consideration.',
      bullets: [
        'This rare condition is one possible cause of a nodule, not the explanation for every finger lump.',
        'Reported trauma or clotting associations do not establish the cause in an individual person.',
      ],
    },
    clinical: {
      body: 'A persistent or tender finger nodule needs clinical assessment; examination and appropriate imaging or tissue analysis may distinguish a thrombosed vein from other lesions. Do not identify a clot by matching a lump to this reference surface.',
      bullets: [
        'The review of reported cases does not provide a general-population risk estimate.',
        'No self-puncture, excision, clotting-screening algorithm or anticoagulant recommendation is supplied.',
      ],
    },
    references: ['https://pubmed.ncbi.nlm.nih.gov/36299837/'],
  },
];
const byFma = new Map(
  handVesselClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
export function handVesselClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if ((tab !== 'pathology' && tab !== 'clinical') || s.system !== 'vessels')
    return undefined;
  const match = byFma.get(s.fmaId);
  if (!match) return undefined;
  const [, side, tree, files, region, regions, category] = match.identity;
  if (
    s.category !== category ||
    s.laterality !== side ||
    s.sourceTree !== tree ||
    s.region !== region ||
    !same(s.regions, regions) ||
    !same(
      s.sources.map((p) => p.file),
      files,
    )
  )
    return undefined;
  const { group } = match,
    topic = group[tab];
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'pathology' ? 'Injury & disease' : 'Clinical context'} · draft`,
    body: topic.body,
    bullets: [...topic.bullets, group.scope],
    note: [
      'Draft teaching; independent anatomical and clinical review pending. Educational context, not a patient diagnosis or treatment plan.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...group.references],
  };
}
