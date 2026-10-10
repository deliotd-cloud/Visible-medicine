// Original teaching summaries. Source links support anatomy and acquisition limits;
// no source image, contour, table or wording is reproduced.
export const orbitalSupportMriReferences = [
  'https://pubmed.ncbi.nlm.nih.gov/32241775/', // microscopy-coil orbital MRI
  'https://pubmed.ncbi.nlm.nih.gov/32178233/', // eyelid MRI study
  'https://pubmed.ncbi.nlm.nih.gov/15733302/', // rectus sleeve histology
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC8776787/', // orbital-apex cadaver anatomy
  'https://pubmed.ncbi.nlm.nih.gov/31675425/', // differing annulus histology
  'https://pubmed.ncbi.nlm.nih.gov/12506273/', // dedicated extraocular muscle imaging
  'https://pubmed.ncbi.nlm.nih.gov/6695076/', // section-thickness partial-volume limit
] as const;

export const orbitalSupportMriFacts = {
  trochlea: {
    body: 'At the anterior superomedial orbit, the superior oblique tendon changes direction through the trochlea. Microscopy-coil MRI has depicted this course; the example does not establish reliable identification on routine orbital or brain MRI.',
    distinction: 'Trace the superior oblique toward its anterior turn. The trochlea is its reflecting pulley, distinct from the nearby medial rectus and from the trochlear nerve.',
  },
  ring: {
    body: 'Use the posterior convergence of the rectus muscles and optic-nerve corridor to orient to the common tendinous origin at the orbital apex. Cadaver studies disagree on the precise participation of the superior rectus, so this draft does not impose one complete ring boundary on MRI.',
    distinction: 'This apical origin is separate from the anterior trochlea and the more anterior rectus sleeves. Their proximity in a model does not show a continuous tendon on a scan.',
  },
  lateralCheck: {
    body: 'Orient along the lateral rectus toward the lateral orbital wall. Human histology shows sleeve extensions attaching to periosteum; this provides an anatomic context for the lateral check ligament, not proof that its individual fibers can be resolved on routine MRI.',
    distinction: 'The lateral check ligament concerns the lateral rectus fascial support. Do not substitute the visible muscle belly or the superior-rectus–lateral-rectus band for the ligament itself.',
  },
  medialCheck: {
    body: 'Orient along the medial rectus toward the medial orbital wall. Human histology shows fine connections from its thick sleeve to periosteum; these are anatomic support structures, not an MRI-validated separately visible target.',
    distinction: 'The medial check ligament is associated with medial rectus fascia, away from the lateral rectus support and from the apical common tendinous origin.',
  },
  upperTarsal: {
    body: 'At the upper eyelid, locate the tarsal plate within the lid rather than within the globe or orbital septum. A dedicated eyelid MRI study identified superior tarsal plates on T1- and T2-weighted images.',
    distinction: 'The upper plate belongs to the upper lid. The nearby orbital septum and levator complex are separate layers; a single low-resolution slice may blend them.',
  },
  lowerTarsal: {
    body: 'At the lower eyelid, locate the inferior tarsal plate within the lid. A dedicated eyelid MRI study identified it on T1- and T2-weighted images, while its identification was much harder on a standard orbit protocol.',
    distinction: 'Keep the lower plate separate from the lower orbital septum and the inferior rectus. Visibility in a dedicated eyelid acquisition does not imply visibility on routine scans.',
  },
} as const;

export const orbitalSupportMriLimitations = [
  'The Atlas mesh is an anatomic reference, not an acquired MRI or patient-to-Atlas registration. Small fascial structures may be lost to acquisition resolution and partial-volume averaging; absence on a slice is not evidence of absence in the orbit.',
  'No individual check-ligament MRI visibility or diagnostic performance is established here. The orbital-apex tendon has disputed detailed boundaries in cadaver studies; do not infer them from the mesh or a single MR slice.',
] as const;
