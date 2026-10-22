import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const stage=path.dirname(fileURLToPath(import.meta.url));
const name='atlas-spinal-muscle-xray.test.mjs';
const rawPath=path.join(stage,'RAW','tests',name);
const codePath=path.join(stage,'CODE','tests',name);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const raw=readFileSync(rawPath),code=readFileSync(codePath);
assert.equal(sha(raw),'7a39e919130ce257d590f564b0a9839857df9b2a1c3c786cf2805527fe79e01b',
  'exact frozen V6 preimage');
assert.equal(sha(code),'1db458f7edd9a9a1de40b50fe886cf277a3fb560f2bc629260388d81785b65ce',
  'exact isolated colic semantic postimage');
const original=raw.toString('utf8'),current=code.toString('utf8');
assert.ok(Buffer.from(original).equals(raw)&&Buffer.from(current).equals(code),'lossless source');
assert.ok(!original.includes('\r')&&!current.includes('\r'),'LF source');
const git=(...args)=>execFileSync('git',['-C','F:/VisibleMedicine/atlas',...args],
  {encoding:'utf8',windowsHide:true}).trim();
assert.equal(git('rev-parse','HEAD'),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(git('rev-parse','HEAD^'),'fa1bf9a233c6989fef42b533bbbac9d6ab034311');
assert.equal(git('rev-parse','HEAD^{tree}'),'e9165d7122361f809a267af1414b337b69097fe2');
for(const [file,blob] of [
  ['content/abdominal-branch-imaging-pins.json','35eba372769ec78877238f070263bb4177717782'],
  ['content/colic-artery-ultrasound.ts','6df46fa047e5108c8e6c55a9b31ff9d2064fe26b'],
  ['lib/colic-artery-ultrasound.ts','b032619b16a5aac42d79a2d2f50ef0b92af02fea'],
])assert.equal(git('rev-parse',`HEAD:${file}`),blob,`${file} authored Git blob`);
assert.equal(git('rev-parse','HEAD^:content/abdominal-branch-imaging-pins.json'),
  '35eba372769ec78877238f070263bb4177717782','exact predecessor pin identity');
const candidate='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website';
for(const file of ['content/colic-artery-ultrasound.ts','lib/colic-artery-ultrasound.ts']){
  const committed=execFileSync('git',['-C','F:/VisibleMedicine/atlas','show',`HEAD:${file}`],
    {windowsHide:true,maxBuffer:2e6});
  assert.deepEqual(readFileSync(path.join(candidate,'atlas-review',file)),committed,
    `${file} exact installed Review source`);
}
const resolver=readFileSync(path.join(candidate,'atlas-review/lib/colic-artery-ultrasound.ts'),'utf8');
assert.equal((resolver.match(/vm:anatomy:body:abdomen:(?:midline|right):vessel:[a-z-]+/g)||[]).length,2,
  'exact middle and right source identity gates');
assert.match(resolver,/if\(tab!=='ultrasound'\)return undefined/);
assert.match(resolver,/binding\.signature!==sourceCanonical\(s\)/);
assert.match(resolver,/readiness:'draft'/);
assert.match(resolver,/revision-bound radiologist review pending/);
assert.match(resolver,/No routine transabdominal visibility is guaranteed/);
const diff=spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--no-ext-diff','-U0','--',rawPath,codePath],
  {encoding:'utf8',windowsHide:true,maxBuffer:2e6});
assert.equal(diff.status,1,'exact source delta exists');
const oldLines=original.split('\n'),newLines=current.split('\n');
const patch=diff.stdout.split('\n');
const restored=[];let cursor=0,hunks=0;
for(let i=0;i<patch.length;i++){
  const match=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(patch[i]);
  if(!match)continue;
  const oldCount=Number(match[2]??1),newCount=Number(match[4]??1);
  const oldStart=Number(match[1])-(oldCount===0?0:1);
  const newStart=Number(match[3])-(newCount===0?0:1);
  assert.ok(newStart>=cursor&&newStart<=newLines.length,'ordered bounded hunk');
  restored.push(...newLines.slice(cursor,newStart));cursor=newStart;
  let oldHunk=0,newHunk=0;
  while(i+1<patch.length&&/^[ +-]/.test(patch[i+1])){
    const line=patch[++i],mark=line[0],value=line.slice(1);
    if(mark!=='-'){assert.equal(newLines[cursor++],value,'exact CODE hunk');newHunk++;}
    if(mark!=='+'){restored.push(value);oldHunk++;}
  }
  assert.equal(oldHunk,oldCount,'complete RAW hunk');
  assert.equal(newHunk,newCount,'complete CODE hunk');
  assert.equal(restored.length,oldStart+oldCount,'exact RAW hunk position');
  hunks++;
}
assert.ok(hunks>=10,'all bounded semantic seams remain visible');
restored.push(...newLines.slice(cursor));
assert.deepEqual(Buffer.from(restored.join('\n')),raw,'complete CODE to frozen V6 byte inverse');
for(const [label,mutated] of [
  ['approval',current.replace("assert.equal(worksheet.approval,false);","assert.equal(worksheet.approval,true);")],
  ['single colic cell',current.replace('assert.equal(colicChanges,2);','assert.equal(colicChanges,1);')],
  ['historical f1',current.replace('same(predecessor,priorLesson,','same(predecessor,after,')],
  ['Git identity',current.replace('6df46fa047e5108c8e6c55a9b31ff9d2064fe26b','0000000000000000000000000000000000000000')],
]){
  assert.notEqual(mutated,current,`${label} mutation applied`);
  assert.notEqual(sha(Buffer.from(mutated)),sha(code),`${label} refused by immutable postimage`);
}
console.log(JSON.stringify({ok:true,rawSha256:sha(raw),codeSha256:sha(code),hunks,
  gitHead:git('rev-parse','HEAD'),sourceOnly:true,mutationRefusals:4}));
