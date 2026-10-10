// Original, source-bound MRI orientation drafts. Links are reading references only.
// These static donor surfaces are not registered patient images or flow measurements.
export const abdominalVascularMriReferences = {
  arteries: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html',
  veins: 'https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html',
  mra: 'https://www.radiologyinfo.org/en/info/angiomr',
  dorsalStudy: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11769064/',
  arcadesStudy: 'https://pubmed.ncbi.nlm.nih.gov/33392701/',
  greatStudy: 'https://pubmed.ncbi.nlm.nih.gov/24599560/',
  venousStudy: 'https://pubmed.ncbi.nlm.nih.gov/9129413/',
} as const;

type Reference = keyof typeof abdominalVascularMriReferences;
type Group = {
  fmaId: string;
  laterality: 'midline' | 'unspecified' | 'left' | 'right';
  body: string;
  pitfall: string;
  references: readonly Reference[];
};

export const abdominalVascularMriGroups: Record<string, Group> = {
  'inferior-mesenteric-vein': {
    fmaId: 'FMA15391', laterality: 'unspecified',
    body: 'Where venous-sensitive MR resolves it, follow the inferior mesenteric vein cranially from the left mesocolon towards its actual junction near the pancreas.',
    pitfall: 'Its junction may be with the splenic vein, superior mesenteric vein or their confluence; this donor line cannot fix one terminal pattern.',
    references: ['veins', 'venousStudy', 'mra'],
  },
  'ileal-vein': {
    fmaId: 'FMA15405', laterality: 'unspecified',
    body: 'Where resolved on venous-sensitive MR, orient the selected ileal vein among mesenteric tributaries approaching the superior mesenteric vein.',
    pitfall: 'One source-labelled vein does not represent every ileal tributary or a complete bowel drainage territory.',
    references: ['veins', 'mra'],
  },
  'middle-colic-vein': {
    fmaId: 'FMA15406', laterality: 'midline',
    body: 'Where resolved, relate this transverse-mesocolon vein to its receiving mesenteric vein on MR source sections.',
    pitfall: 'The adjacent middle colic artery does not define the venous junction; the model does not validate its complete tributary pattern.',
    references: ['veins', 'mra'],
  },
  'right-colic-vein': {
    fmaId: 'FMA15407', laterality: 'right',
    body: 'Where resolved, follow the right-colon venous channel towards the superior mesenteric venous region.',
    pitfall: 'Do not relabel an adjacent channel as an accessory right colic vein or presume a particular gastrocolic confluence from this selection.',
    references: ['veins', 'mra'],
  },
  'anterior-superior-pancreaticoduodenal-artery': {
    fmaId: 'FMA14782', laterality: 'unspecified',
    body: 'Where arterial MR resolves it, orient the superior anterior branch from the gastroduodenal region along the front of the pancreatic head.',
    pitfall: 'An apparent overlap with an inferior branch does not prove a continuous anterior arcade in this donor.',
    references: ['arteries', 'arcadesStudy', 'mra'],
  },
  'posterior-superior-pancreaticoduodenal-artery': {
    fmaId: 'FMA14784', laterality: 'unspecified',
    body: 'Where resolved, distinguish the superior posterior course behind the pancreatic head from the anterior branch.',
    pitfall: 'The posterior origin and arch configuration vary; position alone cannot prove gastroduodenal continuity or a complete posterior arcade.',
    references: ['arteries', 'arcadesStudy', 'mra'],
  },
  'dorsal-pancreatic-artery': {
    fmaId: 'FMA14787', laterality: 'unspecified',
    body: 'Where resolved, relate this pancreatic-neck branch to its actual proximal arterial origin on MR source sections.',
    pitfall: 'A CT study found differing origins, including splenic and superior mesenteric sources; this static model cannot assign a patient-specific origin.',
    references: ['arteries', 'dorsalStudy', 'mra'],
  },
  'inferior-pancreatic-artery': {
    fmaId: 'FMA14790', laterality: 'unspecified',
    body: 'Where resolved, orient this inferior pancreatic-body course in relation to the dorsal pancreatic branch.',
    pitfall: 'The selected surface cannot establish intraglandular continuity or a complete longitudinal arterial connection.',
    references: ['arteries', 'dorsalStudy', 'mra'],
  },
  'great-pancreatic-artery': {
    fmaId: 'FMA14792', laterality: 'unspecified',
    body: 'Where resolved, relate a pancreatic-body branch to the splenic arterial course and confirm its actual direction on source sections.',
    pitfall: 'A splenic pancreatic branch can take a variant superior course; calibre or a projected crossing cannot identify this named artery.',
    references: ['arteries', 'greatStudy', 'mra'],
  },
  'caudal-pancreatic-artery': {
    fmaId: 'FMA14793', laterality: 'unspecified',
    body: 'Where resolved, orient the caudal pancreatic branch towards the tail near the splenic end of the gland.',
    pitfall: 'This tail-directed source segment does not prove its exact origin or junction with other pancreatic arteries.',
    references: ['arteries', 'mra'],
  },
  'inferior-pancreaticoduodenal-artery': {
    fmaId: 'FMA14805', laterality: 'unspecified',
    body: 'Where resolved, follow the inferior pancreaticoduodenal route from the mesenteric region towards the lower pancreatic head.',
    pitfall: 'Cadaveric origins and arcade configurations vary; this selection cannot establish one shared trunk for both inferior branches.',
    references: ['arteries', 'arcadesStudy', 'mra'],
  },
  'pancreaticoduodenal-vein': {
    fmaId: 'FMA15398', laterality: 'unspecified',
    body: 'Where venous-sensitive MR resolves them, orient pancreatic-head drainage towards the mesenteric or portal venous region.',
    pitfall: 'Three donor components form this grouped selection; they are not three validated named veins or a complete venous arcade.',
    references: ['veins', 'mra'],
  },
  'anterior-inferior-pancreaticoduodenal-artery': {
    fmaId: 'FMA70479', laterality: 'unspecified',
    body: 'Where resolved, distinguish this inferior anterior branch along the front of the pancreatic head from the posterior branch.',
    pitfall: 'Its origin and connection with the superior anterior branch require actual continuity; the donor does not prove a complete arch.',
    references: ['arteries', 'arcadesStudy', 'mra'],
  },
  'posterior-inferior-pancreaticoduodenal-artery': {
    fmaId: 'FMA70480', laterality: 'unspecified',
    body: 'Where resolved, locate the inferior posterior branch behind the pancreatic head relative to its anterior counterpart.',
    pitfall: 'A projected crossing cannot establish its origin or an intact posterior anastomosis; cadaveric configurations vary.',
    references: ['arteries', 'arcadesStudy', 'mra'],
  },
  'gastroduodenal-trunk': {
    fmaId: 'FMA76574', laterality: 'unspecified',
    body: 'Where resolved, orient this gastroduodenal trunk from the hepatic arterial region towards the proximal duodenum and pancreatic head.',
    pitfall: 'The selected source is trunk only; it does not show the complete set of gastroduodenal branches.',
    references: ['arteries', 'mra'],
  },
  'left-gastroepiploic-vein': {
    fmaId: 'FMA15390', laterality: 'left',
    body: 'Where resolved, follow this left greater-curvature venous route towards the splenic venous region.',
    pitfall: 'Do not confuse it with a lesser-curvature gastric vein or assume the exact terminal junction from this donor.',
    references: ['veins', 'mra'],
  },
  'right-gastroepiploic-vein': {
    fmaId: 'FMA15397', laterality: 'right',
    body: 'Where resolved, follow this right greater-curvature vein towards the superior mesenteric venous region near the pancreatic head.',
    pitfall: 'Its actual confluence may involve other tributaries; the right venous route is not a mirror of the left.',
    references: ['veins', 'mra'],
  },
  'right-gastric-vein': {
    fmaId: 'FMA15400', laterality: 'right',
    body: 'Where resolved, orient the right gastric vein along the lesser curvature towards portal venous drainage.',
    pitfall: 'Keep it separate from the right greater-curvature gastroepiploic vein; this static source measures no flow direction.',
    references: ['veins', 'mra'],
  },
};
