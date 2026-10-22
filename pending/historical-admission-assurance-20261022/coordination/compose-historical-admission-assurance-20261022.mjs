// Integrate reviewed test proposals into the prepared, unpublished copy only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-historical-admission-assurance',prep=json(root+'/PREPARED.json'),site=prep.website;
const zero='F:/VisibleMedicine/staging/20261022-zero-registration-current-admission',four='F:/VisibleMedicine/staging/20261022-four-live-source-roles';
assert.equal(sha(read(zero+'/RESULT.json')),'2f677790e876a3693ab452d7e7c50fe2b30ea9bf9e15e2a1e8dd7b9b215740c3');
assert.equal(sha(read(four+'/RESULT_V2.json')),'41c82545084fa949af6b9d0ea5c142636e4f512af6307cee9e7ab6c200277365');
const zeroResult=json(zero+'/RESULT.json'),fourResult=json(four+'/RESULT_V2.json');
assert.equal(sha(read(fourResult.proof.path)),fourResult.proof.sha256);
const v1=json(four+'/RESULT_V1.json'),v2=structuredClone(fourResult);v2.proof.sha256=v1.proof.sha256;assert.deepEqual(v2,v1,'Only incorrect verifier-hash metadata was corrected');
const old='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',now=prep.atlasHead,oldTree='e9165d7122361f809a267af1414b337b69097fe2',newTree=prep.atlasTree;
const fourSeams={
 'native-focus-review-binding.test.mjs':[[`assert.equal(pin.source,'${old}');`,`assert.equal(pin.source,'${now}');`],[`assert.equal(pin.sourceTree,'${oldTree}');`,`assert.equal(pin.sourceTree,'${newTree}');`],['assert.equal(pin.reviewSourceFiles,1558);','assert.equal(pin.reviewSourceFiles,1562);'],['assert.equal(binding.inputs.length,1724);','assert.equal(binding.inputs.length,1729);']],
 'posterior-fossa-coverage.test.mjs':[[`"assert.equal(coverageRevision,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');","assert.equal(coverageRevision,'${old}');"`,`"assert.equal(coverageRevision,'7b3e678ae4b8059aadb84459048ebd05f7abe7b9');","assert.equal(coverageRevision,'${now}');"`],[`assert.equal(coverageRevision,'${old}');`,`assert.equal(coverageRevision,'${now}');`]],
 'salpingopharyngeus-integration-register.test.mjs':[[`assert.equal(current.source,'${old}');`,`assert.equal(current.source,'${now}');`]],
 'studio-lineage-integration.test.mjs':[[`assert.equal(pin.source,'${old}');`,`assert.equal(pin.source,'${now}');`],[`assert.equal(pin.sourceTree,'${oldTree}');`,`assert.equal(pin.sourceTree,'${newTree}');`],['assert.equal(pin.reviewSourceFiles,1558);','assert.equal(pin.reviewSourceFiles,1562);']],
};
const addedPaths=[],changedPaths=[],witnesses=[];
const copyNew=(from,to)=>{const target=containedTarget(site,to);assert(!fs.existsSync(target),to);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(from,target,fs.constants.COPYFILE_EXCL);addedPaths.push(to);};
const writeNew=(to,text)=>{const target=containedTarget(site,to);assert(!fs.existsSync(target));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text,{flag:'wx'});addedPaths.push(to);};
for(const row of fourResult.proposals){
 const name=path.basename(row.path),target='tests/'+name;assert(Object.hasOwn(fourSeams,name));assert.equal(sha(read(site+'/'+target)),row.preimageSha256);assert.equal(sha(read(row.path)),row.sha256);
 const before=read(site+'/'+target);assert.deepEqual(Buffer.from(before.toString()),before);let expected=before.toString();
 for(const[from,to]of fourSeams[name]){assert.equal(expected.split(from).length,2);expected=expected.replace(from,to);}assert.equal(expected,read(row.path).toString());
 copyNew(site+'/'+target,'tests/fixtures/four-live-before/'+name+'.raw');fs.copyFileSync(row.path,site+'/'+target);changedPaths.push(target);
 witnesses.push({name,before:row.preimageSha256,after:row.sha256,seams:fourSeams[name]});
}
const originals=['tests/drawable-epoch-current-admission.test.mjs','tests/expanded-review-delivery-admission.test.mjs'];
for(const target of originals){const row=zeroResult.proposal[target];assert.equal(sha(read(site+'/'+target)),row.preimageSha256);assert.equal(sha(read(zero+'/'+target)),row.proposedSha256);
 copyNew(site+'/'+target,'tests/fixtures/zero-registration-before/'+path.basename(target)+'.raw');let content=read(zero+'/'+target).toString();
 if(target.includes('drawable-')){
  const from="join(websiteRoot,'tests/fixtures/zero-registration-fa1-binding',path)",to="join(websiteRoot,'tests/fixtures/zero-registration-fa1-binding',path+'.raw')";
  assert.equal(content.split(from).length,3,'Reader plus its explicit inverse witness');content=content.replaceAll(from,to);assert.equal(content.split(to).length,3);
 }
 fs.writeFileSync(site+'/'+target,content);changedPaths.push(target);
}
copyNew(zero+'/tests/zero-registration-current-roles-inverse.mjs','tests/zero-registration-current-roles-inverse.mjs');
assert.equal(sha(read(site+'/tests/zero-registration-current-roles-inverse.mjs')),zeroResult.proposal['tests/zero-registration-current-roles-inverse.mjs']);
const fa=json(site+'/tests/fixtures/colic-fa1-preimage/documents/atlas-review/integration-inputs.json.raw'),bindings=new Map(fa.inputs.map(r=>[r.path,r.sha256]));let fixtureBytes=0,fixtureFiles=0;
function fixtures(relative=''){for(const entry of fs.readdirSync(zero+'/tests/fixtures/zero-registration-fa1-binding/'+relative,{withFileTypes:true})){
 assert(!entry.isSymbolicLink());const p=relative+entry.name;if(entry.isDirectory())fixtures(p+'/');else{assert(/\.(?:ts|tsx)$/.test(p));const from=zero+'/tests/fixtures/zero-registration-fa1-binding/'+p,b=read(from);assert.equal(sha(b),bindings.get(p),'Exact immutable fa1 source: '+p);
  copyNew(from,'tests/fixtures/zero-registration-fa1-binding/'+p+'.raw');fixtureBytes+=b.length;fixtureFiles++;}
}}fixtures();assert.equal(fixtureFiles,11);assert.equal(fixtureBytes,393017);
const proof=spawnSync(process.execPath,[zero+'/PROVE_SOURCE.mjs'],{windowsHide:true,encoding:null});fs.writeFileSync(root+'/zero-source-proof.stdout.log',proof.stdout??Buffer.alloc(0),{flag:'wx'});fs.writeFileSync(root+'/zero-source-proof.stderr.log',proof.stderr??Buffer.alloc(0),{flag:'wx'});assert.equal(proof.status,0);
const preservation=`import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restorePreNeckPin2381,restorePreNeckDelivery2381,restorePreNeckHeadTeaching2381,restorePrePresentationViewer2381} from './zero-registration-current-roles-inverse.mjs';
import {restorePracticeExitViewer} from './head-practice-exit-inverse.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>readFileSync(new URL('../'+p,import.meta.url));
const witnesses=${JSON.stringify(witnesses,null,2)};
test('four complete original live-source roots retain every assertion outside exact current-role seams',()=>{
 for(const row of witnesses){const before=read('tests/fixtures/four-live-before/'+row.name+'.raw'),after=read('tests/'+row.name);assert.equal(sha(before),row.before);assert.equal(sha(after),row.after);
  const inverseSeams=row.name==='posterior-fossa-coverage.test.mjs'?row.seams:[...row.seams].reverse();
  let inverse=after.toString();for(const[from,to]of inverseSeams){assert.equal(inverse.split(to).length,2);inverse=inverse.replace(to,from);}assert.equal(inverse,before.toString());}
});
for(const[name,fn,a,b]of [
 ['pin',restorePreNeckPin2381,'tests/fixtures/current-atlas-delivery.json','tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.json'],
 ['whole delivery test',restorePreNeckDelivery2381,'tests/current-atlas-delivery.test.mjs','tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw'],
])test(name+' rejects changed current and historical source bytes',()=>{const current=read(a),before=read(b);assert.deepEqual(fn(current,before),before);
 for(const[left,right]of [[Buffer.concat([current,Buffer.from(' ')]),before],[current,Buffer.concat([before,Buffer.from(' ')])],[before,current]])assert.throws(()=>fn(left,right));});
test('historical teaching and viewer inverses reject altered current inputs',()=>{
 const teaching=read('atlas-review/content/regional-teaching/head-neck.json'),viewer=read('components/HeadAtlasViewer.tsx');
 assert.equal(sha(restorePreNeckHeadTeaching2381(teaching)),'e6a486cc4ab9745eae110615b340fa1797bb0e6e0b72195f083bec766543da25');
 assert.equal(sha(restorePrePresentationViewer2381(viewer,restorePracticeExitViewer)),'a9b7c4b3d8f4febab394e983ace55df020cbcc84dc33daa8b2af6e7abd90fd1b');
 assert.throws(()=>restorePreNeckHeadTeaching2381(Buffer.concat([teaching,Buffer.from(' ')])));
 assert.throws(()=>restorePrePresentationViewer2381(Buffer.concat([viewer,Buffer.from(' ')]),restorePracticeExitViewer));
});
`;
writeNew('tests/historical-admission-role-preservation.test.mjs',preservation);
const tests=['tests/current-atlas-delivery.test.mjs','tests/corpus-xray-v2-current-delivery.test.mjs','tests/craniofacial-ct-current-delivery.test.mjs','tests/corpus-cranio-role-preservation.test.mjs',
 'tests/tongue-palate-delivery.test.ts','tests/tongue-palate-neck-history.test.mjs',...originals,...fourResult.proposals.map(r=>'tests/'+path.basename(r.path)),
 'tests/historical-admission-role-preservation.test.mjs'];
assert.equal(tests.length,13);assert.equal(new Set(tests).size,tests.length);
const result={at:new Date().toISOString(),website:site,previousSource:prep.previousSource,sourceOnlyProposalHashes:{zero:sha(read(zero+'/RESULT.json')),fourV2:sha(read(four+'/RESULT_V2.json'))},
 addedPaths,changedPaths,tests,sourceProofCode:proof.status,sourceProofStdoutSha256:sha(proof.stdout),fixtureFiles,fixtureBytes,
 fixtureAdaptation:'Append .raw to eleven historical .ts/.tsx witness filenames and both exact drawable reader/inverse occurrences, preventing tsc from compiling old source as new product.',
 metadataCorrection:'Four-root V1 verifier hash omitted characters; V2 changes only that computed metadata field. V1 and proposal bytes are preserved.',
 ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/COMPOSED.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/COMPOSED.json',changedRoots:changedPaths.length,addedPaths:addedPaths.length,nativeRoots:tests.length,productChanged:false}));
