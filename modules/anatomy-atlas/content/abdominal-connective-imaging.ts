export type AbdominalConnectiveModality = 'ct' | 'ultrasound';
export type AbdominalConnectiveGroup = 'linea-alba' | 'small-bowel-mesentery' | 'transverse-mesocolon';
export const abdominalConnectiveReferences = {
  lineaCt:'https://pubmed.ncbi.nlm.nih.gov/38177404/',
  lineaUs:'https://pubmed.ncbi.nlm.nih.gov/19637295/',
  mesentericRoot:'https://pubmed.ncbi.nlm.nih.gov/11706218/',
  mesocolonCt:'https://pubmed.ncbi.nlm.nih.gov/8210588/',
};
type Ref=keyof typeof abdominalConnectiveReferences;
type Topic={body:string;bullets:string[];references:Ref[]};
export const abdominalConnectiveSelections:{fmas:string[];group:AbdominalConnectiveGroup;topics:AbdominalConnectiveModality[];landmark:string;limit:string;references:Ref[]}[]=[
  {fmas:['FMA11336'],group:'linea-alba',topics:['ct','ultrasound'],landmark:'Keep the midline linea alba separate from the paired rectus muscles and their surrounding sheaths.',limit:'One supplied fascial surface does not resolve individual aponeurotic layers or establish a normal inter-rectus distance, tissue strength, diastasis or hernia.',references:[]},
  {fmas:['FMA14643'],group:'small-bowel-mesentery',topics:['ct'],landmark:'The selected small-intestinal mesentery is not a separately segmented root, vascular tree or complete set of peritoneal leaves.',limit:'Its source folds and attachments remain unvalidated. A coloured surface or separation gap is not a CT tissue boundary, avascular plane or patient registration.',references:[]},
  {fmas:['FMA14647'],group:'transverse-mesocolon',topics:['ct'],landmark:'Use the transverse-colon mesentery as a distinct selection from the small-intestinal mesentery and the mesoappendix.',limit:'One supplied mesocolic surface does not certify its full attachment, thickness, embedded vessels or boundaries on a patient examination.',references:[]},
];
// Original short teaching from cited factual references; no publisher images or scans.
export const abdominalConnectiveTopics:Record<AbdominalConnectiveGroup,Partial<Record<AbdominalConnectiveModality,Topic>>>= {
  'linea-alba':{
    ct:{body:'CT-based reconstruction can describe the linea alba along its length, including its width and curvature. A study of 117 patient scans found substantial variation rather than a uniform straight strip.',bullets:['Width varied with measurement level, age and body mass index. The study also identified sex-related differences; its measurements are not universal diagnostic cut-offs.','The authors distinguished anatomical description from evidence linking reconstructed shape to hernia or diastasis. Do not diagnose either condition from this source mesh or transfer its dimensions to a patient.'],references:['lineaCt']},
    ultrasound:{body:'Ultrasound can assess the interval between the paired rectus muscles at a specified level. A reference study examined 150 nulliparous women aged 20–45 years, with body mass index below 30, at the xiphoid and at levels above and below the umbilicus.',bullets:['Measurements from different levels or populations are not interchangeable. The study population does not define normal values for all sexes, ages, body sizes or postpartum states.','This static fascial mesh has no sonographic texture or dynamic measurement. Its thickness and width do not reproduce the acquired ultrasound appearance.'],references:['lineaUs']},
  },
  'small-bowel-mesentery':{
    ct:{body:'On CT, vascular relationships help orient the root of the small-bowel mesentery. The correlative anatomy reference describes continuity toward the hepatoduodenal ligament around the superior mesenteric vein and toward the right transverse mesocolon around the gastrocolic trunk.',bullets:['The inferior mesenteric vein runs along the left side of the mesenteric root in the cited description. These vessels are landmarks, not interchangeable labels for the entire mesentery.','A root-focused reference does not validate every fold in this whole-mesentery surface. Embedded vessels, fat and connecting tissues should not be mistaken for separately resolved peritoneal leaves.'],references:['mesentericRoot']},
  },
  'transverse-mesocolon':{
    ct:{body:'The middle colic vessels are CT landmarks for the transverse mesocolon. The cited anatomy reference uses mesocolic vessels to distinguish mesocolic planes from the small-bowel mesentery.',bullets:['A vessel within the fold is a landmark, not the mesocolon itself. Do not assign the entire mesocolic surface the attenuation or enhancement of a vascular branch.','This relationship-based orientation does not establish a complete visible sheet, an individual patient boundary or a surgical dissection plane.'],references:['mesocolonCt']},
  },
};
