// Original factual summaries only; the cited works supply no reusable prose or figures.
export const spinalDiscFunctionFacts = {
  shared: 'Intervertebral discs are fibrocartilaginous joints between vertebral bodies. An outer annulus surrounds an inner nucleus; together they help cushion and distribute load while allowing movement between bodies.',
} as const;

export const spinalDiscFunctionGroups = {
  cervicalDisc: {
    body: 'This source-labelled cervical disc participates in load transfer during neck movement. In a cadaveric cervical study, internal stress distribution changed with posture and loading.',
    bullets: [
      'Compare the selected disc with the neighbouring bodies as a functional unit, without assigning a patient imaging interval from its source name.',
      'Posture and load matter to the cervical stress pattern; lumbar mechanics cannot simply be carried over to this region.',
      'The study measured cadaveric behaviour. This static surface cannot show stress within the selected disc or predict an individual response.',
    ],
    references: [
      'https://anatomy.ttuhscep.edu/anatomytables/joints_back.html',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC2078298/',
    ],
  },
  thoracicDisc: {
    body: 'This source-labelled thoracic disc contributes to load transfer within the thoracic column. An in-vitro study found that disc pressure varied with loading direction and segmental region.',
    bullets: [
      'A thoracic disc should be considered with its surrounding vertebral and rib-cage context, rather than as an isolated spacer.',
      'The tested pressure pattern depended on direction and region; one fixed value would obscure those differences.',
      'The experiment retained short rib stumps rather than an intact rib cage, so it does not supply universal motion or force claims for patients.',
    ],
    references: [
      'https://anatomy.ttuhscep.edu/anatomytables/joints_back.html',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC7311578/',
    ],
  },
  lumbarDisc: {
    body: 'This source-labelled lumbar disc helps distribute loads between vertebral bodies. A cadaveric study found that internal load sharing changed with tissue condition.',
    bullets: [
      'The annulus and nucleus contribute differently to load sharing, even though this whole-disc surface does not separate them.',
      'Changes in tissue condition can alter the internal response to a load; an external outline alone cannot quantify pressure.',
      'The cadaveric findings explain a mechanical principle, not the condition or performance of this selected source mesh or any patient disc.',
    ],
    references: [
      'https://anatomy.ttuhscep.edu/anatomytables/joints_back.html',
      'https://pubmed.ncbi.nlm.nih.gov/8951017/',
    ],
  },
} as const;
