// Create only the reviewable seam proposal after stock coverage generation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';

const stage='F:/VisibleMedicine/staging/20261028-quadriceps-website';
const proposal='F:/VisibleMedicine/staging/20261028-quadriceps-coverage-proposal';
const prep=json(stage+'/PREPARATION.json'),parent=json(prep.parent.path),native=json(prep.native.path);
assert.equal(prep.schema,'vm-quadriceps-website-preparation/1');
assert.equal(hash(prep.parent.path),'4764d6b96003443c3a81302aa4a50f2fbf5576832281e8472bd68b218eee44db');
assert.equal(hash(prep.native.path),'642b0ac8e9cf0b99a56cf571110bafc2c3c0ccd521d9e86321082c687fa2ef3d');
assert.equal(prep.atlasHead,'44516d0ab85be6c6d6a3accec42b1e7372a0886b');
assert.equal(parent.atlasHead,native.parentHead);
assert(json(stage+'/checks/coverage-generate-attempt-1/RESULT.json').passing);
const old=json(parent.website+'/docs/anatomy-coverage/index.json');
const nativeRows=new Map(native.sourceRows.map(row=>[row.path,row.sha256]));
assert.equal(Object.keys(old.evidence.sourceInputs).length,171);
assert.deepEqual(Object.entries(old.evidence.sourceInputs).filter(([path,sha])=>nativeRows.get(path)!==sha),[],
  'Quadriceps tour changes no existing coverage source input');
assert(!fs.existsSync(proposal),'Create-only coverage proposal');
fs.mkdirSync(proposal+'/witness',{recursive:true});
for(const [path,name] of [
 ['docs/anatomy-coverage/index.json','index.json.raw'],
 ['lib/anatomy-coverage-view.ts','anatomy-coverage-view.ts.raw'],
 ['scripts/check-anatomy-coverage.mjs','check-anatomy-coverage.mjs.raw'],
]){
 const row=parent.sourceRows.find(row=>row.path===path);assert(row);
 assert.equal(hash(prep.website+'/'+path),row.sha256);
 fs.copyFileSync(prep.website+'/'+path,proposal+'/witness/'+name,fs.constants.COPYFILE_EXCL);
}
const helper=new URL('./prepare-quadriceps-coverage-seams-20261028.mjs',import.meta.url);
assert.equal(hash(helper),'1face61adceb6bb9235ae7bd23370c65749d33ac784ccfa3b711aa0b3d4248a9');
fs.copyFileSync(helper,proposal+'/prepare-seams.mjs',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(proposal+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),website:prep.website,coverage:stage+'/coverage-candidate',nativeHead:prep.atlasHead,parent:{path:prep.parent.path,sha256:hash(prep.parent.path)},native:{path:prep.native.path,sha256:hash(prep.native.path)},helper:{path:proposal+'/prepare-seams.mjs',sha256:hash(proposal+'/prepare-seams.mjs')},unchangedCoverageSourceInputs:171,stockGeneratorPassed:true,installed:false,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proposal,helperSha256:hash(proposal+'/prepare-seams.mjs'),changedCoverageInputs:0,installed:false}));
