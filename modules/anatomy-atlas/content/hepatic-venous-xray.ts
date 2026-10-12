// Original factual teaching; references are reading links, never imported media.
const venography='https://www.radiologyinfo.org/en/info/venography';
const junctions='https://pubmed.ncbi.nlm.nih.gov/20177869/';
const hepaticStudy='https://www.wjgnet.com/2307-8960/full/v10/i14/4460.htm';
const cavalStudy='https://pubmed.ncbi.nlm.nih.gov/8541675/';
const selectedHepaticStudy='A study of 102 selected patients with portal hypertension undergoing TIPS assessed all three hepatic veins during balloon-occlusion angiography. This interventional disease cohort is not routine normal-anatomy visibility evidence; occlusion and collateral filling must not be mistaken for unaltered physiological drainage.';

export const hepaticVenousXrayTopics={
  'inferior-vena-cava':{
    title:'Cavographic orientation',
    body:'On an acquired contrast cavogram, identify the demonstrated inferior vena cava and follow the actual opacified course. Keep renal venous entry and hepatic venous outflow distinct; the examined field and injection determine which tributaries are shown. An abdominal reference surface does not establish that either junction is completely demonstrated.',
    bullets:[
      'A prospective study of 108 referrals for filter placement or cavography compared flush cavography with selective renal venography. Selective injections revealed renal venous variants missed on standard cavography. This selected cohort does not establish that a single projection excludes variants or defines all tributaries.',
      'The FMA10951 source retains two original files as one selection. It is not a single-file vessel or a complete caval drainage tree. Neither surface diameter nor a published cohort average is a calibrated patient measurement, filter-sizing guide or pressure estimate.',
    ],citations:[venography,junctions,cavalStudy],
  },
  'right-hepatic-vein':{
    title:'Hepatic venographic orientation',
    body:'If a selective hepatic venogram demonstrates the right hepatic vein, follow its observed outflow towards the inferior vena cava. Distinguish hepatic venous drainage from portal inflow. An accessory right hepatic vein or projected overlap is not automatically part of this selected main vein.',
    bullets:[
      selectedHepaticStudy,
      'The retained FMA14338 segment does not map every right-liver tributary, a Couinaud territory or collateral channels. A 69-liver cadaver study documented variable hepatic venous openings; its anatomical observations do not establish the branching or venographic visibility of this patient.',
    ],citations:[venography,junctions,hepaticStudy],
  },
  'left-hepatic-vein':{
    title:'Hepatic venographic orientation',
    body:'If a selective hepatic venogram demonstrates the left hepatic vein, follow its actual relationship to the middle hepatic vein and inferior vena cava. A left-middle common trunk is a reference possibility, not an invariant junction. Keep hepatic outflow distinct from the left portal branch.',
    bullets:[
      selectedHepaticStudy,
      'FMA14339 remains the retained left hepatic vein selection. The 69-liver cadaver study included both left-middle and separate major openings. Do not infer the patient\'s confluence, accessory veins or complete left-liver drainage from this source surface.',
    ],citations:[venography,junctions,hepaticStudy],
  },
  'middle-hepatic-vein':{
    title:'Hepatic venographic orientation',
    body:'If a selective hepatic venogram demonstrates the middle hepatic vein, trace its observed drainage rather than assigning a junction from screen position. A common trunk with the left hepatic vein and a separate caval opening are anatomical possibilities. Neither this surface nor projected filling outlines a validated hepatic segment boundary.',
    bullets:[
      selectedHepaticStudy,
      'The 69-liver cadaver study documented variation in the major openings. FMA14340 retains the whole source-labelled selection, including its disconnected components; these are not newly named tributaries. Source unspecified laterality is preserved, not converted to a patient-side marker.',
    ],citations:[venography,junctions,hepaticStudy],
  },
} as const;
