import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-ae84-metadata-closure',p=json(root+'/PREPARATION.json'),site=p.website;
const dependencies=[];
for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
 const base='public/atlas-runtime/'+module+'/',manifest=json(site+'/'+base+'manifest.json');
 for(const row of manifest.files.filter(r=>r.path.endsWith('.js'))){assert(!row.path.split('/').includes('..'));const name=base+row.path,from=p.frozenWebsite+'/'+name,bytes=read(from);assert.equal(sha(bytes),row.sha256,name);
  const dest=site+'/'+name;assert(!fs.existsSync(dest));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(from,dest,fs.constants.COPYFILE_EXCL);dependencies.push({path:name,bytes:bytes.length,sha256:row.sha256});}
}
const relative='tests/atlas-label-keyboard.test.ts',bytes=read(site+'/'+relative);assert.equal(sha(bytes),p.selectedInputs.find(r=>r.path===relative).sha256);
fs.writeFileSync(root+'/atlas-label-keyboard.before.ts',bytes,{flag:'wx'});
const oldSource=JSON.parse(runGit(['-C',p.atlas,'show','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1:content/review-revisions.json'])),current=JSON.parse(runGit(['-C',p.atlas,'show',p.atlasRevision+':content/review-revisions.json']));
const id='vm:anatomy:upper-limb:shoulder:right:bone:scapula';
assert.equal(oldSource.revisions[id].geometry,'00067d00809923231bb91f559c1f8e737c6e6a36d1259c9584ee7880e79eae54');
assert.equal(current.revisions[id].geometry,'614a581d1199ac3ab85e3e833f304dc927508b23bd10f5a7e49fdc9ada48900a');
assert.equal(json(site+'/atlas-review/content/review-revisions.json').sourceRevisions[id].geometry,current.revisions[id].geometry);
const report={at:new Date().toISOString(),test:relative,originalSha256:sha(bytes),copiedRuntimeJavaScript:dependencies,oldSource:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',currentSource:p.atlasRevision,oldGeometry:oldSource.revisions[id].geometry,currentGeometry:current.revisions[id].geometry,
 diagnosis:'Literal current geometry expectation is authentic old6d7 geometry, while imported geometry exactly matches current2381 commit. Both keyboard source files retain their exact unchanged hashes. This is an epoch-role conflict, not evidence of a mesh or label behavior defect.',modelsRead:false,previewChanged:false};
fs.writeFileSync(root+'/SHOULDER_DIAGNOSIS.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/SHOULDER_DIAGNOSIS.json',sha256:sha(read(root+'/SHOULDER_DIAGNOSIS.json')),runtimeJsFiles:dependencies.length,modelsRead:false}));
