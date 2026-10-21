// Test-only replay of the complete original 87ed delivery. Its emitted asset
// context remains F-local; a filtered source backup is not a full runtime backup.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,relative,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readHeadPilotFile,historicalHeadPilotRuntime} from './historical-head-pilot-read.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const defaultRoot='F:/VisibleMedicine/staging/20261020-review-forms-integrated/module-before/head-neck';
const manifestSha='d8d5b5aaf4a40252217da56cd5d42c80ade5b43abb090454fd4c616a8e1ee9d8';
export const historicalHead87Runtime=historicalHeadPilotRuntime;
const logicalRoot=fileURLToPath(historicalHead87Runtime);

export function createClosedHead87Reader({root=process.env.VM_HEAD_PILOT_87_ROOT??defaultRoot}={}){
 const closedRoot=resolve(root);
 const noLinks=path=>{
  let current=path;
  for(;;){assert(!lstatSync(current).isSymbolicLink(),'Historical87 symlink refused: '+current);const parent=dirname(current);if(parent===current)break;current=parent;}
  assert.equal(realpathSync(path),resolve(path),'Historical87 noncanonical path refused');
 };
 noLinks(closedRoot);
 const safeName=name=>assert(typeof name==='string'&&name.length>0&&!name.includes('\\')&&!name.startsWith('/')&&
  !name.split('/').some(part=>!part||part==='.'||part==='..')&&!name.includes(':'),'Historical87 path is not declared/canonical');
 const readClosed=name=>{
  safeName(name);const path=resolve(closedRoot,name),inside=relative(closedRoot,path);
  assert(inside&&!inside.startsWith('..')&&!inside.startsWith(sep),'Historical87 path escapes closed root');
  noLinks(path);assert(lstatSync(path).isFile(),'Historical87 regular file required');return readFileSync(path);
 };
 const manifestBytes=readClosed('manifest.json');
 assert.equal(manifestBytes.length,627564);assert.equal(sha(manifestBytes),manifestSha,'Authentic original87 manifest required');
 const manifest=JSON.parse(manifestBytes);
 assert.equal(manifest.sourceCommit,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');
 assert.equal(manifest.files.length,216);
 const allowed=new Map([['manifest.json',{bytes:627564,sha256:manifestSha}],...manifest.files.map(row=>[row.path,row])]);
 assert.equal(allowed.size,217,'No duplicate historical87 rows');
 for(const [name,row]of allowed){safeName(name);assert(Number.isSafeInteger(row.bytes)&&row.bytes>0);assert.match(row.sha256,/^[a-f0-9]{64}$/);}
 assert.equal(allowed.get('source-inputs.json').sha256,'04b7123d4a613ad8b3a62cd19fdba7a3ef9ac56327b67116a7ad615973deca38');
 const actual=[];
 function walk(path,prefix=''){
  noLinks(path);
  for(const entry of readdirSync(path,{withFileTypes:true})){
   assert(!entry.isSymbolicLink(),'Historical87 symlink refused');
   const name=prefix+entry.name;safeName(name);
   if(entry.isDirectory())walk(resolve(path,entry.name),name+'/');
   else {assert(entry.isFile(),'Historical87 regular file required');noLinks(resolve(path,entry.name));actual.push(name);}
  }
 }
 walk(closedRoot);assert.deepEqual(actual.sort(),[...allowed.keys()].sort(),'Exact closed87 physical file inventory');
 // The authentic9f manifest is async; cache its full checked bytes once below.
 const checkedNineFba=readHeadPilotFile(new URL('manifest.json',historicalHeadPilotRuntime)).then(bytes=>JSON.parse(bytes));
 const nameFor=url=>{
  const name=relative(logicalRoot,fileURLToPath(url)).split(sep).join('/');safeName(name);assert(allowed.has(name),'Historical87 file is not declared: '+name);return name;
 };
 return {
  manifest,
  async readFile(url,encoding){
   const name=nameFor(url),expected=allowed.get(name),old=await checkedNineFba;
   const shared=old.files.find(row=>row.path===name&&row.bytes===expected.bytes&&row.sha256===expected.sha256);
   const bytes=name==='manifest.json'?manifestBytes:shared?await readHeadPilotFile(new URL(name,historicalHeadPilotRuntime)):readClosed(name);
   assert.equal(bytes.length,expected.bytes,'Historical87 size changed: '+name);assert.equal(sha(bytes),expected.sha256,'Historical87 digest changed: '+name);
   return encoding?bytes.toString(encoding):Buffer.from(bytes);
  },
  async readdir(url,options){
   assert.equal(options?.withFileTypes,true);
   const name=relative(logicalRoot,fileURLToPath(url)).split(sep).join('/');if(name)safeName(name);
   const prefix=name?name+'/':'',children=new Map();
   for(const path of allowed.keys()){if(!path.startsWith(prefix))continue;const rest=path.slice(prefix.length),slash=rest.indexOf('/'),child=slash<0?rest:rest.slice(0,slash);children.set(child,slash>=0||children.get(child)===true);}
   assert(children.size>0,'Historical87 directory is not declared');
   return [...children].map(([name,directory])=>({name,isDirectory:()=>directory,isFile:()=>!directory,isSymbolicLink:()=>false}));
  },
 };
}
const reader=createClosedHead87Reader();
export const readHead87File=reader.readFile,listHead87Directory=reader.readdir;
