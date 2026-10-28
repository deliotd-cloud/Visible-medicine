import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {hash,json} from './bounded-source-hash-20261026.mjs';
import {clonePinnedWebsite} from './clone-pinned-website-stage-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261028-tour-delivery-website';
const pf='F:/VisibleMedicine/staging/20261028-quadriceps-website/SOURCE_CANDIDATE.json',ph='2651b0561dd99a1e9e3be394c316cd63d1f2549b0ec976f5bc409a44822137cd';
const sha=b=>createHash('sha256').update(b).digest('hex'),pin=p=>({path:p,sha256:hash(p)});
const proposals=[
 {kind:'title',root:'F:/VisibleMedicine/staging/20261028-tour-delivery-title-proposal',receipt:'f1aa1ede4d4a1c06028940e88d995a217055c2f0a450750b0247be406634b86f',name:'title-tour-functional-delivery.test.mjs',output:'09691a96583193c77190aa42d7e459b0feec21ad83514dbf375c57187457d9b0',spec:'transform.json'},
 {kind:'reader',root:'F:/VisibleMedicine/staging/20261028-tour-delivery-reader-proposal',receipt:'73f58027674bcefe13e70410d140f681f41d8e381bdf1874d199f2584300d134',name:'tour-reading-current-delivery.test.mjs',output:'426badc5d870490c6969fe8ce958ba571c2c5b9a3cbb1089f0d2c08335231b25',spec:'TRANSFORM.json'}
];
for(const p of proposals){assert.equal(hash(p.root+'/PROPOSAL.json'),p.receipt);assert.equal(hash(p.root+'/'+p.name),p.output);}
const {parent,site}=clonePinnedWebsite({stage,parentFile:pf,parentSha256:ph});
const changed=[],added=[],inverse=[];
for(const p of proposals){
 const raw=json(p.root+'/'+p.spec),spec={name:p.name,before:raw.inputSha256??raw.originalSha256,after:raw.outputSha256??raw.proposedSha256,seams:raw.changes??raw.seams.map(x=>[x.before,x.after]),append:raw.append??raw.appendix};
 const original=fs.readFileSync(site+'/tests/'+p.name),next=fs.readFileSync(p.root+'/'+p.name);assert.equal(sha(original),spec.before);assert.equal(sha(next),spec.after);
 let forward=original.toString();for(const [a,b]of spec.seams){assert.equal(forward.split(a).length,2);forward=forward.replace(a,b);}forward+=spec.append;assert.deepEqual(Buffer.from(forward),next);
 let reverse=next.toString();assert(reverse.endsWith(spec.append));reverse=reverse.slice(0,-spec.append.length);for(const[a,b]of spec.seams.toReversed()){assert.equal(reverse.split(b).length,2);reverse=reverse.replace(b,a);}assert.deepEqual(Buffer.from(reverse),original);
 fs.copyFileSync(p.root+'/'+p.name,site+'/tests/'+p.name);changed.push('tests/'+p.name);
 const specPath='tests/fixtures/tour-delivery-preservation/'+p.kind+'.json';fs.mkdirSync(path.dirname(site+'/'+specPath),{recursive:true});fs.writeFileSync(site+'/'+specPath,JSON.stringify(spec,null,2)+'\n',{flag:'wx'});added.push(specPath);inverse.push({path:specPath,sha256:hash(site+'/'+specPath)});
}
const test=`import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
const sha=b=>createHash('sha256').update(b).digest('hex');
const specs=${JSON.stringify(inverse)};
for(const row of specs)test('entire original tour delivery test is recoverable: '+row.path,()=>{
 const raw=fs.readFileSync(new URL('../'+row.path,import.meta.url));assert.equal(sha(raw),row.sha256);
 const s=JSON.parse(raw),current=fs.readFileSync(new URL('./'+s.name,import.meta.url));assert.equal(sha(current),s.after);
 let text=current.toString();assert.deepEqual(Buffer.from(text),current);assert(text.endsWith(s.append));text=text.slice(0,-s.append.length);
 for(const [a,b]of s.seams.toReversed()){assert.equal(text.split(b).length,2);text=text.replace(b,a);}assert.equal(sha(Buffer.from(text)),s.before);
 const restored=text;for(const[a,b]of s.seams){assert.equal(text.split(a).length,2);text=text.replace(a,b);}text+=s.append;assert.deepEqual(Buffer.from(text),current);
 const before=fs.readFileSync('${parent.website}/tests/'+s.name);assert.equal(sha(before),s.before);assert.deepEqual(Buffer.from(restored),before);
});
`;
const testPath='tests/tour-delivery-preservation.test.mjs';fs.writeFileSync(site+'/'+testPath,test,{flag:'wx'});added.push(testPath);
for(const name of ['next-env.d.ts','.next/types/routes.d.ts']){const from=parent.website+'/'+name,to=site+'/'+name;if(!fs.existsSync(to)){fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);}assert.equal(hash(from),hash(to));}
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);if(!changed.includes(r.path))assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}
for(const r of json(site+'/atlas-review/integration-inputs.json').inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const rows=[...parent.sourceRows.map(r=>r.path),...added].sort().map(p=>({path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p)}));
assert.equal(new Set(rows.map(r=>r.path)).size,rows.length);
const result={...parent,schema:'vm-tour-delivery-test-successor/1',at:new Date().toISOString(),website:site,parent:pf,parentSha256:ph,sourceRows:rows,sourcePaths:rows.length,changedPaths:changed,newPaths:added,preparation:pin(stage+'/PREPARATION.json'),proposals:proposals.map(p=>pin(p.root+'/PROPOSAL.json')),allOriginalTestAssertionsPreservedByExactInverse:true,productSourceExactToParent:true,protectedReviewInputsChanged:false,verification:{parentFullVerification:pin('F:/VisibleMedicine/staging/20261028-quadriceps-website/VERIFICATION_SUMMARY.json')},focusedChecksPending:true,freshStrictOrBuildForThisSource:false,wholeSuitePassing:false,installed:false,normalPreviewChanged:false};
fs.writeFileSync(stage+'/SOURCE_CANDIDATE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:pin(stage+'/SOURCE_CANDIDATE.json'),sourcePaths:rows.length,changed,added}));
