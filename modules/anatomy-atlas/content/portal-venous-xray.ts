// Original factual orientation. References are reading sources, not imported media.
const anatomy='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-abdomen/';
const catheter='https://www.radiologyinfo.org/en/info/angiocath';
const portography='https://doi.org/10.1371/journal.pone.0261499';
const mesentericAccess='https://pubmed.ncbi.nlm.nih.gov/33230650/';

export const portalVenousXrayTopics={
  'hepatic-portal-vein':{
    title:'Portal venographic orientation',
    body:'On an acquired contrast portogram, identify the demonstrated main portal vein and follow its actual continuity with the splenic and superior mesenteric veins. Their usual confluence is an orientation reference, not a patient-specific branching map. Keep portal inflow distinct from hepatic veins draining toward the inferior vena cava.',
    bullets:[
      'A retrospective study of 49 patients with non-malignant acute splanchnic vein thrombosis used direct portography to assess the main portal vein, intrahepatic portal branches, splenic vein and superior mesenteric vein. This disease cohort does not establish routine visibility in healthy people.',
      'The retained FMA50735 source is one hepatic portal vein selection. Its surface cannot establish complete intrahepatic branches, a patent lumen, pressure, thrombus grade or collateral channels on an examination.',
    ],citations:[anatomy,catheter,portography],
  },
  'splenic-vein':{
    title:'Splenic venographic orientation',
    body:'On acquired contrast venography, follow the demonstrated splenic venous course from the splenic side toward the portal confluence. Usual hilar tributaries join the splenic vein, but this retained surface is not a complete map of every tributary or a splenorenal shunt.',
    bullets:[
      'The 49-patient thrombosis study assessed the splenic vein with direct portography. Reported collateral diversion affected contrast opacification; an unopacified segment in a projection must not be interpreted from this model as an automatically occluded vessel.',
      'FMA14331 remains one source-labelled splenic vein. Reassemble adjacent structures before comparing their gross relationships; projected overlap or a nearby renal vein does not prove a venous junction or a collateral connection.',
    ],citations:[anatomy,catheter,portography],
  },
  'superior-mesenteric-vein':{
    title:'Superior mesenteric venographic orientation',
    body:'On acquired contrast portomesenteric venography, distinguish the demonstrated superior mesenteric vein from the superior mesenteric artery. Follow the vein toward its actual portal confluence; the usual union with the splenic vein is a reference relationship, not proof that all bowel tributaries have opacified.',
    bullets:[
      'The retrospective 49-patient non-malignant acute splanchnic vein thrombosis study assessed the superior mesenteric vein by direct portography. Its Doppler comparison included this vein in only nine patients; that limited subgroup cannot establish universal ultrasound visibility or interchangeable examinations.',
      'The retained FMA14332 segment is not a complete mesenteric drainage tree. Surface colour, calibre and separation cannot determine bowel viability, thrombus extent or an endovascular access route.',
    ],citations:[anatomy,catheter,portography],
  },
  'inferior-mesenteric-vein':{
    title:'Inferior mesenteric venographic orientation',
    body:'If an acquired contrast portomesenteric examination demonstrates the inferior mesenteric vein, follow its observed junction rather than assigning it from the model. Drainage into the splenic vein or the splenic–superior mesenteric confluence is a usual reference description, not an exhaustive catalogue of variants.',
    bullets:[
      'A four-patient series with portal vein thrombosis and cavernous transformation reported fluoroscopic confirmation of inferior mesenteric venous access in one patient; the other three used superior mesenteric access. This selected interventional series is not routine normal-anatomy visibility evidence or a recommended access route.',
      'FMA15391 remains the retained inferior mesenteric vein selection. Do not infer complete colic tributaries, a patent junction, collateral drainage or measured flow from its surface. Its source unspecified laterality is not a patient-side marker.',
    ],citations:[anatomy,catheter,mesentericAccess],
  },
} as const;
