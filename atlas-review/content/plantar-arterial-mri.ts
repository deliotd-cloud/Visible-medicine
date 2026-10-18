// Original educational summaries and reading links; no publisher media or prose imported.
export const plantarArterialMriReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html',
  arch: 'https://pubmed.ncbi.nlm.nih.gov/11694970/',
  deep: 'https://pubmed.ncbi.nlm.nih.gov/9787393/',
  comparative: 'https://pubmed.ncbi.nlm.nih.gov/7696797/',
  pitfalls: 'https://pubmed.ncbi.nlm.nih.gov/7489621/',
  unenhanced: 'https://pubmed.ncbi.nlm.nih.gov/24758556/',
} as const;

export const plantarArterialMriLandmarks = {
  medial: 'Follow the posterior tibial division into the medial sole. The medial plantar artery and its source-labelled superficial branch are separate selections; neither is the deep plantar connecting artery.',
  lateral: 'Follow the lateral plantar contribution towards the plantar arch. Compare the lateral parent, arch and deep plantar selections individually instead of treating their surfaces as a continuous proven lumen.',
  arch: 'The plantar arterial arch joins lateral plantar and deep plantar contributions. Cadaveric work describes variable contributions; a donor-labelled arch does not define the branching pattern of every foot.',
  deep: 'The deep plantar artery links the dorsalis pedis system with the plantar arch through the first intermetatarsal region. It is not the medial plantar artery or its superficial branch.',
  superficial: 'This supplied superficial medial plantar branch belongs to the medial plantar system. Keep the parent and branch distinct; the surface name alone does not establish its depth or complete digital territory in an acquired scan.',
} as const;

export const plantarArterialMriContext =
  'A routine foot MRI and a dedicated pedal MRA answer different questions. For spatial learning, identify the side and dorsal/plantar orientation, then trace the candidate artery through acquired source sections before comparing it with this donor surface. A single projection or neighbouring signal focus is not enough to name a small branch.';

export const plantarArterialMriStudies = {
  comparison: 'An older comparative time-of-flight study examined medial plantar, lateral plantar and arch vessels in patients with arterial occlusive disease. Its findings concern that acquisition and cohort, not routine foot MRI or guaranteed visibility of every branch.',
  flow: 'A distal-extremity MRA study reported difficulty depicting flow in the plantar arch and retrograde lateral plantar flow. Apparent signal loss therefore needs acquisition-specific assessment; it is not automatically an occluded or absent artery.',
  unenhanced: 'A dedicated unenhanced pedal-MRA study reported nondiagnostic segments related to motion, weak arterial signal and venous contamination. Its named vessel assessment does not separately validate this small deep plantar or superficial medial plantar source segment.',
} as const;
