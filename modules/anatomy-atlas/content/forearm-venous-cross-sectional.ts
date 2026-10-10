// Original anatomical search prompts. Sources provide context, not reusable images.
export const forearmVenousCrossSectionalReferences = {
  anatomy: 'https://pubmed.ncbi.nlm.nih.gov/23131916/',
  anatomyPatterns: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9256478/',
  variants: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4371182/',
  ct: 'https://pubmed.ncbi.nlm.nih.gov/27757189/',
  mrv: 'https://pubmed.ncbi.nlm.nih.gov/22920352/',
} as const;
type Ref = keyof typeof forearmVenousCrossSectionalReferences;
export type ForearmVenousCrossSectionalGroup = 'cephalic' | 'basilic' | 'medianCubital' | 'medianAntebrachial';
export type ForearmVenousCrossSectionalMode = 'ct' | 'mri';
type Fact = { text: string; references: readonly Ref[] };
const fact = (text: string, ...references: Ref[]): Fact => ({ text, references });

export const forearmVenousCrossSectionalModes = {
  ct: fact('On an already acquired CT, first check whether the forearm or elbow is covered and whether superficial veins are distinguishable. A cited CT venography study tested central venous stenosis and noted potential depiction of upper-limb superficial and deep systems; it did not test these individual forearm veins. A blue model surface supplies no CT attenuation or patient-specific lumen.', 'ct'),
  mri: fact('On an already acquired MR series, check coverage and sequence before seeking a superficial vein. An upper-limb MR venography abstract reports evaluation of named large veins and small branches; the abstract does not establish reliable depiction of an individual connector on routine MRI. The model supplies no MR signal or flow information.', 'mrv'),
} as const;

export const forearmVenousCrossSectionalGroups: Record<ForearmVenousCrossSectionalGroup, {
  landmark: Fact; ct: Fact; mri?: Fact;
}> = {
  cephalic: {
    landmark: fact('Seek the superficial radial-side forearm route and trace it towards the lateral elbow; its connection across the fossa varies between people.', 'variants'),
    ct: fact('In serial sections, keep a superficial cephalic candidate separate from deeper radial vessels. At the elbow, look for a possible median-cubital connection rather than assuming that every lateral superficial channel crosses to basilic.', 'anatomy', 'variants'),
  },
  basilic: {
    landmark: fact('Seek the superficial ulnar-side forearm route, then follow it towards the medial elbow. This is distinct from the paired deep forearm veins.', 'variants'),
    ct: fact('Compare adjacent sections through the medial subcutaneous tissue. A channel joining from the lateral elbow may be median cubital, while the median antebrachial may enter basilic directly; neither junction is guaranteed.', 'anatomyPatterns'),
  },
  medianCubital: {
    landmark: fact('The median cubital vein, when present, is a superficial oblique bridge across the anterior elbow between cephalic and basilic routes. Cadaveric series also found patterns without this bridge.', 'anatomy'),
    ct: fact('Search across successive anterior-elbow sections for a superficial channel passing from the lateral cephalic side towards the medial basilic side. Do not label one isolated round profile as the whole bridge or infer that a missing profile means an absent vein.', 'anatomyPatterns', 'variants'),
    mri: fact('Use the same lateral-to-medial elbow landmarks on the acquired series, checking whether a connecting superficial channel can actually be followed. The cited MRV abstract does not separately establish median-cubital visibility; a routine elbow MRI can leave this small route unresolved.', 'anatomy', 'mrv'),
  },
  medianAntebrachial: {
    landmark: fact('The median antebrachial route ascends the anterior forearm towards a variable cubital confluence. It can enter median cubital or basilic, or split into branches leading towards both sides.', 'anatomyPatterns'),
    ct: fact('Track a superficial anterior-forearm candidate towards the elbow over several sections. At its proximal end, check for a median-cubital or basilic junction rather than continuing the label automatically into a lateral or deep vein.', 'anatomyPatterns'),
    mri: fact('Look along the anterior subcutaneous forearm only where the acquired coverage includes it, then inspect the elbow connection if visible. The cited upper-limb MRV abstract does not establish depiction of the median antebrachial vein on an ordinary MRI.', 'anatomyPatterns', 'mrv'),
  },
};
