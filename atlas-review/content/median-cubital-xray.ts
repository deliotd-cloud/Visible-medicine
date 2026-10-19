// Original factual teaching. References are reading links, not imported publication assets.
export const medianCubitalXrayReferences = {
  venography: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12338226/',
  variation: 'https://pubmed.ncbi.nlm.nih.gov/23377482/',
} as const;

type Reference = keyof typeof medianCubitalXrayReferences;
type Teaching = { title: string; body: string; bullets: readonly string[]; citations: readonly Reference[] };
export const medianCubitalXrayTeaching: Record<'medianCubital', Teaching> = {
  medianCubital: {
    title: 'Contrast venography context — access site is not segment depiction',
    body: 'Jo and colleagues reported two selected haemodialysis access-creation cases using intraoperative fluoroscopic contrast venography. A surgically exposed median cubital vein served as an injection access site for assessing upper-arm drainage. This does not establish that the selected median cubital segment is depicted in the published venogram.',
    bullets: [
      'Contrast venography and an unenhanced plain radiograph are different examinations. This evidence does not support identifying the normal superficial venous course on a plain film.',
      'The report concerns selected vascular-access cases, not a healthy normal atlas or a general visibility rate. Injection-site identity must not be transferred to an unlabelled contrast-filled segment.',
      'Keep the median cubital and median antebrachial veins distinct. Ukoha and colleagues studied surface venous configurations in 135 young adults after tourniquet application; this supports variation, not X-ray or venographic identification.',
      'The bilateral reference surfaces are independent of these examinations. Neither a nearby mesh nor projected overlap establishes patient-specific continuity, patency or flow; no image registration is supplied.',
      'No contrast choice, cannulation route, acquisition protocol or procedural recommendation is supplied. A future image link requires a securely identified segment, cleared acquisition and exact source/revision review.',
    ],
    citations: ['venography', 'variation'],
  },
};

export const medianCubitalXrayNote = 'Draft for revision-bound radiologist review. These independent reference surfaces provide semantic comparison only, not acquired-image correspondence or patient-space registration. Publication figures, scans and datasets are not included; source anatomy remains unvalidated.';
