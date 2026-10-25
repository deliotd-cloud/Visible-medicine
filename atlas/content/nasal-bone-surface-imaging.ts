// Original first-party teaching notes. The linked publications are reading references;
// no third-party prose, figure, image, table, or patient study is copied here.
export const nasalBoneSurfaceImagingReferences = {
  comparison: 'https://pubmed.ncbi.nlm.nih.gov/25749616/',
  lateralUltrasound: 'https://pubmed.ncbi.nlm.nih.gov/24170464/',
} as const;

export type NasalBoneSurfaceModality = 'xray' | 'ultrasound';
export const nasalBoneSurfaceImagingTopics: Record<NasalBoneSurfaceModality, {
  body: string;
  bullets: readonly [string, string];
  references: readonly (keyof typeof nasalBoneSurfaceImagingReferences)[];
}> = {
  xray: {
    body: 'A published nasal-fracture comparison acquired radiographs alongside ultrasound and CT, distinguishing right and left lateral walls from the midline region. This source bone can orient the upper bony bridge before reviewing an actual projection. Overlap and positioning determine what a radiograph shows: a projected edge cannot be assigned to this selected side solely from its place on the screen. CT performed better for the lateral walls in that cohort. The comparison enrolled fracture patients; its radiographs are acquisition evidence, not a normal template or an instruction to order a nasal radiograph. Clinical assessment and local imaging guidance remain separate.',
    bullets: [
      'An isolated, coloured bone surface has no detector geometry, X-ray attenuation, fracture line or validated patient-side match.',
      'A midline observation must not be transferred to either individual bone; review the original image and its side information.',
    ],
    references: ['comparison'],
  },
  ultrasound: {
    body: 'In acquired studies of nasal injury, high-resolution ultrasound examined the superficial bony bridge. One comparison assessed right and left lateral walls separately from the midline; a smaller controlled adult study found lateral-view observations more consistent than dorsal-view observations. Use this source bone only to frame where the nasal cortex lies among neighbouring structures. The published observations do not make every contour routinely visible, validate the shape of this donor bone, or establish that either source side corresponds to a patient image. Interpretation belongs to the acquired examination and its clinical context.',
    bullets: [
      'This bone-focused draft does not teach cartilage or deep-injury assessment; a superficial view does not certify the complete bone.',
      'An interrupted cortical line or displacement reported in an injury cohort is not a diagnostic rule for this atlas selection or a normality test.',
    ],
    references: ['comparison', 'lateralUltrasound'],
  },
};

export const nasalBoneSurfaceImagingNote =
  'Original source-bound educational draft. The BodyParts3D source remains anatomically unvalidated and revision-bound radiologist sign-off is pending. No acquired image, patient transform, diagnostic result, approved geometry or clinical protocol is loaded. Atlas, Education case and lecture access remain independent.';
