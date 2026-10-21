/** Public notice index only. Never enumerate private study paths or decisions. */
export const viewerNoticeLinks = [
  { label: 'Whole-body and regional 3D', base: '/atlas-runtime/head-neck' },
  { label: 'Shoulder', base: '/atlas-runtime/shoulder' },
  { label: 'Female pelvis', base: '/atlas-runtime/female-pelvis' },
  { label: 'Independent lower-limb specimen', base: '/atlas-runtime/lower-limb' },
] as const;

export const previewCredits = [
  { modality: '3D', credit: 'BodyParts3D, © The Database Center for Life Science', licence: 'CC BY 4.0',
    source: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
    context: 'Adapted shoulder-viewer capture, with display colours, illustrative treatment and crop; not the complete whole-body atlas.' },
  { modality: 'CT', credit: 'Mikael Häggström, M.D.', licence: 'CC0 1.0',
    source: 'https://commons.wikimedia.org/wiki/File:CT_of_a_normal_brain,_axial_11.png',
    context: 'A separate axial reference image, not the interactive CT dataset.' },
  { modality: 'MRI', credit: 'Brian L. Edlow et al. (2019); WebM conversion by Jahobr', licence: 'CC0 1.0',
    source: 'https://doi.org/10.5061/dryad.119f80q',
    context: 'Frame from an ex-vivo research-brain movie; not an in-vivo normal head scan.' },
  { modality: 'Ultrasound', credit: 'Mikael Häggström, M.D.', licence: 'CC0 1.0',
    source: 'https://commons.wikimedia.org/w/index.php?title=File:Ultrasonography_of_diastasis_recti.jpg&oldid=451109475',
    context: 'An abdominal-wall case showing diastasis recti, not a normal-anatomy claim or released ultrasound lesson.' },
  { modality: 'X-ray', credit: 'Stillwaterising', licence: 'CC0 1.0',
    source: 'https://commons.wikimedia.org/wiki/File:Chest_Xray_PA_3-8-2010.png',
    context: 'A separate chest radiograph used as a modality reference preview.' },
] as const;
