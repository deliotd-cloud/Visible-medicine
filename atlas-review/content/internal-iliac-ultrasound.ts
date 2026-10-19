// Original draft teaching. The references support facts, not reuse of publisher media.
export const internalIliacUltrasoundReferences = [
  'https://jultrason.pl/artykul.php?a=258',
  'https://pubmed.ncbi.nlm.nih.gov/8544154/',
] as const;

const trunkOrientation = {
  body: 'On an acquired iliac ultrasound examination, finding the internal iliac origin at the common iliac division helps distinguish the pelvic branch from the external iliac route. Doppler assessment at this origin can address flow direction and patency when the vessel is visible.',
  pitfall: 'Bowel gas and difficult acoustic access may obscure iliac segments. Failure to see a segment is not proof of absence or occlusion. This selected source trunk is not a complete map of its distal divisions or branches.',
} as const;

export const internalIliacUltrasoundFacts = {
  FMA18809: trunkOrientation,
  FMA18810: trunkOrientation,
} as const;
