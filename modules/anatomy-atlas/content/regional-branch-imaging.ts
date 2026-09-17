export type RegionalBranchImagingModality = 'ct' | 'mri' | 'ultrasound';
export type RegionalBranchImagingGroup = 'descending-circumflex' | 'subscapular';
export const regionalBranchImagingReferences = {
  descendingCt:'https://pubmed.ncbi.nlm.nih.gov/40611726/',
  descendingMri:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9340230/',
  descendingUs:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8337604/',
  subscapularCt:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8926423/',
};
type Ref=keyof typeof regionalBranchImagingReferences;
type Topic={body:string;bullets:string[];references:Ref[]};
export const regionalBranchImagingSelections:{fmas:string[];group:RegionalBranchImagingGroup;topics:RegionalBranchImagingModality[];landmark:string;limit:string;references:Ref[]}[]=[
  {fmas:['FMA21422','FMA21423'],group:'descending-circumflex',topics:['ct','mri','ultrasound'],landmark:'The selected descending branch is distinct from its lateral circumflex femoral parent and from the individual perforators used in flap studies.',limit:'This source is not a complete perforator map or a registered patient vessel. It supplies no skin territory, measured perfusion, verified surgical corridor or proof of a continuous parent junction.',references:[]},
  {fmas:['FMA22678','FMA22679'],group:'subscapular',topics:['ct'],landmark:'Compare the subscapular trunk with the same-side thoracodorsal and circumflex scapular selections through Arterial connections.',limit:'Separate selectable names and graph links do not prove this donor has a particular origin variant or a continuous perfused pedicle. They cannot establish a patient-specific flap plan.',references:[]},
];
// Original concise factual teaching. No publisher text, illustrations or scans imported.
export const regionalBranchImagingTopics:Record<RegionalBranchImagingGroup,Partial<Record<RegionalBranchImagingModality,Topic>>>= {
  'descending-circumflex':{
    ct:{body:'CT angiography can assess the lateral circumflex femoral artery and its descending branch as distinct vascular segments. A study analysed 136 arteries from abdominal and pelvic CTA in 75 consecutive patients, examining vessel origins, dimensions and relationships to landmarks.',bullets:['The study found variability in both the parent artery and descending branch. Its measurements of the parent origin must not be relabelled as measurements of this descending branch.','CTA-derived dimensions belong to the acquired examinations, not to this reference surface. The study does not establish routine non-contrast CT visibility or validate every distal perforator in the atlas.'],references:['descendingCt']},
    mri:{body:'A prospective study used time-resolved contrast-enhanced MR angiography (CE-DISCO) to examine lateral circumflex femoral branching and descending-branch perforators in 30 reconstruction candidates, covering both thighs.',bullets:['Readers used arterial-phase projections and volume reconstructions, selecting images with limited venous overlap. In 26 transplanted flaps, operative findings agreed with the descending-branch origin and whether the perforator followed an intermuscular septum.','This is a specialised contrast-enhanced MRA method in a selected cohort, not proof that routine thigh MRI resolves the full branch or all skin perforators. Neither skin viability nor a transplantable pedicle can be inferred from this mesh.'],references:['descendingMri']},
    ultrasound:{body:'In a 28-patient anterolateral thigh flap series, high-frequency colour Doppler combined with panoramic imaging mapped selected perforators and their source-vessel relationships. The examination followed the descending arterial route rather than treating every superficial Doppler signal as the same branch.',bullets:['The selected dominant perforator was identified at surgery, with its location and course matching the reported imaging. That finding concerns the selected perforator, not validation of every part of the descending trunk.','The small selected cohort does not establish universal visibility or show that every anterolateral thigh perforator arises from this branch. Panoramic imaging, acquired flow and operator assessment are not reproduced by a static 3D surface.'],references:['descendingUs']},
  },
  subscapular:{
    ct:{body:'Chest CT angiography can show whether the thoracodorsal and circumflex scapular arteries share a subscapular trunk. A study of 100 adults examined 200 arterial systems and found examples without that common trunk.',bullets:['Absence of a shared trunk did not mean absence of both named branches: alternative origins were present. Review each side independently instead of assuming the opposite side has the same arrangement.','Contrast in nearby veins prevented confident assignment of one circumflex scapular origin. Non-visualisation and proven absence are different findings; an atlas connection line cannot resolve that uncertainty.'],references:['subscapularCt']},
  },
};
