import assert from 'node:assert/strict';
import {existsSync,mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website',root='F:/VisibleMedicine/staging/20261022-foot-notice-admission-proposal';
assert(!existsSync(root));
const source=json('F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/VERIFIED_SOURCE.json'),path='tests/atlas-foot-notice-epoch.test.ts';
const expected=source.sourceRows.find(row=>row.path===path);assert(expected);assert.equal(sha(read(website+'/'+path)),expected.sha256);
const historical='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const families=['head-neck','shoulder','female-pelvis','lower-limb'].map(name=>{
 const base='public/atlas-runtime/'+name+'/',current=json(website+'/'+base+'manifest.json');
 const bytes=runGit(['-C',website,'show',historical+':'+base+'manifest.json']),previous=JSON.parse(bytes);
 const nowModels=current.files.filter(row=>row.path.startsWith('models/')),oldModels=previous.files.filter(row=>row.path.startsWith('models/'));
 const dependencies=['bundled-dependencies.json','BUNDLED_NOTICES.txt'].map(path=>({path,unchanged:read(website+'/'+base+path).equals(runGit(['-C',website,'show',historical+':'+base+path]))}));
 return{name,currentSource:current.sourceCommit,historicalSource:previous.sourceCommit,modelEntriesUnchanged:JSON.stringify(nowModels)===JSON.stringify(oldModels),currentModelPaths:nowModels.length,historicalModelPaths:oldModels.length,dependencies};
});
mkdirSync(root);copyFileSync(website+'/'+path,root+'/atlas-foot-notice-epoch.test.ts');copyFileSync(website+'/'+path,root+'/atlas-foot-notice-epoch.test.ts.raw');
const receipt={at:new Date().toISOString(),website,path,originalSha256:expected.sha256,originalBytes:expected.bytes,historical,families,frozenOrCanonicalEdited:false};
writeFileSync(root+'/PREPARED.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
