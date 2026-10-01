// Original educational summaries. No study image, figure, table, measurement or patient data is imported.
export const tentoriumImagingReferences = {
  anatomy: 'https://www.cureus.com/articles/13852-the-tentorium-cerebelli-a-comprehensive-review-including-its-anatomy-embryology-and-surgical-techniques.pdf',
  anatomyLicense: 'https://creativecommons.org/licenses/by/3.0/',
  ct: 'https://pubmed.ncbi.nlm.nih.gov/870939/',
  mri: 'https://pubmed.ncbi.nlm.nih.gov/8273651/',
} as const;

const { anatomy, anatomyLicense, ct, mri } = tentoriumImagingReferences;

export const tentoriumImagingTopics = {
  ct: {
    title: 'CT orientation',
    body: 'On head CT, orient the tentorial dural shelf beneath the posterior cerebrum and above the cerebellum. Its band-like appearance varies with slice level and angle; follow adjacent planes before relating a visible band to the fold. The Atlas surface is only the supplied right-sided portion, not the complete tentorium or notch.',
    bullets: [
      'Compare the apparent fold on adjacent images and planes; one bright band does not define its full extent or establish haemorrhage or pathologic thickening.',
      'Keep dura distinct from neighbouring brain, CSF and venous-sinus regions. This surface supplies no sinus lumen or patient-specific boundary.',
    ],
    citations: [anatomy, anatomyLicense, ct],
  },
  mri: {
    title: 'MRI orientation',
    body: 'Postcontrast T1-weighted MRI may delineate the tentorial fold. Inspect the actual sequence and plane, then adjacent images, to orient it beneath the posterior cerebrum and above the cerebellum. This Atlas selection contains only an incomplete right-sided source surface, not a complete notch or patient-specific meningeal boundary.',
    bullets: [
      'In the cited historical comparison, normal meningeal continuity differed between conventional 2D spin echo and 3D gradient echo; continuous enhancement alone is not a diagnosis.',
      'Distinguish the dural fold from adjacent brain, CSF and venous-sinus region in the acquired study. The model contains no measured signal or sinus lumen.',
    ],
    citations: [anatomy, anatomyLicense, mri],
  },
} as const;
