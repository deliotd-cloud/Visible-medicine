export type ShoulderArterialGroup = 'posteriorHumeral' | 'scapular' | 'suprascapular';
export const shoulderArterialMriReferences = {
  posteriorHumeral:'https://pubmed.ncbi.nlm.nih.gov/8079857/',
  scapular:'https://pubmed.ncbi.nlm.nih.gov/39568746/',
  suprascapular:'https://pubmed.ncbi.nlm.nih.gov/39568746/',
};
export const shoulderArterialMriSelections: {fmaId:string;files:string[];group:ShoulderArterialGroup}[] = [
  {fmaId:'FMA22685',files:['FJ2291','FJ2292'],group:'posteriorHumeral'},
  {fmaId:'FMA22687',files:['FJ2239','FJ2240'],group:'posteriorHumeral'},
  {fmaId:'FMA23180',files:['FJ2273'],group:'scapular'},
  {fmaId:'FMA23181',files:['FJ2221'],group:'scapular'},
  {fmaId:'FMA10698',files:['FJ2303'],group:'suprascapular'},
  {fmaId:'FMA10681',files:['FJ2251'],group:'suprascapular'},
];
// Short original summaries of primary research; no publisher media are bundled.
export const shoulderArterialMriTopics: Record<ShoulderArterialGroup,{body:string;scope:string}> = {
  posteriorHumeral:{
    body:'A small MR angiography study found position-related arterial occlusion in asymptomatic volunteers as well as a symptomatic patient. This finding alone does not establish quadrilateral space syndrome.',
    scope:'Both official source components remain one posterior circumflex humeral artery selection. Their surface arrangement does not model positional compression or a continuous lumen.',
  },
  scapular:{
    body:'A six-case musculoskeletal series depicted the circumflex scapular artery with dynamic contrast-enhanced MRA in its upper-back case. This demonstrates possible visualisation, not general diagnostic accuracy.',
    scope:'Use this named reference surface for spatial orientation, not as a patient-specific map of scapular collateral connections. Routine shoulder MRI is not equivalent to angiography.',
  },
  suprascapular:{
    body:'In a small series, dynamic contrast-enhanced MRA depicted suprascapular origins from the thyrocervical trunk and, in another case, the internal mammary artery, corroborated by DSA. These examples do not establish variant prevalence.',
    scope:'Trace the origin on the actual study instead of assuming the reference anatomy applies to every patient. Shared shoulder/thorax placement does not create two distinct arteries.',
  },
};
