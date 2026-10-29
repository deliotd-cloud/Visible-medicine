// Original teaching; linked research is not copied or redistributed as an asset.
export const mandibleXrayReferences = {
  landmarks: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4574055/',
  canalVisibility: 'https://pubmed.ncbi.nlm.nih.gov/25473634/',
  mentalForamen: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4670251/',
} as const;

export const mandibleXrayTeaching = {
  body: 'On a panoramic radiograph, follow the mandibular body along its lower border to the angle and ascending ramus on each side. Identify the condylar and coronoid processes and the notch between them. These are landmarks to assess on an acquired projection; rotating the generic Atlas surface does not reproduce a panoramic image.',
  bullets: [
    'The mandibular canal can be followed within the body when its outline is visible. A study comparing panoramic radiographs with CBCT found that canal visibility varied by molar region; an indistinct segment should not be interpreted as an absent canal.',
    'Look for the mental foramen in the premolar region. Its position varies, and a panoramic projection may not reveal it even when it is present on cross-sectional imaging. Superimposed structures can obscure its outline.',
    'Compare sides on the acquired image and keep projection overlap in mind. This whole-mandible mesh does not establish a validated canal, foramen annotation, measurement or patient-specific correspondence.',
  ],
  citations: ['landmarks', 'canalVisibility', 'mentalForamen'],
} as const;

export const mandibleXrayNote = 'Original educational draft; exact-revision radiologist sign-off pending. The cited studies support anatomical orientation and visibility limits, not a diagnostic or acquisition protocol. No images or annotations are supplied by these references. Atlas, imaging-case and paid-lecture access remain independent.';
