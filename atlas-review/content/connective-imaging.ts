// Original concise synthesis; cited publications are not bundled image assets.
export const connectiveImagingTopics={
 forearm:{
  mri:{title:'MRI: a membrane with regionally different bundles',
   body:'Follow the interosseous membrane between radius and ulna rather than assuming a uniform sheet. A cadaver MRI study correlated regional membrane thickness and its main and oblique bundles with direct measurements after dissection.',
   bullets:['The study supports anatomical orientation, not a diagnostic threshold for every examination. A visible segment does not establish integrity along the whole forearm.','This atlas surface does not separately label those bundles or reproduce their thickness. No MR signal, fibre disruption or load-dependent instability is simulated.'],
   citations:['https://pubmed.ncbi.nlm.nih.gov/15338212/'],credit:'McGinley et al. (2004): MRI and laser-micrometer comparison in 12 cadaver forearms.'},
  ultrasound:{title:'Ultrasound: distinguish the membrane from its model',
   body:'Ultrasound can assess the forearm interosseous membrane between the two bones. A controlled cadaver study compared ultrasound and MRI after complete experimental disruption of the central membrane; this is narrower evidence than detecting every clinical injury.',
   bullets:['Do not transfer results from a deliberately cut central segment to partial, peripheral or chronic tears, or assume one normal image clears the entire membrane.','The displayed surface has no probe orientation, acoustic response or real-time tissue movement. Its continuity cannot demonstrate a normal patient membrane or exclude associated elbow and wrist injury.'],
   citations:['https://doi.org/10.1053/jhsu.2002.32961'],credit:'Fester et al. (2002): experimental central disruption in 19 fresh-frozen cadaver arms; no clinical sensitivity claim.'},
 },
 leg:{
  mri:{title:'MRI: check the membrane along the leg',
   body:'Correlate the tibia-to-fibula membrane over the imaged length of the leg, not only the ankle. A 15-patient Maisonneuve-fracture study reported both continuous injury and separated proximal/distal injuries with an intervening intact segment.',
   bullets:['That selected injury series does not establish the pattern in every patient. Confirm scan coverage; neither an ankle-only view nor the level of a fibular fracture defines the full membrane injury.','The long membrane is not synonymous with the distal syndesmotic ligament complex. The atlas does not separately simulate its distal ligament subdivisions, tears, edema or mechanical stability.'],
   citations:['https://doi.org/10.1111/os.13654'],credit:'He et al. (2023): imaging observations in 15 patients with typical Maisonneuve fractures, not a general diagnostic-accuracy study.'},
  ultrasound:{title:'Ultrasound: a small clinical series, not a rule-out test',
   body:'A three-patient report described the unaffected leg membrane as a bright continuous line between tibia and fibula, while injured segments appeared less distinct and interrupted. These observations provide image-orientation context, not a universal appearance or accuracy guarantee.',
   bullets:['Assess the actual images in their clinical context. The cited small retrospective series cannot establish that an apparently continuous line excludes injury elsewhere or proves ankle stability.','A broad atlas membrane surface is not an ultrasound beam or the complete distal syndesmosis. No tissue echogenicity, stress response, probe pressure or validated tear boundary is supplied.'],
   citations:['https://pubmed.ncbi.nlm.nih.gov/14682426/'],credit:'Durkee et al. (2003): three retrospective cases with CT correlation and surgical confirmation of distal syndesmotic injury in two.'},
 },
 wrist:{
  mri:{title:'MRI: distinguish the tunnel roof from its contents',
   body:'Use the flexor retinaculum as a roof landmark, keeping it distinct from the carpal bones, flexor tendons and median nerve. Normal-anatomy MRI correlated with cadaver sections demonstrated the tunnel walls; slight palmar bowing of the retinaculum could be normal.',
   bullets:['Bowing alone is not a diagnosis of carpal tunnel syndrome. This historical normal-anatomy study does not supply a universal measurement threshold for current clinical examinations.','The source surface has no validated regional thickness, tunnel lumen or separately modelled fascial subdivisions. Median nerves and synovial sheaths are absent from this supplied study representation; no nerve compression or MR signal is simulated.'],
   citations:['https://doi.org/10.1148/radiology.171.3.2717746'],credit:'Mesgarzadeh, Schneck and Bonakdarpour (1989): normal volunteers with cadaver MRI/anatomy correlation.'},
  ultrasound:{title:'Ultrasound: identify the roof separately from nerve and tendons',
   body:'A normal-volunteer ultrasound study identified the flexor retinaculum alongside the carpal surfaces, tendons, vessels and nerves. Treat these as distinct structures; the retinaculum is a spatial boundary, not the median nerve itself.',
   bullets:['The study also reported angle-dependent nerve echogenicity. Apparent brightness is not a fixed atlas colour, and normal-volunteer visibility does not establish sensitivity for carpal tunnel syndrome.','This source surface supplies no nerve cross-sectional area, tunnel pressure or dynamic tendon excursion. Fading or separating it is an illustration control, not a safe cutting plane or evidence that a patient nerve is uncompressed.'],
   citations:['https://pubmed.ncbi.nlm.nih.gov/2554376/'],credit:'Calleja Cancho et al. (1989): high-resolution sonography in 16 normal volunteers; no pathology-detection claim.'},
 },
} as const;
