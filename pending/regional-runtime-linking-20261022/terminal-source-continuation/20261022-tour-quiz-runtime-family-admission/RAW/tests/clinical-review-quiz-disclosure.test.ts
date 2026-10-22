import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const expected=new Map([
 ['app/atlas-workspace.tsx','0785f499c3e9d6a6ee83eb0ccb396956ad8a61599563f8f17b373e59f5786520'],
 ['app/atlas-panel.css','384e9ac467389d9e55ab695e1f6899d6742ac03834ab5da1bdc7c7fd7e46e478'],
]);
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
function verifyDisclosureBytes(path:string,hash:string,historical:Buffer,current:Buffer,imported:Buffer,record:any){
 assert.equal(sha(historical),hash,path+': saved 9f source');
 assert.deepEqual(current,historical,path+': unchanged at current 87ed source');
 assert(record,path+': current Review record');
 assert.equal(record.sourceSha256,hash,path+': current Review source');
 assert.equal(record.importedSha256,sha(imported),path+': current Review import');
 assert.equal(imported.toString(),path.endsWith('.tsx')?current.toString().replaceAll('@/','@/atlas-review/'):current.toString(),
  path+': only the normal Review import rewrite');
}
function admitCurrentDisclosure(){
 const pin=validateCurrentAtlasDelivery(),root=currentAtlasDeliveryRoot();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);assert.notEqual(pin.source,revision);
 const git=(commit:string,path:string)=>execFileSync('git',['-C',root,'show',commit+':'+path],
  {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const review=read('atlas-review/manifest.json');assert.equal(review.revision,pin.source);
 for(const [path,hash] of expected){
  const historical=git(revision,path),current=git(pin.source,path);
  const record=review.files.find((row:{path:string})=>row.path===path);assert(record,path);
  const imported=readFileSync('atlas-review/'+path);
  verifyDisclosureBytes(path,hash,historical,current,imported,record);
  for(const module of ['head-neck','shoulder']){
   const inputs=read(`public/atlas-runtime/${module}/source-inputs.json`);
   assert.equal(inputs.find((row:{path:string})=>row.path===path)?.sha256,hash,module+': current learner source');
  }
  for(const module of ['lower-limb','female-pelvis'])
   assert.equal(read(`public/atlas-runtime/${module}/source-inputs.json`).find((row:{path:string})=>row.path===path),undefined,
    module+': independent specimen learner source');
 }
 return pin.source;
}
test('saved disclosure sources reject altered historical, current, or imported bytes',()=>{
 const root=currentAtlasDeliveryRoot();
 const path='app/atlas-workspace.tsx',expectedHash=expected.get(path)!;
 const git=(commit:string)=>execFileSync('git',['-C',root,'show',commit+':'+path],
  {windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 const old=git(revision),current=git(CURRENT_ATLAS_REVISION),imported=readFileSync('atlas-review/'+path);
 const record=read('atlas-review/manifest.json').files.find((row:{path:string})=>row.path===path);assert(record);
 verifyDisclosureBytes(path,expectedHash,old,current,imported,record);
 const altered=(bytes:Buffer)=>Buffer.concat([bytes,Buffer.from('altered')]);
 assert.throws(()=>verifyDisclosureBytes(path,expectedHash,altered(old),current,imported,record));
 assert.throws(()=>verifyDisclosureBytes(path,expectedHash,old,altered(current),imported,record));
 assert.throws(()=>verifyDisclosureBytes(path,expectedHash,old,current,altered(imported),record));
});
test('learner modules bind compact practice sources to the exact saved implementation',()=>{
 const currentRevision=admitCurrentDisclosure();
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
  const root='public/atlas-runtime/'+module,m=read(root+'/manifest.json'),inputs=read(root+'/source-inputs.json');
  assert.equal(m.sourceCommit,currentRevision);assert.equal(m.clinicalApproved,false);assert.equal(m.patientDataIncluded,false);
  for(const [path,hash]of expected){
   const input=inputs.find((f:{path:string})=>f.path===path);
   if(module==='head-neck'||module==='shoulder')assert.equal(input?.sha256,hash,module+': '+path);
   else assert.equal(input,undefined,module+' retains its independent specimen UI');
  }
  if(module==='head-neck'){
   const code=m.files.filter((f:{path:string})=>f.path.endsWith('.js')||f.path.endsWith('.css')).map((f:{path:string;sha256:string})=>{const b=readFileSync(root+'/'+f.path);assert.equal(sha(b),f.sha256);return b.toString();}).join('\n');
   assert(code.includes('Sources & limitations'));assert(code.includes('atlas-quiz-sources'));assert(code.includes('Formative draft · not a scored assessment'));
   assert(code.includes('focus-visible'));assert(code.includes('Practise again'));
  }
 }
});
test('protected Review retains the same disclosure and exact revised renderer bindings',()=>{
 const currentRevision=admitCurrentDisclosure();
 const m=read('atlas-review/manifest.json');assert.equal(m.revision,currentRevision);
 const display=new Map(read('atlas-review/content/review-revisions.json').display);
 for(const [path,hash]of expected){const f=m.files.find((entry:{path:string})=>entry.path===path);assert.equal(f.sourceSha256,hash);assert.equal(sha(readFileSync('atlas-review/'+path)),f.importedSha256);assert.equal(display.get(path),hash);}
 const source=readFileSync('atlas-review/app/atlas-workspace.tsx','utf8');
 assert(source.includes('<summary>Sources &amp; limitations</summary>'));
 assert(source.includes('key={JSON.stringify([structure.id, content.body, content.note, content.citations])}'));
 assert(source.includes('if (exam) return null;'));assert(source.includes('enabled={open && teachingVisible}'));
 const start=source.indexOf('className="atlas-quiz-sources"'),end=source.indexOf('</details>',start);
 const disclosure=source.slice(start,end);assert(disclosure.includes('{content.note}'));assert(disclosure.includes('content.citations?.map'));assert(!disclosure.includes('StructureQuickCheck'));
 assert.equal(sha(JSON.stringify(read('atlas-review/content/deep-brain-quiz-pins.json'))),'6ab3a1675f49936b62210879aa7bd28c2875ad461c2b5ff9d2a0650d42ec6d74');
});
