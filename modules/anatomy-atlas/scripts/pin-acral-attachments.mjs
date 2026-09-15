import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';
const compiled=await build({stdin:{contents:"export * from './content/acral-attachments';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {acralAttachments,acralAttachmentBones}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const raw=await readFile('public/models/bodyparts3d/full-body/catalog.json');
assert.equal(hash(raw),'109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7');
const catalog=JSON.parse(raw),muscles=acralAttachments.flatMap(a=>a.fmas),bones=Object.values(acralAttachmentBones).flat();
assert.equal(new Set(muscles).size,56);assert.equal(new Set(bones).size,60);
const ids=[...muscles,...bones],entries=catalog.structures.filter(s=>ids.includes(s.fmaId));
assert.equal(entries.length,116);
for(const group of [...acralAttachments.map(a=>a.fmas),...Object.values(acralAttachmentBones)])for(const [i,fma]of group.entries()){
  const found=entries.filter(s=>s.fmaId===fma);assert.equal(found.length,1);
  assert.equal(found[0].laterality,group.length===1?'midline':i===0?'right':'left');
  assert.equal(found[0].system,muscles.includes(fma)?'muscles':'skeleton');
}
const bundles=catalog.bundles.filter(b=>entries.some(s=>s.bundle===b.id));
for(const b of bundles)assert.equal(hash(await readFile('public'+b.url)),b.sha256);
const sourceCommit='e581676c3cef073412c5d783fb25698d8679fa88';
const output=JSON.stringify({sourceCommit,catalogSha256:hash(raw),sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,bundles,entries},null,2)+'\n';
const path='content/acral-attachment-pins.json';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),output);
else {assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));await writeFile(path,output,{flag:'wx'});}
console.log(JSON.stringify({muscles:56,bones:60,bundles:bundles.length,check:process.argv.includes('--check')}));
