export type GenicularImagingModality = 'ct' | 'mri' | 'ultrasound';
export type GenicularImagingGroup = 'middle' | 'superior-medial' | 'superior-lateral' | 'inferior-medial' | 'inferior-lateral';
export const genicularImagingReferences = {
  cbct:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10156764/',
  imgaMri:'https://doi.org/10.1186/s40634-020-00288-w',
  doppler:'https://doi.org/10.17085/apm.2019.14.1.67',
};
type Ref=keyof typeof genicularImagingReferences;
type Topic={body:string;bullets:string[];references:Ref[]};
export const genicularImagingSelections:{fmas:string[];group:GenicularImagingGroup;topics:GenicularImagingModality[];landmark:string;limit:string;references:Ref[]}[]=[
  {fmas:['FMA22562','FMA22563'],group:'middle',topics:['ct'],landmark:'Keep the middle genicular selection distinct from the four peripheral genicular groups.',limit:'Each supplied middle-genicular group contains two disconnected pieces. Neither their gap nor their shared label demonstrates a continuous lumen or an occlusion.',references:[]},
  {fmas:['FMA22586','FMA22587'],group:'superior-medial',topics:['ct','ultrasound'],landmark:'This selection is the superior medial branch, not the inferior medial or descending genicular artery.',limit:'An atlas label does not establish which nearby small vessel produces a Doppler signal. Follow acquired anatomy rather than transferring this mesh identity to a scan.',references:[]},
  {fmas:['FMA22588','FMA22589'],group:'superior-lateral',topics:['ct','ultrasound'],landmark:'Distinguish the superior lateral selection from the inferior lateral branch on the same side.',limit:'A coloured mesh does not measure lumen calibre, contrast filling, flow or a shared arterial origin.',references:[]},
  {fmas:['FMA43890','FMA43891'],group:'inferior-medial',topics:['ct','mri','ultrasound'],landmark:'Use the inferior medial selection without substituting the superior medial vessel or its landmarks.',limit:'The source surface contains no measured MRI landmark correspondence, patient-specific clearance or registered ultrasound window.',references:[]},
  {fmas:['FMA43892','FMA43893'],group:'inferior-lateral',topics:['ct'],landmark:'Keep the inferior lateral selection separate from the superior lateral branch and anterior tibial recurrent artery.',limit:'This individual source does not reconstruct the complete collateral network, validate a junction or establish an intervention target.',references:[]},
];
// Original short factual notes, not copied article prose or publisher media.
const cbct=(orientation:string):Topic=>({
  body:'Contrast-enhanced cone-beam CT depicted genicular branching in a retrospective study of 205 technically adequate examinations from patients undergoing embolization for symptomatic knee osteoarthritis.',
  bullets:[orientation,'This was intraprocedural cone-beam CT, not routine intravenous CT angiography or non-contrast knee CT. Non-visualisation is not proof of absence. The selected treatment cohort does not establish population prevalence.'],references:['cbct'],
});
const doppler=(orientation:string):Topic=>({
  body:'A prospective ultrasound study examined 24 knees in 14 patients with advanced osteoarthritis. Colour Doppler supported local vessel recognition near bony landmarks.',
  bullets:[orientation,'Vessel identities were assigned from expected course and appearance, without independent angiographic or dissection confirmation. This is localisation feasibility, not a validated artery-to-nerve map or needle-placement guide.'],references:['doppler'],
});
export const genicularImagingTopics:Record<GenicularImagingGroup,Partial<Record<GenicularImagingModality,Topic>>>= {
  middle:{ct:cbct('The small middle branch supplies cruciate and synovial regions. Conventional CT may not resolve it; a superior branch may share its origin.')},
  'superior-medial':{
    ct:cbct('The superior medial branch may arise independently or share a trunk with the middle branch, sometimes also the superior lateral branch.'),
    ultrasound:doppler('The study labelled a vessel near the upper adductor tubercle as superior medial genicular; that name remains an assumption of its method.'),
  },
  'superior-lateral':{
    ct:cbct('The superior lateral branch commonly shared a trunk with the middle branch in this cohort. Separate names do not require separate ostia.'),
    ultrasound:doppler('The reported superior lateral window was near the distal part of the lateral femoral epicondyle-to-shaft transition.'),
  },
  'inferior-medial':{
    ct:cbct('The inferior medial and inferior lateral branches usually had independent origins in this cohort; a shared trunk was also observed.'),
    mri:{body:'A retrospective proof-of-concept study assessed the inferior medial genicular artery on 80 non-contrast 1.5-T knee MRI examinations. Fat-suppressed T2-weighted sagittal and coronal images were used for landmark measurements.',bullets:['The joint line, medial tibial plateau and semimembranosus tendon provided reference relationships. This is evidence for this branch, not a complete MR angiographic map of all genicular arteries.','The selected cohort excluded important vascular and postoperative conditions. Reported landmark distances are not universal safe zones; the study does not validate the geometry or boundaries of this atlas mesh.'],references:['imgaMri']},
    ultrasound:doppler('The reported inferior medial window was near the proximal part of the medial tibial epicondyle-to-shaft transition.'),
  },
  'inferior-lateral':{ct:cbct('Identify the inferior lateral branch separately from the inferior medial branch, even when a common origin is present.')},
};
