import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-current-source-closure-assurance',site=root+'/website';
const previousSource='F:/VisibleMedicine/staging/20261022-historical-admission-assurance/SOURCE_V3.json';
assert.equal(sha(read(previousSource)),'d769eb7da674dd534f3e220a1b32b1a176c321ce39602d84ae9862a942c0989a');
const previous=json(previousSource),stages={head:'F:/VisibleMedicine/staging/20261022-head-current-history-closure',regional:'F:/VisibleMedicine/staging/20261022-regional-current-history-closure',ui:'F:/VisibleMedicine/staging/20261022-ui-tour-current-history-closure'};
const receipts={head:'90d2962246a429d9c9052607281485c53f243dde7d3a44efe5af990bf8131995',regional:'',ui:'d97dfba84a44b3a3cc56502e44e95f75c6e3f95d96aaa3813385a259dc82fdb1'};
const proposals=[];
for(const [key,dir]of Object.entries(stages)){
 const result=json(dir+'/RESULT.json');if(receipts[key])assert.equal(sha(read(dir+'/RESULT.json')),receipts[key]);
 assert.equal(result.parentSourceReceiptSha256??result.sourceReceiptSha256??result.source.receiptSha256,sha(read(previousSource)));
 if(key==='head')for(const r of result.files)proposals.push({name:path.basename(r.proposed),before:r.beforeSha256,after:r.proposedSha256,from:r.proposed});
 if(key==='regional')for(const r of result.files)proposals.push({name:r.name,before:r.preimageSha256,after:r.proposalSha256,from:r.proposalPath});
 if(key==='ui')for(const r of result.rows)proposals.push({name:r.name,before:r.before,after:r.after,from:r.proposed});
}
assert.equal(proposals.length,11);assert.equal(new Set(proposals.map(r=>r.name)).size,11);
assert(!fs.existsSync(root));fs.mkdirSync(root);runGit(['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site]);runGit(['-C',site,'read-tree','HEAD']);
const held=new Set(['.local/disc-review/assets.ts','.local/optic-review/assets.ts','.local/plexus-review/assets.ts']);
for(const row of previous.sourceRows){assert.equal(sha(read(previous.website+'/'+row.path)),row.sha256,row.path);
 if(!held.has(row.path))assert(!/(^|\/)(?:\.env(?:\.[^/]*)?|\.local|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path));
 const target=containedTarget(site,row.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(previous.website+'/'+row.path,target,fs.constants.COPYFILE_EXCL);
}
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');fs.symlinkSync(previous.atlas,root+'/atlas','junction');
const addedPaths=[],proof=[];
function add(relative,bytes){assert(!previous.sourceRows.some(r=>r.path===relative));const target=containedTarget(site,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});addedPaths.push(relative);}
function editsFor(a,b){const dp=Array.from({length:a.length+1},()=>new Uint32Array(b.length+1));for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
 let i=0,j=0,start=null;const edits=[];function close(){if(start){edits.push({...start,before:a.slice(start.i,i),after:b.slice(start.j,j)});start=null;}}
 while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){close();i++;j++;}else{start??={i,j};if(i<a.length&&(j===b.length||dp[i+1][j]>=dp[i][j+1]))i++;else j++;}}close();return edits;}
for(const row of proposals){const before=read(site+'/tests/'+row.name);assert.equal(sha(before),row.before);const worker=read(row.from);assert.equal(sha(worker),row.after);let proposed=worker;
 if(row.name==='inferior-thyroid-mra-current-delivery.test.mjs'){
  const from="if(key!=='regionalTours')equal(currentGit[key],now[key],`Current ${key} unchanged since historical MRA introduction`);",to='equal(currentGit[key],now[key],`Current ${key} unchanged since historical MRA introduction`);';
  const text=worker.toString();assert.equal(text.split(from).length,2);proposed=Buffer.from(text.replace(from,to));
  row.mainStrengthening='Restore the full original regionalTours data equality: later renal resolver guard is not permission to skip array-content comparison.';
 }
 const a=before.toString().split('\n'),b=proposed.toString().split('\n'),edits=editsFor(a,b);let restored=[...b];for(const e of [...edits].reverse()){assert.deepEqual(restored.slice(e.j,e.j+e.after.length),e.after);restored.splice(e.j,e.after.length,...e.before);}assert.deepEqual(restored,a);
 fs.writeFileSync(site+'/tests/'+row.name,proposed);add('tests/fixtures/current-source-closure-before/'+row.name+'.raw',before);
 proof.push({name:row.name,before:row.before,after:sha(proposed),workerAfter:row.after,mainStrengthening:row.mainStrengthening??null,edits});
}
// Retain the independent UI exact-seam proof in addition to the full-file proof.
for(const row of json(stages.ui+'/RESULT.json').rows)add('tests/fixtures/ui-tour-current-before/'+row.name+'.raw',read(row.preimage));
add('tests/ui-tour-current-role-preservation.test.mjs',read(stages.ui+'/tests/ui-tour-current-role-preservation.test.mjs'));
const witness=`import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const rows=${JSON.stringify(proof,null,2)},sha=b=>createHash('sha256').update(b).digest('hex');
function restore(row,bytes){assert.equal(sha(bytes),row.after);const lines=bytes.toString().split('\\n');for(const e of [...row.edits].reverse()){assert.deepEqual(lines.slice(e.j,e.j+e.after.length),e.after);lines.splice(e.j,e.after.length,...e.before);}return Buffer.from(lines.join('\\n'));}
test('all eleven complete original head/regional/UI test bodies and refusal assertions survive exact current-source seams',()=>{for(const row of rows){const before=readFileSync(new URL('./fixtures/current-source-closure-before/'+row.name+'.raw',import.meta.url)),after=readFileSync(new URL('./'+row.name,import.meta.url));assert.equal(sha(before),row.before);assert.deepEqual(restore(row,after),before);}});
test('added text, missing assertions and foreign source edits cannot pass the complete source inverse',()=>{for(const row of rows){const after=readFileSync(new URL('./'+row.name,import.meta.url));assert.throws(()=>restore(row,Buffer.concat([after,Buffer.from('/* foreign */')])));const changed=Buffer.from(after);changed[0]^=1;assert.throws(()=>restore(row,changed));}});
`;
add('tests/current-source-closure-preservation.test.mjs',Buffer.from(witness));
const oldRoots=json('F:/VisibleMedicine/staging/20261022-remaining-native-recheck/TERMINAL.json').roots;
const recentRoots=json('F:/VisibleMedicine/staging/20261022-historical-admission-assurance/COMPOSED.json').tests;
const tests=[...new Set([...oldRoots,...recentRoots,'tests/ui-tour-current-role-preservation.test.mjs','tests/current-source-closure-preservation.test.mjs'])].sort();
const paths=[...previous.sourceRows.map(r=>r.path),...addedPaths].sort(),sourceRows=paths.map(p=>{const b=read(site+'/'+p);return{path:p,bytes:b.length,sha256:sha(b)};}),old=new Map(previous.sourceRows.map(r=>[r.path,r.sha256]));
const changedPaths=sourceRows.filter(r=>old.has(r.path)&&old.get(r.path)!==r.sha256).map(r=>r.path);assert.deepEqual(changedPaths.sort(),proposals.map(r=>'tests/'+r.name).sort());
const source={at:new Date().toISOString(),website:site,atlas:previous.atlas,atlasHead:previous.atlasHead,atlasTree:previous.atlasTree,review:previous.review,boundInputs:1729,importedSources:1562,previousSource,previousSourceSha256:sha(read(previousSource)),sourceRows,sourcePaths:sourceRows.length,changedPaths,addedPaths,allProductAndBindingsByteIdentical:true,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(root+'/COMPOSED.json',JSON.stringify({at:new Date().toISOString(),tests,proof,proposals,sourceOnlyInversePassed:true,sourceReceipt:root+'/SOURCE.json',sourceReceiptSha256:sha(read(root+'/SOURCE.json')),proposalReceipts:Object.fromEntries(Object.entries(stages).map(([key,dir])=>[key,{path:dir+'/RESULT.json',sha256:sha(read(dir+'/RESULT.json'))}]))},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),paths:sourceRows.length,changed:changedPaths.length,roots:tests.length,ownerPreviewChanged:false}));
