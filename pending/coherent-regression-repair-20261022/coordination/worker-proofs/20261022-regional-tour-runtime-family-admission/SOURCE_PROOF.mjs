// Pure byte/Git proof only; never imports or runs website tests, transpilers or validators.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {regionalTourRoleNames,restorePriorRegionalTourRole} from './CODE/tests/regional-tour-role-inverse.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const cases=[
 ['clinical-review-elbow-arterial-tour.test.ts','1b2f22d6bee38da836cc3e491b1b16fec3c0bc4fca0b577cf9e127cf0d081490','4cfe1d8c84bd0be8f628ac4c1e5bf8d080f563e608a6918c77ed550be50b0402',2],
 ['clinical-review-lower-venous-tour-v2.test.ts','f52a3fd3ba12fc9836344febb9ab59a0a6c3f2b9bd6199595e0def5ef74ad4ae','a06c263636799e7238d200f38061d6e6340da28ccb9619fc51da0711166e24a9',3],
 ['clinical-review-medial-thigh-tour.test.ts','03b265445b7937621a9d01ce849294ea170232c245f6f8c7a3f34b19325b4916','558c0c4d8565651bfaacb6e9b47277dafc4446e6532deb5bf36d7e1001ee2406',3],
 ['clinical-review-portal-hepatic-tour.test.ts','f6276358748589754a53ef567e03c1b963973e3ec326f6e26ae3aa20c04b0e30','dd2b6307e31504c69710ae809756db7cc7b34ae4369f802576d34289ce6c34c3',3],
 ['clinical-review-pulmonary-venous-tour.test.ts','cb7d62d8efba6f4fb6bc2541f13a8eb3012e780815537156d67936f3dbb06a11','ccbd8ac7c367eef9021d0da686b23bb70dc3ab16add770a5f22c3c0763f5de1b',3],
 ['clinical-review-regional-tour.test.ts','af4d4f3efee33d61db8c1769632909680bf07e89d46e514c97601499097ea7ff','5e07bfe4b0fab462660f6d01c59f91b6cc4630202cdcdb5aecb8b68315cec3e7',5],
];
const read=(part,name)=>readFileSync(new URL(`./${part}/tests/${name}`,import.meta.url));
function hunks(before,after){
 const a=before.split('\n'),b=after.split('\n');
 const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)
  dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const result=[];let i=0,j=0,open=null;
 const flush=()=>{if(open){result.push(open);open=null;}};
 while(i<a.length||j<b.length){
  if(i<a.length&&j<b.length&&a[i]===b[j]){flush();i++;j++;continue;}
  if(!open)open={beforeStart:i,afterStart:j,removed:[],added:[]};
  if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))open.removed.push(a[i++]);
  else open.added.push(b[j++]);
 }
 flush();return result;
}
for(const [name,rawSha,codeSha,count] of cases){
 const raw=read('RAW',name),code=read('CODE',name);
 assert.equal(sha(raw),rawSha,'Exact frozen whole preimage: '+name);
 assert.equal(sha(code),codeSha,'Exact proposed whole source: '+name);
 assert.equal(raw.includes(Buffer.from('\r\n')),false,'LF frozen source: '+name);
 assert.equal(code.includes(Buffer.from('\r\n')),false,'No EOL migration: '+name);
 const before=raw.toString('utf8'),after=code.toString('utf8'),edits=hunks(before,after);
 assert.equal(edits.length,count,'Only reviewed source-role hunks: '+name);
 assert.equal((before.match(/\btest\('/g)||[]).length,(after.match(/\btest\('/g)||[]).length,'All registered tests retained');
 assert.equal((before.match(/\bassert\./g)||[]).length<= (after.match(/\bassert\./g)||[]).length,true,'No assertion removal');
 for(const edit of edits){
  const text=edit.added.join('\n');
  assert.match(text,/CURRENT_ATLAS_REVISION|runtimeSources|validateCurrentAtlasDelivery|pin\.source/,
   'Every edit is an authenticated current/family role seam: '+name);
 }
 const inverse=after.split('\n');
 for(const edit of edits.toReversed()){
  assert.deepEqual(inverse.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added,'Exact inverse segment: '+name);
  inverse.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 assert.deepEqual(Buffer.from(inverse.join('\n')),raw,'Whole frozen original reconstructed: '+name);
 assert.notEqual(sha(Buffer.from(after.replace('runtimeSources','runtimeSourcez'))),codeSha,'Substitution refused: '+name);
 assert.notEqual(sha(Buffer.from(after+'\n'+after)),codeSha,'Duplicate refused: '+name);
 assert.notEqual(sha(Buffer.from(after.replace(/CURRENT_ATLAS_REVISION|runtimeSources|validateCurrentAtlasDelivery/,''))),codeSha,'Missing seam refused: '+name);
}
const adapted=['clinical-review-elbow-arterial-tour.test.ts','clinical-review-lower-venous-tour-v2.test.ts',
 'clinical-review-medial-thigh-tour.test.ts','clinical-review-regional-tour.test.ts'];
assert.deepEqual(regionalTourRoleNames,adapted);
assert.equal(sha(readFileSync(new URL('./CODE/tests/regional-tour-role-inverse.mjs',import.meta.url))),
 'cc24d5aa06dd0bb5b0e614222fff50238a40565d61ddd5fc31d624a08459cec4');
for(const name of adapted){
 const current=read('CODE',name),prior=read('RAW',name);
 const fixture=readFileSync(new URL('./CODE/tests/fixtures/regional-tour-role-prior/'+name+'.raw',import.meta.url));
 assert.deepEqual(fixture,prior,'Full frozen CODE fixture: '+name);
 assert.deepEqual(restorePriorRegionalTourRole(name,current),prior,'Actual authored adapter success: '+name);
 for(const mutant of [
  Buffer.from(current.toString('utf8').replace('runtimeSources','runtimeSourcez')),
  Buffer.concat([current,current]),
  Buffer.from(current.toString('utf8').replace(/CURRENT_ATLAS_REVISION|runtimeSources|validateCurrentAtlasDelivery/,'')),
 ])assert.throws(()=>restorePriorRegionalTourRole(name,mutant),'Unknown/substituted/duplicate current source refused: '+name);
 assert.throws(()=>restorePriorRegionalTourRole(name,current,{readPrior:()=>Buffer.concat([fixture,Buffer.from('forged')])}),
  'Fixture corruption refused: '+name);
}
assert.throws(()=>restorePriorRegionalTourRole('not-admitted',Buffer.alloc(0)),'Unknown path refused');
const witnesses=[
 ['clinical-epoch-batch-c-originals.test.mjs','d3f5a72b343c8856a030ccdefd8a2d6fe733248f3cf892dcf77855bb3d0120f5','b576d85a62871a868b6af80e4e46cefc9846371aee32da776a839ad7c8b99091'],
 ['elbow-current-lifecycle-preservation.test.mjs','7d0c39c16ad534409dc29bc0b6ad4c994f3c24b167a001ce80483db385da8e9a','4695e45bf01d9f6bb4e86eb8a181a03e61b8d3ea24b02b7e33875c8d59c97c06'],
 ['regional-tour-role-preservation-20261021.test.mjs','60d340be22a36780958c15a76fef4823d4f1c028f3279dedfe60132a3dc53645','11900802b88e160a98b7810f18dc0afae9b4df66918f2cbaf148dc49aecba912'],
];
for(const [name,rawSha,codeSha] of witnesses){
 const raw=read('RAW',name),code=read('CODE',name);
 assert.equal(sha(raw),rawSha);assert.equal(sha(code),codeSha);
 assert.equal(raw.includes(Buffer.from('\r\n')),code.includes(Buffer.from('\r\n')),'Witness EOL unchanged');
 const before=raw.toString('utf8'),after=code.toString('utf8'),edits=hunks(before,after);
 assert.equal(edits.length,2,'Only adapter import and exact-source seam: '+name);
 assert.equal((before.match(/\btest\('/g)||[]).length,(after.match(/\btest\('/g)||[]).length,'Historical theorem title/count intact');
 const inverse=after.split('\n');
 for(const edit of edits.toReversed()){
  assert.deepEqual(inverse.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added);
  inverse.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 assert.deepEqual(Buffer.from(inverse.join('\n')),raw,'Complete original witness inverse: '+name);
}
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const pin=JSON.parse(readFileSync(website+'/tests/fixtures/current-atlas-delivery.json'));
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(pin.runtimeSources['head-neck'],pin.source);
for(const module of ['shoulder','lower-limb','female-pelvis'])
 assert.equal(pin.runtimeSources[module],'190a63238eadcf906abe89dcbb6a67c88afe70b9');
const review=JSON.parse(readFileSync(website+'/atlas-review/manifest.json'));
const viewer=JSON.parse(readFileSync(website+'/public/atlas-review-viewer/manifest.json'));
assert.equal(review.revision,pin.source);assert.equal(viewer.sourceCommit,pin.source);
for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
 const manifest=JSON.parse(readFileSync(website+'/public/atlas-runtime/'+module+'/manifest.json'));
 assert.equal(manifest.sourceCommit,pin.runtimeSources[module],'Actual frozen family manifest: '+module);
}
const atlas='F:/VisibleMedicine/atlas';
const git=args=>execFileSync('git',args,{cwd:atlas,encoding:'utf8',env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
assert.equal(git(['rev-parse','HEAD']),pin.source);
assert.equal(git(['merge-base',pin.runtimeSources.shoulder,pin.source]),pin.runtimeSources.shoulder);
for(const path of ['lib/regional-tours.ts','lib/lower-venous-tour.ts','content/lower-venous-tour-v2-pins.json',
 'lib/medial-thigh-tour.ts','content/medial-thigh-tour-pins.json','app/structure-quick-check.tsx',
 'lib/elbow-arterial-tour.ts','content/elbow-arterial-tour-pins.json',
 'lib/portal-hepatic-tour.ts','content/portal-hepatic-tour-pins.json',
 'lib/pulmonary-venous-tour.ts','content/pulmonary-venous-tour-pins.json'])
 assert.equal(git(['rev-parse',pin.source+':'+path]),git(['rev-parse',pin.runtimeSources.shoulder+':'+path]),
  'Authenticated unchanged family source across 190a→6d7: '+path);
process.stdout.write('SOURCE_ONLY_OK: nine whole RAW inverses, four direct adapter successes with source/fixture mutants refused, exact Review/family Git sources; native tests deferred.\n');
