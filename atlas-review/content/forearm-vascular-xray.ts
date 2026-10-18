// Independently written factual orientation. Publications are reading links, not imported assets.
export const forearmVascularXrayReferences = {
  calcification: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10460149/',
  venography: 'https://doi.org/10.1016/j.ejvs.2009.11.036',
} as const;

type Reference = keyof typeof forearmVascularXrayReferences;
type Teaching = { title: string; body: string; bullets: readonly string[]; citations: readonly Reference[] };
export const forearmVascularXrayTeaching: Record<'radial' | 'ulnar' | 'cephalic' | 'basilic', Teaching> = {
  radial: {
    title: 'Plain-film arterial calcification orientation',
    body: 'Yang and colleagues compared plain radiographs and ultrasound of bilateral radial and ulnar arteries in 40 adults receiving stable haemodialysis with forearm fistulas. A calcified wall may project along the radial arterial course; this is an indirect mineralisation sign, not a visible normal arterial lumen.',
    bullets: [
      'Keep the selected radial artery separate from the ulnar artery and its smaller neighbours. Projection and overlap do not establish a continuous arterial tree.',
      'The study used posterior-anterior and lateral radiographs in a selected renal cohort. Its findings are not a healthy-population detection rate, and a negative film does not exclude vascular disease.',
      'Plain-film calcification alone cannot measure flow, establish patency or grade stenosis. The reference mesh supplies none of these findings and is not the study participant’s artery.',
      'Do not transfer these findings to radial branches or perforators. Published diagnostic-performance percentages are deliberately omitted because the displayed contingency table and reported denominators are inconsistent.',
    ],
    citations: ['calcification'],
  },
  ulnar: {
    title: 'Plain-film arterial calcification orientation',
    body: 'In Yang and colleagues’ selected cohort of 40 adults on stable haemodialysis, bilateral ulnar and radial arteries were assessed with plain radiographs and ultrasound. Projected wall calcification can offer ulnar-course orientation; it does not depict the normal lumen or reveal the origin of every recurrent or interosseous branch.',
    bullets: [
      'Compare the actual calcified course in the acquired projection, keeping the ulnar and radial selections distinct. A source label does not identify an overlapping opacity by itself.',
      'Posterior-anterior and lateral study views were observations in a renal cohort, not a universal visibility promise. Absence of visible calcification is not evidence of normal flow or freedom from disease.',
      'Neither a plain radiograph nor this static surface establishes arterial patency, collateral adequacy, perfusion territory or a patient-specific intervention route.',
      'Diagnostic-performance percentages are omitted because the study’s displayed table and reported denominators are inconsistent. No calcification scoring, screening or treatment protocol is supplied here.',
    ],
    citations: ['calcification'],
  },
  cephalic: {
    title: 'Contrast venography orientation — not plain-film visibility',
    body: 'Heye and colleagues retrospectively evaluated 209 carbon-dioxide (CO2) venograms in 116 selected patients with advanced chronic kidney disease. Their digital-subtraction venography review included cephalic and basilic veins in the forearm and upper arm. This provides a contrast-mapping context for the cephalic selection, not visibility of a normal vein on an unenhanced X-ray.',
    bullets: [
      'Use only a segment actually demonstrated on acquired contrast venography. The selected study does not establish that every cephalic segment fills in every examination.',
      'Keep the cephalic vein distinct from the basilic vein and median venous connections. A projected overlap or nearby contrast-filled segment does not prove a junction with this source surface.',
      'CO2 digital-subtraction venography is an acquired contrast technique, not simulated mesh enhancement or a plain radiograph. An unfilled segment cannot be classified as absent or occluded from this mesh.',
      'This draft does not recommend an examination, contrast agent, cannulation site, access operation or diameter threshold; it supplies no acquisition protocol or patient-specific vascular-access suitability assessment.',
    ],
    citations: ['venography'],
  },
  basilic: {
    title: 'Contrast venography orientation — not plain-film visibility',
    body: 'The retrospective study by Heye and colleagues reviewed forearm and upper-arm basilic and cephalic veins on CO2 digital-subtraction venography: 209 venograms in 116 selected advanced-kidney-disease patients. It supports conditional contrast mapping of the basilic course, not a normal-vein silhouette on an unenhanced plain film or a universal detection rate.',
    bullets: [
      'Identify the demonstrated basilic segment on the acquired contrast study rather than transferring a cephalic or upper-arm observation to the whole forearm vein.',
      'The retained bilateral sources are independent reference surfaces. They do not establish patient venous variants, filling, continuity, a patent confluence or measured flow.',
      'Contrast venography and plain radiography answer different visibility questions. Projection, incomplete filling and absent mesh segments do not by themselves diagnose stenosis, thrombosis or anatomical absence.',
      'The selected access-planning cohort is not a general-population normal atlas. No contrast choice, injection method, cannulation route, procedural recommendation or access-suitability threshold is reproduced.',
    ],
    citations: ['venography'],
  },
};

export const forearmVascularXrayNote =
  'Original educational draft; revision-bound radiologist sign-off pending. No acquired radiographs, venograms, patient data or patient-to-atlas registration are supplied. Reset explode to zero for reference orientation; this does not register an imaging plane. Atlas, imaging-case and paid-lecture access remain independent.';
