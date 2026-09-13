// Original concise teaching; references are reading links, not reusable image assets.
export const thoracicBranchImagingReferences={
  archCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6732111/',
  outlet:'https://pmc.ncbi.nlm.nih.gov/articles/PMC13205449/',
  upperVessels:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11695452/',
  centralVeins:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10156895/',
  venousCompression:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5220205/',
  collaterals:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6565786/',
  coronaryCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5605061/',
  coronaryOrigins:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11242126/',
  coronaryMR:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4170228/',
  cardiacVeinsCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4121327/',
  cardiacVeinsMR:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4195839/',
  internalThoracicCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9071078/',
  internalBranches:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4583587/',
  internalThoracicUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8191278/',
  epigastric:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12445759/',
  anteriorVeinsCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5919579/',
  bronchialCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7237606/',
  bronchialVariants:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8183775/',
  esophagealCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12408246/',
} as const;
type Reference=keyof typeof thoracicBranchImagingReferences;
export type ThoracicBranchImagingModality='ct'|'mri'|'ultrasound';
type Fact={body:string;pitfall:string;references:readonly Reference[]};
type Group={fmaId:string;region:'thorax';laterality:'midline'|'unspecified'|'left'|'right';focus:Partial<Record<ThoracicBranchImagingModality,Fact>>};
const fact=(body:string,pitfall:string,...references:Reference[]):Fact=>({body,pitfall,references});
const subclavianMRI=fact('Trace the selected artery across the thoracic outlet on MRA and correlate with surrounding scalene, first-rib and clavicular anatomy.','Arm position affects relationships; a neutral-position atlas cannot establish dynamic compression.','upperVessels');
const subclavianUS=fact('Identify the artery in relation to the clavicle and first rib, then correlate spectral flow with the actual examination position.','An altered waveform alone does not establish symptomatic thoracic outlet syndrome.','outlet');
const subclavianVeinMRI=fact('Follow axillary-to-subclavian venous continuity into the central junction on venous-sensitive images, noting acquisition and arm position.','Positional narrowing alone is not proof of clinically significant obstruction.','venousCompression');
const subclavianVeinUS=fact('Follow the accessible axillosubclavian vein and inspect colour and spectral flow. Correlate any abnormality with the actual anatomy.','The clavicle prevents complete direct compression; an unexamined central segment is not a negative result.','venousCompression');
const internalArteryCT=fact('Trace the parasternal artery behind the costal cartilages from its subclavian origin, keeping accompanying veins distinct.','Sternal distance varies; this donor surface is not a safe procedural clearance.','internalThoracicCT');
const internalArteryUS=fact('Identify the parasternal arterial channel and nearby pleura using anatomical layers and Doppler, not colour alone.','A small vessel can be obscured by rib shadow; no needle route is provided.','internalThoracicUS');
const superiorEpigastricCT=fact('Follow internal thoracic continuation into the upper rectus region, distinguishing it from inferior and superficial epigastric vessels.','Visible proximal continuity does not prove a patent inferior epigastric anastomosis.','internalBranches');
const superiorEpigastricUS=fact('Relate the deep superior epigastric vessels to rectus and its posterior sheath, using Doppler where resolved.','An isolated vessel in the abdominal wall cannot be named from depth alone; trace continuity.','epigastric');
const musculophrenicArteryCT=fact('Trace the lateral terminal internal thoracic branch towards the costal margin and diaphragm on thin arterial-sensitive sections.','Small branches may be unresolved; source pieces are not a map of all diaphragmatic supply.','internalBranches');
const musculophrenicVeinCT=fact('At the thoracoabdominal margin, look for venous continuity towards the internal thoracic pathway on appropriately enhanced sections.','Small diaphragmatic channels may not be individually identifiable; do not assign every collateral to this named vein.','anteriorVeinsCT');
export const thoracicBranchImagingGroups:Record<string,Group>={
  'brachiocephalic-artery':{fmaId:'FMA3932',region:'thorax',laterality:'midline',focus:{
    ct:fact('Follow the arch origin to the right carotid–subclavian division on multiplanar arterial images.','A shared origin or other variant must be established on the patient study, not assumed from this donor.','archCT'),
    mri:fact('Trace the brachiocephalic trunk and its division on arch MRA, checking source sections as well as projections.','The aortic origin may lie outside a neck-only acquisition.','upperVessels'),
    ultrasound:fact('A supraclavicular view may show the accessible trunk or division; correlate carotid and subclavian waveforms with the identified segment.','Retrosternal origin coverage is limited; peripheral waveforms do not directly image the entire trunk.','upperVessels'),
  }},
  'right-subclavian-artery':{fmaId:'FMA3953',region:'thorax',laterality:'right',focus:{
    ct:fact('Trace the right artery from its actual origin across the inlet towards the first rib and axillary continuation.','An aberrant origin or retro-oesophageal course must be checked on the study; left-sided anatomy is not a template.','archCT'),mri:subclavianMRI,ultrasound:subclavianUS,
  }},
  'left-subclavian-artery':{fmaId:'FMA4694',region:'thorax',laterality:'left',focus:{
    ct:fact('Follow the usually direct arch origin up to the left thoracic outlet, relating artery, anterior scalene and first rib.','A shoulder-limited field may omit the arch origin and proximal disease.','archCT'),mri:subclavianMRI,ultrasound:subclavianUS,
  }},
  'right-brachiocephalic-vein':{fmaId:'FMA4751',region:'thorax',laterality:'right',focus:{
    ct:fact('Trace the short right jugular–subclavian confluence towards the SVC, checking for collateral drainage.','Dense injected contrast and streak artefact may obscure the lumen.','collaterals'),
    mri:fact('Confirm right central venous continuity to the caval confluence on MR venographic or suitable anatomical images.','Sequence timing and flow affect signal; a poorly depicted segment is not automatically thrombosed.','centralVeins'),
    ultrasound:fact('Follow the accessible right jugular–subclavian junction centrally and inspect its venous waveform.','The intrathoracic course may be hidden by bone or lung; state what was actually seen.','upperVessels'),
  }},
  'left-brachiocephalic-vein':{fmaId:'FMA4761',region:'thorax',laterality:'left',focus:{
    ct:fact('Follow the longer transverse vein behind the manubrium towards the right-sided SVC junction.','Narrowing or collateral filling needs patient-specific assessment; this is not a mirror of the right vein.','collaterals'),
    mri:fact('Trace the left jugular–subclavian junction across the mediastinum on venous-sensitive source images.','Confirm any unusual crossing course; a single projection may conceal a congenital variant.','centralVeins'),
    ultrasound:fact('Inspect the accessible left venous angle and any central continuation, using Doppler to complement anatomy.','The retrosternal crossing often remains incompletely visualised; a normal peripheral signal is not complete central-vein exclusion.','upperVessels'),
  }},
  'right-subclavian-vein':{fmaId:'FMA4755',region:'thorax',laterality:'right',focus:{
    ct:fact('Trace right axillary venous return beneath the clavicle towards its jugular confluence, anterior to anterior scalene.','Arterial-phase enhancement is not equivalent to a diagnostic venous acquisition.','venousCompression'),mri:subclavianVeinMRI,ultrasound:subclavianVeinUS,
  }},
  'left-subclavian-vein':{fmaId:'FMA4763',region:'thorax',laterality:'left',focus:{
    ct:fact('Follow the left vein through the costoclavicular region to the left venous angle. Review any collateral pathway separately.','An apparently narrow segment must be interpreted with arm position, enhancement and clinical context.','collaterals'),mri:subclavianVeinMRI,ultrasound:subclavianVeinUS,
  }},
  'right-coronary-trunk':{fmaId:'FMA3802',region:'thorax',laterality:'right',focus:{
    ct:fact('Locate the RCA ostium and follow the right atrioventricular groove on coronary source images and curved reformats.','Motion may blur or duplicate the lumen. A trunk selection cannot establish distal dominance or stenosis.','coronaryCT'),
    mri:fact('Dedicated coronary MRA can depict the RCA origin and proximal course in relation to the aorta and pulmonary outflow.','Routine cine or perfusion MRI is not a coronary lumen study; distal coverage and resolution must be checked.','coronaryMR'),
  }},
  'left-coronary-trunk':{fmaId:'FMA3855',region:'thorax',laterality:'left',focus:{
    ct:fact('Trace the left main origin to the LAD/circumflex division; identify a ramus or separate ostia only when present on the images.','A short or absent common trunk is not reconstructed from the atlas.','coronaryOrigins'),
    mri:fact('On dedicated coronary MRA, establish the left coronary origin and proximal relationship to the great vessels.','A visible proximal course does not exclude luminal disease throughout the coronary tree.','coronaryMR'),
  }},
  lad:{fmaId:'FMA3862',region:'thorax',laterality:'left',focus:{
    ct:fact('Follow the LAD in the anterior interventricular groove, identifying visible diagonal and septal origins on source sections.','Calcific blooming can exaggerate narrowing. Do not infer branch completeness or a myocardial perfusion territory from this mesh.','coronaryCT'),
    mri:fact('Relate the anterior interventricular course on coronary MRA to separately acquired myocardial cine, perfusion or scar images.','Those myocardial sequences do not directly prove LAD patency or assign a lesion to one artery.','coronaryMR'),
  }},
  circumflex:{fmaId:'FMA3895',region:'thorax',laterality:'left',focus:{
    ct:fact('Follow the circumflex in the left atrioventricular groove, separating it from the neighbouring coronary venous pathway.','Source overlap or motion can obscure the lumen; dominance depends on distal anatomy not supplied by this trunk.','coronaryCT'),
    mri:fact('Trace the circumflex on dedicated coronary-sensitive images along the left atrioventricular groove.','Small calibre and motion may limit distal depiction; absent signal alone is not an occlusion diagnosis.','coronaryMR'),
  }},
  'great-cardiac-vein':{fmaId:'FMA4707',region:'thorax',laterality:'unspecified',focus:{
    ct:fact('Follow anterior interventricular venous return as it turns into the left atrioventricular groove towards the coronary sinus.','Check venous enhancement and artery–vein crossings; coronary arterial timing may not fully depict venous tributaries.','cardiacVeinsCT'),
    mri:fact('Trace the great cardiac vein into the coronary sinus pathway on a dedicated venous-sensitive cardiac acquisition.','A visible sinus does not guarantee depiction of every small tributary or valve.','cardiacVeinsMR'),
  }},
  'middle-cardiac-vein':{fmaId:'FMA4713',region:'thorax',laterality:'unspecified',focus:{
    ct:fact('Identify the venous course in the posterior interventricular groove and confirm its coronary sinus connection on source images.','Do not confuse the accompanying posterior interventricular artery with this vein or treat source pieces as tributaries.','cardiacVeinsCT'),
    mri:fact('Seek posterior interventricular venous continuity towards the sinus on suitable cardiac venous images.','Partial depiction is not proof of a missing connection; this model contains no venous drainage measurement.','cardiacVeinsMR'),
  }},
  'right-internal-thoracic-artery':{fmaId:'FMA3969',region:'thorax',laterality:'right',focus:{ct:internalArteryCT,ultrasound:internalArteryUS}},
  'left-internal-thoracic-artery':{fmaId:'FMA4068',region:'thorax',laterality:'left',focus:{ct:internalArteryCT,ultrasound:internalArteryUS}},
  'right-superior-epigastric-artery':{fmaId:'FMA3988',region:'thorax',laterality:'right',focus:{ct:superiorEpigastricCT,ultrasound:superiorEpigastricUS}},
  'left-superior-epigastric-artery':{fmaId:'FMA4083',region:'thorax',laterality:'left',focus:{ct:superiorEpigastricCT,ultrasound:superiorEpigastricUS}},
  'right-musculophrenic-artery':{fmaId:'FMA10692',region:'thorax',laterality:'right',focus:{ct:musculophrenicArteryCT}},
  'left-musculophrenic-artery':{fmaId:'FMA4077',region:'thorax',laterality:'left',focus:{ct:musculophrenicArteryCT}},
  'right-internal-thoracic-vein':{fmaId:'FMA4758',region:'thorax',laterality:'right',focus:{
    ct:fact('Follow the deep parasternal venous pathway towards its actual central termination and inspect any collateral connections.','Published termination descriptions differ; neither a brachiocephalic nor direct caval junction is validated by this source.','collaterals'),
  }},
  'right-musculophrenic-vein':{fmaId:'FMA4772',region:'thorax',laterality:'right',focus:{ct:musculophrenicVeinCT}},
  'left-musculophrenic-vein':{fmaId:'FMA4786',region:'thorax',laterality:'left',focus:{ct:musculophrenicVeinCT}},
  'esophageal-artery':{fmaId:'FMA4149',region:'thorax',laterality:'midline',focus:{
    ct:fact('Look for a small enhancing arterial course towards the oesophageal wall, tracing its actual parent vessel on thin sections.','Arterial supply is distributed and variable; a visible branch neither localises all bleeding nor represents venous varices.','esophagealCT'),
  }},
  'variant-bronchial-artery':{fmaId:'FMA10704',region:'thorax',laterality:'midline',focus:{
    ct:fact('Trace a suspected bronchial artery from its actual origin towards the bronchi; ectopic systemic origins require deliberate review.','The source is explicitly variant-labelled but does not validate its precise origin or hazardous spinal connections.','bronchialVariants'),
  }},
  'bronchial-artery':{fmaId:'FMA68109',region:'thorax',laterality:'midline',focus:{
    ct:fact('On arterial-sensitive thin sections, follow the small systemic vessel towards the retrotracheal/retro-oesophageal bronchial region.','Distinguish bronchial from pulmonary arterial supply; routine chest CT may not resolve the complete bronchial course.','bronchialCT'),
  }},
  'esophageal-branches':{fmaId:'FMA71537',region:'thorax',laterality:'midline',focus:{
    ct:fact('Inspect visible small branches from the thoracic aortic region towards the oesophagus, checking continuity across sections.','This grouped source is not an enumeration of all oesophageal arteries or validated intervention targets.','esophagealCT'),
  }},
};
