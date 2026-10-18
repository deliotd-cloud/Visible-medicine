// Original factual teaching summaries. Citations are reading links, not asset licences.
export const centralCanalImagingTopics = {
  ct: {
    title: 'CT: distinguish the spaces',
    body: 'The central canal belongs within the spinal cord; it is not the larger vertebral canal enclosing the cord. Do not label the bony canal on CT as this small intramedullary space. A visible atlas surface does not establish that the normal central canal can be resolved on routine CT.',
    bullets: [
      'CT myelography outlines the cord and nerve roots using contrast in the surrounding subarachnoid space. That contrast column is not a cast of the central canal.',
      'MRI is used to assess the cord itself and suspected intramedullary cavities. This anatomical model supplies neither CT attenuation nor a diagnostic exclusion of cord disease.',
    ],
    citations: ['https://www.radiologyinfo.org/en/info/myelography','https://www.radiologyinfo.org/en/info/spinemr'],
  },
  mri: {
    title: 'MRI: a canal-like signal is not a diagnosis',
    body: 'A thin fluid-signal feature within or near the midline of the cord needs anatomical interpretation, not automatic labelling as a syrinx. MRI is the principal imaging method for evaluating syringomyelia, but this source surface is a reference representation, not a segmented cavity from that examination.',
    bullets: [
      'Petit-Lacour and colleagues described appearances compatible with a persistent central canal in 12 of 794 spinal MRI studies. That observational series does not supply a universal size threshold or a patient-specific diagnosis.',
      'An exploratory cervical MRI study found that some canal-like T2 signal may relate to the anterior median fissure. Compare axial and sagittal relationships; a sagittal bright line alone does not establish the precise space.',
      'Do not infer patency, fluid flow, symptoms or treatment from this mesh. Any proposed scan correspondence needs the actual acquisition, annotation and revision-bound radiologist review.',
    ],
    citations: ['https://www.ninds.nih.gov/health-information/disorders/syringomyelia','https://pubmed.ncbi.nlm.nih.gov/11110081/','https://pmc.ncbi.nlm.nih.gov/articles/PMC7960245/'],
  },
  ultrasound: {
    title: 'Ultrasound: age and acoustic access matter',
    body: 'Neonatal and young-infant spine ultrasound uses acoustic access through incompletely ossified posterior elements. This is a different imaging setting from the adult source model: its central-canal surface must not be presented as a routinely visible adult transcutaneous ultrasound target.',
    bullets: [
      'The AIUM neonatal/infant spine parameter includes assessment of suspected hydromyelia or syringomyelia. It distinguishes fluid collections within the cord from the subarachnoid space around it; these are not interchangeable annotations.',
      'The model contains no ultrasound pixels, calibrated probe plane or dynamic examination. It cannot establish a normal canal diameter, exclude a cord abnormality or reproduce neonatal anatomy.',
    ],
    citations: ['https://www.aium.org/docs/default-source/resources/guidelines/neonatalspine.pdf?sfvrsn=853d087e_1','https://onlinelibrary.wiley.com/doi/10.1002/jum.15875'],
  },
} as const;
