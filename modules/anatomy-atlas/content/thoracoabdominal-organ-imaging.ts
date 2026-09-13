// Original short teaching. References are reading links, not imported figures or datasets.
export const thoracoabdominalOrganImagingReferences={
  cardiacCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4299369/',
  cmr:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7038611/',
  echo:'https://www.asecho.org/wp-content/uploads/2019/01/2019_Comprehensive-TTE.pdf',
  airway:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5900079/',
  airwayUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11897443/',
  lungMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3481083/',
  lungUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10086956/',
  esophagus:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2713885/',
  thymus:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5296624/',
  thymusMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10742587/',
  stomachCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5605014/',
  stomachMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4000491/',
  enterographyCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3474054/',
  enterographyMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11592478/',
  bowelUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5658311/',
  bowelUSMeasurements:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12129437/',
  mrcp:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3292642/',
  bileUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11988351/',
  appendix:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4324638/',
} as const;
type Reference=keyof typeof thoracoabdominalOrganImagingReferences;
export type ThoracoabdominalOrganImagingModality='ct'|'mri'|'ultrasound';
type Fact={body:string;pitfall:string;references:readonly Reference[]};
type Group={fmaId:string;region:'thorax'|'abdomen';laterality:'left'|'right'|'unpaired';focus:Partial<Record<ThoracoabdominalOrganImagingModality,Fact>>};
const fact=(body:string,pitfall:string,...references:Reference[]):Fact=>({body,pitfall,references});
export const thoracoabdominalOrganImagingGroups:Record<string,Group>={
  heart:{fmaId:'FMA7088',region:'thorax',laterality:'unpaired',focus:{
    ct:fact('Orient the atria, ventricles and great-vessel connections before assessing a focal finding. ECG synchronisation reduces cardiac motion; contrast timing determines which chambers are opacified.','Routine chest CT is not equivalent to a dedicated cardiac acquisition. Mixing or motion artefact can resemble a filling defect.','cardiacCT'),
    mri:fact('Relate two-, three- and four-chamber views to the short-axis stack. Cine images assess motion; tissue-characterisation sequences, perfusion and late enhancement answer different questions.','A static 3D heart cannot supply ejection fraction, myocardial signal or scar extent.','cmr'),
    ultrasound:fact('Parasternal, apical and subcostal windows show different cuts through the same heart. Identify chambers and valve connections before interpreting two-dimensional, Doppler or M-mode information.','A rotated atlas camera is not a calibrated echo probe plane; the source aggregate does not validate every valve or chamber boundary.','echo'),
  }},
  'right-lung':{fmaId:'FMA7309',region:'thorax',laterality:'right',focus:{
    ct:fact('Use lung windows to follow the horizontal and oblique fissures, then confirm lobar location across planes. Review hilar soft tissues and vessels separately.','The many source pieces are not a bronchopulmonary-segment count; incomplete fissures must not be filled in from the model.'),
    mri:fact('Aerated lung has weak conventional proton signal, and breathing degrades detail. Dedicated lung sequences can improve visualisation; their availability and appearance differ from routine body MRI.','A dark region is not proof of absent lung tissue, and a coloured surface is not a ventilation map.','lungMRI'),
    ultrasound:fact('At accessible right chest windows, identify ribs, the pleural interface and its motion. Aerated lung is largely assessed through acoustic artefacts; consolidation and fluid may provide direct tissue views.','B-lines are not individual vessels or septa. The open 3D lung view does not imply sonographic visibility through air.','lungUS'),
  }},
  'left-lung':{fmaId:'FMA7310',region:'thorax',laterality:'left',focus:{
    ct:fact('Track the oblique fissure to distinguish upper from lower lobe. The lingula remains part of the upper lobe, including where it lies beside the heart.','Do not assign a left middle lobe or infer all segment boundaries from this aggregate.'),
    mri:fact('Correlate the left lung with diaphragm and heart across planes. Respiratory and cardiac motion combine with low lung signal to limit conventional MRI detail.','A poorly seen fissure is not evidence of fusion or missing anatomy.','lungMRI'),
    ultrasound:fact('Orient left basal views using the diaphragm and neighbouring abdominal organs. Interpret pleural motion, artefacts and any directly visible consolidation in their actual acoustic window.','Neither an artefact nor the static atlas surface is a complete left-lung image.','lungUS'),
  }},
  esophagus:{fmaId:'FMA7131',region:'thorax',laterality:'unpaired',focus:{
    ct:fact('Follow the oesophagus behind the trachea and through the hiatus to the stomach. Assess luminal distension alongside wall appearance and adjacent mediastinal tissues.','A collapsed lumen changes apparent wall thickness; this surface does not show mucosa, swallowing or a stricture.','esophagus'),
    mri:fact('Trace the oesophageal wall and surrounding mediastinal fat across anatomical planes. Fluid, wall signal and enhancement depend on the acquired sequence and luminal contents.','Cross-sectional imaging does not replace mucosal inspection or demonstrate motility from one still image.','esophagus'),
  }},
  trachea:{fmaId:'FMA7394',region:'thorax',laterality:'unpaired',focus:{
    ct:fact('Follow the air column from the cricoid region to the carina using axial and longitudinal reformats. Review lumen, wall and adjacent tissues.','One inspiratory image cannot establish dynamic expiratory collapse.','airway'),
    mri:fact('Correlate the central airway with surrounding soft tissues in more than one plane. MRI visibility depends on sequence and motion control.','An indistinct wall does not establish discontinuity; CT and MRI are not interchangeable airway measurements.','airway'),
    ultrasound:fact('In the accessible cervical trachea, recognise the anterior cartilage and bright tissue–air interface. Repeated deeper bright lines are reverberation artefacts.','Air blocks direct inspection of the posterior lumen and wall; this is not a complete intrathoracic tracheal examination or procedural guide.','airwayUS'),
  }},
  thymus:{fmaId:'FMA9607',region:'thorax',laterality:'unpaired',focus:{
    ct:fact('Identify the thymic region in the prevascular mediastinum. Age-related replacement by fat changes its contour and attenuation; compare morphology with the clinical setting.','This fixed donor outline is not a normal-size reference for every age.','thymus'),
    mri:fact('Paired in-phase and opposed-phase imaging can demonstrate microscopic fat. Normal younger thymus may lack appreciable signal loss, and diffusion restriction is not uniquely malignant.','Do not diagnose a tumour solely from absent opposed-phase suppression or diffusion signal.','thymusMRI'),
    ultrasound:fact('When an acoustic window exists, especially in children, thymic tissue may contain fine bright foci within a softer background. Visibility changes with age and surrounding structures.','Paediatric sonographic appearances cannot be assigned to this adult donor surface as validation.','thymus'),
  }},
  'right-main-bronchus':{fmaId:'FMA7395',region:'thorax',laterality:'right',focus:{
    ct:fact('Trace the right main bronchus from carina towards the early upper-lobe branch. Confirm each branch on consecutive images.','This proximal selection is not the entire right airway tree.','airway'),
    mri:fact('Identify the proximal right airway by its carinal connection and surrounding landmarks on the actual series.','MRI resolution and motion may limit small branches; never infer a patent distal tree from this surface.','airway'),
  }},
  'left-main-bronchus':{fmaId:'FMA7396',region:'thorax',laterality:'left',focus:{
    ct:fact('Follow the left main bronchus beneath the aortic arch towards the left hilum using reformats.','Its oblique course can be misjudged on a single axial section.','airway'),
    mri:fact('Use the carina and left hilar relationships to establish the airway course across planes.','A single dark structure is insufficient for identification or assessment of luminal continuity.','airway'),
  }},
  stomach:{fmaId:'FMA7148',region:'abdomen',laterality:'unpaired',focus:{
    ct:fact('Follow cardia, fundus, body and antrum to the pyloric outlet. Gastric distension and contrast phase influence the apparent wall and folds.','A routine underdistended stomach is not equivalent to a dedicated gastric examination; the fixed model cannot supply a wall-thickness threshold.','stomachCT'),
    mri:fact('Relate the gastric wall to luminal contents and adjacent organs on the actual sequences. Distension, enhancement and motion affect assessment.','MRI may assess mural and extramural disease, but this surface cannot stage a lesion or reproduce endoscopic mucosal detail.','stomachMRI'),
    ultrasound:fact('The antrum can be followed in the epigastrium relative to the liver and pancreas. Observe the layered wall, contents and movement where visible.','Gas can obscure other gastric regions. A visible antrum does not constitute a complete stomach examination.','bowelUS'),
  }},
  'small-intestine':{fmaId:'FMA7200',region:'abdomen',laterality:'unpaired',focus:{
    ct:fact('Follow bowel continuity rather than assigning jejunum or ileum from position alone. Enterography improves luminal distension and assessment of the enhancing wall.','Collapsed loops or transient spasm can resemble thickening or narrowing; inspect adjacent mesentery and other findings.','enterographyCT'),
    mri:fact('Combine distended bowel anatomy with fluid-sensitive, diffusion and enhancement information as acquired. Cine assessment can add movement information that a still frame lacks.','Signal or a short narrow segment alone does not establish active inflammation or a fixed stricture.','enterographyMRI'),
    ultrasound:fact('Follow accessible loops in longitudinal and transverse planes. Describe the wall layers, lumen and peristalsis, with Doppler information where appropriate.','Probe pressure and luminal contents alter appearances; grouped atlas loops are not validated individual sonographic segments.','bowelUS'),
  }},
  'large-intestine':{fmaId:'FMA7201',region:'abdomen',laterality:'unpaired',focus:{
    ct:fact('Trace the colon through its flexures rather than naming a gas-filled loop by location alone. Review the wall and surrounding fat alongside luminal contents.','Routine CT or enterography is not prepared CT colonography; stool and poor distension limit mucosal assessment.','enterographyCT'),
    mri:fact('Identify colonic segments in continuity and check which parts the examination covers. Relate wall signal to luminal distension and adjacent tissues.','Small-bowel MR enterography is not a complete colonic mucosal examination or a dedicated rectal staging study.','enterographyMRI'),
    ultrasound:fact('Follow the colon in accessible windows using its course, haustra and contents. Compare apparent wall layering and vascularity with the actual degree of distension.','Gas and depth limit coverage; a single measured segment cannot establish that the entire colon is normal.','bowelUS'),
  }},
  'cystic-duct':{fmaId:'FMA14539',region:'abdomen',laterality:'unpaired',focus:{
    ct:fact('Trace any visible duct from the gallbladder neck towards the extrahepatic ductal junction. Keep the neighbouring enhancing vessels separate.','The cystic duct may not be resolved on routine CT; absent visibility is not proof of absence or obstruction.'),
    mri:fact('On MRCP, follow the gallbladder neck into the cystic duct using thin source images as well as projections. Its insertion and course vary.','Overlapping bright fluid structures can create false connections on a projection; this donor surface is not an operative map.','mrcp'),
    ultrasound:fact('Look for continuity from the gallbladder neck when the window permits. Cystic-duct visibility varies with depth, gas and duct calibre.','A confidently seen gallbladder does not establish that its duct and junction have been completely examined.','bileUS'),
  }},
  'common-hepatic-duct':{fmaId:'FMA14668',region:'abdomen',laterality:'unpaired',focus:{
    ct:fact('Locate the hepatic ductal confluence and follow the extrahepatic channel towards the cystic-duct junction. Correlate with adjacent portal and arterial structures.','If the junction is not resolved, do not claim a precise common-hepatic/common-bile-duct boundary from one image.'),
    mri:fact('Use heavily T2-weighted MRCP to trace bile above the cystic-duct junction. Review the original sections to distinguish true narrowing from overlap or vascular impression.','MRCP signal is not a cast proving every duct is patent; small branches and junction variants may remain unresolved.','mrcp'),
    ultrasound:fact('Follow the proximal extrahepatic duct at the porta hepatis and distinguish it from vessels using anatomy and Doppler. State where a calibre measurement was taken.','Visibility of the cystic insertion varies; a duct diameter must be interpreted with measurement technique and patient context.','bileUS'),
  }},
  appendix:{fmaId:'FMA14542',region:'abdomen',laterality:'unpaired',focus:{
    ct:fact('Find the appendiceal base at the caecum and follow the blind-ending tube to its tip in multiple planes. Position varies between patients.','Calibre alone is insufficient for appendicitis; assess wall, contents and periappendiceal tissues.','appendix'),
    mri:fact('Trace the appendix from caecum to tip on the available T2-weighted and other acquired sequences. Compare wall appearance and surrounding inflammatory changes.','Visibility varies. Do not label an untraced small-bowel loop as appendix or infer normality from this intact atlas surface.','appendix'),
    ultrasound:fact('Locate the caecum and seek a blind-ending appendix, following its full visible length with graded compression as tolerated. Assess wall and surrounding tissues.','Nonvisualisation is not the same as seeing a normal appendix; document the limits of the window.','bowelUSMeasurements'),
  }},
  'ileocecal-junction':{fmaId:'FMA11338',region:'abdomen',laterality:'unpaired',focus:{
    ct:fact('Follow the terminal ileum into the caecum across reformats, separating the junction from the nearby appendiceal origin. Assess distension and adjacent tissues.','The source aliases this small surface to several ileal/caecal definitions; it is not a validated valve contour.','enterographyCT'),
    mri:fact('Correlate the terminal ileum and caecal entry on distended anatomical images and the available functional sequences. Confirm continuity rather than relying on one slice.','A static donor junction cannot demonstrate valve competence, transit or the extent of bowel disease.','enterographyMRI'),
    ultrasound:fact('Find the terminal ileum as it enters the caecum, then follow it proximally. Keep the junction distinct from the blind-ending appendix.','The selected mesh does not separately identify valve leaflets or reproduce bowel-wall layers.','bowelUSMeasurements'),
  }},
};
