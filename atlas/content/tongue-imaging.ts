// Original orientation prose. Reading citations confer no image or data reuse rights.
export const tongueImagingReferences = {
  tongue: 'https://pubmed.ncbi.nlm.nih.gov/27830322/',
  floor: 'https://sajr.org.za/index.php/sajr/article/view/2677/3448',
  spaces: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5990998/',
  mylohyoid: 'https://doi.org/10.2214/AJR.09.3516',
} as const;

export const tongueImagingTopics = {
  tongue: {
    ct: {
      body: 'Use the mandible and hyoid as orientation landmarks. Compare the central and lateral tongue musculature with the adjacent floor of mouth on axial and coronal CT.',
      limit: 'CT provides cross-sectional landmarks, including the mandibular cortex, but this whole-tongue source does not separate oral from pharyngeal tongue, mucosa, intrinsic muscles or disease.',
      citations: [tongueImagingReferences.tongue, tongueImagingReferences.mylohyoid, tongueImagingReferences.floor],
    },
    mri: {
      body: 'Compare the tongue muscles on axial and coronal T1-weighted images, then examine the adjacent sublingual spaces. These lie above mylohyoid and lateral to the genioglossus/geniohyoid complex.',
      limit: 'MRI contrast depends on sequence. A single whole-tongue source surface cannot label individual muscle, mucosal or lesion boundaries in an acquired study.',
      citations: [tongueImagingReferences.tongue, tongueImagingReferences.floor],
    },
  },
  genioglossus: {
    ct: {
      body: 'Find the mental-spine region of the anterior mandible, then follow the expected fan of genioglossus into the tongue. Compare its position with the adjacent sublingual space across CT sections.',
      limit: 'The displayed side is a source label, not a traced patient muscle boundary; CT appearance and separation depend on the acquired study.',
      citations: [tongueImagingReferences.tongue, tongueImagingReferences.mylohyoid],
    },
    mri: {
      body: 'Use axial and coronal MRI to relate the central genioglossus to the lateral sublingual space. Its fibres fan from the mental spine; the lowest portion reaches the hyoid.',
      limit: 'No individual fibre course or patient-specific attachment is validated by this source surface. Sequence and image quality determine the detail available.',
      citations: [tongueImagingReferences.tongue, tongueImagingReferences.spaces, tongueImagingReferences.floor],
    },
  },
  hyoglossus: {
    ct: {
      body: 'Orient hyoglossus from the hyoid towards the lateral tongue, outside genioglossus. Compare adjacent sections and the neighbouring floor-of-mouth landmarks on the selected side.',
      limit: 'The expected sheet is an anatomical guide; this source does not establish a visible patient-specific muscle margin or a complete floor-of-mouth compartment.',
      citations: [tongueImagingReferences.tongue, tongueImagingReferences.mylohyoid],
    },
    mri: {
      body: 'Follow the expected hyoglossus course upward from the hyoid, lateral to genioglossus. Relate it to the adjacent sublingual space on axial and coronal MR images.',
      limit: 'Individual-muscle edges depend on sequence and adjacent fat; do not treat the model edge as a registered MR boundary.',
      citations: [tongueImagingReferences.tongue, tongueImagingReferences.spaces, tongueImagingReferences.floor],
    },
  },
} as const;
