// Source-only educational draft. Exact structure binding belongs to the integration layer.
const sharedMethod =
  'Conventional 3 T turbo spin-echo MRI can show nearby soft tissue while mineralized tooth components yield little or no signal. Dedicated dental sequences and coils can change what is visible; a dark area is a signal limitation, not evidence that a structure is absent.';

const sharedCitations = Object.freeze([
  'https://pubmed.ncbi.nlm.nih.gov/22707436/',
  'https://pubmed.ncbi.nlm.nih.gov/23420857/',
  'https://pubmed.ncbi.nlm.nih.gov/40301177/',
]);

export const dentalMriGroups = Object.freeze({
  incisors: Object.freeze([
    'FMA55680', 'FMA55681', 'FMA55682', 'FMA55683',
    'FMA57140', 'FMA57141', 'FMA57142', 'FMA57143',
  ]),
  canines: Object.freeze(['FMA55686', 'FMA55687', 'FMA55798', 'FMA55799']),
  premolars: Object.freeze([
    'FMA55688', 'FMA55689', 'FMA55690', 'FMA55691',
    'FMA55692', 'FMA55693', 'FMA55694', 'FMA55695',
  ]),
  molars: Object.freeze([
    'FMA55697', 'FMA55698', 'FMA55699', 'FMA55700',
    'FMA55703', 'FMA55704', 'FMA55705', 'FMA55706',
  ]),
});

export const dentalMriTopics = Object.freeze({
  incisors: Object.freeze({
    body: `These eight anterior incisors are source-labelled by upper or lower arch and left or right side. ${sharedMethod}`,
    bullets: Object.freeze([
      'Read this as an incisor-group methods orientation, not an image of the selected tooth.',
      'UTE findings for hard dental tissue used dedicated acquisition; the cited 2012 high-field UTE/ZTE examples included extracted teeth.',
    ]),
    citations: sharedCitations,
  }),
  canines: Object.freeze({
    body: `These four canines sit between incisor and premolar groups, one per side in each arch. ${sharedMethod}`,
    bullets: Object.freeze([
      'The class and side come from the selected source label; no scan is matched to this canine.',
      'A 2013 human UTE caries study found restoration artifacts and could not establish universal enamel–dentine separation.',
    ]),
    citations: sharedCitations,
  }),
  premolars: Object.freeze({
    body: `These eight source-labelled premolars comprise first and second entries in each side of both arches. ${sharedMethod}`,
    bullets: Object.freeze([
      'The 2025 3 T microscopy-coil results concern the left lower first molar region in 21 healthy volunteers, not these premolars.',
      'Signal and detail depend on sequence, coil, position and artifacts; no internal layer is supplied by this surface model.',
    ]),
    citations: sharedCitations,
  }),
  molars: Object.freeze({
    body: `These eight source-labelled first and second molars span both arches and sides; third molars are outside this subset. ${sharedMethod}`,
    bullets: Object.freeze([
      'In the cited 2025 left lower first-molar study, proton-density weighting performed best for the tested visibility measures under its protocol.',
      'That result does not show every molar or side, and this selected exterior mesh has no acquired MRI counterpart.',
    ]),
    citations: sharedCitations,
  }),
});

export const dentalMriNote =
  'Teaching draft; revision-bound radiologist review is pending. No scan or registration was imported or matched. The source supplies whole exterior tooth surfaces only: no enamel, dentine, pulp, canals, periodontal layers, clinical numbering, third molars or diagnostic findings are represented.';
