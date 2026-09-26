export type PalmarArterialModality = 'ct' | 'mri';
export type PalmarArterialGroup = 'superficial-arch' | 'deep-arch' | 'common-digital' | 'proper-digital';

export const palmarArterialReferences = {
  qissMra: 'https://pubmed.ncbi.nlm.nih.gov/33582146/',
  historicalMra: 'https://pubmed.ncbi.nlm.nih.gov/9524324/',
  superficialArchCta: 'https://link.springer.com/article/10.1007/s00276-016-1750-6',
  commonDigitalAnatomy: 'https://scholars.duke.edu/publication/1550741',
};

type Ref = keyof typeof palmarArterialReferences;
type Topic = {body: string; bullets: string[]; references: Ref[]};
type Selection = {fmaId: string; file: string; group: PalmarArterialGroup; topics: PalmarArterialModality[]};

// Closed editorial allow-list. Discovery patterns must never expand runtime admission.
export const palmarArterialSelections: Selection[] = [
  {fmaId:'FMA22839',file:'FJ2279',group:'deep-arch',topics:['mri']},
  {fmaId:'FMA22840',file:'FJ2227',group:'deep-arch',topics:['mri']},
  {fmaId:'FMA22835',file:'FJ2300',group:'superficial-arch',topics:['ct','mri']},
  {fmaId:'FMA22837',file:'FJ2248',group:'superficial-arch',topics:['ct','mri']},
  {fmaId:'FMA22856',file:'FJ2343',group:'common-digital',topics:['mri']},
  {fmaId:'FMA85118',file:'FJ2315',group:'common-digital',topics:['mri']},
  {fmaId:'FMA85119',file:'FJ2344',group:'common-digital',topics:['mri']},
  {fmaId:'FMA85120',file:'FJ2316',group:'common-digital',topics:['mri']},
  {fmaId:'FMA85121',file:'FJ2345',group:'common-digital',topics:['mri']},
  {fmaId:'FMA85122',file:'FJ2317',group:'common-digital',topics:['mri']},
  {fmaId:'FMA85123',file:'FJ2370',group:'common-digital',topics:['mri']},
  {fmaId:'FMA85124',file:'FJ2337',group:'common-digital',topics:['mri']},
  {fmaId:'FMA22858',file:'FJ2365',group:'proper-digital',topics:['mri']},
  {fmaId:'FMA22860',file:'FJ2334',group:'proper-digital',topics:['mri']},
  {fmaId:'FMA23050',file:'FJ2364',group:'proper-digital',topics:['mri']},
  {fmaId:'FMA23051',file:'FJ2333',group:'proper-digital',topics:['mri']},
  {fmaId:'FMA23052',file:'FJ2369',group:'proper-digital',topics:['mri']},
  {fmaId:'FMA23054',file:'FJ2368',group:'proper-digital',topics:['mri']},
  {fmaId:'FMA23055',file:'FJ2336',group:'proper-digital',topics:['mri']},
  {fmaId:'FMA85112',file:'FJ2367',group:'proper-digital',topics:['mri']},
  {fmaId:'FMA85115',file:'FJ2366',group:'proper-digital',topics:['mri']},
  {fmaId:'FMA85116',file:'FJ2335',group:'proper-digital',topics:['mri']},
];

// Original summaries. References do not license publisher figures or tables.
export const palmarArterialTopics: Record<PalmarArterialGroup, Partial<Record<PalmarArterialModality, Topic>>> = {
  'superficial-arch': {
    ct:{body:'CTA can show superficial palmar arch configuration and arterial contribution. Review the curved arch across contiguous images rather than assigning completeness from one slice.',bullets:['Reported anatomic variability does not establish functional collateral adequacy, and this reference surface contains no contrast, flow or patient-specific lumen.'],references:['superficialArchCta']},
    mri:{body:'Tailored non-contrast QISS MRA has depicted palmar arches. Trace the superficial arch across source slices and longitudinal reformats; routine hand MRI is not equivalent.',bullets:['Non-visualisation is not proof of absence; flow-sensitive appearance cannot be inferred from atlas colour.'],references:['qissMra']},
  },
  'deep-arch': {
    mri:{body:'Tailored non-contrast MRA can depict the deep arch. Review oblique reformats when a segment aligns with the acquisition plane.',bullets:['Historical MRA incompletely displayed some plane-parallel arch portions; this is neither a current accuracy estimate nor proof of absence.'],references:['qissMra','historicalMra']},
  },
  'common-digital': {
    mri:{body:'Tailored non-contrast MRA may depict common palmar digital arteries. Follow a trunk longitudinally toward division rather than naming it from one cross-section.',bullets:['Reported courses are usually superficial near flexor tendons, with variants including deep origin.'],references:['qissMra','commonDigitalAnatomy']},
  },
  'proper-digital': {
    mri:{body:'Tailored non-contrast MRA may depict proper palmar digital arteries. Assess distal continuity across sequential slices rather than assuming it from one bright focus.',bullets:['Older MRA incompletely displayed some digital arteries; non-visualisation does not prove absence or occlusion.'],references:['qissMra','historicalMra']},
  },
};
