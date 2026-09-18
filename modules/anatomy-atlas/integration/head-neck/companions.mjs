// Explicit, source-bound files only. Never traverse source folders: they also
// contain audit-only models and original archives not needed by this delivery.
export const regionalCompanions = [
  ['public/models/bodyparts3d/full-body/catalog.json', 'models/bodyparts3d/full-body/catalog.json'],
  ...['README.md','display-correction.json'].map(name => [`public/models/bodyparts3d/celiac-display/${name}`, `models/bodyparts3d/celiac-display/${name}`]),
  ...['dark', 'light'].map(t => [`public/brand/visible-medicine-lockup-${t}.png`, `brand/visible-medicine-lockup-${t}.png`]),
  ...['LICENSE', 'LICENSES/THIRD_PARTY_NOTICES.md', 'LICENSES/CC-BY-4.0.txt', 'LICENSES/BODYPARTS3D.md', 'LICENSES/BODYPARTS3D_FULL_BODY.md', 'LICENSES/bodyparts3d-license-evidence.html'].map(p => [p, p]),
  ['integration/head-neck/credits.html', 'models/bodyparts3d/credits.html'],
  ...['bodyparts3d-v3/abdominal-wall', 'bodyparts3d-v3/back-layers', 'hra-renal','hra-pelvis'].flatMap(folder => ['catalog.json', 'NOTICE.md'].map(name => [`public/models/${folder}/${name}`, `models/${folder}/${name}`])),
  ...['abdominal-wall','back-layers'].flatMap(specimen=>['source-readme.html', 'license-deed.html', 'license-legalcode.html', 'source-audit.json'].map(name => [`content/sources/bodyparts3d-v3-${specimen}/${name}`, `models/bodyparts3d-v3/${specimen}/${name}`])),
  ['lib/abdominal-wall.ts', 'models/bodyparts3d-v3/abdominal-wall/specimen-data.ts.txt'],
  ['lib/back-layers.ts', 'models/bodyparts3d-v3/back-layers/specimen-data.ts.txt'],
  ['content/sources/hra-renal/metadata.json', 'models/hra-renal/source-metadata.json'],
  ['content/sources/hra-pelvis/metadata.json', 'models/hra-pelvis/source-metadata.json'],
  ...['um-knee','um-limb'].map(folder=>[`public/models/${folder}/catalog.json`,`models/${folder}/catalog.json`]),
  ...['readme.txt','dataverse.json'].map(name=>[`LICENSES/um-lower-limb-v1-2/${name}`,`LICENSES/um-lower-limb-v1-2/${name}`]),
  ['integration/lower-limb/MODEL_NOTICE.md','models/um-limb/MODEL_NOTICE.md'],
];
