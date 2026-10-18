import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {atlasExactGitApi as staged} from './atlas-exact-git-api.mjs';
import {atlasExactGitApi as original} from './fixtures/atlas-exact-git-api-before-batch.mjs';

const stage=resolve(fileURLToPath(new URL('..',import.meta.url)));
const git=(root,...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true,
 env:{...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null'}}).trim();

test('original helper is exact and transformation is confined to Git blob loading',async()=>{
 const originalBytes=await readFile(join(stage,'tests','fixtures','atlas-exact-git-api-before-batch.mjs'));
 assert.equal(createHash('sha256').update(originalBytes).digest('hex'),
  'bfe266fd72263edd f8a7abcfe0e742b615b989a4f2624f0b85141d9398a5bb52'.replace(' ',''));
 const old=originalBytes.toString('utf8').replaceAll('\r\n','\n');
 let current=(await readFile(join(stage,'tests','atlas-exact-git-api.mjs'),'utf8')).replaceAll('\r\n','\n');
 const undo=(after,before)=>{assert.equal(current.split(after).length,2);current=current.replace(after,before);};
 undo("import {createGitObjectReader} from './git-object-reader.mjs';\n",'');
 undo(' const reader=createGitObjectReader({cwd:root,maxBytes:32e6});\n let result;\n try { result=await build(',
  ' const result=await build(');
 undo('  api.onLoad({filter:/.*/,namespace:\'exact-atlas-git\'},async args=>{',
  '  api.onLoad({filter:/.*/,namespace:\'exact-atlas-git\'},args=>{');
 undo("   if(!cache.has(object))cache.set(object,reader.readBlob(object));\n   const bytes=await cache.get(object);\n   return{contents:bytes.toString('utf8'),",
  "   if(!cache.has(object))cache.set(object,execFileSync('git',['cat-file','blob',object],options).toString());\n   return{contents:cache.get(object),");
 undo(' }}]}); } finally { await reader.close(); }',' }}]});');
 assert.equal(current,old);
});

test('bounded exact Git loader preserves epoch, resolution, exports and failures', {timeout:30000}, async()=>{
 const local=join(stage,'.local');
 await mkdir(local,{recursive:true});
 const fixture=await mkdtemp(join(local,'tiny-git-'));
 const priorCwd=process.cwd();
 try{
  git(fixture,'init','--quiet');
  git(fixture,'config','core.autocrlf','false');
  await mkdir(join(fixture,'atlas-review','lib'),{recursive:true});
  await writeFile(join(fixture,'atlas-review','lib','part.ts'),'export const part = "first";\n');
  await writeFile(join(fixture,'atlas-review','lib','config.json'),'{"number":7}\n');
  await writeFile(join(fixture,'atlas-review','lib','base.ts'),
   'import {part} from "./part"; import data from "@/atlas-review/lib/config.json"; export const value = part + data.number;\n');
  git(fixture,'add','atlas-review');
  git(fixture,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','first');
  const first=git(fixture,'rev-parse','HEAD');
  await writeFile(join(fixture,'atlas-review','lib','part.ts'),'export const part = "second";\n');
  git(fixture,'add','atlas-review');
  git(fixture,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','second');
  const second=git(fixture,'rev-parse','HEAD');
  await writeFile(join(fixture,'atlas-review','lib','part.ts'),'export const part = "dirty";\n');
  process.chdir(fixture);
  const entry='export {value} from "./atlas-review/lib/base";';
  assert.equal((await staged(first,entry)).value,'first7');
  assert.equal((await staged(second,entry)).value,'second7');
  assert.equal((await original(first,entry)).value,(await staged(first,entry)).value);
  await assert.rejects(staged('0'.repeat(40),entry));
  await assert.rejects(staged(first,'export {value} from "./atlas-review/lib/missing";'),/Missing historical Atlas module/);
  await assert.rejects(staged(first,'export {value} from "../outside";'),/Historical import outside Atlas/);
  await assert.rejects(staged(first,'export {value from "./atlas-review/lib/base";'));
  assert.equal((await staged(first,entry)).value,'first7','reader from a prior failure did not poison the next replay');
 }finally{process.chdir(priorCwd);}
});
