import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

// This adapter executes the staged preservation tests against the immutable
// candidate's actual source and fixture paths. It never rewrites the candidate.
const stage='F:/VisibleMedicine/staging/20261022-limb-urinary-final-closures';
const candidate='F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/website';
const tests=join(candidate,'tests').replaceAll('\\','/');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const receipt='F:/VisibleMedicine/staging/20261022-remaining-runtime-admissions/APPLIED_SOURCE.json';
assert.equal(sha(readFileSync(receipt)),'d72789221c1cbdb0686e65a6316fe42c378f4cddc6e4adfd2b556ad7b79f2f8e','current candidate source receipt');
const sourceHashes={
 'clinical-review-upper-limb-completion-quiz.test.ts':'21f7a97ef194a242edb71fdcffd2de525c2657ace3e137e018121f62adbba4f6',
 'clinical-review-urinary-tract-tour.test.ts':'3353c20def157cdffdd191c099c10b2dfb6673a08dd55b83f5794a3f42097dd6',
};
const ownChanges={
 'limb-suprahyoid-role-preservation-20261021.test.mjs':{
  raw:'d51678cc4a2f42badbc9fb3fd0afffabb6094c7af2fa2f225f4acb907c6e0fcb',
  code:'6199b846dcce39829e61d21ff8bcdf07648152492a9034122761b98e83d2a7c8',
  hunks:['a87760b3856f03e566793c2598910f954354aaacf57f621889e536c2d3bbc992','2ba23d6fa8482eaaec1f6a9738bbeac280965cf3a88552aad1e594fc71c34cbb','d50c8ce0c322630c84d20915c272340f7289b0f9118005d718dc69cb7eaa00c6','1d7a5f5fadaff8a4d6490e277009efeb52cbd22761960925b0d2a776d943007a'],
 },
 'venous-urinary-role-preservation-20261021.test.mjs':{
  raw:'4130539addc372692276dcad2da6bb8b1913e93b41df98394045ae42f7d58b4e',
  code:'5816c24ad3defd9eef3055939519cce94bc4f8af307713b915de3f2795f8dd21',
  hunks:['864e43507c58aee7b7177bc34e5b90a792e02a50e52fc3865050fe44f3c1a0ec','0f041111e1320b4b7aed60b246b588013f8557b5c860fe4367c60e697647d612'],
 },
};
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
for(const [name,digest] of Object.entries(sourceHashes))
 assert.equal(sha(readFileSync(join(tests,name))),digest,'actual candidate source '+name);
for(const name of [
 'limb-suprahyoid-role-preservation-20261021.test.mjs',
 'venous-urinary-role-preservation-20261021.test.mjs',
]){
 const actual=readFileSync(join(tests,name));
 const raw=readFileSync(join(stage,'RAW','tests',name));
 assert.equal(sha(raw),ownChanges[name].raw,'frozen RAW '+name);
 assert.deepEqual(raw,actual,'full frozen preimage '+name);
 let source=readFileSync(join(stage,'CODE','tests',name),'utf8');
 assert.equal(sha(Buffer.from(source)),ownChanges[name].code,'staged CODE '+name);
 const edits=sourceHunks(raw.toString('utf8'),source);
 const fingerprints=edits.map(e=>sha(JSON.stringify([e.removed,e.added])));
 assert.deepEqual(fingerprints,ownChanges[name].hunks,'only exact reviewed own-change hunks '+name);
 const inverse=source.split('\n');
 for(const edit of edits.toReversed()){
  assert.deepEqual(inverse.slice(edit.afterStart,edit.afterStart+edit.added.length),edit.added);
  inverse.splice(edit.afterStart,edit.added.length,...edit.removed);
 }
 assert.deepEqual(Buffer.from(inverse.join('\n')),raw,'full CODE→RAW inverse '+name);
 if(name.startsWith('limb-')){
  source=source.replace("'./shoulder-source-family-inverse.mjs'",JSON.stringify(pathToFileURL(join(tests,'shoulder-source-family-inverse.mjs')).href));
  source=source.replace("'./question-source-family-inverse.mjs'",JSON.stringify(pathToFileURL(join(tests,'question-source-family-inverse.mjs')).href));
  source=source.replace('const here=dirname(fileURLToPath(import.meta.url));',`const here=${JSON.stringify(tests)};`);
 }else{
  source=source.replaceAll('import.meta.url',JSON.stringify(pathToFileURL(join(tests,name)).href));
 }
 await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
