import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

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
 for(const [i,[before,after]]of seams.entries())expected=exact(expected,before,after,name+' forward '+i);
 assert.equal(actual,expected,name+': every original assertion and refusal survives only declared seams');
 let inverse=actual;
 for(const [i,[before,after]]of seams.toReversed().entries())inverse=exact(inverse,after,before,name+' inverse '+i);
 assert.equal(sha(Buffer.from(inverse)),digest,name+': byte-exact whole-file inverse');
 assert(actual.includes(refusal),name+': original refusal retained');
 assert.throws(()=>assert.equal(actual.replace(refusal,''),expected),name+': removed refusal rejected');
 assert.throws(()=>assert.equal(actual+'\nconst unknown=true;\n',expected),name+': unknown append rejected');
};
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
