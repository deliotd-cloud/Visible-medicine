// Original factual teaching, not imported publisher prose, figures or protocols.
export const headNeckVesselImagingReferences = {
  arteries: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_head_neck.html',
  posterior: 'https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p07_index.html',
  ct: 'https://www.radiologyinfo.org/en/info/angioct',
  mri: 'https://www.radiologyinfo.org/en/info/angiomr',
  carotid: 'https://www.radiologyinfo.org/en/info/carotidstenosis',
  catheter: 'https://www.radiologyinfo.org/en/info/angiocath',
  duplex: 'https://onlinelibrary.wiley.com/doi/10.1002/jum.15877',
  transcranial: 'https://onlinelibrary.wiley.com/doi/10.1002/jum.16234',
  ctArtifacts: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7964077/',
  mrFlow: 'https://www.ajnr.org/content/ajnr/15/4/733.full.pdf',
  mrVenography: 'https://doi.org/10.2214/AJR.10.5323',
  jugularPosition: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6182958/',
} as const;
export type HeadNeckVesselReference = keyof typeof headNeckVesselImagingReferences;
export type HeadNeckVesselModality = 'ct' | 'mri' | 'ultrasound' | 'xray';
export type HeadNeckVesselFact = {text: string; references: readonly HeadNeckVesselReference[]};
const fact = (text: string, ...references: HeadNeckVesselReference[]): HeadNeckVesselFact => ({text, references});
export const headNeckVesselImagingModes: Record<HeadNeckVesselModality, HeadNeckVesselFact> = {
  ct: fact('Check contrast phase and coverage before following a vessel. CTA uses contrast-enhanced CT to assess arteries; the coloured donor surface supplies neither contrast timing nor a measured patient lumen.', 'ct'),
  mri: fact('Separate routine structural MRI from an angiographic or venographic acquisition. MR vessel imaging can use different techniques, with or without contrast; a model colour is not flow or signal.', 'mri'),
  ultrasound: fact('Identify the actual vessel using anatomy, grayscale, colour and spectral Doppler as appropriate. This stationary surface cannot supply a waveform, Doppler angle or flow direction.', 'duplex'),
  xray: fact('An ordinary radiograph is not a vessel-lumen study. Contrast catheter angiography is a separate X-ray examination; this rotatable model is neither a radiograph nor an angiographic projection.', 'carotid', 'catheter'),
};
type Group = {
  fmaIds: readonly string[];
  landmark: HeadNeckVesselFact;
  focus: Record<HeadNeckVesselModality, HeadNeckVesselFact>;
  limitation: string;
};
export const headNeckVesselImagingGroups = {
  commonCarotid: {
    fmaIds: ['FMA3941', 'FMA4058'],
    landmark: fact('Trace the common carotid to its internal/external division. The usual right origin is the brachiocephalic trunk; the usual left origin is the aortic arch.', 'arteries'),
    focus: {
      ct: fact('Follow the arterial course through the acquired neck coverage. Dense shoulder-level contrast, metal and flow artifacts can obscure the lumen or simulate disease; inspect source images rather than trusting a smooth rendering.', 'ctArtifacts'),
      mri: fact('Check that the selected MRA includes the vessel origin and bifurcation. A head-only display and this generic selection do not establish that the entire common carotid has been examined.', 'mri'),
      ultrasound: fact('Use transverse and longitudinal views, then sample proximal and mid/distal common carotid flow. Common carotid and vertebral disease must not simply inherit internal-carotid velocity criteria.', 'duplex'),
      xray: fact('Plain-film appearance cannot grade carotid stenosis. Duplex, CTA, MRA and catheter angiography provide different vascular information; choose the matching study rather than projecting a stenosis onto this mesh.', 'carotid'),
    },
    limitation: 'The bifurcation level and arch branching are not universal. The retained donor selection does not encode plaque, a carotid-sinus measurement, patient variants or a treatment threshold.',
  },
  internalCarotid: {
    fmaIds: ['FMA3949', 'FMA4062'],
    landmark: fact('Distinguish the internal carotid from the external branch: the normal cervical internal carotid has no branches in the neck and continues to intracranial circulation.', 'arteries'),
    focus: {
      ct: fact('Cross-check the cervical artery and skull-base course on source images. CTA flow artifacts may imitate an intimal flap or occlusion; the Atlas contour cannot adjudicate a suspected dissection.', 'ctArtifacts'),
      mri: fact('Match the neck or intracranial angiographic coverage to the segment being discussed. MRA evaluates vessels, but the unsplit donor selection does not define separately reviewed cervical, petrous, cavernous or supraclinoid boundaries.', 'mri'),
      ultrasound: fact('Cervical duplex combines plaque appearance with colour and spectral Doppler. Sample the proximal and more distal accessible internal carotid; apply the laboratory-approved interpretation criteria, not a velocity estimated from the model.', 'duplex'),
      xray: fact('Cerebral catheter angiography uses injected contrast and X-ray acquisition. It is not an ordinary skull film; a lateral model view does not establish the internal carotid lumen or an angiographic measurement.', 'carotid'),
    },
    limitation: 'The left and right records remain bound to their supplied sources. No C1–C7 segmentation, stenosis percentage, wall haematoma, collateral adequacy or patient-specific aneurysm is generated.',
  },
  vertebral: {
    fmaIds: ['FMA3958', 'FMA4066'],
    landmark: fact('Follow the paired vertebral arteries towards their intracranial union and the basilar trunk on the anterior brainstem.', 'posterior'),
    focus: {
      ct: fact('Assess the acquired neck-to-head vessel course on CTA, not only an isolated 3D surface. The selected donor artery does not establish the completeness of the patient acquisition or exclude an injured segment.', 'ct'),
      mri: fact('Vertebrobasilar model experiments show that geometry and flow can change the apparent vessel contour between MR angiographic sequences. Signal loss is not, by itself, proof of an anatomical break.', 'mrFlow'),
      ultrasound: fact('Extracranial duplex assesses accessible vertebral segments and records flow direction and waveforms. This is not complete intracranial coverage; internal-carotid stenosis criteria cannot simply be transferred to the vertebral artery.', 'duplex'),
      xray: fact('The arterial course shown here belongs to a separate vascular source. If using catheter angiography, compare the actual contrast-filled vessel and projection; an ordinary cervical radiograph cannot supply that lumen.', 'catheter'),
    },
    limitation: 'This whole source is not four independently validated V1–V4 segments. Asymmetry, dominance, entry-level variants and dissection require the actual study; no missing continuation or branch is invented.',
  },
  basilar: {
    fmaIds: ['FMA50542'],
    landmark: fact('The basilar trunk forms from the vertebral union and runs along the anterior brainstem. Use the pons and the vertebral confluence as orientation landmarks.', 'posterior'),
    focus: {
      ct: fact('Use an appropriate intracranial CTA acquisition to assess contrast within the basilar artery. The reference surface has no attenuation, intraluminal thrombus or perfusion information; its apparent continuity cannot establish patency.', 'ct'),
      mri: fact('At the vertebral confluence and basilar trunk, complex flow can alter MR angiographic appearance. Compare the source sequence and acquisition method before interpreting a rendered gap as a true vessel interruption.', 'mrFlow'),
      ultrasound: fact('Specialist transcranial Doppler can interrogate vertebral and basilar flow through the foramen-magnum window. It is a distinct examination, not a routine superficial neck scan or a complete surface reconstruction.', 'transcranial'),
      xray: fact('An angiographic basilar silhouette requires a suitable contrast acquisition. Do not interpret small branches absent from this reference mesh as occluded or assume that a chosen model camera reproduces an angiographic projection.', 'catheter'),
    },
    limitation: 'The existing basilar selection contains two supplied source pieces, not two independently named arterial segments. It is not a complete perforator map, collateral model or patient treatment-planning surface.',
  },
  internalJugular: {
    fmaIds: ['FMA4754', 'FMA4762'],
    landmark: fact('The internal jugular and carotid relationship varies between people and changes with head position. Do not treat the donor vein as a fixed lateral target.', 'jugularPosition'),
    focus: {
      ct: fact('Arterial-phase CTA may show jugular non-opacification or contrast-mixing defects. These can mimic thrombus; judge venous findings using the actual acquisition and appropriate corroborating images, not the vessel colour.', 'ctArtifacts'),
      mri: fact('Time-of-flight MR venography can lose jugular signal through saturation and in-plane flow. Nonvisualization alone does not establish thrombosis; inspect source images and the rest of the examination.', 'mrVenography'),
      ultrasound: fact('Compare the real vein with the carotid in the current head position. Venous compressibility and changing overlap make a static 3D relationship inadequate for vascular access or an individual safety assessment.', 'jugularPosition'),
      xray: fact('An ordinary neck or chest film does not delineate this venous lumen. Catheter position on a projection is not proof of jugular patency; the Atlas supplies no patient venogram or line-placement assessment.', 'catheter'),
    },
    limitation: 'No venous pressure, respiratory change, thrombosis, compression syndrome or safe needle path is represented. The selection is not an approved procedural guide or a complete dural-sinus/venous-drainage map.',
  },
} as const satisfies Record<string, Group>;
export type HeadNeckVesselImagingGroup = keyof typeof headNeckVesselImagingGroups;
