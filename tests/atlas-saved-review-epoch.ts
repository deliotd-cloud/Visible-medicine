// Replay an immutable, source-verified website import for historical transition tests.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync as liveRead} from 'node:fs';
import {dirname,isAbsolute,relative} from 'node:path';
import type {Plugin} from 'esbuild';

const gitOptions={cwd:process.cwd(),windowsHide:true,maxBuffer:32e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};
const frozen=(path:string)=>path.startsWith('atlas-review/')||
 path.startsWith('public/atlas-runtime/')||path.startsWith('public/atlas-review-viewer/')||
 ['lib/atlas-model-inventory.json','lib/plexus-review-manifest.json','package.json','package-lock.json'].includes(path);

// The immutable limb fixture's package.json hash differs from its saved Git
// epoch. The original captured bytes remain unavailable, so this proves only
// Git-to-Git package continuity; the fixture hash remains independently pinned.
export function assertSavedPackageContinuity(rows:readonly {path:string;sha256:string}[],before:string,after:string){
 const captures:{[path:string]:string}={
  'package.json':'19e8f0863f8fd6830ddfba8684219e9b7df42fea70aadd0b7c0e82d5d07d5edb',
  'package-lock.json':'da6513ef764b1291e1bc87ebd50184971ebe7ffe44be24e9753e8071fe297b68'};
 assert.deepEqual(rows.map(row=>row.path),['package.json','package-lock.json'],'captured package set');
 for(const row of rows){
  assert.equal(row.sha256,captures[row.path],`${row.path}: immutable capture hash`);
  const previous=execFileSync('git',['show',`${before}:${row.path}`],gitOptions);
  const imported=execFileSync('git',['show',`${after}:${row.path}`],gitOptions);
  assert.deepEqual(imported,previous,`${row.path}: exact saved website package continuity`);
  if(row.path==='package-lock.json')
   assert.equal(createHash('sha256').update(imported).digest('hex'),row.sha256,'exact captured package lock');
 }
}

export function savedReviewEpoch(websiteCommit:string,sourceCommit:string,manifestSha256:string){
 for(const [name,value] of Object.entries({websiteCommit,sourceCommit}))
  assert.match(value,/^[a-f0-9]{40}$/,name);
 assert.match(manifestSha256,/^[a-f0-9]{64}$/,'manifest SHA-256');
 assert.equal(execFileSync('git',['rev-parse',websiteCommit+'^{commit}'],gitOptions).toString().trim(),websiteCommit);
 const cache=new Map<string,Buffer>();
 const gitRead=(path:string):Buffer=>{
  assert(frozen(path),`historical read outside saved review: ${path}`);
  assert(!path.split('/').includes('..'),`historical path traversal: ${path}`);
  if(!cache.has(path))cache.set(path,execFileSync('git',['show',`${websiteCommit}:${path}`],gitOptions));
  return cache.get(path)!;
 };
 const manifest=gitRead('atlas-review/manifest.json');
 assert.equal(createHash('sha256').update(manifest).digest('hex'),manifestSha256,'saved Review manifest bytes');
 assert.equal(JSON.parse(manifest.toString()).revision,sourceCommit,'saved Review source revision');
 return {
  readFileSync(path:any,encoding?:any):any{
   const raw=String(path);
   const name=(isAbsolute(raw)?relative(process.cwd(),raw):raw).replaceAll('\\','/');
   assert(!name.split('/').includes('..'),`read outside website: ${raw}`);
   if(!frozen(name))return liveRead(path,encoding);
   const bytes=gitRead(name);
   return encoding==='utf8'?bytes.toString():bytes;
  },
  plugin():Plugin{return{name:'saved-review-epoch',setup(api){
   api.onLoad({filter:/(?:^|[\\/])atlas-review[\\/]/},args=>{
    const path=relative(process.cwd(),args.path).replaceAll('\\','/');
    assert(path.startsWith('atlas-review/')&&!path.split('/').includes('..'));
    return{contents:gitRead(path).toString(),
     loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':path.endsWith('.ts')?'ts':'js',
     resolveDir:dirname(args.path)};
   });
   }};
 }
 };
}
