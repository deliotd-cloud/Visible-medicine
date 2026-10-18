// Original draft wording; these references do not license figure or prose reuse.
export const rootCuffXrayReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
  'https://www.orthoinfo.org/diseases--conditions/rotator-cuff-tears',
] as const;

export const rootCuffXrayFacts = {
  infraspinatus: {
    body: 'Find infraspinatus below the scapular spine, running from its fossa toward the greater tubercle’s middle facet.',
    distinction: 'The middle facet distinguishes it from the adjacent superior and inferior cuff attachments.',
  },
  subscapularis: {
    body: 'Orient from the anterior scapular surface to the lesser tubercle for subscapularis.',
    distinction: 'This anterior cuff muscle reaches the lesser, rather than greater, tubercle.',
  },
  supraspinatus: {
    body: 'Find supraspinatus above the scapular spine, running toward the greater tubercle’s superior facet.',
    distinction: 'Its superior-facet destination differs from the middle and inferior cuff attachments.',
  },
  teresMinor: {
    body: 'Follow the lateral scapular border toward the greater tubercle’s inferior facet to orient teres minor.',
    distinction: 'Its inferior-facet destination lies below that of infraspinatus.',
  },
} as const;

export const rootCuffXrayLimitations = [
  'Radiographs show bony orientation, not the cuff tendons or their attachment continuity. A normal X-ray does not rule out a cuff tear; MRI or ultrasound can assess soft tissues.',
  'Keep bones visible and return model separation to zero. The assembled 3D view is an anatomy aid; rotating it does not create a radiographic projection or reveal a tendon footprint.',
] as const;
