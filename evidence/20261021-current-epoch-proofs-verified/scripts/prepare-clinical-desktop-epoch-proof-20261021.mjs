import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,sha,json} from './source-only-backup-20261019.mjs';
const sourceSite='F:/VisibleMedicine/staging/20261021-source190-website/website';
const atlas='F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const proposal='F:/VisibleMedicine/staging/20261021-clinical-viewer-epoch-proposal';
const stage='F:/VisibleMedicine/staging/20261021-clinical-desktop-epoch-native-proof';
const subject='tests/clinical-review-desktop-layout.test.mjs';
const frozen=json('F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json');
const preimage=frozen.find(row=>row.path===subject);assert(preimage);
assert.equal(sha(read(sourceSite+'/'+subject)),preimage.sha256);
const source=read(proposal+'/'+subject).toString();
assert.equal((source.match(/^test\(/gm)||[]).length,7);
assert(source.includes('all four original layout assertions reconstruct exactly'));
const originals=['tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs','package.json'];
const junctions=['tests/fixtures','components','app','scripts','docs','lib','atlas-review','public','node_modules'];
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const site=stage+'/native-check';fs.mkdirSync(site);fs.mkdirSync(site+'/tests');
for(const p of junctions){const target=site+'/'+p;fs.mkdirSync(path.dirname(target),{recursive:true});fs.symlinkSync(sourceSite+'/'+p,target,'junction');}
for(const p of originals){const target=site+'/'+p;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(sourceSite+'/'+p,target,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(target)),sha(read(sourceSite+'/'+p)));}
fs.copyFileSync(proposal+'/'+subject,site+'/'+subject,fs.constants.COPYFILE_EXCL);
const prep={stage,site,atlas,sourceSite,proposal,subject,beforeSha256:preimage.sha256,sha256:sha(read(site+'/'+subject)),unchanged:originals.map(path=>({path,sha256:sha(read(sourceSite+'/'+path))})),readOnlyJunctions:junctions,scope:'Only seven native desktop CSS/context/current-delivery metadata tests. No TypeScript corpus subjects, full application build/typecheck, browser or clinical acceptance. Junction harness must never be recursively deleted or packaged.'};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,sha256:prep.sha256,tests:7,heavyJobUntouched:true}));
