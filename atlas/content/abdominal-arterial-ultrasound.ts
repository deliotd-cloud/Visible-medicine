/** Original factual teaching drafts. Reading links grant no asset reuse rights. */
export const abdominalArterialUltrasoundTopics = {
  FMA14805: {
    method: 'linear endoscopic ultrasound (EUS)',
    body: 'In a published linear EUS view, an inferior pancreaticoduodenal arterial branch arises on the right side of the superior mesenteric artery and heads toward the probe, while nearby jejunal branches run away. Use that difference as orientation in the described view, then check the observed branch origin before naming it.',
    bullets: [
      'The pictured branch is the inferior pancreaticoduodenal trunk, not a separately resolved anterior or posterior inferior branch.',
      'One labelled EUS view establishes neither a detection rate nor visibility through the abdominal wall or the entire arterial course.',
    ],
    citations: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC4145479/'],
  },
  FMA14784: {
    method: 'linear endoscopic ultrasound (EUS)',
    body: 'An expert EUS account describes the posterior superior pancreaticoduodenal artery near the hepatoduodenal ligament as a branch crossing in front of the common bile duct. In that viewing context, relate the crossing to the gastroduodenal pathway and confirm its continuity on the actual examination.',
    bullets: [
      'A crossing beside the duct alone does not identify this artery; its proximal origin can vary.',
      'This is an author-described orientation example, without a routine visibility rate or a validated whole-vessel EUS trace.',
    ],
    citations: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC6032695/', 'https://pubmed.ncbi.nlm.nih.gov/33392701/'],
  },
  FMA14826: {
    method: 'laparoscopic intraoperative ultrasound (IOUS)',
    body: 'In an 18-patient left-colon operative series, laparoscopic ultrasound was used to distinguish the left colic artery from superior rectal and sigmoid branches at the inferior mesenteric arterial tree. The useful landmark is the parent branch relationship within the exposed operative field.',
    bullets: [
      'The report concerns the left-colic parent, not its separately named ascending or descending child branches.',
      'Operative exposure and the selected cancer cohort do not establish routine transabdominal or EUS visibility, a normal branching frequency, or this donor vessel’s patient-specific course.',
    ],
    citations: ['https://pubmed.ncbi.nlm.nih.gov/29943055/'],
  },
  FMA14824: {
    method: 'intraoperative color Doppler ultrasound (IOUS)',
    body: 'In a 40-patient rectal-surgery study, color Doppler sampled a local marginal mesenteric artery segment near an intended bowel join after operative exposure. The acquired waveform represents flow at that sampled segment, not a map of the entire colonic marginal arcade.',
    bullets: [
      'The left colic artery in that study was identified by dissection and measured with a ruler; those measurements are not ultrasound findings.',
      'A local waveform cannot establish continuous collateral supply, adequate perfusion, or a treatment threshold; the study does not establish routine transabdominal or EUS visibility.',
    ],
    citations: ['https://link.springer.com/article/10.1007/s10151-024-03037-8'],
  },
} as const;

export const abdominalArterialUltrasoundNote = 'Educational draft; revision-bound radiologist review pending. The reference surface is unvalidated and does not supply an acquired ultrasound image, measured flow or patient-space registration.';
