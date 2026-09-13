// Original orientation notes; linked publications are not imported assets.
export const centralVesselImagingReferences={
  aortaCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5329815/',
  aortaMRI:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3874367/',
  aortaEcho:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9876736/',
  aortaMeasure:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11656620/',
  systemicMR:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10156895/',
  azygosCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10864146/',
  svcEcho:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6654543/',
  pulmonaryCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6269336/',
  pulmonaryMR:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3500786/',
  pulmonaryVeins:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7715996/',
  echo:'https://www.asecho.org/wp-content/uploads/2019/01/2019_Comprehensive-TTE.pdf',
  ivc:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8405820/',
  ivcUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10730449/',
  mesentericCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4263800/',
  mesentericUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3553331/',
  visceralMR:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9025362/',
  proximalMR:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5594983/',
  hepaticArteries:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10093498/',
  hepaticMR:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4668994/',
  liverUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3478706/',
  portal:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5098943/',
  portalVariants:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3036482/',
  hepaticVeins:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12916557/',
  liverMR:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8871101/',
  renalCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4247506/',
  renalMR:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5264189/',
  renalUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3567456/',
} as const;
type Reference=keyof typeof centralVesselImagingReferences;
export type CentralVesselImagingModality='ct'|'mri'|'ultrasound';
type Fact={body:string;pitfall:string;references:readonly Reference[]};
type Group={fmaId:string;region:'thorax'|'abdomen';laterality:'midline'|'unspecified'|'left'|'right';focus:Partial<Record<CentralVesselImagingModality,Fact>>};
const fact=(body:string,pitfall:string,...references:Reference[]):Fact=>({body,pitfall,references});
const pulmonaryVeinMRI=fact('Trace the vein to its atrial connection on source images; timing and motion affect depiction.','A projection alone cannot establish ostial number or exclude anomalous drainage.','pulmonaryCT');
const hepaticVeinMRI=fact('Trace the selected hepatic vein into the caval outflow on the available venous-sensitive series. Compare source sections with projections.','Sequence-dependent visibility of small tributaries is not proof of absent drainage.','liverMR');
const hepaticVeinUS=fact('Follow hepatic outflow towards the IVC and inspect its Doppler waveform.','Cardiac effects alter the waveform; a static mesh supplies no pressure or flow measurement.','hepaticVeins');
export const centralVesselImagingGroups:Record<string,Group>={
  'ascending-aorta':{fmaId:'FMA3736',region:'thorax',laterality:'midline',focus:{
    ct:fact('Follow the ascending lumen from the root towards the arch. Review orthogonal reformats and whether the acquisition controls cardiac motion.','Pulsation may simulate an intimal flap on a nongated study.','aortaCT'),
    mri:fact('Relate bright-blood, dark-blood and cine views to the same aortic level. Angiography depicts the lumen; dedicated flow sequences answer a different question.','A coloured surface cannot establish valve function, regurgitant volume or wall signal.','aortaMRI'),
    ultrasound:fact('Parasternal echocardiographic views can show the root and proximal ascending aorta alongside the valve. State which segment is actually visualised.','An adequate root view does not establish that the entire ascending aorta has been examined.','aortaEcho'),
  }},
  'aortic-arch':{fmaId:'FMA3768',region:'thorax',laterality:'midline',focus:{
    ct:fact('Follow the curved arch and identify each branch origin on source sections before using a volume rendering.','Branching variants and overlap cannot be resolved by assuming the atlas donor pattern.','aortaCT'),
    mri:fact('Follow arch continuity in multiplanar angiographic images and relate it to its branches and proximal descending segment.','Oblique cuts exaggerate apparent calibre; compare measurements perpendicular to the vessel course.','aortaMeasure'),
    ultrasound:fact('A suprasternal window may show the arch, branches and proximal descending aorta. Correlate the plane with the direction of blood flow.','Acoustic access varies; incomplete arch visualisation must remain explicit.','aortaEcho'),
  }},
  'descending-aorta':{fmaId:'FMA87217',region:'thorax',laterality:'unspecified',focus:{
    ct:fact('Trace the descending thoracic aorta beside the spine to the diaphragmatic hiatus. Inspect lumen, wall and surrounding tissues separately.','Do not measure across an oblique axial section as though it were a true short axis.','aortaCT'),
    mri:fact('Use longitudinal and cross-sectional views to follow the lumen and wall through the descending thorax. Check the sequence before interpreting blood signal.','Flow-related signal loss is not, by itself, an occluded lumen.','aortaMRI'),
  }},
  'superior-cava':{fmaId:'FMA4720',region:'thorax',laterality:'unspecified',focus:{
    ct:fact('Trace the brachiocephalic confluence through the SVC to the right atrium, checking enhancement and any collateral pathways.','Venous opacification depends on injection and timing; one incompletely filled segment does not prove obstruction.','systemicMR'),
    mri:fact('Confirm the caval course and atrial connection using anatomical and venous angiographic views. Dedicated flow imaging can add haemodynamic information.','A routine cardiac plane is not a complete map of systemic venous return.','systemicMR'),
    ultrasound:fact('Supraclavicular imaging may show the SVC and tributaries; specialised echo views assess different portions. Identify the actual segment before interpreting Doppler.','No single acoustic window guarantees inspection of the whole vessel.','svcEcho'),
  }},
  azygos:{fmaId:'FMA4838',region:'thorax',laterality:'unspecified',focus:{
    ct:fact('Follow the paravertebral vein into its arch over the right hilar region and towards the SVC.','An enlarged vein may resemble a mediastinal mass; assess continuity and collateral pathways.','azygosCT'),
    mri:fact('Use axial and coronal venous or bright-blood views to establish the azygos pathway and its central connection.','Do not infer interrupted IVC or collateral flow solely from a prominent static surface.','systemicMR'),
  }},
  hemiazygos:{fmaId:'FMA4944',region:'thorax',laterality:'midline',focus:{
    ct:fact('Trace the lower left paravertebral venous course and its crossing towards the azygos system on consecutive sections.','Crossing level and connections vary; the retained midline source tag is not a claim of an entirely midline course.','azygosCT'),
    mri:fact('Follow the hemiazygos connection across planes on a series that depicts venous anatomy.','Do not invent an accessory hemiazygos segment or a complete collateral circuit from this selection.','systemicMR'),
  }},
  'right-pulmonary-artery':{fmaId:'FMA50872',region:'thorax',laterality:'right',focus:{
    ct:fact('Follow the right pulmonary artery behind the ascending aorta towards the right hilum, then correlate its branches with airways.','Pulmonary arterial contrast timing matters; this aggregate is not a validated segmental embolus map.','pulmonaryCT'),
    mri:fact('Relate the right branch to the pulmonary trunk on angiographic images. Phase-contrast acquisition can measure branch flow when appropriately prescribed.','Lumen appearance alone cannot measure pulmonary pressure or regional perfusion.','pulmonaryMR'),
    ultrasound:fact('Echo views of the outflow tract and pulmonary bifurcation may depict the proximal right branch. Interpret Doppler with the actual beam direction.','This is not complete sonographic coverage of the distal pulmonary arteries.','echo'),
  }},
  'left-pulmonary-artery':{fmaId:'FMA50873',region:'thorax',laterality:'left',focus:{
    ct:fact('Follow the left pulmonary artery over the left main bronchus into the hilum, checking branch continuity on reformats.','An apparent defect needs assessment on the acquired study; the donor surface supplies neither thrombus nor contrast timing.','pulmonaryCT'),
    mri:fact('Locate the left branch from the pulmonary bifurcation and review its relationship to the left airway. Separate angiographic anatomy from acquired flow information.','Small distal branches may not be resolved even when the proximal artery is clear.','pulmonaryMR'),
    ultrasound:fact('Identify the pulmonary bifurcation and any visible proximal left branch in the actual echo window.','The atlas camera is not a calibrated probe, and a visible bifurcation does not exclude distal disease.','echo'),
  }},
  'right-superior-pulmonary-vein':{fmaId:'FMA49914',region:'thorax',laterality:'right',focus:{
    ct:fact('Trace right upper and usual middle-lobe venous drainage towards the superior right-sided ostium of the left atrium.','Middle-lobe drainage and accessory ostia vary; do not equate source pieces with vein count.','pulmonaryVeins'),mri:pulmonaryVeinMRI,
  }},
  'left-superior-pulmonary-vein':{fmaId:'FMA49916',region:'thorax',laterality:'left',focus:{
    ct:fact('Follow upper-lobe and lingular venous drainage towards the upper left atrial connection.','A shared left-sided ostium is a possible variant; inspect actual connections.','pulmonaryVeins'),mri:pulmonaryVeinMRI,
  }},
  'right-inferior-pulmonary-vein':{fmaId:'FMA49911',region:'thorax',laterality:'right',focus:{
    ct:fact('Trace right lower-lobe drainage medially to its posterior-inferior left atrial connection.','Location alone cannot distinguish a vein from the neighbouring artery without continuity.','pulmonaryVeins'),mri:pulmonaryVeinMRI,
  }},
  'left-inferior-pulmonary-vein':{fmaId:'FMA49913',region:'thorax',laterality:'left',focus:{
    ct:fact('Follow left lower-lobe venous return towards the lower left atrial connection.','Do not assume four separate ostia simply because four named selections exist.','pulmonaryVeins'),mri:pulmonaryVeinMRI,
  }},
  'abdominal-aorta':{fmaId:'FMA3789',region:'abdomen',laterality:'midline',focus:{
    ct:fact('Follow the aorta from the hiatus to the iliac bifurcation, locating visceral and renal origins. Review true cross-sections rather than an oblique diameter.','The donor outline is not a patient calibre reference or aneurysm measurement.','aortaMeasure'),
    mri:fact('Relate the abdominal lumen and branch origins across acquired angiographic source images. Contrast-enhanced and noncontrast techniques have different signal behaviour.','Missing signal on one sequence does not prove an absent branch.','visceralMR'),
    ultrasound:fact('Survey the aorta longitudinally and transversely, retaining a consistent measurement convention and identifying the bifurcation where visible.','Gas or obliquity can hide or distort segments; document incomplete coverage.','aortaEcho'),
  }},
  'inferior-cava':{fmaId:'FMA10951',region:'abdomen',laterality:'unspecified',focus:{
    ct:fact('Follow iliac venous confluence, renal inflow and the retrohepatic IVC. Compare apparent defects with the enhancement pattern across available phases.','Enhanced renal inflow mixing with less opacified blood can mimic thrombus.','ivc'),
    mri:fact('Define caval continuity and the extent of any real intraluminal abnormality using anatomical and venous-sensitive sequences.','Flow-related artefact can mimic material in the lumen; tumour extension is not inferred from this model.','ivc'),
    ultrasound:fact('Identify the IVC separately from the aorta and follow the accessible lumen towards the hepatic venous junctions. Doppler adds flow information.','Bowel gas may prevent examination of the infrahepatic course; nonvisualisation is not absence.','ivcUS'),
  }},
  celiac:{fmaId:'FMA50737',region:'abdomen',laterality:'unspecified',focus:{
    ct:fact('Identify the coeliac origin and individually trace hepatic, splenic and left gastric supply on arterial-phase reformats.','The common trifurcation is not universal; two source pieces do not establish three branches.','mesentericCT'),
    mri:fact('Correlate the proximal coeliac trunk on source images with its branches on MRA.','Small branches may be less conspicuous than the trunk; confirm rather than infer their origins.','proximalMR'),
    ultrasound:fact('Locate the short anterior aortic branch above the SMA. Assess the lumen and spectral waveform in the actual respiratory and examination conditions.','Gas and Doppler angle affect assessment; a single velocity is not a diagnosis.','mesentericUS'),
  }},
  sma:{fmaId:'FMA14749',region:'abdomen',laterality:'midline',focus:{
    ct:fact('Follow the SMA from its anterior aortic origin into the mesenteric root, distinguishing it from the adjacent SMV.','Proximal patency does not establish bowel viability or exclude distal/nonocclusive ischaemia.','mesentericCT'),
    mri:fact('Trace the proximal SMA in longitudinal and cross-sectional angiographic views.','A well-seen proximal vessel does not guarantee diagnostic depiction of distal branches.','proximalMR'),
    ultrasound:fact('Identify the SMA below the coeliac origin and inspect its waveform. Fasting and postprandial flow patterns differ.','Do not apply fasting expectations to an unrecorded meal state.','mesentericUS'),
  }},
  ima:{fmaId:'FMA14750',region:'abdomen',laterality:'unspecified',focus:{
    ct:fact('Locate the smaller anterior-left aortic origin below the renal arteries and trace its left-colonic course.','One selected trunk does not validate marginal collateral continuity.','mesentericCT'),
    mri:fact('Seek continuity with the distal abdominal aorta on the actual angiographic source sections.','Its small calibre limits MRA depiction; nonvisualisation is not proof of occlusion.','mesentericCT'),
    ultrasound:fact('When resolved, follow the IMA from its aortic origin and confirm arterial flow with Doppler.','Depth and small calibre make identification difficult; a negative view is not an exclusion test.','mesentericUS'),
  }},
  'common-hepatic-artery':{fmaId:'FMA14771',region:'abdomen',laterality:'midline',focus:{
    ct:fact('Trace the common hepatic artery from its actual origin to the gastroduodenal branch and continuing hepatic supply.','Replaced or accessory hepatic arteries require a patient-specific branch map.','hepaticArteries'),
    mri:fact('Relate arterial-phase or dedicated MRA source images to the coeliac region and gastroduodenal junction.','Routine liver MRI and dedicated hepatic arteriography do not provide identical branch visibility.','hepaticMR'),
    ultrasound:fact('Trace arterial continuity from the coeliac region where accessible; use Doppler to distinguish it from adjacent veins.','A waveform sampled near the porta does not by itself identify the common hepatic segment.','liverUS'),
  }},
  'proper-hepatic-artery':{fmaId:'FMA14772',region:'abdomen',laterality:'unspecified',focus:{
    ct:fact('Follow the artery beyond the gastroduodenal takeoff towards the hepatic hilum and right/left branches.','Do not assume all hepatic arterial inflow passes through this selected segment.','hepaticArteries'),
    mri:fact('Trace the proper hepatic segment on arterial-sensitive images and confirm any visible hilar branching.','Motion and limited resolution can interrupt depiction without proving stenosis.','hepaticMR'),
    ultrasound:fact('At the porta, distinguish the small artery from the portal vein and bile duct by continuity and pulsatile Doppler flow.','Colour alone is not vessel identity or proof of normal inflow.','liverUS'),
  }},
  'splenic-artery':{fmaId:'FMA14773',region:'abdomen',laterality:'unspecified',focus:{
    ct:fact('Follow the tortuous artery along the upper pancreatic region towards the splenic hilum.','Multiple cross-sections of one loop are not separate arteries.','hepaticArteries'),
    mri:fact('Review the splenic artery course on angiographic source images as well as projections.','Overlapping tortuous loops and motion can obscure short segments.','visceralMR'),
    ultrasound:fact('Identify arterial flow along the accessible pancreatic border or splenic hilar window.','Neither an isolated colour focus nor a single waveform demonstrates the whole tortuous course.','mesentericUS'),
  }},
  'left-gastric-artery':{fmaId:'FMA14768',region:'abdomen',laterality:'left',focus:{
    ct:fact('Follow the small artery from its origin towards the proximal lesser curvature, inspecting any hepatic branch.','An accessory or replaced left hepatic artery may arise here; do not assume a purely gastric territory.','hepaticArteries'),
    mri:fact('Seek the small left gastric branch on arterial-sensitive source images and confirm continuity with its origin.','Limited conspicuity on MRA is not evidence that the vessel is absent.','visceralMR'),
  }},
  'portal-vein':{fmaId:'FMA50735',region:'abdomen',laterality:'unspecified',focus:{
    ct:fact('Follow splenomesenteric confluence behind the pancreatic neck to the porta hepatis and intrahepatic branching.','Branching variants must be inspected rather than assigned from a standard bifurcation.','portalVariants'),
    mri:fact('Use venous-sensitive images to trace portal continuity and distinguish portal inflow from hepatic venous outflow.','Signal varies with sequence and flow; a static bright channel does not establish flow direction.','portal'),
    ultrasound:fact('Identify the portal vein by course and branching, then use spectral Doppler to establish the actual flow direction.','Red and blue indicate direction relative to the probe and colour map, not artery versus vein.','liverUS'),
  }},
  'right-renal-artery':{fmaId:'FMA14752',region:'abdomen',laterality:'right',focus:{
    ct:fact('Trace the right renal artery from the aorta, usually behind the IVC, to its hilar or early branches.','Search separately for accessory supply; one main-artery mesh cannot exclude polar arteries.','renalCT'),
    mri:fact('Review right renal origin, course and branching on the actual MRA source images. Contrast and noncontrast techniques can depict different levels of detail.','Small accessory arteries or early divisions may be missed.','renalMR'),
    ultrasound:fact('Locate the aortic origin and follow the retrocaval course where visible, correlating main-artery and intrarenal Doppler findings.','Gas, depth and beam angle limit assessment; no colour signal alone does not establish occlusion.','renalUS'),
  }},
  'left-renal-artery':{fmaId:'FMA14753',region:'abdomen',laterality:'left',focus:{
    ct:fact('Follow the left renal artery from the aorta towards the hilum, recording early division and any separate arterial origins.','The opposite side is not a reliable template for branch number.','renalCT'),
    mri:fact('Trace left renal arterial continuity and inspect source sections for small or early branches.','A smooth projection can conceal branching that remains relevant on source images.','renalMR'),
    ultrasound:fact('Use accessible anterior or flank views to relate the left renal artery to the kidney and aorta. Interpret Doppler at the identified segment.','Normal intrarenal flow does not prove that every accessory artery has been examined.','renalUS'),
  }},
  'right-hepatic-vein':{fmaId:'FMA14338',region:'abdomen',laterality:'right',focus:{
    ct:fact('Follow right hepatic venous outflow to the IVC, checking for additional inferior right drainage.','The visible main vein does not exclude accessory hepatic veins.','hepaticVeins'),mri:hepaticVeinMRI,ultrasound:hepaticVeinUS,
  }},
  'left-hepatic-vein':{fmaId:'FMA14339',region:'abdomen',laterality:'left',focus:{
    ct:fact('Follow the left hepatic vein towards its caval connection and look for a common trunk with the middle vein.','Shared or separate termination must be confirmed on the individual study.','hepaticVeins'),mri:hepaticVeinMRI,ultrasound:hepaticVeinUS,
  }},
  'middle-hepatic-vein':{fmaId:'FMA14340',region:'abdomen',laterality:'unspecified',focus:{
    ct:fact('Trace the middle hepatic vein between the functional right and left liver towards its outflow, often shared with the left vein.','A venous landmark is not a complete segmentation boundary or individual drainage-territory map.','hepaticVeins'),mri:hepaticVeinMRI,ultrasound:hepaticVeinUS,
  }},
  'superior-mesenteric-vein':{fmaId:'FMA14332',region:'abdomen',laterality:'unspecified',focus:{
    ct:fact('Follow the SMV through the mesenteric root to its confluence with splenic venous return behind the pancreatic neck.','A source aggregate is not a complete tributary map.','portal'),
    mri:fact('Confirm mesenteric-to-portal venous continuity on venous-sensitive sections and reformats.','A projected crossing is not necessarily a communicating tributary.','portal'),
    ultrasound:fact('Identify the SMV in relation to the SMA and trace towards the portal confluence where visible.','Gas may hide the confluence or distal tributaries; do not infer complete patency.','liverUS'),
  }},
  'splenic-vein':{fmaId:'FMA14331',region:'abdomen',laterality:'unspecified',focus:{
    ct:fact('Follow splenic venous return behind the pancreas to the portal confluence. Inspect the actual inferior mesenteric venous junction if visible.','The inferior mesenteric vein does not have one invariant termination.','portal'),
    mri:fact('Correlate the retropancreatic venous channel with the splenic hilum and portal confluence across planes.','A signal interruption on one sequence is insufficient to diagnose thrombosis.','portal'),
    ultrasound:fact('Identify the retropancreatic vein using the pancreas as a landmark, adding Doppler to assess flow where accessible.','Seeing the central channel does not guarantee coverage of its entire splenic hilar course.','liverUS'),
  }},
};
