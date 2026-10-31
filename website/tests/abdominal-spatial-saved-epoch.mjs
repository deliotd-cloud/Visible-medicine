import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {relative,dirname} from 'node:path';

const before='F:/VisibleMedicine/staging/20261010-abdominal-spatial-website/before/';
const after='F:/VisibleMedicine/recovery/checkpoints/20261010-abdominal-spatial-website/after/';
const checkpoint='F:/VisibleMedicine/recovery/checkpoints/20261010-abdominal-spatial-website/checkpoint.json';
const sha=b=>createHash('sha256').update(b).digest('hex');
const checkpointBytes=readFileSync(checkpoint);
assert.equal(sha(checkpointBytes),'d0ddad43aef336e567f7c2de14220cb30f128e9c3d4e9836b0c5032ce6d1dc2c',
 'authenticated complete saved website checkpoint');
const rows=JSON.parse(checkpointBytes).files;
const rowByPath=new Map(rows.map(row=>[row.path,row]));
assert.equal(rowByPath.size,rows.length,'unique saved paths');
const roots=['atlas-review/','public/atlas-runtime/head-neck/','public/atlas-runtime/female-pelvis/',
 'public/atlas-runtime/lower-limb/','public/atlas-runtime/shoulder/','public/atlas-review-viewer/'];
const manifestByRoot=new Map();
for(const root of roots){
 const path=root+'manifest.json',row=rowByPath.get(path);
 assert(row?.after,`saved manifest in checkpoint: ${path}`);
 const bytes=readFileSync(after+path);
 assert.equal(sha(bytes),row.after,`saved manifest bytes: ${path}`);
 const manifest=JSON.parse(bytes);
 assert.equal(manifest.revision??manifest.sourceCommit,'61ff057d5204caaaa4be654bacb371de7de8f038',
  `saved source revision: ${path}`);
 const files=new Map(manifest.files.map(file=>[root+file.path,file.importedSha256??file.sha256]));
 assert.equal(files.size,manifest.files.length,`unique saved manifest files: ${root}`);
 manifestByRoot.set(root,files);
}
function safePath(path){
 assert.equal(typeof path,'string','historical path type');
 const name=path.replaceAll('\\','/');
 assert(!name.startsWith('/')&&!name.includes('..')&&!name.includes(':')&&!name.includes('//'),
  `unsafe historical path: ${path}`);
 assert(roots.some(root=>name.startsWith(root)),`outside saved historical roots: ${path}`);
 return name;
}
function historical(path){
 const name=safePath(path);
 const root=roots.find(root=>name.startsWith(root));
 const row=rowByPath.get(name);
 const digest=manifestByRoot.get(root).get(name)??row?.after??row?.before;
 assert.match(digest??'',/^[a-f0-9]{64}$/,`saved hash for ${name}`);
 for(const base of [after,before,process.cwd().replaceAll('\\','/')+'/']){
  const candidate=base+name;
  if(!existsSync(candidate))continue;
  const size=statSync(candidate).size;
  assert(size<=32_000_000,`bounded saved read: ${name}`);
  const bytes=readFileSync(candidate);
  if(sha(bytes)===digest)return bytes;
 }
 throw Error(`Missing authenticated historical bytes: ${name} SHA256 ${digest}`);
}
export const historicalAbdominalRead=historical;
export function historicalAbdominalPlugin(){return{name:'saved-abdominal-spatial-epoch',setup(api){
 api.onLoad({filter:/(?:^|[\\/])atlas-review[\\/]/},args=>{
  const name=relative(process.cwd(),args.path).replaceAll('\\','/');
  assert(name.startsWith('atlas-review/')&&!name.split('/').includes('..'));
  const path=name;
  return{contents:historical(path).toString(),
   loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':path.endsWith('.ts')?'ts':'js',
   resolveDir:dirname(args.path)};
 });
}};}
