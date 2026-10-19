// Original draft teaching; references supply facts, not reusable image assets.
export const mainBronchusXrayReferences = [
  'https://ehealth.kcl.ac.uk/tel/radiology/CXR/03-02-lungs.html',
  'https://www.radiologymasterclass.co.uk/tutorials/chest/chest_home_anatomy/chest_anatomy_page1',
] as const;

export const mainBronchusXrayFacts = {
  FMA7395: {
    body: 'On a frontal chest radiograph, locate the tracheal air column and its division at the carina. Follow the visible right main-bronchial air column towards the right hilum; its course is normally steeper than the left.',
    pitfall: 'Follow the air column, not an adjacent hilar opacity. Check positioning before interpreting apparent displacement. The visible projection and this unregistered 3D surface do not establish the complete bronchial wall, distal branches or patency.',
  },
  FMA7396: {
    body: 'Start at the carina and trace the visible left main-bronchial air column towards the left hilum. Compare its more oblique course with the right main bronchus, using the actual radiograph rather than the rotated atlas camera.',
    pitfall: 'If the airway outline is indistinct, do not fill in its course from this donor model. A visible proximal air column does not prove a normal wall or an unobstructed distal bronchial tree.',
  },
} as const;
