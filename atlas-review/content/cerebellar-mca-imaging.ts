// Original educational prose only: no study images, tables, measurements or patient data.
export const cerebellarMcaImagingReferences = {
  posteriorBranches: 'https://pubmed.ncbi.nlm.nih.gov/24023533/',
  picaOrigin: 'https://pubmed.ncbi.nlm.nih.gov/25001076/',
  angiography: 'https://pubmed.ncbi.nlm.nih.gov/15891154/',
  mcaSourceImages: 'https://pubmed.ncbi.nlm.nih.gov/9010532/',
} as const;

const { posteriorBranches, picaOrigin, angiography, mcaSourceImages } = cerebellarMcaImagingReferences;

export const cerebellarMcaImagingTopics = {
  pica: {
    ct: {
      title: 'CT and CTA orientation',
      body: 'Routine noncontrast head CT shows brain tissue and haemorrhage, not this arterial surface as a vessel map. CTA is a separate contrast-enhanced acquisition that can depict a PICA origin and course. Compare the assembled source group with an angiographic study only as anatomical orientation, never as a patient-specific match.',
      bullets: [
        'Each PICA side retains 13 original files and 14 components; gaps do not demonstrate occlusion or a continuous lumen.',
        'PICA origin varies, including reported C1/2 origins. This mesh establishes no individual origin variant.',
      ],
      citations: [posteriorBranches, picaOrigin],
    },
    mri: {
      title: 'MRI and MRA orientation',
      body: 'Structural brain MRI and MR angiography answer different questions. Time-of-flight MRA uses flow-related signal to show arteries; a faint or absent small PICA branch on a projection is not proof of agenesis or occlusion. Read angiographic source images in context rather than matching signal gaps to the model gaps.',
      bullets: [
        'The paired source groups are fragmented surfaces, not measured PICA flow, calibre or perfusion territories.',
        'The published CTA and MRA posterior-branch groups were separate cohorts, not a matched accuracy comparison.',
      ],
      citations: [posteriorBranches, angiography],
    },
  },
  sca: {
    ct: {
      title: 'CT and CTA orientation',
      body: 'Routine noncontrast head CT does not trace an SCA lumen. CTA is a separate contrast-enhanced vessel study that can help orient the superior cerebellar artery near the basilar artery. Compare only the assembled source position: the slight proximal midline crossing in this source is not evidence of a named variant or patent junction.',
      bullets: [
        'The source retains one original file and one connected component per side; distal branches and territory are incomplete.',
        'Posterior-branch patterns vary in angiographic cohorts, but this model cannot assign an individual configuration.',
      ],
      citations: [posteriorBranches, angiography],
    },
    mri: {
      title: 'MRI and MRA orientation',
      body: 'Structural MRI displays tissue; MRA is the vessel-focused examination. Time-of-flight MRA signal depends on moving blood and can make small or slowly flowing arterial portions difficult to see. A projected signal gap should not be read as a gap in this SCA surface, nor should the source crossing be labelled a variant.',
      bullets: [
        'Keep right and left source identities as supplied; the small proximal crossing does not prove a different side.',
        'Neither the mesh nor a single MRA projection establishes lumen continuity, flow or a complete SCA tree.',
      ],
      citations: [posteriorBranches, angiography],
    },
  },
  mca: {
    ct: {
      title: 'CT and CTA orientation',
      body: 'Routine noncontrast head CT and CTA are different examinations: the former depicts tissue and haemorrhage, while contrast-enhanced CTA depicts arteries. The retained right MCA surface can orient a CTA review, but it is not a lumen reconstruction. No left MCA, complete tree, or separate M1/M2 boundary is supplied.',
      bullets: [
        'Three ordered PART-OF files contain six disconnected source components; do not bridge them into a continuous artery.',
        'CTA source images and reconstructions need their own interpretation; model gaps are not patient stenoses.',
      ],
      citations: [angiography],
    },
    mri: {
      title: 'MRI and MRA orientation',
      body: 'Structural brain MRI is not MR angiography. Time-of-flight MRA highlights flow-related signal, and a maximum-intensity projection can lose signal at a middle cerebral artery segment without proving occlusion. Check the angiographic source images in context. The model supplies only disconnected right MCA source surfaces, not measured flow or segment labels.',
      bullets: [
        'Three source files form six components; no complete right tree, left counterpart or M1/M2 assignment is inferred.',
        'A missing projected branch or model component is not proof of patient occlusion or an anatomical variant.',
      ],
      citations: [angiography, mcaSourceImages],
    },
  },
} as const;
