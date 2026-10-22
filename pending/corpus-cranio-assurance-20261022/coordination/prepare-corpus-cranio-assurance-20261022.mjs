import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-corpus-cranio-assurance';
const previousSource='F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate/SOURCE_V2.json';
assert.equal(sha(read(previousSource)),'d388db43518ff7ccd443a8e7977e7ac67b2f49a696eb294529992ba64fc4132d');
const previous=json(previousSource),proposal='F:/VisibleMedicine/staging/20261022-corpus-cranio-release-roles',site=root+'/website';
const rows=[{name:'corpus-xray-v2-current-delivery.test.mjs',before:'28be69bc03dd3b78665ccf5947fb2fd33077654ed6a26bf03bad6bf9c3e6207e',after:'738db1aa3510dc96366398578fea0b5c4fe173a6f59b63d187b38be82191ef7e',seams:[
 ["assert.equal(delivery.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');","assert.equal(delivery.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');"]]},
 {name:'craniofacial-ct-current-delivery.test.mjs',before:'2de47b24e78247eb1aa1d60d5d8763a35a79e3f5cc3ab3e136fef6c726490ecc',after:'d12881fb54d1c052d5f598f53ab4ccd03fb078604f2685a3728eebac7126ea5e',seams:[
 ["const source='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',tree='e9165d7122361f809a267af1414b337b69097fe2';","const source='2381efe43b75f8a7fb768a069eecd7268c508dac',tree='db21ed3dee259c390878450b3495468996a3af85';"],
 ['assert.equal(delivery.reviewSourceFiles,1558);','assert.equal(delivery.reviewSourceFiles,1562);'],
 ['assert.equal(inputs.inputs.length,1724);','assert.equal(inputs.inputs.length,1729);']]}];
for(const row of rows){
 const original=read(previous.website+'/tests/'+row.name);assert.equal(sha(original),row.before);
 const proposed=read(proposal+'/proposal/tests/'+row.name);assert.equal(sha(proposed),row.after);
 let expected=original.toString();for(const[from,to]of row.seams){assert.equal(expected.split(from).length,2);expected=expected.replace(from,to);}assert.equal(expected,proposed.toString());
}
assert(!fs.existsSync(root));fs.mkdirSync(root);runGit(['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site]);runGit(['-C',site,'read-tree','HEAD']);
const held=new Set(['.local/disc-review/assets.ts','.local/optic-review/assets.ts','.local/plexus-review/assets.ts']);
for(const row of previous.sourceRows){assert.equal(sha(read(previous.website+'/'+row.path)),row.sha256,row.path);
 if(!held.has(row.path))assert(!/(^|\/)(?:\.env(?:\.[^/]*)?|\.local|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path));
 const to=containedTarget(site,row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(previous.website+'/'+row.path,to,fs.constants.COPYFILE_EXCL);
}
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');
const added=[];for(const row of rows){const witness='tests/fixtures/corpus-cranio-before/'+row.name+'.raw';
 const to=containedTarget(site,witness);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(site+'/tests/'+row.name,to,fs.constants.COPYFILE_EXCL);added.push(witness);
 fs.copyFileSync(proposal+'/proposal/tests/'+row.name,site+'/tests/'+row.name);
}
const testPath='tests/corpus-cranio-role-preservation.test.mjs';
const testSource=`import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const rows=${JSON.stringify(rows,null,2)};
const sha=b=>createHash('sha256').update(b).digest('hex');
function restore(row,source){for(const[from,to]of [...row.seams].reverse()){assert.equal(source.split(to).length,2,'Exact declared current seam');source=source.replace(to,from);}return source;}
test('both complete original release roots survive only their enumerated current source roles',()=>{
 for(const row of rows){const before=readFileSync(new URL('./fixtures/corpus-cranio-before/'+row.name+'.raw',import.meta.url)),current=readFileSync(new URL('./'+row.name,import.meta.url));
  assert.equal(sha(before),row.before);assert.equal(sha(current),row.after);assert.equal(restore(row,current.toString()),before.toString(),'Whole original historical/refusal/teaching assertions remain');}
});
test('changed historical or current source assertions cannot pass the whole-original witness',()=>{
 for(const row of rows){const before=readFileSync(new URL('./fixtures/corpus-cranio-before/'+row.name+'.raw',import.meta.url)).toString(),current=readFileSync(new URL('./'+row.name,import.meta.url)).toString();
  const altered=current.replace(row.seams[0][1],row.seams[0][1]+'/* forged */');
  assert.throws(()=>assert.equal(restore(row,altered),before));
  assert.throws(()=>assert.equal(restore(row,current+'\\n/* foreign assertion */'),before));}
});
`;
fs.writeFileSync(site+'/'+testPath,testSource,{flag:'wx'});added.push(testPath);
const sourceRows=[...previous.sourceRows.map(r=>r.path),...added].sort().map(p=>({path:p,bytes:read(site+'/'+p).length,sha256:sha(read(site+'/'+p))}));
const old=new Map(previous.sourceRows.map(r=>[r.path,r.sha256]));assert.deepEqual(sourceRows.filter(r=>old.has(r.path)&&old.get(r.path)!==r.sha256).map(r=>r.path),rows.map(r=>'tests/'+r.name).sort());
const receipt={at:new Date().toISOString(),website:site,atlas:previous.atlas,atlasHead:previous.atlasHead,atlasTree:previous.atlasTree,review:previous.review,
 boundInputs:previous.boundInputs,importedSources:previous.importedSources,previousSource,previousSourceSha256:sha(read(previousSource)),sourceRows,sourcePaths:sourceRows.length,
 changedPaths:rows.map(r=>'tests/'+r.name),addedPaths:added,allProductAndBindingsByteIdentical:true,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),paths:sourceRows.length,productChanged:false}));
