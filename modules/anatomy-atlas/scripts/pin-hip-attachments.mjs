import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';
const compiled=await build({stdin:{contents:"export * from './content/hip-attachments';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {hipAttachments,hipAttachmentPartners}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const raw=await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(hash(raw),'109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
const catalog=JSON.parse(raw),muscles=hipAttachments.flatMap(a=>a.fmas),partners=Object.values(hipAttachmentPartners).flat();
assert.equal(new Set(muscles).size,36);assert.equal(new Set(partners).size,13);
const ids=[...muscles,...partners],entries=catalog.structures.filter(s=>ids.includes(s.fmaId));
assert.equal(entries.length,49);
const vertebralIds=['FMA10081','FMA13072','FMA13073','FMA13074','FMA13075','FMA13076'];
assert.equal(hash(JSON.stringify(entries.filter(s=>!vertebralIds.includes(s.fmaId)))),'8a4261cd824cf9380019e8f58a41f5c7b05a351cd56148994d8bf3e6c80f0187','Original 43 complete source records remain unchanged and ordered');
assert.deepEqual(entries.filter(s=>vertebralIds.includes(s.fmaId)).map(s=>[s.fmaId,s.sources.map(p=>p.file)]),[
 ['FMA10081',['FJ3156']],['FMA13072',['FJ3157']],['FMA13073',['FJ3159']],
 ['FMA13074',['FJ3162']],['FMA13075',['FJ3165']],['FMA13076',['FJ3168']],
]);
for(const group of [...hipAttachments.map(a=>a.fmas),...Object.values(hipAttachmentPartners)])for(const [i,fma]of group.entries()){
  const found=entries.filter(s=>s.fmaId===fma);assert.equal(found.length,1);
  if(muscles.includes(fma)){assert.equal(found[0].system,'muscles');assert.equal(found[0].laterality,group.includes('FMA46444')?(i===0?'left':'right'):(i===0?'right':'left'));}
  else {assert.equal(found[0].laterality,group.length===1?'midline':i===0?'right':'left');assert.equal(found[0].system,hipAttachmentPartners.iliotibial.includes(fma)?'connective':'skeleton');}
}
const bundles=catalog.bundles.filter(b=>entries.some(s=>s.bundle===b.id));
for(const b of bundles)assert.equal(hash(await readFile('public'+b.url)),b.sha256);
const sourceCommit='7112c856117f5090444df8146657f336c656be27';
const output=JSON.stringify({sourceCommit,catalogSha256:hash(raw),sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,entries},null,2)+'\n';
const path='content/hip-attachment-pins.json';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),output);
else {
 assert(process.argv.includes('--extend-psoas'),'Explicit reviewed extension required');
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);
 assert.equal(hash((await readFile(path,'utf8')).replace(/\r\n/g,'\n')),'e3c8b45643428cac2232a6b57ae88b5b6c75a01c2f13e2a1b88ea143636bebfe','Replace only the exact reviewed 43-entry baseline');
 await writeFile(path,output);
}
console.log(JSON.stringify({muscles:36,partners:13,preservedOriginalEntries:43,bundles:bundles.length,check:process.argv.includes('--check')}));
