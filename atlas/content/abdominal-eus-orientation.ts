// Original orientation teaching; references are factual reading links, not asset licences.
export const abdominalEusTopics = {
  FMA76574: {
    title: 'Gastroduodenal trunk · Endoscopic ultrasound (EUS)',
    body: 'In the cited duodenal-bulb EUS view, the gastroduodenal artery is an anterior landmark at the pancreatic head–neck junction, while the portal vein provides a posterior landmark. Compare these relationships with the assembled atlas, rather than treating a rotated 3D view as the ultrasound plane.',
    bullets: [
      'This lesson concerns the selected arterial trunk, not separate pancreaticoduodenal branches or the pancreatic duct.',
      'A vessel seen in one section does not establish its full course. Confirm continuity on the acquired examination; the reference surface cannot establish patient-specific branching.',
    ],
    citations: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC4568631/'],
  },
  FMA14768: {
    title: 'Endoscopic ultrasound (EUS)',
    body: 'Near the oesophagogastric junction, EUS can show the left gastric artery close to the corresponding vein. The cited account uses pulsed Doppler to help distinguish the two. Proximity alone is insufficient to name a small vessel in an acquired image.',
    bullets: [
      'Keep arterial and venous identities separate: the left gastric artery selection is not a map of the left gastric vein.',
      'Confirm the observed vessel and its continuity on the actual study. The atlas colour and surface shape are labels, not Doppler findings or a patient-specific vessel boundary.',
    ],
    citations: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC4062237/'],
  },
  FMA15391: {
    title: 'Endoscopic ultrasound (EUS)',
    body: 'The inferior mesenteric vein has variable drainage. The cited linear-EUS account illustrates connections to the splenic vein, superior mesenteric vein or their portal confluence. Its appearance therefore depends on the individual connection and the EUS viewing location.',
    bullets: [
      'A gastric view may demonstrate entry into the inferior aspect of the splenic vein; alternative drainage is described in duodenal views. Failure to see that first connection does not establish an absent vein.',
      'Use the pancreas and neighbouring veins as orientation landmarks. A single retained donor surface does not encode every drainage variant or prove the connection in a patient.',
    ],
    citations: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC4062237/'],
  },
  FMA15400: {
    title: 'Linear endoscopic ultrasound (EUS)',
    body: 'Linear EUS can depict the small right gastric vein entering the front of the portal vein near the liver hilum in the cited account. Its small calibre makes identification difficult. This observation is not a routine transabdominal detection rate and does not establish the course or drainage variant of the selected donor surface.',
    bullets: [
      'Distinguish the right gastric vein from the left gastric vein and right gastroepiploic vein. A nearby venous signal alone does not establish a named vessel identity.',
      'The selected source surface remains unvalidated. It encodes no probe station, patient confluence or correspondence to an acquired image.',
    ],
    citations: ['https://pubmed.ncbi.nlm.nih.gov/24949362/'],
  },
} as const;
