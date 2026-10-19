export const distalPalmarMriReference = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2734893/';
export type DistalPalmarGroup = 'metacarpal' | 'princeps' | 'indicis';
export const distalPalmarMriSelections: {fmaId:string;files:string[];group:DistalPalmarGroup}[] = [
  {fmaId:'FMA22864',files:['FJ2289'],group:'metacarpal'},
  {fmaId:'FMA22865',files:['FJ2237'],group:'metacarpal'},
  {fmaId:'FMA22905',files:['FJ2371','FJ2372'],group:'princeps'},
  {fmaId:'FMA22907',files:['FJ2338','FJ2339'],group:'princeps'},
  {fmaId:'FMA22777',files:['FJ2342','FJ2363'],group:'indicis'},
  {fmaId:'FMA22778',files:['FJ2314','FJ2332'],group:'indicis'},
];
// Original bounded summaries of primary research, not imported publisher media.
export const distalPalmarMriTopics: Record<DistalPalmarGroup,{body:string;scope:string}> = {
  metacarpal:{
    body:'Specialised non-contrast, ECG-gated VFA-FSE MRA has depicted palmar metacarpal segments. Compare source slices and reformats; routine hand MRI is not equivalent.',
    scope:'This source-labelled palmar-metacarpal selection is not a separately validated second, third or fourth artery. Do not assign a numbered branch from the grouped surface.',
  },
  princeps:{
    body:'Tailored VFA-FSE MRA has depicted princeps pollicis segments. Follow the thumb-side vessel across views; rendered proximity alone cannot establish its origin.',
    scope:'The two official source components remain one named princeps-pollicis selection. Their file identities do not justify separate branch names or a reconstructed connection.',
  },
  indicis:{
    body:'Tailored VFA-FSE MRA has depicted radialis indicis segments. The preliminary study lacked a comparison standard; poor visualisation alone cannot establish occlusion.',
    scope:'The two official source components remain one named radialis-indicis selection. Their adjacency does not prove a continuous arterial route to the index finger.',
  },
};
