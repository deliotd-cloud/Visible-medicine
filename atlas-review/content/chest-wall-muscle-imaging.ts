// Original factual teaching drafts. References are reading links, not media licences.
export const chestWallMuscleImagingReferences = {
  thorax: 'https://www.ncbi.nlm.nih.gov/books/NBK535414/',
  chestUS: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5647615/',
  intercostalUS: 'https://pubmed.ncbi.nlm.nih.gov/2171083/',
  pectoralis: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10668934/',
  pectoralisMRI: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12496263/',
  axilla: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11909697/',
  transversus: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3037302/',
  parasternal: 'https://asra.com/docs/default-source/asra-news/may-2020-special-edition.pdf',
  diaphragm: 'https://link.springer.com/article/10.1186/s12890-021-01441-6',
  abdominalUS: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7441131/',
  abdominalImaging: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8913712/',
  mri: 'https://www.radiologyinfo.org/en/info/muscmr',
  xray: 'https://www.radiologyinfo.org/en/info/bonerad',
} as const;
export type ChestWallImagingReference = keyof typeof chestWallMuscleImagingReferences;
export type ChestWallImagingModality = 'ct' | 'mri' | 'ultrasound' | 'xray';
export type ChestWallImagingFact = {text:string; references:readonly ChestWallImagingReference[]};
const fact=(text:string,...references:ChestWallImagingReference[]):ChestWallImagingFact=>({text,references});
export const chestWallMuscleImagingModes:Record<ChestWallImagingModality,ChestWallImagingFact> = {
  ct: fact('Orient with the acquired sections and anatomical landmarks. The atlas colours do not encode CT attenuation or a patient segmentation.'),
  mri: fact('Use the actual sequence and acquired planes to assess soft tissues; this surface has no MR signal or oedema measurement.','mri'),
  ultrasound: fact('A rotated mesh is not a sonographic window. Rib shadow, tissue depth and the imaging plane limit what can be seen.','chestUS'),
  xray: fact('A projection overlaps tissues. Bone landmarks do not establish the integrity of an individual muscle or tendon.','xray'),
};
type Group={fmaIds:readonly string[];landmark:ChestWallImagingFact;focus:Record<ChestWallImagingModality,ChestWallImagingFact>;limitation:string};
const intercostalLimit='This selection combines left and right source pieces. It does not independently identify a numbered interspace, a neurovascular bundle or a safe procedural corridor.';
export const chestWallMuscleImagingGroups = {
  externalIntercostal: {
    fmaIds:['FMA9756'],
    landmark:fact('External intercostals form the outer intercostal muscle layer; anteriorly, muscle gives way to the external intercostal membrane.','thorax'),
    focus:{
      ct:fact('Use adjacent ribs to orient the outer intercostal layer. Follow its location across sections rather than assuming a complete muscle band at the anterior costochondral region.','thorax'),
      mri:fact('Relate the superficial intercostal layer to the ribs and deeper muscle layers. Visibility on a particular scan does not follow the sharply separated mesh boundaries.','thorax'),
      ultrasound:fact('Locate the rib cortices and their shadows, then inspect the intervening superficial intercostal tissue. The pleural interface is deeper and must not be labelled as muscle.','intercostalUS'),
      xray:fact('The ribs and interspaces provide orientation, but the external intercostal muscle is not individually resolved as this coloured layer.','xray'),
    },limitation:intercostalLimit,
  },
  internalIntercostal: {
    fmaIds:['FMA9757'],
    landmark:fact('Internal intercostals form the middle layer, beneath external intercostals and superficial to the innermost group.','thorax'),
    focus:{
      ct:fact('Interpret the selected layer within the rib-bounded chest wall. A single section does not establish all intercostal layer boundaries or their posterior membranous continuation.','thorax'),
      mri:fact('Distinguish the middle layer from the superficial and deepest muscle planes using actual image contrast. The separated teaching model is not evidence of a fluid-filled interval.','thorax'),
      ultrasound:fact('The internal layer lies between the external and innermost groups. Report only interfaces demonstrated in the acquired view; a three-layer atlas does not guarantee three resolved sonographic layers.','intercostalUS'),
      xray:fact('Use the rib cage as a spatial reference. A plain film does not separately outline the internal intercostal layer or confirm its normality.','xray'),
    },limitation:intercostalLimit,
  },
  innermostIntercostal: {
    fmaIds:['FMA9758'],
    landmark:fact('The innermost group is the deepest intercostal muscle layer, external to endothoracic fascia and parietal pleura.','thorax'),
    focus:{
      ct:fact('Follow the inner chest-wall soft tissue beside the ribs. Keep muscle distinct from adjacent extrapleural fat and pleura; thin structures may not be individually resolved.','intercostalUS'),
      mri:fact('Use the inner chest wall as the anatomical search region, not the lung surface itself. Do not transfer the mesh outline into a scan boundary without image-based review.','thorax'),
      ultrasound:fact('Recognise that the echogenic pleural interface lies deep to chest-wall muscle and contains echoes from several adjacent tissues. It is not the innermost intercostal muscle.','intercostalUS'),
      xray:fact('A visible rib margin or lung edge does not delineate this deepest intercostal layer. Its source colour is a teaching convention only.','xray'),
    },limitation:intercostalLimit,
  },
  pectoralisMajor: {
    fmaIds:['FMA13373','FMA13374'],
    landmark:fact('Pectoralis major is the superficial anterior chest muscle, with clavicular and sternal contributions converging towards the humeral tendon.','pectoralis'),
    focus:{
      ct:fact('Follow the superficial chest-wall muscle towards the anterior axilla, keeping the deeper pectoralis minor separate. The belly, musculotendinous junction and distal tendon are different anatomical targets.','pectoralis'),
      mri:fact('Check that the relevant chest wall, myotendinous region and humeral attachment are actually covered. A routine shoulder MRI can omit important portions of pectoralis major.','pectoralisMRI'),
      ultrasound:fact('Follow the muscle into its tendon near the proximal humerus in more than one plane. Tendon appearance and the biceps relationship help orientation; a single dark area is not by itself a proven tear.','pectoralis'),
      xray:fact('The humerus and shoulder girdle supply attachment-region landmarks. A radiograph does not reproduce the muscle heads or establish distal tendon continuity.','xray'),
    },limitation:'The retained selection combines two source parts per side. It does not independently map tendon laminae, tear grades, retraction or internal fibre architecture.',
  },
  pectoralisMinor: {
    fmaIds:['FMA13375','FMA13376'],
    landmark:fact('Pectoralis minor lies deep to pectoralis major and approaches the coracoid, providing a landmark for axillary levels.','axilla'),
    focus:{
      ct:fact('Identify the deeper pectoral muscle and relate the axillary region to its margins. The surrounding axillary spaces and lymph nodes are not parts of the muscle itself.','axilla'),
      mri:fact('Use the coracoid and overlying pectoralis major to orient this smaller deep muscle. Do not assign the major muscle’s humeral tendon attachment to pectoralis minor.','axilla','pectoralis'),
      ultrasound:fact('The coracoid is a useful landmark when following pectoralis minor under pectoralis major. Keep muscle, adjacent axillary vessels and any imaged nodes separately identified.','axilla'),
      xray:fact('The coracoid is an osseous reference, not a radiographic outline of pectoralis minor or evidence that its tendon is intact.','xray'),
    },limitation:'No lymph-node level is assigned to a patient finding by this mesh. Axillary vessels, plexus anatomy and any procedural route require their own reviewed evidence.',
  },
  transversusThoracis: {
    fmaIds:['FMA9761','FMA9762'],
    landmark:fact('Transversus thoracis forms variable muscular slips on the inner anterior chest wall behind the sternum and costal cartilages.','transversus'),
    focus:{
      ct:fact('Look along the posterior sternal and adjacent costal-cartilage region, rather than the superficial pectoral compartment. The number and extent of slips vary between individuals.','transversus'),
      mri:fact('Use the inner anterior chest wall as the expected location. The source donor’s slip pattern is not a universal template for deciding whether a patient structure is absent or abnormal.','transversus'),
      ultrasound:fact('In a parasternal teaching view, distinguish transversus thoracis from intercostal muscle, the internal thoracic vessels and the deeper pleural interface. Visibility depends on the actual acoustic window.','parasternal'),
      xray:fact('Relate the region to the anterior rib cage and sternum. Costal cartilage is not necessarily visible, and a chest radiograph does not separately outline these muscle slips.','xray'),
    },limitation:'Source slips are not separately named here. This is not a segmented vascular plane or a needle-placement guide.',
  },
  diaphragm: {
    fmaIds:['FMA13295'],
    landmark:fact('The diaphragm separates thoracic and abdominal compartments; its dome position and shape change with respiration.','diaphragm'),
    focus:{
      ct:fact('Follow both domes and the posterior crural region across reformatted views. Acquired lung volume affects the contour; a static CT does not measure respiratory excursion.','diaphragm'),
      mri:fact('Distinguish static anatomical MRI from a dynamic acquisition that records diaphragm movement. Advancing through spatial slices is not the same as viewing a respiratory cine sequence.','diaphragm'),
      ultrasound:fact('Keep dome excursion separate from thickness or thickening at the zone of apposition. They assess different features and depend on the acquisition site, breathing effort and acoustic window.','diaphragm'),
      xray:fact('Assess dome contours in the context of projection and lung volume. An elevated hemidiaphragm is nonspecific and does not, by itself, establish paralysis.','diaphragm'),
    },limitation:'This is one static source selection, not independent functional hemidiaphragms. It supplies no phrenic conduction, respiratory motion or patient-specific hiatus segmentation.',
  },
  externalOblique: {
    fmaIds:['FMA13336','FMA13337'],
    landmark:fact('External oblique is the outer muscular layer of the lateral abdominal wall, superficial to internal oblique and transversus abdominis.','abdominalUS'),
    focus:{
      ct:fact('Trace the outer lateral abdominal muscle towards its aponeurotic continuation. Muscle, fascia and the rectus sheath are related but are not interchangeable CT labels.','abdominalImaging'),
      mri:fact('Follow the outer muscle layer and its transition into aponeurosis across planes. Distinguish it from internal oblique and the deeper transversus; an intervening fascial plane is not an extra muscle.','abdominalImaging'),
      ultrasound:fact('Identify the superficial external-oblique layer before the two deeper lateral wall muscles. Relate the image to the sampled site; a local view does not show the whole aponeurosis or all abdominal-wall defects.','abdominalUS'),
      xray:fact('Ribs and iliac bone can orient the attachment region. Plain radiography does not separately map the external-oblique belly, aponeurosis or individual abdominal-wall layers.','xray'),
    },limitation:'This lateral muscle selection is not a complete abdominal wall or a hernia study. Dynamic strain, fascial defects and patient-specific tendon detail are not supplied.',
  },
} satisfies Record<string,Group>;
export type ChestWallMuscleImagingGroup = keyof typeof chestWallMuscleImagingGroups;
