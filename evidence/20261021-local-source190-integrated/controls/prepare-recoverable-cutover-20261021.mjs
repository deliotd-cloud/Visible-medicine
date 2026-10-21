// Create-only F-local staging/recovery. Does NOT install, move, delete or restart.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const planFile='F:/VisibleMedicine/staging/20261021-cutover-plan-5155/PLAN_V4.json';
assert.equal(sha(read(planFile)),'6c621cafde36f277e98034064a9699131db2ec78b1aa63bff8c4cc074acf483c');
const plan=json(planFile),root='F:/VisibleMedicine/recovery/local-cutover/20261021-source190-prepared';
const proof=json('F:/VisibleMedicine/staging/20261021-buffer-type-application/VERIFICATION.json');assert(proof.passed);assert.equal(proof.sourceSnapshotSha256,plan.snapshotSha256);
assert.equal(plan.blockers.length,0);assert.equal(plan.operations.length,278);assert.equal(plan.generated.length,6);
assert(!fs.existsSync(root));assert.equal(path.resolve(plan.target),path.resolve('F:/VisibleMedicine/website'));
const safe=(base,p)=>{
 assert(!path.isAbsolute(p)&&!/[\\\x00-\x1f]/.test(p)&&p.split('/').every(v=>v&&v!=='.'&&v!=='..'));
 const resolved=path.resolve(base,p);assert(resolved.startsWith(path.resolve(base)+path.sep));
 let cursor=path.resolve(base);for(const segment of p.split('/')){cursor=path.join(cursor,segment);if(fs.existsSync(cursor))assert(!fs.lstatSync(cursor).isSymbolicLink(),'No symlink/junction traversal: '+p);}
 return resolved;
};
const checked=(base,p,expected,bytes)=>{const b=read(safe(base,p));assert.equal(sha(b),expected,p);if(bytes!==undefined)assert.equal(b.length,bytes,p);return b;};
const walk=(base,p)=>{const full=safe(base,p),s=fs.lstatSync(full);assert(!s.isSymbolicLink());return s.isDirectory()?fs.readdirSync(full).sort().flatMap(n=>walk(base,p+'/'+n)):[p];};
const preserved=new Map();for(const p of plan.preservedNamedPaths)preserved.set(p,{sha256:sha(read(safe(plan.target,p))),bytes:read(safe(plan.target,p)).length});
const coordination=plan.preservedCoordination.map(r=>({path:r.path,sha256:sha(read(r.path))}));
const verifyCanonical=()=>{
 for(const row of plan.rows){
  if(row.action==='preserve')assert.equal(sha(read(safe(plan.target,row.path))),preserved.get(row.path).sha256,row.path);
  else if(row.canonicalBeforeSha256===null)assert(!fs.existsSync(safe(plan.target,row.path)),row.path);
  else checked(plan.target,row.path,row.canonicalBeforeSha256,row.canonicalBeforeBytes);
 }
 for(const g of plan.generated){assert.deepEqual(walk(plan.target,g.scope).sort(),g.canonical.map(r=>r.path).sort());for(const r of g.canonical)checked(plan.target,r.path,r.sha256,r.bytes);}
 for(const r of coordination)assert.equal(sha(read(r.path)),r.sha256,r.path);
 assert.equal(runGit(['-C',plan.target,'rev-parse','HEAD']).toString().trim(),plan.revisions.website);
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),plan.revisions.atlas);
 process.kill(260328,0);
};
const inputs=json(plan.snapshot);assert.equal(inputs.length,5155);assert.equal(sha(read(plan.snapshot)),plan.snapshotSha256);
for(const r of inputs)checked(plan.source,r.path,r.sha256,r.bytes);
for(const g of plan.generated){assert.deepEqual(walk(plan.source,g.scope).sort(),g.source.map(r=>r.path).sort());for(const r of g.source)checked(plan.source,r.path,r.sha256,r.bytes);}
for(const row of plan.operations)assert.equal(sha(read(row.source)),row.proposedSha256,row.path);
verifyCanonical();const required=plan.generated.reduce((n,g)=>n+g.source.reduce((a,r)=>a+r.bytes,0)+g.canonical.reduce((a,r)=>a+r.bytes,0),0);
const storage=fs.statfsSync('F:/');assert(storage.bavail*storage.bsize>required+2e9,'Keep at least 2GB free after scoped staging');
fs.mkdirSync(root,{recursive:true});const copied=[];
const copy=(from,to,expected)=>{const bytes=read(from);assert.equal(sha(bytes),expected);const target=safe(root,to);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});assert.equal(sha(read(target)),expected);copied.push({path:to,bytes:bytes.length,sha256:expected});};
for(const row of plan.operations.filter(r=>!r.scope)){
 copy(row.source,'staged-website/'+row.path,row.proposedSha256);
 if(row.canonicalBeforeSha256)copy(safe(plan.target,row.path),'preimages-website/'+row.path,row.canonicalBeforeSha256);
}
for(const g of plan.generated){
 for(const r of g.source){const keep=preserved.get(r.path);copy(keep?safe(plan.target,r.path):safe(plan.source,r.path),'staged-website/'+r.path,keep?.sha256??r.sha256);}
 // Some canonical LICENSE paths are intentionally absent from generated candidate manifests.
 for(const [p,r]of preserved)if(p.startsWith(g.scope+'/')&&!g.source.some(s=>s.path===p))copy(safe(plan.target,p),'staged-website/'+p,r.sha256);
 for(const r of g.canonical)copy(safe(plan.target,r.path),'preimages-website/'+r.path,r.sha256);
}
const virtual=p=>fs.existsSync(safe(root,'staged-website/'+p))?read(safe(root,'staged-website/'+p)):read(safe(plan.target,p));
const bound=JSON.parse(virtual('atlas-review/integration-inputs.json'));assert.equal(bound.sha256,plan.revisions.review);assert.equal(bound.inputs.length,1710);
for(const r of bound.inputs)assert.equal(sha(virtual(r.path)),r.sha256,r.path);
verifyCanonical();
const result={at:new Date().toISOString(),root,planFile,planSha256:sha(read(planFile)),sourceSnapshotSha256:plan.snapshotSha256,source:plan.revisions.sourceAtlas,review:plan.revisions.review,namedOperations:278,ordinaryOperations:plan.operations.filter(r=>!r.scope).length,generatedScopes:6,reviewBindings:1710,stagedVirtualReviewVerified:true,canonicalUnchanged:true,ownerPreviewChanged:false,ownerFormsTouched:false,installerExecuted:false,allCopiesExact:true,preservedPaths:[...preserved].map(([path,r])=>({path,...r})),coordination,copyCount:copied.length,copiedBytes:copied.reduce((n,r)=>n+r.bytes,0),wholeProjectBackup:false,privateDataBackup:false,clinicalApproval:false,publicDeployment:false,spatialRegistration:false,next:'Fresh preimage and open-draft gate, then deliberate coherent local cutover; this preparation does not authorize stopping or refreshing owner pages.'};
fs.writeFileSync(root+'/COPIES.json',JSON.stringify(copied,null,2)+'\n',{flag:'wx'});fs.writeFileSync(root+'/PREPARED.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({prepared:root+'/PREPARED.json',sha256:sha(read(root+'/PREPARED.json')),copyCount:result.copyCount,copiedBytes:result.copiedBytes,canonicalChanged:false}));
