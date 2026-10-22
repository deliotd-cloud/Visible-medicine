// Pure source-byte/Git proof. No website tests, validators, bundlers or TS modules execute.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {batchCRoleNames,restorePriorBatchCRole} from './CODE/tests/batch-c-role-inverse.mjs';
import {regionalTourRoleNames,restorePriorRegionalTourRole} from '../20261022-regional-tour-runtime-family-admission/CODE/tests/regional-tour-role-inverse.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const read=(part,name)=>readFileSync(new URL(`./${part}/tests/${name}`,import.meta.url));
const worker='F:/VisibleMedicine/staging/20261022-branch-hip-iliac-hepatic-family-admission';
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const priorStage='F:/VisibleMedicine/staging/20261022-regional-tour-runtime-family-admission';
const rows=[
 ['clinical-review-iliac-venous-xray.test.ts','a55f6c33ee41cccc7720482124104b529bcdfa9336ee5760ff35ec49ce34be68','2263dcdb09bcf8aa42a608db8c31075aa19b47e4101f500c9df5f07a677b8a74','4b3e6d5f6fc24cbeb19fcb43af72a97ad10160ff7778266b6f66c256fc873dba','worker'],
 ['clinical-review-intracranial-arterial-xray.test.ts','582b55d1960288b58f00cac0c2bf4b5be88df0dbe851a2e270e7522b3f9a91c8','df6c0e5b9fc90ed57d60b580c0f03360daeea3997b24c286db6d036434949c35','4fb65a161ac7114957cc6551efab2c7d3834344ee250b875240ca407bb28d740','worker'],
 ['clinical-review-limb-nerve-quiz.test.ts','74a100863fb33a27b94e7e56847c225fab618b500bfeb5f0d37971faff5781d9','fa3ff34ae74397b4f84835e0a5f5364493136114f004c26ce9d7a41acdd9d9a7','2fc0a37e63dee23f82cff25fb7caa5af6b07c2feb886802a99a2cc84d004b432','own'],
 ['clinical-review-longus-colli-quiz.test.ts','68589eca6ad26c87d2e46f57f55769b75f3e3ce0919fe5cc49ac50ae7fa32dd8','d43126d271fa2c7a957e9e9000b60b4c13e99a77afdd71d92b18e083c8399612','d050051128140219b110774454dcfdda235565d35d4c9a7a18a719330013585d','own'],
 ['clinical-review-lower-venous-tour-v2.test.ts','f52a3fd3ba12fc9836344febb9ab59a0a6c3f2b9bd6199595e0def5ef74ad4ae','a06c263636799e7238d200f38061d6e6340da28ccb9619fc51da0711166e24a9','c4eef1a6057e7bb9e9d5e197d858601b4ee353d64d0a8c09663de5a005de6d84','regional'],
 ['clinical-review-medial-thigh-tour.test.ts','03b265445b7937621a9d01ce849294ea170232c245f6f8c7a3f34b19325b4916','558c0c4d8565651bfaacb6e9b47277dafc4446e6532deb5bf36d7e1001ee2406','a72852540281e6e6525e67dad75ce888483c3040e2d6c0a780459b35bdaa62b0','regional'],
 ['clinical-review-median-cubital-xray.test.ts','886db4ebcf56a04764fb9e416aaffd61c72f9487d5d18ddc63f66b0ed6e848a4','211e92a61e4e9b7298163c20b90b04b333e9ea741654dfbada106c9537864b1f','3d7f3026f1c679ae695209c8bbe2b9f66c160fc67745d86804ea880e2b4492f4','own'],
 ['clinical-review-mesenteric-vessel-teaching.test.ts','b677b62a8c142b7e0a07ed8d225e1ba040f1e675bc3402a77d71b0883ed140b4','32a0194ad4c377346eccca8a4e4ce00e097d6b4f31c5cf3bf278db48701c8277','cc50a3c5d8a8334b3cd9f6eb92c4f7d1a1dbbd5088ba5f0a0c0c13fc1c64c26c','own'],
];
assert.deepEqual([...batchCRoleNames].sort(),rows.filter(r=>r[4]==='own'||r[4]==='worker').map(r=>r[0]).sort());
assert.deepEqual(regionalTourRoleNames.filter(n=>rows.some(r=>r[0]===n)).sort(),rows.filter(r=>r[4]==='regional').map(r=>r[0]).sort());
assert.equal(sha(read('CODE','batch-c-role-inverse.mjs')),'c0fcc58347889fb7b56fe4c43006a8cf6cbfb77e207c510d26a2ae31ad9767c4');
assert.equal(sha(readFileSync(priorStage+'/CODE/tests/regional-tour-role-inverse.mjs')),'cc24d5aa06dd0bb5b0e614222fff50238a40565d61ddd5fc31d624a08459cec4');
assert.equal(sha(readFileSync(worker+'/prove-source.mjs')),'917602d9916da84cd82d168ddf09ebac7e3b63407f8f5e391a6e40c0dd790e3f');
const inverseBytes=readFileSync(website+'/tests/fixtures/clinical-epoch-batch-c-original/inverse-hunks.json');
assert.equal(sha(inverseBytes),'a302b465f4caf1b89898bee80ea175e04e9cf15b6bd15fca0ccfbe807129ecce');
const inverse=JSON.parse(inverseBytes);
assert.equal(inverse.schema,'vm-clinical-epoch-batch-c-whole-source-inverse-1');
assert.deepEqual(inverse.files.map(f=>f.name).sort(),rows.map(r=>r[0]).sort());
function historicalInverse(source,hunks){
 let restored=source;
 for(const {before,after} of [...hunks].reverse()){
  assert(before.length>0&&after.length>0);
  assert.equal(restored.split(after).length,2,'Unique historical hunk');
  restored=restored.replace(after,before);
 }
 return restored;
}
for(const [name,priorSha,currentSha,originalSha,kind] of rows){
 const current=kind==='worker'?readFileSync(worker+'/proposal/tests/'+name):
  kind==='regional'?readFileSync(priorStage+'/CODE/tests/'+name):read('CODE',name);
 const frozen=readFileSync(website+'/tests/'+name);
 const fixture=kind==='regional'?readFileSync(priorStage+'/CODE/tests/fixtures/regional-tour-role-prior/'+name+'.raw'):
  readFileSync(new URL('./CODE/tests/fixtures/batch-c-role-prior/'+name+'.raw',import.meta.url));
 assert.equal(sha(current),currentSha,'Immutable current proposal: '+name);
 assert.equal(sha(frozen),priorSha,'Exact frozen current candidate: '+name);
 assert.deepEqual(fixture,frozen,'Full frozen fixture: '+name);
 if(kind==='own')assert.deepEqual(read('RAW',name),frozen);
 if(kind==='worker')assert.deepEqual(readFileSync(worker+'/original/tests/'+name),frozen);
 const restore=kind==='regional'?restorePriorRegionalTourRole:restorePriorBatchCRole;
 assert.deepEqual(restore(name,current),frozen,'Direct authored role adapter: '+name);
 for(const mutant of [current.subarray(0,current.length-1),Buffer.concat([current,current]),
  Buffer.from(current.toString('utf8').replace(/runtimeSources|CURRENT_ATLAS_REVISION|6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1/,'substituted'))])
  assert.throws(()=>restore(name,mutant),'Unknown current edit refused: '+name);
 assert.throws(()=>restore(name,current,{readPrior:()=>Buffer.concat([fixture,Buffer.from('forged')])}),
  'Fixture corruption refused: '+name);
 const original=readFileSync(website+'/tests/fixtures/clinical-epoch-batch-c-original/'+name+'.raw');
 assert.equal(sha(original),originalSha,'Exact complete historical source: '+name);
 const hunks=inverse.files.find(f=>f.name===name).hunks;
 const proposed=frozen.toString('utf8').replace(/\r\n/g,'\n');
 assert.equal(historicalInverse(proposed,hunks),original.toString('utf8').replace(/\r\n/g,'\n'),
  'Original eight-case whole-source theorem composed: '+name);
 const firstAfter=hunks[0].after,match=/[A-Za-z0-9]/.exec(firstAfter);
 assert(match);const replacement=match[0]==='X'?'Y':'X';
 const changed=proposed.replace(firstAfter,firstAfter.slice(0,match.index)+replacement+firstAfter.slice(match.index+1));
 assert.notEqual(changed,proposed);assert.throws(()=>historicalInverse(changed,hunks),'Original historical mutation refused: '+name);
}
assert.throws(()=>restorePriorBatchCRole('not-admitted',Buffer.alloc(0)));
const witnessRaw=read('RAW','clinical-epoch-batch-c-originals.test.mjs');
const witnessCode=read('CODE','clinical-epoch-batch-c-originals.test.mjs');
assert.equal(sha(witnessRaw),'d3f5a72b343c8856a030ccdefd8a2d6fe733248f3cf892dcf77855bb3d0120f5');
assert.equal(sha(witnessCode),'2cb1fdb0b6b3d0a1bc84e5160844b40c7020a27bb80f20a465b126de676a9d4a');
assert.equal((witnessRaw.toString().match(/\btest\('/g)||[]).length,(witnessCode.toString().match(/\btest\('/g)||[]).length);
function sourceHunks(before,after){
 const a=before.split('\n'),b=after.split('\n');
 const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)
  dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const edits=[];let i=0,j=0,open=null;
 const flush=()=>{if(open){edits.push(open);open=null;}};
 while(i<a.length||j<b.length){
  if(i<a.length&&j<b.length&&a[i]===b[j]){flush();i++;j++;continue;}
  if(!open)open={afterStart:j,removed:[],added:[]};
  if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))open.removed.push(a[i++]);
  else open.added.push(b[j++]);
 }
 flush();return edits;
}
for(const [name,count] of [
 ['clinical-review-limb-nerve-quiz.test.ts',3],
 ['clinical-review-longus-colli-quiz.test.ts',3],
 ['clinical-review-median-cubital-xray.test.ts',4],
 ['clinical-review-mesenteric-vessel-teaching.test.ts',5],
 ['clinical-epoch-batch-c-originals.test.mjs',3],
]){
 const original=read('RAW',name),candidate=read('CODE',name);
 assert.equal(original.includes(Buffer.from('\r\n')),candidate.includes(Buffer.from('\r\n')),'No EOL migration: '+name);
 const edits=sourceHunks(original.toString('utf8'),candidate.toString('utf8'));
 assert.equal(edits.length,count,'Only the declared source-role/inverse composition seams: '+name);
 const restored=candidate.toString('utf8').split('\n');
 for(const edit of edits.toReversed()){
  assert.deepEqual(restored.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added);
  restored.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 assert.deepEqual(Buffer.from(restored.join('\n')),original,'Complete frozen RAW source inverse: '+name);
}
const atlas='F:/VisibleMedicine/atlas';
const git=args=>execFileSync('git',args,{cwd:atlas,encoding:'utf8',env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
const pin=JSON.parse(readFileSync(website+'/tests/fixtures/current-atlas-delivery.json'));
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(pin.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
assert.equal(git(['rev-parse','HEAD']),pin.source);
assert.equal(git(['merge-base',pin.runtimeSources.shoulder,pin.source]),pin.runtimeSources.shoulder);
for(const [commit,digest] of [[pin.source,'26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc'],
 [pin.runtimeSources.shoulder,'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2']])
 assert.equal(sha(execFileSync('git',['show',commit+':app/body-content.ts'],{cwd:atlas,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest);
process.stdout.write('SOURCE_ONLY_OK: eight direct complete current→frozen→historical inverses and mutants; four own RAW sources and one witness pinned; current/family Git roles authenticated. Native deferred.\n');
