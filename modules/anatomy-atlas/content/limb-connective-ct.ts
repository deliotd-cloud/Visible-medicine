// Original CT orientation drafts. References supply facts, not reusable images.
export const limbConnectiveCtReferences = {
  plantarAnatomy: 'https://pubmed.ncbi.nlm.nih.gov/33413502/',
  footCriteria: 'https://acsearch.acr.org/docs/69424/Narrative',
  wristCt: 'https://pubmed.ncbi.nlm.nih.gov/3685462/',
  wristCriteria: 'https://acsearch.acr.org/docs/69427/Narrative/',
  wristMr: 'https://pubmed.ncbi.nlm.nih.gov/3492109/',
  tractAnatomy: 'https://pubmed.ncbi.nlm.nih.gov/16533314/',
  tractMr: 'https://pubmed.ncbi.nlm.nih.gov/1410374/',
  tractUs: 'https://pubmed.ncbi.nlm.nih.gov/23804342/',
} as const;

export const limbConnectiveCtTeaching = {
  longPlantar: {
    title: 'CT plantar midfoot orientation',
    body: 'On an already acquired foot CT that includes the plantar midfoot, first identify the calcaneus, cuboid and calcaneocuboid joint on serial sections and reformats. These bony landmarks orient the long plantar ligament region; the atlas surface is not a segmented patient ligament.',
    bullets: [
      'The long and short plantar ligaments are distinct, variably shaped supports around the calcaneocuboid joint. Do not infer a tear from the atlas outline or an indistinct CT soft-tissue margin.',
      'CT clarifies adjacent bone and joint relationships. In chronic foot pain with suspected soft-tissue origin after negative or indeterminate radiographs, ACR favours MRI and ultrasound over CT. CT alone does not establish ligament integrity.',
    ],
    citations: [limbConnectiveCtReferences.plantarAnatomy, limbConnectiveCtReferences.footCriteria],
  },
  wristRetinaculum: {
    title: 'CT carpal-tunnel orientation',
    body: 'On an already acquired wrist CT, use axial sections to follow the palmar carpal arch around the tunnel and the position of the retinacular roof. This is an orientation to the osseous corridor, not a measurement of median-nerve compression.',
    bullets: [
      'A small CT anatomy study described the osseous walls and transverse ligament in healthy volunteers under its study technique. It does not establish reliable fine-tissue separation on every routine CT.',
      'MRI has demonstrated the retinaculum and tunnel contents against anatomy; ultrasound can assess superficial wrist soft tissues. CT appearance alone cannot grade retinacular injury or nerve disease.',
    ],
    citations: [limbConnectiveCtReferences.wristCt, limbConnectiveCtReferences.wristMr, limbConnectiveCtReferences.wristCriteria],
  },
  iliotibialTract: {
    title: 'CT lateral knee orientation',
    body: 'On an already acquired CT spanning the lateral knee, locate the lateral femoral epicondyle and proximal lateral tibia on serial sections. They give bony context for the distal iliotibial tract, whose complete fascial attachments are not verified by this atlas surface.',
    bullets: [
      'The tract is anchored to surrounding tissues; a static CT or atlas view does not demonstrate its behaviour with knee movement.',
      'MR studies describe soft-tissue signal deep to the tract in symptomatic cohorts, and ultrasound has examined its relation to the epicondyle during movement. Do not diagnose iliotibial-band syndrome from CT bone landmarks or an unseen fascial margin.',
    ],
    citations: [limbConnectiveCtReferences.tractAnatomy, limbConnectiveCtReferences.tractMr, limbConnectiveCtReferences.tractUs],
  },
} as const;
