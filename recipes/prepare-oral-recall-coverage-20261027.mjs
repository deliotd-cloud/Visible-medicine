// Create only the reviewable seam proposal after stock coverage generation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from './bounded-source-hash-20261026.mjs';

const stage='F:/VisibleMedicine/staging/20261027-oral-recall-website';
const proposal='F:/VisibleMedicine/staging/20261027-oral-recall-coverage-proposal';
const prep=json(stage+'/PREPARATION.json'),parent=json(prep.parent.path),native=json(prep.native.path);
assert.equal(hash(prep.parent.path),'9641cddacce5ba037eb87023b6873ad9d64a10542b490bfafbf0f318b1a939cc');
assert.equal(hash(prep.native.path),'ebe7c8272ccf51fdc9c698761513b9fb5bfae7c3184255d2ecfd90f27badb785');
assert.equal(prep.atlasHead,'dc0f5d9648b73e4baf25f468e52963b1d503df68');
assert.equal(parent.atlasHead,native.parentHead);
assert(json(stage+'/checks/coverage-generate-attempt-1/RESULT.json').passing);
const old=json(parent.website+'/docs/anatomy-coverage/index.json');
const nativeRows=new Map(native.sourceRows.map(row=>[row.path,row.sha256]));
assert.equal(Object.keys(old.evidence.sourceInputs).length,171);
assert.deepEqual(Object.entries(old.evidence.sourceInputs).filter(([path,sha])=>nativeRows.get(path)!==sha),[],
  'Oral recall changes no existing coverage source input');
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
const helper=new URL('./prepare-oral-recall-coverage-seams-20261027.mjs',import.meta.url);
assert.equal(hash(helper),'c0290dc3666bf99fc9b4bb44f8e300190accf8f35d93169b6e8ab4f2bdd391bb');
fs.copyFileSync(helper,proposal+'/prepare-seams.mjs',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(proposal+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),website:prep.website,coverage:stage+'/coverage-candidate',nativeHead:prep.atlasHead,parent:{path:prep.parent.path,sha256:hash(prep.parent.path)},native:{path:prep.native.path,sha256:hash(prep.native.path)},helper:{path:proposal+'/prepare-seams.mjs',sha256:hash(proposal+'/prepare-seams.mjs')},unchangedCoverageSourceInputs:171,stockGeneratorPassed:true,installed:false,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proposal,helperSha256:hash(proposal+'/prepare-seams.mjs'),changedCoverageInputs:0,installed:false}));
