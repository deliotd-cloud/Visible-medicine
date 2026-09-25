// Original draft wording. These are reading references, not image reuse licences.
export const hipAbductorXrayReferences = [
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html',
  'https://www.radiologyinfo.org/en/info/bonerad',
] as const;

export const hipAbductorXrayFacts = {
  medius: {
    body: 'Use the ilium and greater trochanter to orient the selected gluteus medius. Its iliac origin lies between the anterior and posterior gluteal lines; its distal attachment is at the greater trochanter.',
    distinction: 'Keep medius separate from minimus: sharing a trochanteric destination does not make their muscle bellies or tendon attachments interchangeable.',
  },
  minimus: {
    body: 'Relate the selected gluteus minimus to the ilium and greater trochanter. Its iliac origin lies between the anterior and inferior gluteal lines; it also attaches at the greater trochanter.',
    distinction: 'The atlas lets you separate minimus from medius, but an X-ray does not reproduce this dissection plane or the individual coloured muscle surfaces.',
  },
} as const;

export const hipAbductorXrayLimitations = [
  'Bone radiographs provide limited information about muscles and tendons. A normal-looking greater trochanter does not establish an intact abductor tendon or exclude muscle disease.',
  'Use visible bone contours as orientation landmarks, not as a direct outline of the gluteal lines or individual tendon footprints. Check the actual side marker and projection; rotating this model does not simulate a radiograph.',
] as const;
