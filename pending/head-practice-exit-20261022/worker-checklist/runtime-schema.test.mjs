import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {validateChecklist,verifyImportedAtlasEvidence} from './refresh-completion-checklist.mjs';

// Synthetic records and injected read/Git functions: never an installed-delivery acceptance test.
const current='a'.repeat(40),old='b'.repeat(40),tree='c'.repeat(40);
const sha=value=>createHash('sha256').update(value).digest('hex');
const names=['head-neck','shoulder','lower-limb','female-pelvis'];
const map=()=>Object.fromEntries(names.map(name=>[name,name==='head-neck'?current:old]));
const key=path=>path.replaceAll('\\','/');
function fixture({mapped=false}={}){
 const inputs=[{path:'synthetic-source.ts',sha256:'d'.repeat(64)}],binding=sha(JSON.stringify(inputs));
 const evidence=Buffer.from(JSON.stringify({applied:true,publicDeployment:false,sourceAtlas:current,review:binding}));
 const imported={commit:current,tree,reviewIntegration:binding,reviewSourceFiles:1,rootDraftPlacements:1,rootPendingPlacements:0,rootGeneratedIdentificationPlacements:0,evidence:'proof:synthetic.json',evidenceSha256:sha(evidence)};
 if(mapped)imported.runtimeSources=map();
 const data={schemaVersion:1,revision:1,updatedAt:'2026-10-22',roots:{proof:'X:/synthetic/proof',atlas:'X:/synthetic/atlas'},baseline:{rootTopicPlacements:1},items:[{id:'TEST-01',status:'open',scope:'full-roadmap',priority:'P1',area:'Synthetic',owner:'Synthetic',task:'Synthetic',acceptance:'Synthetic',evidence:['proof:synthetic.json']}],changeLog:[{revision:1}],importedAtlasSource:imported};
 const files=new Map([
  [resolve('X:/synthetic/proof/synthetic.json'),evidence],
  [resolve('X:/synthetic/site/atlas-review/manifest.json'),JSON.stringify({revision:current,websiteIntegrationSha256:binding,files:[{}]})],
  [resolve('X:/synthetic/site/atlas-review/integration-inputs.json'),JSON.stringify({sourceCommit:current,sha256:binding,inputs})],
  [resolve('X:/synthetic/site/public/atlas-review-viewer/manifest.json'),JSON.stringify({sourceCommit:current,websiteIntegrationSha256:binding,personalRecordsIncluded:false})],
  ...names.map(name=>[resolve(`X:/synthetic/site/public/atlas-runtime/${name}/manifest.json`),JSON.stringify({sourceCommit:mapped?map()[name]:current,patientDataIncluded:false})]),
 ].map(([path,value])=>[key(path),value]));
 const calls=[];
 const read=path=>{assert(files.has(key(path)),`Unexpected synthetic read: ${path}`);return files.get(key(path));};
 const git=(repo,ref)=>{calls.push([repo,ref]);assert.equal(repo,data.roots.atlas);if(ref===current+'^{commit}')return current;if(ref===current+'^{tree}')return tree;throw Error('Unexpected Git ref');};
 return {data,files,read,git,calls,site:resolve('X:/synthetic/site'),binding};
}
function verify(f){verifyImportedAtlasEvidence(f.data,f.site,{read:f.read,git:f.git});assert.deepEqual(f.calls,[[f.data.roots.atlas,current+'^{commit}'],[f.data.roots.atlas,current+'^{tree}']]);}
function refuse(f){assert.throws(()=>verifyImportedAtlasEvidence(f.data,f.site,{read:f.read,git:f.git}),{code:'ERR_ASSERTION'});}
function mutateFile(f,path,edit){const file=key(resolve(f.site,path));f.files.set(file,JSON.stringify(edit(JSON.parse(f.files.get(file)))));}

test('producer is byte-identical to captured preimage outside three enumerated seams',()=>{
 const base=new URL('.',import.meta.url),before=readFileSync(new URL('refresh-completion-checklist.preimage.mjs',base),'utf8');
 let after=readFileSync(new URL('refresh-completion-checklist.mjs',base),'utf8');
 const seams=[
  ["assert(imported&&typeof imported==='object'&&!Array.isArray(imported)&&Object.keys(imported).length===keys.length+Number(Object.hasOwn(imported,'runtimeSources'))&&keys.every(k=>Object.hasOwn(imported,k)),'Invalid local import record');",
   "assert(imported&&typeof imported==='object'&&!Array.isArray(imported)&&Object.keys(imported).length===keys.length&&keys.every(k=>Object.hasOwn(imported,k)),'Invalid local import record');"],
  ["  if(Object.hasOwn(imported,'runtimeSources')){\n   const names=['head-neck','shoulder','lower-limb','female-pelvis'],sources=imported.runtimeSources;\n   assert(sources&&typeof sources==='object'&&!Array.isArray(sources)&&Object.keys(sources).length===names.length&&names.every(name=>Object.hasOwn(sources,name)&&typeof sources[name]==='string'&&/^[a-f0-9]{40}$/.test(sources[name])),'Invalid exact runtime source map');\n   assert.equal(sources['head-neck'],imported.commit,'Current head-neck runtime must match imported Atlas source');\n  }\n",'' ],
  ["assert.equal(learner.sourceCommit,imported.runtimeSources?.[name]??imported.commit,name+': source');",
   "assert.equal(learner.sourceCommit,imported.commit,name+': source');"],
 ];
 for(const [added,original] of seams){assert.equal(after.split(added).length,2,'Seam must appear exactly once');after=after.replace(added,original);}
 assert.equal(after,before);
});

test('legacy uniform runtime and explicit nonuniform runtime both retain exact proof',()=>{
 verify(fixture());verify(fixture({mapped:true}));
 const legacy=fixture();mutateFile(legacy,'public/atlas-runtime/shoulder/manifest.json',m=>({...m,sourceCommit:old}));refuse(legacy);
});

test('runtime map requires exactly four known 40-hex sources and current head-neck source',()=>{
 for(const edit of [
  m=>{delete m.shoulder;},
  m=>{m.extra=old;},
  m=>{m.shoulder='f'.repeat(39);},
  m=>{m.shoulder=42;},
  m=>{m['head-neck']=old;},
 ]){const f=fixture({mapped:true});edit(f.data.importedAtlasSource.runtimeSources);assert.throws(()=>validateChecklist(f.data),{code:'ERR_ASSERTION'});}
 const f=fixture({mapped:true});f.data.importedAtlasSource.unrecognized=true;assert.throws(()=>validateChecklist(f.data),{code:'ERR_ASSERTION'});
});

test('every runtime family must match its pinned source and exclude patient data',()=>{
 for(const name of names){
  const stale=fixture({mapped:true});mutateFile(stale,`public/atlas-runtime/${name}/manifest.json`,m=>({...m,sourceCommit:name==='head-neck'?old:current}));refuse(stale);
  const patient=fixture({mapped:true});mutateFile(patient,`public/atlas-runtime/${name}/manifest.json`,m=>({...m,patientDataIncluded:true}));refuse(patient);
 }
});

test('evidence bytes, applied receipt, public flag, source, Review binding and immutable Git identity still refuse',()=>{
 const tampered=fixture({mapped:true});tampered.files.set(key(resolve('X:/synthetic/proof/synthetic.json')),Buffer.from('{}'));refuse(tampered);
 for(const changed of [{applied:false},{publicDeployment:true},{sourceAtlas:old},{review:'0'.repeat(64)}]){
  const f=fixture({mapped:true}),file=key(resolve('X:/synthetic/proof/synthetic.json'));
  const evidence=Buffer.from(JSON.stringify({...JSON.parse(f.files.get(file)),...changed}));f.files.set(file,evidence);f.data.importedAtlasSource.evidenceSha256=sha(evidence);refuse(f);
 }
 const wrongGit=fixture({mapped:true});assert.throws(()=>verifyImportedAtlasEvidence(wrongGit.data,wrongGit.site,{read:wrongGit.read,git:()=>old}),{code:'ERR_ASSERTION'});
 for(const [path,edit] of [
  ['atlas-review/manifest.json',m=>({...m,websiteIntegrationSha256:'0'.repeat(64)})],
  ['atlas-review/integration-inputs.json',m=>({...m,inputs:[]})],
  ['public/atlas-review-viewer/manifest.json',m=>({...m,personalRecordsIncluded:true})],
 ]){const f=fixture({mapped:true});mutateFile(f,path,edit);refuse(f);}
});
