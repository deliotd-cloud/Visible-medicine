import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {restoreReasoningRegistry} from './tests/reasoning-current-source-epoch.mjs';
const base='G:/VisibleMedicine-temp/staging/20261031-release19-followup/website',root=path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/,'$1');
const sha=b=>createHash('sha256').update(b).digest('hex'),rows=[];
const edit=(file,changes)=>{const bytes=fs.readFileSync(base+'/'+file);let text=bytes.toString();for(const [from,to]of changes){assert.equal(text.split(from).length,2,file+' unique edit');text=text.replace(from,to);}const dest=root+'/'+file;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,text,{flag:'wx'});rows.push({path:file,before:sha(bytes),after:sha(Buffer.from(text))});};
edit('tests/clinical-review-abdominal-vessel-reasoning.test.ts',[
 ["import {emittedTeaching} from './atlas-emitted-teaching.ts';","import {emittedTeaching} from './atlas-emitted-teaching.ts';\nimport {restoreReasoningRegistry} from './reasoning-current-source-epoch.mjs';"],
 ['  assert.equal(file.sourceSha256,digest,path);\n  assert.equal(file.importedSha256,digest,path);\n  assert.equal(sha(readFileSync(\'atlas-review/\'+path)),digest,path);',`  const historical=execFileSync('git',['show',revision+':'+path],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const current=execFileSync('git',['show',CURRENT_ATLAS_REVISION+':'+path],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.deepEqual(path==='lib/reasoning-questions.ts'?restoreReasoningRegistry(current,historical):current,historical,path+' original source retained');
  assert.equal(file.sourceSha256,sha(current),path);
  assert.equal(file.importedSha256,sha(current),path);
  assert.deepEqual(readFileSync('atlas-review/'+path),current,path);`],
 [' for(const [path,digest] of Object.entries(sourceHashes))\n  assert.equal(learnerInputs.find((file:{path:string})=>file.path===path)?.sha256,digest,`learner ${path}`);',` for(const path of Object.keys(sourceHashes))
  assert.equal(learnerInputs.find((file:{path:string})=>file.path===path)?.sha256,review.files.find((file:{path:string})=>file.path===path).sourceSha256,\`learner \${path}\`);`],
]);
edit('tests/clinical-review-reasoning.test.ts',[
 ["import { build } from './review-component-test-build.ts';","import { build } from './review-component-test-build.ts';\nimport {restoreReasoningRegistry} from './reasoning-current-source-epoch.mjs';"],
 ["    assert.deepEqual(current,historical,path+' retains exact 9f reasoning source bytes');","    assert.deepEqual(path==='lib/reasoning-questions.ts'?restoreReasoningRegistry(current,historical):current,historical,path+' retains every original 9f reasoning source byte');"],
]);
const git=(rev,file)=>execFileSync('git',['-C','F:/VisibleMedicine/atlas','show',rev+':'+file],{windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:1e6});
const old=git('9fba9a1e24b6669aafd48e945d55fc0939d50ab2','lib/reasoning-questions.ts'),current=git('c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3','lib/reasoning-questions.ts');
assert.deepEqual(restoreReasoningRegistry(current,old),old);
for(const target of ['current','historical']){const changed=Buffer.from(target==='current'?current:old);changed[0]^=1;assert.throws(()=>restoreReasoningRegistry(target==='current'?changed:current,target==='historical'?changed:old));}
const helper='tests/reasoning-current-source-epoch.mjs';rows.push({path:helper,before:null,after:sha(fs.readFileSync(root+'/'+helper))});
fs.writeFileSync(root+'/MANIFEST.json',JSON.stringify({schema:'vm-reviewed-source-proposal/1',base,files:rows,productChanged:false,historicalRegistrySha256:sha(old),currentRegistrySha256:sha(current),explicitLaterCohorts:9,focusedNativePending:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proposal:root,files:rows.length,wholeHistoricalRegistryRestored:true,mutationChecks:2}));
