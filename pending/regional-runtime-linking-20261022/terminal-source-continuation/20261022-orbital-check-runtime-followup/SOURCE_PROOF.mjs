import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
const atlas='F:/VisibleMedicine/atlas';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(join(website,path));
const json=path=>JSON.parse(read(path));
const git=args=>execFileSync('git',['-C',atlas,'--no-replace-objects',...args],{
 windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},
});
const gitText=args=>git(args).toString('utf8').trim();
const pin=json('tests/fixtures/current-atlas-delivery.json');
const review=json('atlas-review/manifest.json');
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(gitText(['rev-parse','HEAD']),pin.source);
assert.equal(gitText(['rev-parse',`${pin.source}^{tree}`]),pin.sourceTree);
assert.equal(gitText(['status','--porcelain=v1']),'');
assert.equal(review.revision,pin.source);
const paths=['content/orbital-support-mri-pins.json','content/orbital-support-mri.ts','lib/orbital-support-mri.ts'];
const historical='f5052a1906bf9b87e5235bda57d367b1103729db';
const sourceHashes=Object.fromEntries(paths.map(path=>[path,sha(git(['show',`${pin.source}:${path}`]))]));
for(const path of paths){
 assert.deepEqual(git(['show',`${historical}:${path}`]),git(['show',`${pin.source}:${path}`]));
 const imported=review.files.find(file=>file.path===path);
 assert(imported,path);
 assert.equal(imported.sourceSha256,sourceHashes[path]);
 assert.equal(imported.importedSha256,sourceHashes[path]);
 assert.equal(sha(read('atlas-review/'+path)),sourceHashes[path]);
}
const expectedRuntime={
 'head-neck':pin.source,
 shoulder:'190a63238eadcf906abe89dcbb6a67c88afe70b9',
 'female-pelvis':'190a63238eadcf906abe89dcbb6a67c88afe70b9',
 'lower-limb':'190a63238eadcf906abe89dcbb6a67c88afe70b9',
};
assert.deepEqual(pin.runtimeSources,expectedRuntime);
for(const [module,revision] of Object.entries(expectedRuntime)){
 assert.equal(gitText(['rev-parse',`${revision}^{commit}`]),revision);
 const manifest=json(`public/atlas-runtime/${module}/manifest.json`);
 assert.equal(manifest.sourceCommit,revision,module);
 assert.equal(manifest.patientDataIncluded,false,module);
 assert.equal(manifest.clinicalApproved,false,module);
 if(module==='head-neck'||module==='shoulder'){
  const inputs=json(`public/atlas-runtime/${module}/source-inputs.json`);
  for(const path of paths){
   const bytes=git(['show',`${revision}:${path}`]);
   assert.equal(sha(bytes),sourceHashes[path],`${module}: ${path} source continuity`);
   assert.equal(inputs.find(file=>file.path===path)?.sha256,sha(bytes),`${module}: ${path} input`);
  }
 }
}
console.log(JSON.stringify({source:pin.source,runtimeSources:expectedRuntime,sourceHashes,closed:true}));
