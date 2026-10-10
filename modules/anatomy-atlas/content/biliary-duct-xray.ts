// Original draft teaching; references support facts, not reusable images.
export const biliaryDuctXrayReferences = [
  'https://www.radiologyinfo.org/en/info/biliary',
  'https://www.sages.org/publications/guidelines/clinical-spotlight-review-laparoscopic-common-bile-duct-exploration/',
] as const;

export const biliaryDuctXrayFacts = {
  FMA14539: {
    body: 'The cystic duct runs from the gallbladder neck to its junction with the common hepatic duct. On contrast X-ray cholangiography, orient to the opacified ductal lumen and locate that junction; an unopacified plain abdominal film does not normally delineate the duct.',
    pitfall: 'Projection overlap and variable junction anatomy can obscure its course. This selected source surface does not establish a connected lumen, patency or flow, and cannot guide cannulation or diagnose stones.',
  },
  FMA14668: {
    body: 'The common hepatic duct lies between the confluence of the right and left hepatic ducts and the cystic duct junction. Contrast X-ray cholangiography may outline its opacified lumen; an unopacified plain abdominal film does not normally delineate this duct.',
    pitfall: 'Check the projection and variant branching before assigning a junction. The selected source surface does not establish a connected lumen, patency or flow, and cannot diagnose stones or guide a procedure.',
  },
} as const;
