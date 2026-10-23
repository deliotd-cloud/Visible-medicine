import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';

assert.equal(CURRENT_ATLAS_REVISION,'2ab63cbbc1c5e18a4d7b3a65f799e863f5be0491','Exact sealed current Atlas role');
const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const exact=(text,before,after,label)=>{
 assert.equal(text.split(before).length,2,label+': unique declared seam');
 return text.replace(before,after);
};
const prove=(name,digest,seams,refusal)=>{
 const original=read('./fixtures/'+name+'-before-current190.test.ts.raw');
 assert.equal(sha(original),digest,name+': exact entire original');
 const actual=read('./'+name+'.test.ts').toString();
 let expected=original.toString();
 for(const [i,[before,after]]of seams.entries())expected=exact(expected,before,after,name+' historical forward '+i);
 for(const [i,[before,after]]of currentSeams[name].entries())expected=exact(expected,before,after,name+' current forward '+i);
 assert.equal(actual,expected,name+': every original assertion and refusal survives only declared seams');
 let inverse=actual;
 for(const [i,[before,after]]of currentSeams[name].toReversed().entries())inverse=exact(inverse,after,before,name+' current inverse '+i);
 for(const [i,[before,after]]of seams.toReversed().entries())inverse=exact(inverse,after,before,name+' historical inverse '+i);
 assert.equal(sha(Buffer.from(inverse)),digest,name+': byte-exact whole-file inverse');
 assert(actual.includes(refusal),name+': original refusal retained');
 assert.throws(()=>assert.equal(actual.replace(refusal,''),expected),name+': removed refusal rejected');
 assert.throws(()=>assert.equal(actual+'\nconst unknown=true;\n',expected),name+': unknown append rejected');
};
const currentSeams={"clinical-review-thoracic-eus":[["import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\n\nconst authoredRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';\nconst priorRevision='b03ba458907946c1b1c152149ee5867f8d6a62df';\n","import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\nimport {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n\nconst authoredRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst historicalRuntimeRevision='190a63238eadcf906abe89dcbb6a67c88afe70b9';\nconst priorRevision='b03ba458907946c1b1c152149ee5867f8d6a62df';\n"],["test('azygos EUS remains exact without admitting independently drafted hemiazygos',async()=>{\n const sourceRoot=checkedAtlasSourceRepo(revision);\n const {exactSourceHistoryApi}=await import(pathToFileURL(sourceRoot+'/scripts/exact-source-history-api.mjs').href);\n const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(revision);\n const review=json('atlas-review/manifest.json');\n assert.equal(review.revision,revision);\n assert.notEqual(review.revision,priorRevision);\n","test('azygos EUS remains exact without admitting independently drafted hemiazygos',async()=>{\n const deliveryPin=validateCurrentAtlasDelivery(),currentSource=CURRENT_ATLAS_REVISION;\n assert.equal(deliveryPin.source,currentSource);\n const sourceRoot=checkedAtlasSourceRepo(currentSource);\n const {exactSourceHistoryApi}=await import(pathToFileURL(sourceRoot+'/scripts/exact-source-history-api.mjs').href);\n const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(currentSource);\n const review=json('atlas-review/manifest.json');\n assert.equal(review.revision,currentSource);\n assert.notEqual(review.revision,priorRevision);\n"],["  assert.equal(sha(execFileSync('git',['show',authoredRevision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest,'Exact authored source '+path);\n  const record=review.files.find((file:{path:string})=>file.path===path);\n","  assert.equal(sha(execFileSync('git',['show',authoredRevision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest,'Exact authored source '+path);\n  assert.equal(sha(execFileSync('git',['show',historicalRuntimeRevision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest,'Exact 190a source '+path);\n  assert.equal(sha(execFileSync('git',['show',currentSource+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest,'Exact current source '+path);\n  const record=review.files.find((file:{path:string})=>file.path===path);\n"],["  const manifest=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');\n  assert.equal(manifest.sourceCommit,revision,module);\n  assert.equal(manifest.patientDataIncluded,false,module);\n","  const manifest=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');\n  assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);\n  assert.equal(manifest.patientDataIncluded,false,module);\n"],[" const viewer=json(viewerBase+'manifest.json');\n assert.equal(viewer.sourceCommit,revision);\n assert.equal(viewer.personalRecordsIncluded,false);\n"," const viewer=json(viewerBase+'manifest.json');\n assert.equal(viewer.sourceCommit,currentSource);\n assert.equal(viewer.personalRecordsIncluded,false);\n"]],"clinical-review-thoracic-systemic-teaching":[["import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\n\n","import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\nimport {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n\n"],["const authoredRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';\nconst sourceFiles:Record<string,string>={FMA4149:'FJ1934',FMA10704:'FJ3418',FMA68109:'FJ1933',FMA71537:'FJ3431'};\n","const authoredRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst revision=CURRENT_ATLAS_REVISION;\nconst runtimeSources=validateCurrentAtlasDelivery().runtimeSources;\nconst sourceFiles:Record<string,string>={FMA4149:'FJ1934',FMA10704:'FJ3418',FMA68109:'FJ1933',FMA71537:'FJ3431'};\n"],[" const api=await bundled,review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n assert.equal(review.revision,revision);assert.notEqual(review.revision,parent);\n"," const api=await bundled,review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));\n const sourceRoot=checkedAtlasSourceRepo(revision);\n assert.equal(review.revision,revision);assert.notEqual(review.revision,parent);\n"],["  const base=`public/atlas-runtime/${name}/`,m=JSON.parse(readFileSync(base+'manifest.json','utf8')),inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));\n  assert.equal(m.sourceCommit,review.revision);assert.equal(m.patientDataIncluded,false);assert.equal(m.clinicalApproved,false);\n  for(const path of paths){const f=review.files.find((f:any)=>f.path===path);assert(f);assert.equal(rawSha(readFileSync('atlas-review/'+path)),f.importedSha256);assert.equal(inputs.find((i:any)=>i.path===path)?.sha256,f.sourceSha256);}\n  const js=m.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>{const b=readFileSync(base+f.path);assert.equal(rawSha(b),f.sha256);return new TextDecoder('utf-8',{fatal:true}).decode(b);}).join('\\n');\n","  const base=`public/atlas-runtime/${name}/`,m=JSON.parse(readFileSync(base+'manifest.json','utf8')),inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));\n  assert.equal(m.sourceCommit,runtimeSources[name]);assert.equal(m.patientDataIncluded,false);assert.equal(m.clinicalApproved,false);\n  for(const path of paths){const f=review.files.find((f:any)=>f.path===path);assert(f);assert.equal(rawSha(readFileSync('atlas-review/'+path)),f.importedSha256);\n   const committed=(source:string)=>execFileSync('git',['show',`${source}:${path}`],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n   assert.equal(f.sourceSha256,rawSha(committed(revision)),`${path}: current Review source`);\n   assert.equal(inputs.find((i:any)=>i.path===path)?.sha256,rawSha(committed(runtimeSources[name])),`${name}: family input`);}\n  const js=m.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>{const b=readFileSync(base+f.path);assert.equal(rawSha(b),f.sha256);return new TextDecoder('utf-8',{fatal:true}).decode(b);}).join('\\n');\n"]],"clinical-review-thoracic-wall-xray":[["import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\n\nconst authoredRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';\nconst atlas=checkedAtlasSourceRepo(revision);\n","import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\nimport {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n\nconst authoredRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst revision=CURRENT_ATLAS_REVISION;\nconst atlas=checkedAtlasSourceRepo(revision);\n"],["  assert.equal(review.revision,revision);\n  assert.equal(learner.sourceCommit,revision);\n  assert.equal(viewer.sourceCommit,revision);\n","  assert.equal(review.revision,revision);\n  assert.equal(learner.sourceCommit,validateCurrentAtlasDelivery().runtimeSources['head-neck']);\n  assert.equal(viewer.sourceCommit,revision);\n"]],"clinical-review-thoracoacromial-ultrasound":[["import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\n\n","import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';\nimport {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n\n"],["test('six thoracoacromial ultrasound drafts bind exact learner and protected Review revisions',async()=>{\n const sourceRoot=checkedAtlasSourceRepo(revision);\n const {exactSourceHistoryApi}=await import(pathToFileURL(sourceRoot+'/scripts/exact-source-history-api.mjs').href);\n const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(revision);\n const review=json('atlas-review/manifest.json');\n","test('six thoracoacromial ultrasound drafts bind exact learner and protected Review revisions',async()=>{\n const pin=validateCurrentAtlasDelivery();\n assert.equal(pin.source,CURRENT_ATLAS_REVISION);assert.equal(pin.runtimeSources.shoulder,revision);\n const sourceRoot=checkedAtlasSourceRepo(pin.source);\n const {exactSourceHistoryApi}=await import(pathToFileURL(sourceRoot+'/scripts/exact-source-history-api.mjs').href);\n const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(pin.source);\n const review=json('atlas-review/manifest.json');\n"],[" const catalog=json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');\n assert.equal(review.revision,revision);\n assert.equal(pins.baseline,baseline);\n"," const catalog=json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');\n assert.equal(review.revision,pin.source);\n assert.equal(pins.baseline,baseline);\n"],["  const manifest=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');\n  assert.equal(manifest.sourceCommit,revision,module);\n  assert.equal(manifest.patientDataIncluded,false,module);\n","  const manifest=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');\n  assert.equal(manifest.sourceCommit,pin.runtimeSources[module],module);\n  assert.equal(manifest.patientDataIncluded,false,module);\n"]]};
const oldRev="const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';";
const newRev="const authoredRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\nconst revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';";

test('complete azygos EUS source retains its authored and current obligations',()=>{
 prove('clinical-review-thoracic-eus','f2779287a51c847d087e6fd22097d65d644c9b76c62c8d6633cce163cbe2f36b',[
  ["import {emittedTeaching} from './atlas-emitted-teaching.ts';",`import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {pathToFileURL} from 'node:url';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';`],
  [oldRev,newRev],
  ["test('azygos EUS remains exact without admitting independently drafted hemiazygos',async()=>{",`test('azygos EUS remains exact without admitting independently drafted hemiazygos',async()=>{
 const sourceRoot=checkedAtlasSourceRepo(revision);
 const {exactSourceHistoryApi}=await import(pathToFileURL(sourceRoot+'/scripts/exact-source-history-api.mjs').href);
 const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(revision);`],
  [" for(const [path,digest] of Object.entries(sourceHashes)){\n  const record=review.files.find((file:{path:string})=>file.path===path);",` for(const [path,digest] of Object.entries(sourceHashes)){
  assert.equal(sha(execFileSync('git',['show',authoredRevision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest,'Exact authored source '+path);
  const record=review.files.find((file:{path:string})=>file.path===path);`],
  ["  cwd:'F:/VisibleMedicine/atlas',windowsHide:true,maxBuffer:8e6,","  cwd:sourceRoot,windowsHide:true,maxBuffer:8e6,"],
  [" assert.deepEqual(packet.topics.find((item:{tab:string})=>item.tab==='ultrasound'),{tab:'ultrasound',...lesson});",` assert.deepEqual(packet.topics.find((item:{tab:string})=>item.tab==='ultrasound'),{tab:'ultrasound',...lesson});
 const authoredPacket=wire(await authored.bodyReviewMaterial(id));assert.equal(authoredPacket.approval,false);assert.equal(authoredPacket.status,'worksheet-not-submitted');
 assert.deepEqual(authoredPacket.topics.find((item:{tab:string})=>item.tab==='ultrasound'),{tab:'ultrasound',...lesson},'Exact authored EUS topic');
 assert.deepEqual(packet,wire(await bound.bodyReviewMaterial(id)),'Complete current packet equals independently renderer-bound Atlas replay');`],
 ],"assert.equal(storageCalls,0);");
});

test('complete thoracic systemic teaching source retains its authored and current obligations',()=>{
 prove('clinical-review-thoracic-systemic-teaching','46a83e58c6a04bdb2c6516beb94662b765f80cc32172dd51b4dd072a47bbc00b',[
  ["import {build} from 'esbuild';",`import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';`],
  [oldRev,newRev],
  [" const api=await bundled,renderer=JSON.parse(readFileSync('atlas-review/content/body-renderer-revision.json','utf8'));",` const api=await bundled,renderer=JSON.parse(readFileSync('atlas-review/content/body-renderer-revision.json','utf8'));
 const sourceRoot=checkedAtlasSourceRepo(revision);
 const {exactSourceHistoryApi}=await import(pathToFileURL(sourceRoot+'/scripts/exact-source-history-api.mjs').href);
 const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(revision);
 for(const path of ['content/thoracic-systemic-teaching-pins.json','content/thoracic-systemic-teaching.ts','lib/thoracic-systemic-teaching.ts'])
  assert.deepEqual(readFileSync('atlas-review/'+path),execFileSync('git',['show',authoredRevision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}),'Unchanged exact authored teaching source '+path);`],
  ["  assert(snapshot&&packet&&context);assert.equal(packet.approval,false);assert.deepEqual(snapshot.source.structure,identity);assert.deepEqual(packet.source.structure,identity);",`  assert(snapshot&&packet&&context);assert.equal(packet.approval,false);assert.deepEqual(snapshot.source.structure,identity);assert.deepEqual(packet.source.structure,identity);
  const authoredPacket=await authored.bodyReviewMaterial(identity.id);assert(authoredPacket);assert.equal(authoredPacket.approval,false);assert.deepEqual(authoredPacket.source.structure,identity);
  assert.deepEqual(packet,await bound.bodyReviewMaterial(identity.id),'Complete current packet equals independently renderer-bound Atlas replay');`],
  ["   assert.deepEqual(snapshot.topics.find((t:any)=>t.tab===tab),{tab,...lesson});assert.deepEqual(packet.topics.find((t:any)=>t.tab===tab),{tab,...lesson});",`   assert.deepEqual(snapshot.topics.find((t:any)=>t.tab===tab),{tab,...lesson});assert.deepEqual(packet.topics.find((t:any)=>t.tab===tab),{tab,...lesson});
   assert.deepEqual(authoredPacket.topics.find((t:any)=>t.tab===tab),{tab,...lesson},'Exact authored target teaching topic');`],
 ],"assert.equal(await api.parseBodyReviewResponse(forged,identity.id),null)");
});

test('complete thoracic wall X-ray source retains its authored and current obligations',()=>{
 prove('clinical-review-thoracic-wall-xray','97cae6bdb01fcb68757c7cbba433cdc5b8caa4e84b2f84077fcb19b2ae18385b',[
  ["import {emittedTeaching} from './atlas-emitted-teaching.ts';",`import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {pathToFileURL} from 'node:url';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';`],
  [oldRev+"\nconst atlas='F:/VisibleMedicine/atlas';",newRev+"\nconst atlas=checkedAtlasSourceRepo(revision);"],
  ["test('six exact thoracic wall angiography drafts reach learner and protected Review',async()=>{",`test('six exact thoracic wall angiography drafts reach learner and protected Review',async()=>{
  const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(revision);`],
  ["    const source=execFileSync('git',['show',\`${revision}:${path}\`],{cwd:atlas,windowsHide:true,maxBuffer:32e6});",`    const source=execFileSync('git',['show',\`\${revision}:\${path}\`],{cwd:atlas,windowsHide:true,maxBuffer:32e6});
    assert.deepEqual(source,execFileSync('git',['show',\`\${authoredRevision}:\${path}\`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}),'Exact authored source remains unchanged: '+path);`],
  ["    assert.deepEqual(packet.topics.find((t:{tab:string})=>t.tab==='xray'),{tab:'xray',...lesson});",`    assert.deepEqual(packet.topics.find((t:{tab:string})=>t.tab==='xray'),{tab:'xray',...lesson});
    const authoredPacket=await authored.bodyReviewMaterial(s.id);assert(authoredPacket);assert.equal(authoredPacket.approval,false);
    assert.deepEqual(authoredPacket.topics.find((t:{tab:string})=>t.tab==='xray'),{tab:'xray',...lesson},'Exact authored X-ray topic');
    assert.deepEqual(packet,await bound.bodyReviewMaterial(s.id),'Whole current packet equals independent renderer-bound Atlas replay');`],
 ],"packet.topics.find((t:{tab:string})=>t.tab==='xray').body+=' forged';");
});

test('complete thoracoacromial ultrasound source retains its authored and current obligations',()=>{
 prove('clinical-review-thoracoacromial-ultrasound','7c395e4ceed1630061a62f3032b8cd660e0518ad8ea8f21a48a6aaa777fc3222',[
  ["import {build} from 'esbuild';",`import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';`],
  [oldRev,newRev],
  ["test('six thoracoacromial ultrasound drafts bind exact learner and protected Review revisions',async()=>{",`test('six thoracoacromial ultrasound drafts bind exact learner and protected Review revisions',async()=>{
 const sourceRoot=checkedAtlasSourceRepo(revision);
 const {exactSourceHistoryApi}=await import(pathToFileURL(sourceRoot+'/scripts/exact-source-history-api.mjs').href);
 const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(revision);`],
  [" for(const [path,digest] of Object.entries(sourceHashes)){\n  const imported=review.files.find((file:{path:string})=>file.path===path);",` for(const [path,digest] of Object.entries(sourceHashes)){
  assert.equal(sha(execFileSync('git',['show',authoredRevision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),digest,'Exact authored source '+path);
  const imported=review.files.find((file:{path:string})=>file.path===path);`],
  ["  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='ultrasound'),{tab:'ultrasound',...lesson});",`  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='ultrasound'),{tab:'ultrasound',...lesson});
  const authoredPacket=wire(await authored.bodyReviewMaterial(id));assert.equal(authoredPacket.approval,false);assert.equal(authoredPacket.status,'worksheet-not-submitted');
  assert.deepEqual(authoredPacket.topics.find((topic:{tab:string})=>topic.tab==='ultrasound'),{tab:'ultrasound',...lesson},'Exact authored ultrasound topic');
  assert.deepEqual(packet,wire(await bound.bodyReviewMaterial(id)),'Whole current packet equals independent renderer-bound Atlas replay');`],
 ],"assert.equal(await api.parseBodyReviewResponse(bad,id),null");
});
