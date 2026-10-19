import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const expected=new Map([
 ['app/atlas-workspace.tsx','0785f499c3e9d6a6ee83eb0ccb396956ad8a61599563f8f17b373e59f5786520'],
 ['app/atlas-panel.css','384e9ac467389d9e55ab695e1f6899d6742ac03834ab5da1bdc7c7fd7e46e478'],
]);
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
test('learner modules bind compact practice sources to the exact saved implementation',()=>{
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
  const root='public/atlas-runtime/'+module,m=read(root+'/manifest.json'),inputs=read(root+'/source-inputs.json');
  assert.equal(m.sourceCommit,revision);assert.equal(m.clinicalApproved,false);assert.equal(m.patientDataIncluded,false);
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
 const m=read('atlas-review/manifest.json');assert.equal(m.revision,revision);
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
