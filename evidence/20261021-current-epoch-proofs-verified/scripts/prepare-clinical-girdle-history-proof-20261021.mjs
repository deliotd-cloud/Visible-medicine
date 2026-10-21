import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read, sha, json} from './source-only-backup-20261019.mjs';

const sourceSite='F:/VisibleMedicine/staging/20261021-source190-website/website';
const atlas='F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const proposal='F:/VisibleMedicine/staging/20261021-clinical-girdle-history-epoch-proposal';
const stage='F:/VisibleMedicine/staging/20261021-clinical-girdle-history-native-proof';
const rows=[
 ['tests/clinical-review-girdle-muscle-xray.test.ts','0e9acbdf4079b27520a30de4ad4efc257463260196e2199b219db454c3752e77','aad3d4eb21f3fe6f2c8a5bffce816f140276d8582142667f2aab25e3f88be339'],
 ['tests/clinical-review-git-root-preservation.test.mjs','0e244cfc0601dd9fd085e27e1ed6e75d04c30b1fac2fb6d2a0af18dff58b9c7d','d7bd7c4e5abb369c00a69cf049d02848f77064b14f757573297393eac6bab4a1'],
 ['tests/clinical-review-girdle-history-preservation.test.mjs',null,'d9f795ed98c2c58be3cfa3ec6cc0d3b39d5926607cde4b7251ee530095a2a011'],
 ['tests/fixtures/clinical-review-girdle-muscle-xray-original.ts.raw',null,'0e9acbdf4079b27520a30de4ad4efc257463260196e2199b219db454c3752e77'],
];
for(const [p,before,after] of rows){
 assert.equal(before?sha(read(sourceSite+'/'+p)):fs.existsSync(sourceSite+'/'+p),before??false,p+': exact frozen preimage');
 assert.equal(sha(read(proposal+'/'+p)),after,p+': reviewed proposal');
}
const unchanged=[
 'tests/clinical-review-salivary-stylohyoid-quiz.test.ts',
 'tests/clinical-review-teaching-heading.test.ts',
 'tests/fixtures/clinical-review-salivary-stylohyoid-quiz.before-git-root.ts.raw',
 'tests/fixtures/clinical-review-teaching-heading.before-git-root.ts.raw',
];
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const site=stage+'/native-check';fs.mkdirSync(site);
for(const p of unchanged){const dest=site+'/'+p;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(sourceSite+'/'+p,dest,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(dest)),sha(read(sourceSite+'/'+p)));}
for(const [p,,hash]of rows){const dest=site+'/'+p;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(proposal+'/'+p,dest,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(dest)),hash);}
const frozen=json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');
for(const row of frozen)assert.equal(sha(read(sourceSite+'/'+row.path)),row.sha256,row.path+': frozen input unchanged');
const prep={stage,site,atlas,sourceSite,proposal,proposed:rows.map(([path,beforeSha256,sha256])=>({path,beforeSha256,sha256})),unchanged:unchanged.map(path=>({path,sha256:sha(read(sourceSite+'/'+path))})),frozenInputs:frozen.length,scope:'Only native FS/hash whole-source guards run here. No TypeScript subject execution, current girdle9936/1104 theorem, build or typecheck. No source edits or junctions.'};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,proposed:rows.length,unchanged:unchanged.length,frozenInputs:frozen.length,heavyJobUntouched:true}));
