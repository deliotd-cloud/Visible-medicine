import type { AxialGroup, AxialStudy } from './axial-anatomy';
const references = [
  'https://anatomy.ttuhscep.edu/gastrointestinal_system/peritoneum_tables.html',
];
const membraneCaution =
  'Only selected source surfaces are available. Their roots, leaves, attachments and embedded nerves, vessels and lymphatics are not fully segmented or validated. This is not a complete peritoneum or a safe surgical plane.';
const vesselCaution =
  'Named source segments do not establish a continuous vascular tree, a patent lumen, normal calibre, perfusion territory or an individual patient’s anatomy. Mesenteric plexuses, lymphatic networks and many branches remain absent. Three overlapping arterial alternatives are deliberately withheld.';
export const mesentericGroups: AxialGroup[] = [
  {
    id: 'small-intestinal-mesentery',
    name: 'Small-intestinal mesentery',
    fmaIds: ['FMA14643'],
    anatomy:
      'The small-intestinal mesentery suspends the jejunum and ileum from the posterior abdominal wall.',
    function:
      'It supports mobile bowel and provides a route for vessels, nerves and lymphatics.',
    caution: membraneCaution,
    references,
  },
  {
    id: 'transverse-mesocolon',
    name: 'Transverse mesocolon',
    fmaIds: ['FMA14647'],
    anatomy:
      'The transverse mesocolon connects the transverse colon to the posterior abdominal wall.',
    function:
      'It supports the transverse colon while carrying its neurovascular connections.',
    caution: membraneCaution,
    references,
  },
  {
    id: 'mesoappendix',
    name: 'Mesoappendix',
    fmaIds: ['FMA16549'],
    anatomy:
      'The mesoappendix is the mesenteric fold associated with the appendix.',
    function: 'It supports the appendix and carries its vessels.',
    caution: membraneCaution,
    references,
  },
  {
    id: 'mesenteric-arteries',
    name: 'Selected mesenteric arterial branches',
    fmaIds: [
      'FMA14810',
      'FMA14811',
      'FMA14815',
      'FMA14818',
      'FMA14820',
      'FMA14824',
      'FMA14826',
      'FMA14828',
      'FMA14829',
    ],
    anatomy:
      'These source-labelled colic, ileocolic and appendicular segments belong to the arterial supply of the bowel.',
    function:
      'Arterial branches carry blood towards their supplied tissues. The displayed surfaces do not simulate blood flow.',
    caution: vesselCaution,
    references,
  },
  {
    id: 'mesenteric-veins',
    name: 'Selected mesenteric venous segments',
    fmaIds: ['FMA14332', 'FMA15391', 'FMA15405', 'FMA15406', 'FMA15407'],
    anatomy:
      'The available superior/inferior mesenteric and named bowel veins form part of the portal venous drainage system.',
    function:
      'These veins convey blood away from the bowel towards the portal circulation.',
    caution: vesselCaution,
    references: ['https://pubmed.ncbi.nlm.nih.gov/23749713/'],
  },
];
export const mesentericGroupFor = (fmaId: string) =>
  mesentericGroups.find((g) => g.fmaIds.includes(fmaId));
export const mesentericMembraneIds = mesentericGroups
  .slice(0, 3)
  .flatMap((g) => g.fmaIds);
export const mesentericArteryIds = mesentericGroups[3].fmaIds;
export const mesentericVeinIds = mesentericGroups[4].fmaIds;
export const mesentericStudySets: AxialStudy[] = [
  {
    id: 'mesenteric-surfaces',
    title: 'Mesenteric surfaces & bowel',
    regions: ['abdomen'],
    targetFmaIds: mesentericMembraneIds,
    context: [{ fmaIds: ['FMA7200', 'FMA7201', 'FMA14542', 'FMA11338'] }],
    view: 'anterior',
    description:
      'Keep the three supplied mesenteric surfaces with bowel context; hide a bowel aggregate to inspect the surface behind it.',
    inspect:
      'Set the bowel aside, then restore it with Undo to compare source relationships. Removing a surface is an educational visibility change, not peritoneal dissection.',
    landmarks: [
      'mesentery of small intestine',
      'transverse mesocolon',
      'mesoappendix',
    ],
  },
  {
    id: 'mesenteric-vessel-window',
    title: 'Mesenteric vessels exposed',
    regions: ['abdomen'],
    targetFmaIds: [...mesentericArteryIds, ...mesentericVeinIds],
    context: [{ fmaIds: ['FMA14749', 'FMA14750', 'FMA50735'] }],
    view: 'anterior',
    description:
      'Remove bowel and mesenteric surfaces to compare available arterial and venous segments with existing major-vessel context.',
    inspect:
      'Select and isolate an individual segment, or use the separate arterial and venous windows. Red and blue distinguish source artery/vein labels, not oxygenation. Gaps are not bridged with invented vessels.',
    landmarks: [
      'superior mesenteric artery',
      'superior mesenteric vein',
      'inferior mesenteric vein',
      'middle colic artery',
    ],
  },
  {
    id: 'mesenteric-arteries',
    title: 'Colic & appendicular arteries',
    regions: ['abdomen'],
    targetFmaIds: mesentericArteryIds,
    context: [{ fmaIds: ['FMA14749', 'FMA14750'] }],
    view: 'anterior',
    description:
      'Compare the admitted bowel arterial segments without overlying organs or veins.',
    inspect:
      'Frame a small branch for closer study. Continuity, territories and variant branching require review; the held ileal alternatives are not displayed.',
    landmarks: [
      'middle colic artery',
      '(?:right|left) colic artery',
      'appendicular artery',
    ],
  },
  {
    id: 'mesenteric-veins',
    title: 'Mesenteric venous drainage',
    regions: ['abdomen'],
    targetFmaIds: mesentericVeinIds,
    context: [{ fmaIds: ['FMA50735'] }],
    view: 'anterior',
    description:
      'Isolate the available mesenteric veins with the existing hepatic portal-vein source context.',
    inspect:
      'These are reference surfaces, not contrast enhancement, flow or a verified continuous drainage model.',
    landmarks: [
      'superior mesenteric vein',
      'inferior mesenteric vein',
      'hepatic portal vein',
    ],
  },
  {
    id: 'appendix-mesentery',
    title: 'Appendix, mesoappendix & artery',
    regions: ['abdomen'],
    targetFmaIds: ['FMA16549', 'FMA14818'],
    context: [{ fmaIds: ['FMA14542', 'FMA11338'] }],
    view: 'anterior',
    description:
      'A close four-structure window without the large bowel aggregates obscuring the supplied appendiceal context.',
    inspect:
      'Hide or fade the mesoappendix to inspect the available artery and appendix. The junction surface is context, not a complete cecum. Attachments and surgical planes remain unvalidated.',
    landmarks: [
      'mesoappendix',
      'appendicular artery',
      '^appendix$',
      'ileocecal junction',
    ],
  },
];
