import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const stage=dirname(fileURLToPath(import.meta.url));
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const atlas='F:/VisibleMedicine/atlas';
const head='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const shoulder='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(rev,path)=>execFileSync('git',['show',`${rev}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const seam=(newText,oldText)=>(source)=>{
 assert.equal(source.split(newText).length,2,`non-unique inverse seam: ${newText.slice(0,90)}`);
 return source.replace(newText,oldText);
};
const insert=(text)=>(source)=>seam(text,'')(source);
const files={
 'clinical-review-thoracic-detail-ultrasound.test.ts':[
  insert("import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n"),
  insert('const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n'),
  seam('assert.equal(built.sourceCommit,runtimeSources[name],name);','assert.equal(built.sourceCommit,revision,name);')
 ],
 'clinical-review-thoracic-mediastinal-arterial-xray.test.ts':[
  insert("import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n"),
  insert('const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n'),
  seam('assert.equal(manifest.sourceCommit,runtimeSources[name],name);','assert.equal(manifest.sourceCommit,importedRevision,name);')
 ],
 'clinical-review-thoracic-systemic-teaching.test.ts':[
  insert("import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n"),
  seam('const revision=CURRENT_ATLAS_REVISION;\nconst runtimeSources=validateCurrentAtlasDelivery().runtimeSources;',"const revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';"),
  seam(" const api=await bundled,review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n const sourceRoot=checkedAtlasSourceRepo(revision);"," const api=await bundled,review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));"),
  seam('assert.equal(m.sourceCommit,runtimeSources[name]);','assert.equal(m.sourceCommit,review.revision);'),
  seam("for(const path of paths){const f=review.files.find((f:any)=>f.path===path);assert(f);assert.equal(rawSha(readFileSync('atlas-review/'+path)),f.importedSha256);\n   const committed=(source:string)=>execFileSync('git',['show',`${source}:${path}`],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n   assert.equal(f.sourceSha256,rawSha(committed(revision)),`${path}: current Review source`);\n   assert.equal(inputs.find((i:any)=>i.path===path)?.sha256,rawSha(committed(runtimeSources[name])),`${name}: family input`);}","for(const path of paths){const f=review.files.find((f:any)=>f.path===path);assert(f);assert.equal(rawSha(readFileSync('atlas-review/'+path)),f.importedSha256);assert.equal(inputs.find((i:any)=>i.path===path)?.sha256,f.sourceSha256);}")
 ],
 'clinical-review-thoracic-venous-xray.test.ts':[
  insert("import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n"),
  insert('const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\n'),
  seam('assert.equal(manifest.sourceCommit,runtimeSources[name],name);','assert.equal(manifest.sourceCommit,importedRevision,name);'),
  seam('three independent workbenches retain their own family commits and teaching closures.','three independent workbenches share the commit, not its teaching closure.')
 ],
 'clinical-review-thoracic-wall-xray.test.ts':[
  insert("import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n"),
  seam('const revision=CURRENT_ATLAS_REVISION;',"const revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';"),
  seam("assert.equal(learner.sourceCommit,validateCurrentAtlasDelivery().runtimeSources['head-neck']);",'assert.equal(learner.sourceCommit,revision);')
 ]
};
const reconstruct=(name,bytes)=>{
 let value=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 for(const operation of files[name])value=operation(value);
 return Buffer.from(value,'utf8');
};
for(const name of Object.keys(files)){
 const original=readFileSync(join(stage,'original','tests',name));
 const proposal=readFileSync(join(stage,'proposal','tests',name));
 assert.deepEqual(original,readFileSync(join(website,'tests',name)),`${name}: raw original/frozen`);
 assert.deepEqual(reconstruct(name,proposal),original,`${name}: complete inverse`);
 const appended=Buffer.concat([proposal,Buffer.from('\n// mutation\n')]);
 assert.notDeepEqual(reconstruct(name,appended),original,`${name}: append mutant refused`);
 const mutated=Buffer.from(proposal.toString('utf8').replace('current-atlas-delivery.mjs','current-atlas-delivery-mutant.mjs'),'utf8');
 assert.throws(()=>reconstruct(name,mutated),/non-unique inverse seam/,`${name}: altered seam refused`);
 process.stdout.write(`${name} original=${sha(original)} proposal=${sha(proposal)} inverse=PASS mutants=PASS\n`);
}
const pin=JSON.parse(readFileSync(join(website,'tests','fixtures','current-atlas-delivery.json'),'utf8'));
assert.equal(pin.source,head);
for(const [name,source] of Object.entries(pin.runtimeSources))assert.equal(source,name==='head-neck'?head:shoulder);
const reviewed=JSON.parse(readFileSync(join(website,'atlas-review','manifest.json'),'utf8'));
assert.equal(reviewed.revision,head);
const paths=['content/thoracic-systemic-teaching-pins.json','content/thoracic-systemic-teaching.ts','lib/thoracic-systemic-teaching.ts','app/body-content.ts'];
for(const path of paths){
 const item=reviewed.files.find(f=>f.path===path);
 assert(item,`${path}: Review entry`);
 assert.equal(item.sourceSha256,sha(git(head,path)),`${path}: Review Git source`);
 assert.equal(item.importedSha256,sha(readFileSync(join(website,'atlas-review',path))),`${path}: imported bytes`);
 for(const name of ['head-neck','shoulder']){
  const inputs=JSON.parse(readFileSync(join(website,'public','atlas-runtime',name,'source-inputs.json'),'utf8'));
  const entry=inputs.find(i=>i.path===path);
  assert(entry,`${name}: ${path} input`);
  assert.equal(entry.sha256,sha(git(pin.runtimeSources[name],path)),`${name}: ${path} family Git source`);
  if(name==='shoulder'&&path==='app/body-content.ts')assert.notEqual(entry.sha256,item.sourceSha256,'known shoulder body-content difference');
 }
 process.stdout.write(`Git source roles ${path}: Review=${head.slice(0,7)} head-neck=${head.slice(0,7)} shoulder=${shoulder.slice(0,7)} PASS\n`);
}
process.stdout.write('SOURCE-ONLY proof complete; no website native test or validator executed.\n');
