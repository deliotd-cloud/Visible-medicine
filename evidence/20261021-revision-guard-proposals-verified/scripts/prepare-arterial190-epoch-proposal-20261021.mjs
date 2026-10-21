import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const old='F:/VisibleMedicine/staging/20261021-arterial-history-epoch-proposal';
const root='F:/VisibleMedicine/staging/20261021-arterial190-epoch-proposal';
const candidate='F:/VisibleMedicine/staging/20261021-source190-website/website';
assert(!fs.existsSync(root));fs.mkdirSync(root);
const subjectPath='tests/atlas-arterial-evidence-limits.test.mjs',guardPath='tests/arterial-history-preservation.test.mjs';
const subject=read(candidate+'/'+subjectPath).toString();assert.equal(sha(Buffer.from(subject)),'840d4ecb8bef4c4bf725f1cecd39fa6e53dfa9a7c4d2922a750851509806451a');
const before="  assert.equal(CURRENT_ATLAS_REVISION,'485df97c2530e8e81a8d39a5ee61073ce76d93db');";
const after="  assert.equal(CURRENT_ATLAS_REVISION,'190a63238eadcf906abe89dcbb6a67c88afe70b9');";
assert.equal(subject.split(before).length,2);const next=subject.replace(before,after);
assert.equal(next.replace(after,before),subject,'Exact whole-source inverse');
let guard=read(old+'/'+guardPath).toString();assert.equal(sha(Buffer.from(guard)),'df883d11222ff04c055769a7f6eca5526e0bbf16031cd5e974e2585aa4ee8fb4');
const gate=" assert.equal(sha(admittedBytes),currentSubjectSha,'Exact current arterial whole-test bytes');\n const before=originalBytes.toString('utf8'),after=admittedBytes.toString('utf8');";
assert.equal(guard.split(gate).length,2);
const replacement=[
 ` assert.equal(sha(admittedBytes),'${sha(Buffer.from(next))}','Exact source190 arterial whole-test bytes');`,
 ` const source190Pin=${JSON.stringify(after)};`,
 ` const source485Pin=${JSON.stringify(before)};`,
 " const nativeCurrent=admittedBytes.toString('utf8');",
 " assert.equal(nativeCurrent.split(source190Pin).length,2,'One exact source190 epoch assertion');",
 " const after=nativeCurrent.replace(source190Pin,source485Pin);",
 " assert.equal(sha(Buffer.from(after)),currentSubjectSha,'Complete previous485 whole-test body reconstructs');",
 " const before=originalBytes.toString('utf8');",
].join('\n');
guard=guard.replace(gate,replacement);
assert.equal(guard.replace(replacement,gate),read(old+'/'+guardPath).toString(),'All earlier history assertions retained');
const files=[{path:subjectPath,text:next},{path:guardPath,text:guard}];
const copies=[];
for(const p of [subjectPath,guardPath]){
 const b=read(candidate+'/'+p),to=root+'/preimages/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b,{flag:'wx'});copies.push({path:p,sha256:sha(b)});
}
const fixture='tests/fixtures/atlas-arterial-evidence-limits-before-current-admission.txt';
const b=read(candidate+'/'+fixture);assert.equal(sha(b),'b15cda66fe97f25d6a6a61126f14e87e1f4c7a30d31a27f03ae42fd7238e9c15');
fs.mkdirSync(path.dirname(root+'/'+fixture),{recursive:true});fs.writeFileSync(root+'/'+fixture,b,{flag:'wx'});
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify({stage:root,site:root,atlas:'F:/VisibleMedicine/staging/20261021-atlas-combined-source',
 actualCandidate:candidate,subjectVersionChange:{before,after,exactWholeSourceInverse:true},copies,
 proposed:files.map(f=>({path:f.path,bytes:Buffer.byteLength(f.text),sha256:sha(Buffer.from(f.text))})),
 purpose:'Actual full suite exposed a second stale485 assertion inside the arterial subject. One exact source190 assertion replaces it; the separate guard reconstructs the complete485,87ed,d44,b15 historical subjects. No behavior/assertion removal or duplicate9936-topic computation.',
 candidateEdited:false,canonicalInstalled:false,privateDataCopied:false},null,2)+'\n',{flag:'wx'});
console.log(['*** Begin Patch',...files.flatMap(f=>['*** Add File: '+root+'/'+f.path,...f.text.replaceAll('\r\n','\n').replace(/\n$/,'').split('\n').map(l=>'+'+l)]),'*** End Patch'].join('\n'));
