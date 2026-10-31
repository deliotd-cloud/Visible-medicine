// Test-only load seam for the two authenticated 6d7 historical path constants.
// It runs the unchanged nine-root dispatcher, its original wrapper, and both
// original child cases; only context paths and a known preload are adapted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {registerHooks} from 'node:module';
import {pathToFileURL} from 'node:url';

const historicalWebsite='F:/VisibleMedicine/staging/20261024-head-active-identity-website/website';
const installedWebsite='F:/VisibleMedicine/staging/20261021-body-learning-website-candidate/website';
const installedAtlas='F:/VisibleMedicine/staging/20261021-body-learning-source-candidate/atlas';
const wrapperWebsite='F:/VisibleMedicine/staging/20261027-forehead-nerve-us-website/website';
const closurePath='F:/VisibleMedicine/staging/20261025-arterial-delivery-roles-proposal/LOCAL_ONLY/finite-closure.json';
const rolesPath=path.join(wrapperWebsite,'tests/arterial-delivery-roles.mjs');
const originalTwoPath=path.join(historicalWebsite,'tests/arterial-epoch-preservation.test.mjs');
const rolesSha='f98f5f571e73adebceb22c8db1e8d2e9990266577790d6fb0e9aeddcc713263c';
const originalTwoSha='95b6fc4f9d3f5ecef3dd1c37c876fb959c89ad83107f66f343d5c00e041587be';
const closureSha='bb7f63aee42681cd7caa0bf66e9b7aae2ada2524600bf06500ac83dd4be87e5b';
const fixtureSha='cffc1441ba02daf23c92565a6368be51b6c2794413f8718104afb426f5cc6951';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const exact=(file,digest)=>{const bytes=fs.readFileSync(file);assert.equal(sha(bytes),digest,file+' exact source');return bytes;};
const replaceOne=(text,before,after)=>{assert.equal(text.split(before).length,2,'One exact context seam: '+before);return text.replace(before,after);};
const decoded=bytes=>{const text=new TextDecoder('utf8',{fatal:true}).decode(bytes);assert(Buffer.from(text).equals(bytes),'Lossless source decode');return text;};

export function verifyContext(){
 const bytes=exact(closurePath,closureSha),closure=JSON.parse(bytes);
 assert.equal(closure.schema,'vm-arterial-finite-closure/1');
 assert.deepEqual(Object.keys(closure.roles.epoch2).sort(),['historicalWebsite','installedWebsite']);
 const roots={historicalWebsite:fs.realpathSync(historicalWebsite),installedWebsite:fs.realpathSync(installedWebsite)};
 assert.notEqual(roots.historicalWebsite,roots.installedWebsite);
 for(const [scope,count]of [['historicalWebsite',3],['installedWebsite',16]]){
  const rows=closure.roles.epoch2[scope];assert.equal(rows.length,count,scope+' finite count');
  const seen=new Set();
  for(const row of rows){
   assert(typeof row.path==='string'&&row.path.length&&!row.path.includes('\\')&&!row.path.includes(':')&&!row.path.startsWith('/')&&row.path.split('/').every(part=>part&&part!=='.'&&part!=='..'),'Safe finite path');
   assert(!seen.has(row.path),'Unique finite path');seen.add(row.path);
   const file=path.join(roots[scope],row.path),stat=fs.lstatSync(file);
   assert(stat.isFile()&&!stat.isSymbolicLink(),'Regular finite source');
   assert(fs.realpathSync(file).startsWith(roots[scope]+path.sep),'Finite path remains inside role root');
   const value=fs.readFileSync(file);assert.equal(value.length,row.bytes,row.path+' length');assert.equal(sha(value),row.sha256,row.path+' hash');
  }
 }
 const fixture=exact(path.join(wrapperWebsite,'tests/fixtures/arterial-delivery-roles/manifest.json'),fixtureSha);
 const f=JSON.parse(fixture);assert.equal(f.localClosure.sha256,closureSha);
 assert.equal(f.identities.installed.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(f.identities.installed.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');
 assert.equal(sha(exact(originalTwoPath,originalTwoSha)),originalTwoSha);
 assert.equal(sha(fs.readFileSync(path.join(wrapperWebsite,'tests/arterial-epoch-preservation.test.mjs'))),f.collectors.epoch2);
 const git=(...args)=>execFileSync('git',['-C',installedAtlas,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();
 assert.equal(fs.realpathSync(git('rev-parse','--show-toplevel')),fs.realpathSync(installedAtlas));
 assert.equal(git('rev-parse','HEAD'),f.identities.installed.source);
 assert.equal(git('rev-parse','HEAD^{tree}'),f.identities.installed.sourceTree);
 assert.equal(git('status','--porcelain'),'','Historical native Atlas remains clean');
 return {historicalWebsite:roots.historicalWebsite,installedWebsite:roots.installedWebsite,installedAtlas:fs.realpathSync(installedAtlas),finiteRows:19};
}

const rolesSeams=[
 ["fs.realpathSync('F:/VisibleMedicine/website')",`fs.realpathSync('${installedWebsite}')`],
 ["fs.realpathSync('F:/VisibleMedicine/atlas')",`fs.realpathSync('${installedAtlas}')`],
 ["const args=['--max-old-space-size=768','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',entry];",
  "const args=['--max-old-space-size=768','--experimental-strip-types',...(role==='epoch2'?['--import='+process.env.VM_ARTERIAL_CONTEXT_SEAM]:[]),'--test','--test-concurrency=1','--test-reporter=tap',entry];"],
];
const childSeams=[
 ["const website='F:/VisibleMedicine/website';",`const website='${installedWebsite}';`],
 ["const atlas='F:/VisibleMedicine/atlas';",`const atlas='${installedAtlas}';`],
];
function adapt(file,digest,seams){
 const original=exact(file,digest),text=decoded(original);
 let adapted=text;for(const [before,after]of seams)adapted=replaceOne(adapted,before,after);
 let inverse=adapted;for(const [before,after]of seams.toReversed())inverse=replaceOne(inverse,after,before);
 assert(Buffer.from(inverse).equals(original),'Complete original source recovered by exact inverse');
 return adapted;
}
export function verifyAdaptations(){
 const roles=adapt(rolesPath,rolesSha,rolesSeams);
 const child=adapt(originalTwoPath,originalTwoSha,childSeams);
 assert.equal((roles.match(/assert\b/g)||[]).length,(decoded(exact(rolesPath,rolesSha)).match(/assert\b/g)||[]).length,'All role assertions retained');
 assert.equal((child.match(/assert\b/g)||[]).length,(decoded(exact(originalTwoPath,originalTwoSha)).match(/assert\b/g)||[]).length,'All original two-case assertions retained');
 return {rolesSha,originalTwoSha,roleSeams:rolesSeams.length,childSeams:childSeams.length};
}

const rolesURL=pathToFileURL(rolesPath).href,originalTwoURL=pathToFileURL(originalTwoPath).href;
registerHooks({load(url,context,nextLoad){
 if(url===rolesURL){
  assert.equal(process.env.VM_ARTERIAL_CONTEXT_SEAM,import.meta.url,'Only the declared historical context hook');
  verifyContext();
  return {format:'module',shortCircuit:true,source:adapt(rolesPath,rolesSha,rolesSeams)};
 }
 if(url===originalTwoURL){
  verifyContext();
  return {format:'module',shortCircuit:true,source:adapt(originalTwoPath,originalTwoSha,childSeams)};
 }
 return nextLoad(url,context);
}});
