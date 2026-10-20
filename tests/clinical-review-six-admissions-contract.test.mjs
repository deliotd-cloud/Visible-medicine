import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const names=[
 ['clinical-review-abdominal-eus.test.ts','d2cbbaef7ca2fa650f7ab8cd4733c4ad5e9f4d2635b38d5af0a4e393d80a12f8'],
 ['clinical-review-abdominal-fold-ultrasound.test.ts','3cac6a0affbac57290b03454e5d051b50527f7aa1365cfa7d1950bcd278c490b'],
 ['clinical-review-abdominal-spatial-reasoning.test.ts','69e16055623acf1518d3d53f39f2bbc7276994b265b335086d96ec601d373d5f'],
 ['clinical-review-abdominal-vessel-reasoning.test.ts','dd8c31447a358ee34bdaf3f74f4d16ce541cc26a548732bdc09a72921cd6e74a'],
 ['clinical-review-biliary-xray.test.ts','9aa5a8508673961457d0a6af633ead06aa66e6283032361a702a20eb86d3aa96'],
 ['clinical-review-brain-connections-reasoning.test.ts','64a193efb8dac36599f1d416fa5c29615137df7d10c3efe524878049120b5ca8'],
];
const gitImport="import {execFileSync} from 'node:child_process';\n";
const deliveryImport="import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n";
const eusName='clinical-review-abdominal-eus.test.ts';
// 2026-10-19 six-admission source, before the LF/CRLF working-copy admission.
const preWorkingBranchHash='270b6e9d0e229c52a73077c37a2447ab7099da9ca2fa8a6a760cc914e483190f';
const preBufferTypeHash='6298f4b8ab73c65d8e54242eb828517a5351b34abbc6f8515fdeff081fce1bf2';
const admittedBufferTypeHash='05068e84a9b628dd1860cf4ffc5de972a4713831b5534abe2dc6fa4970c11275';
const workingBranchSeams=[
 [`// This existing pin file is CRLF in the clean Windows build checkout; Review
// imports its LF Git blob. Both exact byte identities are retained, not repinned
// to an arbitrary current manifest value.
const learnerSourceHashes={...sourceHashes,
 'content/abdominal-branch-imaging-pins.json':'735ff50192908a217378920c0f2875b83611ab2d579e41d9a75ea2b6fab370e1',
};`,
 `// The committed/Review pin is LF; the historical Windows working copy is CRLF.
// Both fixed identities remain admissible only when the exact Git blob proves
// the selected working file is unchanged or differs solely by LF-to-CRLF.
const branchPath='content/abdominal-branch-imaging-pins.json';
const branchBlob='35eba372769ec78877238f070263bb4177717782';
const branchCrlfHash='735ff50192908a217378920c0f2875b83611ab2d579e41d9a75ea2b6fab370e1';
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const checkedWorkingBranch=()=>{
 const blob=git(['cat-file','blob',branchBlob]);
 assert.equal(sha(blob),sourceHashes[branchPath],'exact LF Git blob');
 for(const epoch of [revision,'b03ba458',CURRENT_ATLAS_REVISION])
  assert.equal(git(['rev-parse',\`\${epoch}:\${branchPath}\`]).toString().trim(),branchBlob,\`\${epoch}: same pin blob\`);
 assert.equal(blob.includes(13),false,'committed pin has LF only');
 const crlf=Buffer.from(blob.toString('utf8').replaceAll('\\n','\\r\\n'));
 assert.equal(sha(crlf),branchCrlfHash,'exact historical CRLF conversion');
 const working=readFileSync(\`\${atlas}/\${branchPath}\`);
 assert(working.equals(blob)||working.equals(crlf),'working pin must equal LF blob or exact CRLF conversion');
 return sha(working);
};`],
 [` assert.equal(sha(Buffer.from(readFileSync('atlas-review/content/abdominal-branch-imaging-pins.json','utf8').replaceAll('\\n','\\r\\n'))),
  learnerSourceHashes['content/abdominal-branch-imaging-pins.json']);`,
  ' const workingBranchDigest=checkedWorkingBranch();'],
 ['  for(const [path,digest] of Object.entries(learnerSourceHashes)){','  for(const [path,digest] of Object.entries(sourceHashes)){'],
 [`   if(module==='head-neck'||module==='shoulder')assert.equal(found?.sha256,digest,\`\${module}: \${path}\`);`,
 `   if(module==='head-neck'||module==='shoulder'){
    const working=readFileSync(\`\${atlas}/\${path}\`);
    assert.equal(sha(working),path===branchPath?workingBranchDigest:digest,\`\${path}: pinned working file\`);
    assert.equal(found?.sha256,sha(working),\`\${module}: \${path}\`);
   }`],
];
const nodeBufferSeams=[
 ["import {existsSync,readFileSync} from 'node:fs';","import {existsSync,readFileSync} from 'node:fs';\nimport {Buffer} from 'node:buffer';"],
 ["const blob=git(['cat-file','blob',branchBlob]);","const blob=Buffer.from(git(['cat-file','blob',branchBlob]));"],
 ["const working=readFileSync(`${atlas}/${branchPath}`);","const working=Buffer.from(readFileSync(`${atlas}/${branchPath}`));"],
];
const immutable=(commit,indent,digest)=>indent+
 `assert.equal(sha(execFileSync('git',['show',\`\${${commit}}:\${path}\`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),\n`+
 indent+(indent.length===4?'  ':' ')+`${digest},\`\${path}: 9f Git source\`);\n`;

function replaceOne(source,oldText,newText){
 assert.equal(source.split(oldText).length,2,`Expected one declared seam: ${oldText}`);
 return source.replace(oldText,newText);
}
const applySeams=(source,seams)=>seams.reduce((s,[before,after])=>replaceOne(s,before,after),source);
const invertSeams=(source,seams)=>seams.toReversed().reduce((s,[before,after])=>replaceOne(s,after,before),source);
function reconstruct(name,rawHash){
 const raw=readFileSync(new URL('./fixtures/'+name+'.raw',import.meta.url));
 assert.equal(sha(raw),rawHash,`Frozen original changed: ${name}`);
 let s=raw.toString('utf8');
 const spatial=name.includes('spatial-reasoning');
 const biliary=name.includes('biliary-xray');
 const fold=name.includes('fold-ultrasound');
 if(!spatial)s=replaceOne(s,"import assert from 'node:assert/strict';\n",
  "import assert from 'node:assert/strict';\n"+gitImport);
 const importAnchor=fold||biliary?"import {build} from 'esbuild';\n":
  "import {emittedTeaching} from './atlas-emitted-teaching.ts';\n";
 s=replaceOne(s,importAnchor,importAnchor+deliveryImport);
 const commit=biliary?'sourceCommit':'revision';
 const declaration=`const ${commit}='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';\n`;
 s=replaceOne(s,declaration,declaration+"const atlas=currentAtlasDeliveryRoot();\n");
 const opening=s.match(/^test\('[^\n]+',async\(\)=>\{\n/m)?.[0];
 assert(opening,`Original test opening missing: ${name}`);
 const indent=biliary?'  ':' ';
 s=replaceOne(s,opening,opening+indent+
  "const admission=validateCurrentAtlasDelivery();\n"+indent+
  "assert.equal(admission.source,CURRENT_ATLAS_REVISION);\n");
 s=replaceOne(s,`assert.equal(review.revision,${commit});`,
  'assert.equal(review.revision,CURRENT_ATLAS_REVISION);');
 if(biliary){
  s=replaceOne(s,'assert.equal(learner.sourceCommit,sourceCommit);',
   'assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);');
 }else{
  s=replaceOne(s,'assert.equal(manifest.sourceCommit,revision,module);',
   'assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION,module);');
  if(!fold)s=replaceOne(s,'assert.equal(viewer.sourceCommit,revision);',
   'assert.equal(viewer.sourceCommit,CURRENT_ATLAS_REVISION);');
 }
 const digest=fold?'expected':'digest';
 const loop=biliary?'  for(const [path,digest] of Object.entries(sourceFiles)){\n':
  ` for(const [path,${digest}] of Object.entries(sourceHashes)){\n`;
 const loopAnchor=fold?loop+'  const record=review.files.find':loop;
 s=replaceOne(s,loopAnchor,loop+immutable(commit,biliary?'    ':'  ',digest)+
  (fold?'  const record=review.files.find':''));
 if(spatial)s=replaceOne(s,
  "{cwd:'F:/VisibleMedicine/atlas',maxBuffer:32e6}",
  "{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}");
 if(name===eusName){
  const original=s;
  assert.equal(sha(Buffer.from(original)),preWorkingBranchHash,'authentic pre-LF/CRLF EUS source');
  s=applySeams(s,workingBranchSeams);
  assert.equal(sha(Buffer.from(s)),preBufferTypeHash,'complete current pre-type EUS source');
  assert.equal(invertSeams(s,workingBranchSeams),original,'complete pre-LF/CRLF inverse');
  const preType=s;
  s=applySeams(s,nodeBufferSeams);
  assert.equal(sha(Buffer.from(s)),admittedBufferTypeHash,'complete Node Buffer EUS source');
  assert.equal(invertSeams(s,nodeBufferSeams),preType,'complete pre-type inverse');
 }
 return Buffer.from(s,'utf8');
}
function assertExact(name,rawHash,bytes){
 assert.deepEqual(bytes,reconstruct(name,rawHash),`Undeclared change: ${name}`);
}
function mutated(name,from,to){
 const s=readFileSync(new URL('./'+name,import.meta.url),'utf8');
 assert.equal(s.split(from).length,2,`Missing or repeated mutation target: ${name}: ${from}`);
 return Buffer.from(s.replace(from,to));
}

test('all six candidates reconstruct byte-for-byte from immutable originals and declared seams',()=>{
 for(const [name,rawHash] of names){
  const candidate=readFileSync(new URL('./'+name,import.meta.url));
  assertExact(name,rawHash,candidate);
  assert(candidate.includes(Buffer.from('9fba9a1e24b6669aafd48e945d55fc0939d50ab2')));
  assert(candidate.includes(Buffer.from(deliveryImport.trim())));
 }
});

test('source, emitted, negative, practice and Review mutations are refused',()=>{
 const cases=[
  [names[0],"const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';",
   "const revision='3dcdf94a46db44202e72641be9fbcf1274ce5364';"],
  [names[1],"assert.equal(manifest.clinicalApproved,false,module);",
   "assert.equal(manifest.clinicalApproved,true,module);"],
  [names[2],"assert.equal(api.reasoningConcepts.length,190);",
   "assert.equal(api.reasoningConcepts.length,191);"],
  [names[3],"emittedTeaching(viewerBase,viewer.files,true)",
   "emittedTeaching(viewerBase,viewer.files,false)"],
  [names[4],"assert.equal(packet.approval,false);",
   "assert.equal(packet.approval,true);"],
  [names[5],"assert.equal(storageCalls,0,entry.key);",
   "assert.equal(storageCalls,1,entry.key);"],
  [names[0],"const admission=validateCurrentAtlasDelivery();",
   "const admission=validateCurrentAtlasDelivery({pin:{source:revision}});"],
  [names[0],"GIT_NO_REPLACE_OBJECTS:'1'",
   "GIT_NO_REPLACE_OBJECTS:'0'"],
  [names[4],"env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}",
   "env:{...process.env}"],
  [names[0],"replaceAll('\\n','\\r\\n')","replaceAll('\\n','\\n')"],
  [names[0],"const blob=Buffer.from(git(['cat-file','blob',branchBlob]));",
   "const blob=git(['cat-file','blob',branchBlob]);"],
  [names[0],"const working=Buffer.from(readFileSync(`${atlas}/${branchPath}`));",
   "const working=readFileSync(`${atlas}/${branchPath}`);"],
 ];
 for(const [[name,rawHash],before,after] of cases)
  assert.throws(()=>assertExact(name,rawHash,mutated(name,before,after)),{name:'AssertionError'},name);
});
