import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-renal-epoch-repair',site=root+'/website',receipt='F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/SOURCE.json',source=json(receipt);
assert.equal(sha(read(receipt)),'65d2838d513a79ecbf5f9a7eb085354c34b6ebfe0d584c445922eda8e2574522');assert(!fs.existsSync(root));fs.mkdirSync(root);
// Explicit source/metadata-only harness: no GLB, scans, private decisions or
// held reference derivatives. Runtime JavaScript is checked local QA input.
const selected=source.sourceRows.filter(r=>r.path.startsWith('tests/')||r.path.startsWith('atlas-review/')||
 /^public\/atlas-runtime\/[^/]+\/(?:.*\.js|manifest\.json|source-inputs\.json)$/.test(r.path)||
 ['package.json','AGENTS.md','lib/atlas-model-inventory.json','public/atlas-review-viewer/manifest.json'].includes(r.path));
for(const row of selected){assert(!/\.(?:glb|dcm|dicom|nii(?:\.gz)?|sqlite|db)$/i.test(row.path));const bytes=read(source.website+'/'+row.path);assert.equal(sha(bytes),row.sha256,row.path);const dest=site+'/'+row.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes,{flag:'wx'});}
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');
assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
const worker=['tests/clinical-review-axillary-branch-xray.test.ts','tests/clinical-review-continuous-guided-playback.test.ts','tests/clinical-review-girdle-muscle-xray.test.ts','tests/clinical-review-hand-arterial-xray.test.ts','tests/clinical-review-current-admission.mjs','tests/clinical-review-elbow-us-followup.test.ts','tests/clinical-review-forearm-vascular-xray.test.ts'];
const main=['tests/clinical-review-lower-limb-connective-xray.test.ts'];
for(const p of [...worker,...main]){const dest=root+'/preimage/'+p;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(site+'/'+p,dest,fs.constants.COPYFILE_EXCL);}
const prep={at:new Date().toISOString(),website:site,frozenSource:source.website,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),atlas:source.atlas,atlasHead:source.atlasHead,atlasTree:source.atlasTree,selectedInputs:selected,workerOwned:worker,mainOwned:main,
 scope:'Contained source/metadata/JavaScript-only test harness. Binary models and host app are absent; never claim full Website, release, browser or mesh acceptance from it. No original/current frozen source modified.',previewChanged:false,installed:false};
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/PREPARATION.json',sha256:sha(read(root+'/PREPARATION.json')),selectedPaths:selected.length,previewChanged:false}));
