import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-ae84-metadata-closure',site=root+'/website';
const receipt='F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/SOURCE.json';
assert.equal(sha(read(receipt)),'65d2838d513a79ecbf5f9a7eb085354c34b6ebfe0d584c445922eda8e2574522');
const source=json(receipt),rows=new Map(source.sourceRows.map(r=>[r.path,r]));
const metadata=['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json','lib/atlas-model-inventory.json',
 ...['head-neck','shoulder','lower-limb','female-pelvis'].flatMap(name=>['manifest.json','source-inputs.json'].map(file=>'public/atlas-runtime/'+name+'/'+file))];
const exact=new Set([...metadata,'package.json','AGENTS.md','components/review-ui-variants.css','components/AtlasRuntimeFrame.tsx','scripts/bind-clinical-review.mjs','app/globals.css','app/workspace/atlas-review/website-review.css',
 'atlas-review/app/globals.css','atlas-review/app/review/body/review-dashboard.tsx','atlas-review/app/review/review-dashboard.tsx','atlas-review/app/review/review-model-preview.tsx','atlas-review/app/review/review-model-preview.css',
 'atlas-review/content/review-revisions.json','atlas-review/content/body-renderer-revision.json']);
assert(!fs.existsSync(root));fs.mkdirSync(root);const selected=source.sourceRows.filter(r=>r.path.startsWith('tests/')||exact.has(r.path));
for(const p of exact)assert(rows.has(p),'Required named input: '+p);
for(const row of selected){const from=source.website+'/'+row.path;assert.equal(sha(read(from)),row.sha256,row.path);const dest=site+'/'+row.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(from,dest,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');
const pin=json(site+'/tests/fixtures/ae84-review/current-atlas-delivery.json.raw');
const missing=[];
for(const p of metadata){const bytes=read('F:/VisibleMedicine/website/'+p);assert.equal(sha(bytes),pin.documents[p],'Installed metadata is the exact historical ae84 document: '+p);
 if(sha(read(site+'/'+p))!==pin.documents[p])missing.push({path:p,sha256:pin.documents[p],currentSha256:sha(read(site+'/'+p)),bytes:bytes.length});}
// The three pre-existing reader overlays are already present; these are the
// only additional old delivery documents whose live fallback has drifted.
const already=new Set(['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json']);
const additions=missing.filter(r=>!already.has(r.path));assert.deepEqual(additions.map(r=>r.path).sort(),['lib/atlas-model-inventory.json','public/atlas-runtime/head-neck/manifest.json','public/atlas-runtime/head-neck/source-inputs.json']);
for(const row of additions){const name=row.path==='lib/atlas-model-inventory.json'?'model-inventory.json.raw':row.path.endsWith('/manifest.json')?'head-neck-manifest.json.raw':'head-neck-source-inputs.json.raw';
 const dest=root+'/authentic/'+name;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync('F:/VisibleMedicine/website/'+row.path,dest,fs.constants.COPYFILE_EXCL);Object.assign(row,{fixture:'tests/fixtures/ae84-review/'+name,authenticLocalCopy:dest});}
const inventory=json('F:/VisibleMedicine/website/lib/atlas-model-inventory.json'),currentInventory=json(source.website+'/lib/atlas-model-inventory.json');
assert.deepEqual(inventory.models,currentInventory.models,'All137 model identities, paths and bytes remain unchanged');
assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
const report={at:new Date().toISOString(),website:site,frozenWebsite:source.website,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),atlas:source.atlas,atlasRevision:source.atlasHead,atlasTree:source.atlasTree,selectedInputs:selected,additionalHistoricalDocuments:additions,
 originalHelperSha256:sha(read(site+'/tests/historical-review-ae84.mjs')),modelsUnchanged:137,scope:'Contained source/metadata-only test harness, not a complete website, runtime or binary model copy. Historical bytes are read from existing installed documents and must match the immutable ae84 pin; no metadata is generated or rewritten. Current live-delivery files remain exact frozen2381 copies.',previewChanged:false,installed:false};
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/PREPARATION.json',sha256:sha(read(root+'/PREPARATION.json')),selectedPaths:selected.length,newHistoricalMetadata:additions.map(r=>r.path),modelsUnchanged:137}));
