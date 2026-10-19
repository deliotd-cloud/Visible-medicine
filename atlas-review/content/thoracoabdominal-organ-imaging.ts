// Original short teaching. References are reading links, not imported figures or datasets.
export const thoracoabdominalOrganImagingReferences={
  cardiacCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4299369/',
  cmr:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7038611/',
  echo:'https://www.asecho.org/wp-content/uploads/2019/01/2019_Comprehensive-TTE.pdf',
  airway:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5900079/',
  airwayUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11897443/',
  lungMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3481083/',
  lungUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10086956/',
  externalLungUS:'https://onlinelibrary.wiley.com/doi/10.1002/ajum.12163',
  esophagus:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2713885/',
  cervicalEsophagusUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8163523/',
  cervicalEsophagusStudy:'https://pubmed.ncbi.nlm.nih.gov/30402811/',
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
  chestXray:'https://www.radiologyinfo.org/en/info/chestrad',
  projectionOverlap:'https://www.radiologyinfo.org/en/info/safety-hiw_04',
  chestProjection:'https://cs.acr.org/-/media/ACR/Files/Member-Resources/Med-Students/MESO_High-Yield-Guides_Design_v3.pdf',
  upperGI:'https://www.radiologyinfo.org/en/info/uppergi',
  abdominalXray:'https://www.radiologyinfo.org/en/info/abdominrad',
  smallBowelFollowThrough:'https://www.radiologyinfo.org/en/info/small-bowel-follow-thru',
  lowerGI:'https://www.radiologyinfo.org/en/info/lowergi',
  rightLowerQuadrant:'https://acsearch.acr.org/docs/69357/narrative/',
  thymusXray:'https://pubs.rsna.org/doi/10.1148/81.5.834',
} as const;
type Reference=keyof typeof thoracoabdominalOrganImagingReferences;
export type ThoracoabdominalOrganImagingModality='ct'|'mri'|'xray'|'ultrasound';
type Fact={body:string;pitfall:string;references:readonly Reference[]};
type Group={fmaId:string;region:'thorax'|'abdomen';laterality:'left'|'right'|'unpaired';focus:Partial<Record<ThoracoabdominalOrganImagingModality,Fact>>};
const fact=(body:string,pitfall:string,...references:Reference[]):Fact=>({body,pitfall,references});
export const thoracoabdominalOrganImagingGroups:Record<string,Group>={
  heart:{fmaId:'FMA7088',region:'thorax',laterality:'unpaired',focus:{
    xray:fact('On a chest radiograph, orient the cardiomediastinal silhouette against the lungs, diaphragms and midline. Check whether the view is PA or AP before comparing apparent heart size.','A projection superimposes chambers and vessels; AP magnification and positioning can alter the outline. The silhouette does not show individual chamber walls or diagnose their disease.','chestXray','chestProjection'),
    ct:fact('Orient the atria, ventricles and great-vessel connections before assessing a focal finding. ECG synchronisation reduces cardiac motion; contrast timing determines which chambers are opacified.','Routine chest CT is not equivalent to a dedicated cardiac acquisition. Mixing or motion artefact can resemble a filling defect.','cardiacCT'),
    mri:fact('Relate two-, three- and four-chamber views to the short-axis stack. Cine images assess motion; tissue-characterisation sequences, perfusion and late enhancement answer different questions.','A static 3D heart cannot supply ejection fraction, myocardial signal or scar extent.','cmr'),
    ultrasound:fact('Parasternal, apical and subcostal windows show different cuts through the same heart. Identify chambers and valve connections before interpreting two-dimensional, Doppler or M-mode information.','A rotated atlas camera is not a calibrated echo probe plane; the source aggregate does not validate every valve or chamber boundary.','echo'),
  }},
  'right-lung':{fmaId:'FMA7309',region:'thorax',laterality:'right',focus:{
    xray:fact('Trace the right lung field from apex to costophrenic angle, comparing the hilar, retrocardiac and basal regions with the left. Use a lateral view, when available, to help localise an opacity.','Ribs, vessels, diaphragm and mediastinum overlap aerated lung on projection images. A clear-looking field does not expose every fissure or segment.','chestXray','projectionOverlap'),
    ct:fact('Use lung windows to follow the horizontal and oblique fissures, then confirm lobar location across planes. Review hilar soft tissues and vessels separately.','The many source pieces are not a bronchopulmonary-segment count; incomplete fissures must not be filled in from the model.'),
    mri:fact('Aerated lung has weak conventional proton signal, and breathing degrades detail. Dedicated lung sequences can improve visualisation; their availability and appearance differ from routine body MRI.','A dark region is not proof of absent lung tissue, and a coloured surface is not a ventilation map.','lungMRI'),
    ultrasound:fact('At accessible right chest windows, identify ribs, the pleural interface and its motion. Aerated lung is largely assessed through acoustic artefacts; consolidation and fluid may provide direct tissue views.','B-lines are not individual vessels or septa. The open 3D lung view does not imply sonographic visibility through air.','lungUS'),
  }},
  'left-lung':{fmaId:'FMA7310',region:'thorax',laterality:'left',focus:{
    xray:fact('Survey the left lung from apex to costophrenic angle and inspect the region behind the cardiac silhouette. Relate any visible fissure or lingular region to both projections when available.','The heart obscures part of the left lower lung; a frontal silhouette cannot map lobes or exclude an obscured finding.','chestXray','projectionOverlap'),
    ct:fact('Track the oblique fissure to distinguish upper from lower lobe. The lingula remains part of the upper lobe, including where it lies beside the heart.','Do not assign a left middle lobe or infer all segment boundaries from this aggregate.'),
    mri:fact('Correlate the left lung with diaphragm and heart across planes. Respiratory and cardiac motion combine with low lung signal to limit conventional MRI detail.','A poorly seen fissure is not evidence of fusion or missing anatomy.','lungMRI'),
    ultrasound:fact('Orient left basal views using the diaphragm and neighbouring abdominal organs. Interpret pleural motion, artefacts and any directly visible consolidation in their actual acoustic window.','Neither an artefact nor the static atlas surface is a complete left-lung image.','lungUS'),
  }},
  esophagus:{fmaId:'FMA7131',region:'thorax',laterality:'unpaired',focus:{
    ultrasound:fact('External neck ultrasound can show the cervical oesophagus as a layered tube left of the trachea near the lower left thyroid pole. This regional acoustic window does not show the entire intrathoracic organ. Grebe and colleagues examined 81 adults without swallowing disorder, with a pilot of three symptomatic participants; this supports cervical visibility, not complete-organ validation.','External transcutaneous ultrasound differs from endoscopic ultrasound and transoesophageal echocardiography. This static atlas surface supplies no sonographic layers, motility, measurements, patency, normality or registered probe plane.','cervicalEsophagusUS','cervicalEsophagusStudy'),
    xray:fact('On a plain chest film, use the posterior mediastinum and expected course toward the hiatus as orientation only. An esophagram uses swallowed contrast and fluoroscopy to show the lumen in motion.','The normal oesophagus is usually not separately outlined on a plain film; a mediastinal contour or air column does not establish mucosal or swallowing findings.','upperGI'),
    ct:fact('Follow the oesophagus behind the trachea and through the hiatus to the stomach. Assess luminal distension alongside wall appearance and adjacent mediastinal tissues.','A collapsed lumen changes apparent wall thickness; this surface does not show mucosa, swallowing or a stricture.','esophagus'),
    mri:fact('Trace the oesophageal wall and surrounding mediastinal fat across anatomical planes. Fluid, wall signal and enhancement depend on the acquired sequence and luminal contents.','Cross-sectional imaging does not replace mucosal inspection or demonstrate motility from one still image.','esophagus'),
  }},
  trachea:{fmaId:'FMA7394',region:'thorax',laterality:'unpaired',focus:{
    xray:fact('Identify the central tracheal air column above the carina on a frontal chest view; a lateral view can help separate it from overlapping structures.','Projection and rotation alter its apparent position. A visible air column does not assess the full wall, calibre or dynamic collapse.','chestXray','projectionOverlap'),
    ct:fact('Follow the air column from the cricoid region to the carina using axial and longitudinal reformats. Review lumen, wall and adjacent tissues.','One inspiratory image cannot establish dynamic expiratory collapse.','airway'),
    mri:fact('Correlate the central airway with surrounding soft tissues in more than one plane. MRI visibility depends on sequence and motion control.','An indistinct wall does not establish discontinuity; CT and MRI are not interchangeable airway measurements.','airway'),
    ultrasound:fact('In the accessible cervical trachea, recognise the anterior cartilage and bright tissue–air interface. Repeated deeper bright lines are reverberation artefacts.','Air blocks direct inspection of the posterior lumen and wall; this is not a complete intrathoracic tracheal examination or procedural guide.','airwayUS'),
  }},
  thymus:{fmaId:'FMA9607',region:'thorax',laterality:'unpaired',focus:{
    xray:fact('Locate the prevascular mediastinal region within the chest silhouette. In younger patients thymic tissue may contribute to its contour; compare the actual age and projection.','A plain radiograph does not isolate thymic tissue from adjacent mediastinal structures. This fixed donor surface is no age-specific contour standard.','thymusXray'),
    ct:fact('Identify the thymic region in the prevascular mediastinum. Age-related replacement by fat changes its contour and attenuation; compare morphology with the clinical setting.','This fixed donor outline is not a normal-size reference for every age.','thymus'),
    mri:fact('Paired in-phase and opposed-phase imaging can demonstrate microscopic fat. Normal younger thymus may lack appreciable signal loss, and diffusion restriction is not uniquely malignant.','Do not diagnose a tumour solely from absent opposed-phase suppression or diffusion signal.','thymusMRI'),
    ultrasound:fact('When an acoustic window exists, especially in children, thymic tissue may contain fine bright foci within a softer background. Visibility changes with age and surrounding structures.','Paediatric sonographic appearances cannot be assigned to this adult donor surface as validation.','thymus'),
  }},
  'right-main-bronchus':{fmaId:'FMA7395',region:'thorax',laterality:'right',focus:{
    ct:fact('Trace the right main bronchus from carina towards the early upper-lobe branch. Confirm each branch on consecutive images.','This proximal selection is not the entire right airway tree.','airway'),
    mri:fact('Identify the proximal right airway by its carinal connection and surrounding landmarks on the actual series.','MRI resolution and motion may limit small branches; never infer a patent distal tree from this surface.','airway'),
    ultrasound:fact('For external transthoracic ultrasound, orient to the right pleural interface and the available intercostal window. Aerated lung and rib shadows restrict the view of the deeper main bronchus.','Pleural artefacts are not direct views of the bronchial lumen. This atlas surface cannot establish right bronchial patency or distal branches; this lesson does not cover endobronchial or endoscopic ultrasound.','externalLungUS'),
  }},
  'left-main-bronchus':{fmaId:'FMA7396',region:'thorax',laterality:'left',focus:{
    ct:fact('Follow the left main bronchus beneath the aortic arch towards the left hilum using reformats.','Its oblique course can be misjudged on a single axial section.','airway'),
    mri:fact('Use the carina and left hilar relationships to establish the airway course across planes.','A single dark structure is insufficient for identification or assessment of luminal continuity.','airway'),
    ultrasound:fact('For external transthoracic ultrasound, use the left pleural interface and accessible intercostal window as orientation. Air in the lung and rib shadows restrict the view of the deeper main bronchus.','Pleural artefacts do not directly image the bronchial lumen. This atlas surface cannot establish left bronchial patency or distal branches; endobronchial and endoscopic ultrasound are outside this lesson.','externalLungUS'),
  }},
  stomach:{fmaId:'FMA7148',region:'abdomen',laterality:'unpaired',focus:{
    xray:fact('On a plain abdominal film, orient the gastric air bubble beneath the left hemidiaphragm when present. Contrast fluoroscopy can outline the stomach lumen and its passage to the duodenum.','Gas and contents vary; a bubble is not a complete gastric outline. Plain films do not resolve the wall or mucosa.','abdominalXray','upperGI'),
    ct:fact('Follow cardia, fundus, body and antrum to the pyloric outlet. Gastric distension and contrast phase influence the apparent wall and folds.','A routine underdistended stomach is not equivalent to a dedicated gastric examination; the fixed model cannot supply a wall-thickness threshold.','stomachCT'),
    mri:fact('Relate the gastric wall to luminal contents and adjacent organs on the actual sequences. Distension, enhancement and motion affect assessment.','MRI may assess mural and extramural disease, but this surface cannot stage a lesion or reproduce endoscopic mucosal detail.','stomachMRI'),
    ultrasound:fact('The antrum can be followed in the epigastrium relative to the liver and pancreas. Observe the layered wall, contents and movement where visible.','Gas can obscure other gastric regions. A visible antrum does not constitute a complete stomach examination.','bowelUS'),
  }},
  'small-intestine':{fmaId:'FMA7200',region:'abdomen',laterality:'unpaired',focus:{
    xray:fact('Survey central abdominal gas-filled loops and their fold pattern while checking the full film and projection. A contrast small-bowel follow-through can show the course of the lumen over time.','Gas-filled loops overlap and can shift; a plain film cannot reliably label every loop jejunum or ileum or assess its wall.','abdominalXray','smallBowelFollowThrough'),
    ct:fact('Follow bowel continuity rather than assigning jejunum or ileum from position alone. Enterography improves luminal distension and assessment of the enhancing wall.','Collapsed loops or transient spasm can resemble thickening or narrowing; inspect adjacent mesentery and other findings.','enterographyCT'),
    mri:fact('Combine distended bowel anatomy with fluid-sensitive, diffusion and enhancement information as acquired. Cine assessment can add movement information that a still frame lacks.','Signal or a short narrow segment alone does not establish active inflammation or a fixed stricture.','enterographyMRI'),
    ultrasound:fact('Follow accessible loops in longitudinal and transverse planes. Describe the wall layers, lumen and peristalsis, with Doppler information where appropriate.','Probe pressure and luminal contents alter appearances; grouped atlas loops are not validated individual sonographic segments.','bowelUS'),
  }},
  'large-intestine':{fmaId:'FMA7201',region:'abdomen',laterality:'unpaired',focus:{
    xray:fact('Follow colonic gas and stool through the caecum, flexures and pelvis where visible; compare the course and fold pattern with central small-bowel loops.','Projection overlap, variable gas and stool prevent a full segment-by-segment or mucosal assessment on a plain film. A contrast enema is a separate examination.','abdominalXray','lowerGI'),
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
    xray:fact('Use the right lower quadrant and caecal region only as a location cue on a plain abdominal radiograph. The appendix itself is generally not separately visible.','Do not use a normal-looking abdominal film or this atlas surface to assess appendicitis. ACR rates abdominal radiography usually not appropriate for suspected appendicitis.','rightLowerQuadrant'),
    ct:fact('Find the appendiceal base at the caecum and follow the blind-ending tube to its tip in multiple planes. Position varies between patients.','Calibre alone is insufficient for appendicitis; assess wall, contents and periappendiceal tissues.','appendix'),
    mri:fact('Trace the appendix from caecum to tip on the available T2-weighted and other acquired sequences. Compare wall appearance and surrounding inflammatory changes.','Visibility varies. Do not label an untraced small-bowel loop as appendix or infer normality from this intact atlas surface.','appendix'),
    ultrasound:fact('Locate the caecum and seek a blind-ending appendix, following its full visible length with graded compression as tolerated. Assess wall and surrounding tissues.','Nonvisualisation is not the same as seeing a normal appendix; document the limits of the window.','bowelUSMeasurements'),
  }},
  'ileocecal-junction':{fmaId:'FMA11338',region:'abdomen',laterality:'unpaired',focus:{
    xray:fact('Use the right lower quadrant and caecal gas pattern to orient the expected terminal-ileal entry. A dedicated contrast study may show continuity across the junction.','The valve and terminal ileum are not reliably isolated on a plain film; projected gas does not demonstrate valve competence or a validated leaflet contour.','abdominalXray','smallBowelFollowThrough'),
    ct:fact('Follow the terminal ileum into the caecum across reformats, separating the junction from the nearby appendiceal origin. Assess distension and adjacent tissues.','The source aliases this small surface to several ileal/caecal definitions; it is not a validated valve contour.','enterographyCT'),
    mri:fact('Correlate the terminal ileum and caecal entry on distended anatomical images and the available functional sequences. Confirm continuity rather than relying on one slice.','A static donor junction cannot demonstrate valve competence, transit or the extent of bowel disease.','enterographyMRI'),
    ultrasound:fact('Find the terminal ileum as it enters the caecum, then follow it proximally. Keep the junction distinct from the blind-ending appendix.','The selected mesh does not separately identify valve leaflets or reproduce bowel-wall layers.','bowelUSMeasurements'),
  }},
};
