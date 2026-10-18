// Independently written teaching. Citations are reading references, not image licences.
export const handArterialXrayReferences = {
  projection: 'https://pubmed.ncbi.nlm.nih.gov/614070/',
  livingArches: 'https://pubmed.ncbi.nlm.nih.gov/29127118/',
  detection: 'https://pubmed.ncbi.nlm.nih.gov/10520330/',
  thumb: 'https://pubmed.ncbi.nlm.nih.gov/3418051/',
};
export type HandArterialXrayGroup = 'superficialArch' | 'deepArch' | 'princeps';
type Topic = { title: string; body: string; bullets: string[]; citations: (keyof typeof handArterialXrayReferences)[] };
export const handArterialXrayTeaching: Record<HandArterialXrayGroup, Topic> = {
  superficialArch: {
    title: 'X-ray/angiography: superficial palmar arch',
    body: 'Use this selection to orient the superficial palmar arch, not to predict a complete arterial ring. The ACRA cardiac-catheterization study found different superficial arch patterns on contrast angiography; those patients do not define a universal normal pattern.',
    bullets: [
      'An ordinary plain hand radiograph is not an arterial map. The cited cadaver X-ray study used radiopaque arterial injection, not unenhanced patient films.',
      'Contrast angiography shows a projection of filled vessels. The injected-specimen study used multiple projections to help avoid misinterpretation; a single overlap is not proof of a connection.',
      'A selected clinical angiographic series detected closed arches less often than anatomical or sonographic studies. Interpretation limit: its abstract does not establish whether an unseen segment is absent or why it did not fill; absence, interruption or occlusion cannot be inferred from this reference.',
      'The retained surface supplies no acquired filling, flow, collateral adequacy or procedural suitability assessment. Set separation to zero before comparing reference relationships.',
    ],
    citations: ['projection', 'livingArches', 'detection'],
  },
  deepArch: {
    title: 'X-ray/angiography: deep palmar arch',
    body: 'Compare the named deep palmar arch with the superficial arch as distinct reference structures. Living-patient angiography and injected-cadaver arteriography describe arch patterns using different methods; their completeness observations are not interchangeable population frequencies.',
    bullets: [
      'An ordinary plain hand radiograph is not an arterial map. Radiopaque injection or vascular contrast is a different examination from the unenhanced film.',
      'Projection can superimpose vessels. Multiple injected-specimen views were used to help avoid misinterpretation; the atlas does not select an appropriate patient projection or prove an anastomosis.',
      'In selected clinical angiograms, detection of a closed deep arch differed from anatomical and sonographic reports. Interpretation limit: the abstract does not establish why an individual segment is unseen or unfilled; this reference cannot establish its absence, interruption or occlusion.',
      'This whole source-labelled arch is not a complete numbered metacarpal or digital branch inventory, lumen/patency test, collateral assessment or procedural plan. Set separation to zero for relationship comparison.',
    ],
    citations: ['projection', 'livingArches', 'detection'],
  },
  princeps: {
    title: 'X-ray/angiography: variable thumb arterial supply',
    body: 'The princeps pollicis is one contributor to thumb blood supply. Cadaver stereoscopic arteriographs described combinations involving this artery, a superficial arch terminal branch and the first dorsal metacarpal artery; the named source must not imply one fixed thumb-supply pathway or exclusive supply.',
    bullets: [
      'An ordinary plain hand radiograph is not an arterial map. The cited thumb study used cadaver stereoscopic arteriography, not routine clinical visibility testing.',
      'Two retained meshes form one source-labelled princeps pollicis selection. They do not establish a duplicated artery, separate patient branches or a complete thumb arterial map.',
      'Projection and vessel filling must be assessed on the actual contrast angiogram. This surface cannot establish absence, interruption, occlusion, patency, flow or revascularization suitability.',
      'Set separation to zero before comparing relationships; the reference provides no patient-specific origin or registered image correspondence.',
    ],
    citations: ['thumb', 'projection'],
  },
};
export const handArterialXrayNote = 'Draft for revision-bound radiologist review of this exact source and teaching revision. No imaging study loaded, patient registration or diagnostic decision is supplied. Projection and variable filling limit interpretation; this reference is not a complete arterial map or a patency test. Reading references support scoped orientation, not routine visibility of every digital branch or an acquisition/procedural protocol. Atlas, imaging-case and paid-lecture access remain independent.';
