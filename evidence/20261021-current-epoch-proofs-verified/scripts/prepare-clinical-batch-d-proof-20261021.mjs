import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,sha,json} from './source-only-backup-20261019.mjs';
const sourceSite='F:/VisibleMedicine/staging/20261021-source190-website/website';
const atlas='F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const proposal='F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-d';
const stage='F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-d-native-proof';
const subjects=['clinical-review-model-inspection.test.mjs','clinical-review-orbital-sensory-mri.test.ts','clinical-review-pancreatic-vessel-teaching.test.ts'];
const frozen=new Map(json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json').map(row=>[row.path,row.sha256]));
const proposed=[...subjects.map(name=>'tests/'+name),...subjects.map(name=>'tests/fixtures/'+name+'.raw'),'tests/clinical-epoch-batch-d-preservation.test.mjs'].map(p=>({path:p,sha256:sha(read(proposal+'/'+p)),beforeSha256:frozen.get(p)??null,from:proposal+'/'+p}));
for(const row of proposed){assert.equal(row.beforeSha256?sha(read(sourceSite+'/'+row.path)):fs.existsSync(sourceSite+'/'+row.path),row.beforeSha256??false,row.path);}
for(const name of subjects)assert.equal(sha(read(proposal+'/tests/fixtures/'+name+'.raw')),frozen.get('tests/'+name));
assert(!process.env.VM_WEBSITE_ROOT,'No ambient website-root override in isolated controlled-component proof');
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const site=stage+'/native-check';fs.mkdirSync(site);fs.mkdirSync(site+'/tests');
for(const folder of ['node_modules','lib','atlas-review'])fs.symlinkSync(sourceSite+'/'+folder,site+'/'+folder,'junction');
fs.copyFileSync(sourceSite+'/package.json',site+'/package.json',fs.constants.COPYFILE_EXCL);
for(const row of proposed){const dest=site+'/'+row.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(row.from,dest,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(dest)),row.sha256);}
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({stage,site,atlas,sourceSite,proposal,proposed,readOnlyJunctions:['node_modules','lib','atlas-review'],scope:'Only3 native whole-source inverses and2 real-source controlled model-inspection cases. Source-bound orbital and pancreatic teaching tests are copied but NOT executed. No full build/types/browser/authentication/clinical acceptance; no source edits. Retain junction harness without recursive deletion or packaging.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,paths:proposed.length,subjectsExecuted:2,heavyJobUntouched:true}));
