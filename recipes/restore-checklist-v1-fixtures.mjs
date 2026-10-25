import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';
const rows=[
 ['tests/completion-checklist-local-import.test.mjs','completion-checklist-local-import.test.mjs.raw','a90edb60ae231b20ab3940a011f34b3ca7fbe46b7418219659efa72845819491'],
 ['docs/completion-checklist.json','completion-checklist.json.raw','c2b3f9aa77f815fb278f74b40a2b68f496563389906b618acf69ec74e0b3cb58'],
 ['tests/fixtures/completion-checklist-19.json','completion-checklist-19.json.raw','51d016a07f1bfe9692bbcddea3afe40168441f86f9cebdfd44e17b123abe05fd'],
 ['tests/fixtures/completion-checklist-21.json','completion-checklist-21.json.raw','2a7ebfbf4a19a31aac0b6a2a9c802f01cda2a32dbf9f0cee85f4080c24eb5411'],
];
const sha=b=>createHash('sha256').update(b).digest('hex');
export function restoreChecklistV1Fixtures(baseline,target){
  baseline=path.resolve(baseline);target=path.resolve(target);assert(!fs.existsSync(target));
  const inputs=rows.map(([p,name,expected])=>{const bytes=fs.readFileSync(path.resolve(baseline,p));assert.equal(sha(bytes),expected,'Exact local baseline '+p);return{name,bytes,expected};});
  fs.mkdirSync(target,{recursive:true});const root=fs.realpathSync(target),restored=[];
  for(const input of inputs){const folder=path.resolve(target,'tests/fixtures/checklist-v1-role');fs.mkdirSync(folder,{recursive:true});const relative=path.relative(root,fs.realpathSync(folder));assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative));const p=path.resolve(folder,input.name);fs.writeFileSync(p,input.bytes,{flag:'wx'});assert.equal(sha(fs.readFileSync(p)),input.expected);restored.push({path:p,sha256:input.expected});}
  return restored;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const [baseline,target]=process.argv.slice(2);assert(baseline&&target);console.log(JSON.stringify({restored:restoreChecklistV1Fixtures(baseline,target),requiresExactLocalBaseline:true}));}
