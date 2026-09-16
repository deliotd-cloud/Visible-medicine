// Original brief educational synthesis; reading links are not image licences.
export const rectalDeferentImagingReferences = {
  rectalMri: 'https://link.springer.com/article/10.1007/s00330-025-12274-w',
  rectalModalities: 'https://acsearch.acr.org/docs/3195870/Narrative/',
  lowerGi: 'https://www.radiologyinfo.org/en/info/lowergi',
  plainFilm: 'https://www.radiologyinfo.org/en/info/abdominrad',
  maleImaging: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11782349/',
  ductAnatomy: 'https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html',
} as const;
export type RectalDeferentModality = 'ct' | 'mri' | 'ultrasound' | 'xray';
type Reference = keyof typeof rectalDeferentImagingReferences;
type Topic = { body: string; pitfall: string; references: Reference[] };
type Group = {
  fmas: readonly string[];
  limit: string;
  focus: Record<RectalDeferentModality, Topic>;
};

export const rectalDeferentImagingGroups: Record<string, Group> = {
  rectum: {
    fmas: ['FMA14544'],
    limit: 'Root rectal surface only: no separate wall layers, mesorectal fascia, tumour or complete sphincter complex. The independent female-pelvic specimen has separate teaching.',
    focus: {
      ct: {
        body: 'Use pelvic CT for cross-sectional orientation of the rectum and neighbouring organs. CT and dedicated rectal MRI answer different imaging questions; this surface does not substitute for either examination.',
        pitfall: 'A visible rectal outline is not a local tumour stage or a measured mesorectal margin.',
        references: ['rectalModalities'],
      },
      mri: {
        body: 'High-resolution T2-weighted rectal MRI depicts local pelvic anatomy. Distinguish the rectal wall, surrounding mesorectum and mesorectal fascia when reviewing the acquired images.',
        pitfall: 'These are not independently segmented layers in this model. No tumour stage, diffusion result or resection margin can be read from the mesh.',
        references: ['rectalMri'],
      },
      ultrasound: {
        body: 'Endorectal ultrasound examines the rectal wall at close range and has a role in selected early-tumour assessment. It is a different examination from routine transabdominal pelvic ultrasound.',
        pitfall: 'This shell supplies neither ultrasound wall-layer echoes nor a tumour-depth measurement, and does not prescribe an endorectal examination.',
        references: ['rectalMri'],
      },
      xray: {
        body: 'Abdominal radiographs show less anatomical detail than CT or MRI. Lower-GI contrast fluoroscopy can outline the bowel lumen but is a different examination from a plain radiograph.',
        pitfall: 'The atlas supplies no contrast-filled lumen or fluoroscopic sequence; a smooth source surface does not exclude mucosal disease.',
        references: ['lowerGi', 'plainFilm'],
      },
    },
  },
  deferent: {
    fmas: ['FMA19236', 'FMA19235'],
    limit: 'Source-labelled whole-duct surface only: no validated continuous lumen, epididymal connection, ejaculatory-duct segmentation, flow, obstruction or fertility assessment.',
    focus: {
      ct: {
        body: 'Orient the selected duct along the inguinal canal and posterior bladder region before comparing it with acquired CT. Distinguish its surface from the adjacent seminal-vesicle surface.',
        pitfall: 'This reference is not a CT lumen segmentation. No CT density, calcification or contrast phase is encoded in the surface.',
        references: ['ductAnatomy'],
      },
      mri: {
        body: 'Pelvic MRI can depict the intra-abdominal deferent duct, a course that can be difficult to examine with ultrasound. Relate the terminal duct to the seminal-vesicle region.',
        pitfall: 'A visible duct segment or close surface contact is not proof of an uninterrupted lumen or normal transport.',
        references: ['maleImaging', 'ductAnatomy'],
      },
      ultrasound: {
        body: 'Scrotal ultrasound can depict accessible deferent-duct segments. Suprapubic or transrectal ultrasound examines a different, pelvic portion of the reproductive tract; no single view represents the entire source surface.',
        pitfall: 'This model supplies no probe position, wall echoes, calibre measurement or patency assessment. Do not infer congenital absence from an incomplete view.',
        references: ['maleImaging'],
      },
      xray: {
        body: 'Abdominal radiographs show less anatomical detail than CT or MRI. Use this 3D duct outline for anatomical orientation, not as a simulated radiographic finding.',
        pitfall: 'No duct opacification, calcification or radiographic continuity is simulated; a visible source surface does not prove an open lumen.',
        references: ['plainFilm'],
      },
    },
  },
};
