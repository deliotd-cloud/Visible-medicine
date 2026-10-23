import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validatePrivateReferenceRegistry,privateReferencePaths,privateReferenceBase,resolvePrivateReferenceAsset,privateReferenceObjectKey} from '../lib/clinical-review-reference-registry.ts';
const raw=JSON.parse(fs.readFileSync('lib/clinical-review-reference-assets.json','utf8'));
test('real source registry is a separate unitless local draft, not the learner inventory',()=>{
 const r=validatePrivateReferenceRegistry(raw),ref=r.references[0];assert.equal(r.references.length,1);
 assert.equal(ref.sourceFrame,'unitless-normalized-source-assembly');assert.equal(ref.clinicalApproval,false);assert.equal(ref.deployment,'local-only');
 assert.equal(ref.revision,'56cf325c006a00e4349a6b45844797800a11c005448d32a08f40e64664288b44');
 assert.equal(ref.atlasRevision,'e3a901e103e9fb495a18d9bd1622190dfc0d034b');
 assert.equal(ref.files.find(f=>f.path.endsWith('.glb'))?.sha256,'38f96ede01a6cd6467fbcc4cb42eac4b673fe18c2ef54b07731e070c0968a5f6');
 const inventory=JSON.parse(fs.readFileSync('lib/atlas-model-inventory.json','utf8'));assert.equal(inventory.models.length,137);assert(!inventory.models.some((m:{sha256:string})=>ref.files.some(f=>f.sha256===m.sha256)));
 r.references[0].id='changed';assert.equal(raw.references[0].id,'fda-shoulder-fc9f3e56','validation returns an owned copy');
});
test('extra fields, forged approvals/frames, ambiguous identities and noncanonical files fail closed',()=>{
 const mutations:Array<(v:typeof raw)=>void>=[v=>{v.extra=true;},v=>{v.schema='other';},v=>{v.references[0].clinicalApproval=true;},v=>{v.references[0].deployment='public';},v=>{v.references[0].sourceFrame='millimetres';},v=>{v.references.push(structuredClone(v.references[0]));},v=>{v.references[0].files[0].sha256='0'.repeat(64);},v=>{v.references[0].files[0].bytes=256*1024+1;},v=>{v.references[0].files[1].bytes=32*1024*1024+1;},v=>{v.references[0].files[1].contentType='text/html';},v=>{v.references[0].files[0].path='models/../catalog.json';},v=>{v.references[0].files[0].path='models/foreign/catalog.json';},v=>{v.references[0].files[1].path='models/fda-shoulder-draft/foreign.glb';},v=>{v.references[0].files[0].url='https://foreign.test';},v=>{v.references[0].files.push(v.references[0].files[0]);},v=>{v.references[0].id='a/b';}];
 for(const mutate of mutations){const next=structuredClone(raw);mutate(next);assert.throws(()=>validatePrivateReferenceRegistry(next));}
 for(const v of [null,[],{},Object.create({schema:raw.schema,references:raw.references})])assert.throws(()=>validatePrivateReferenceRegistry(v));
});
test('only exact registered revision/asset paths resolve; raw, held, encoded, stale and query aliases never do',()=>{
 const ref=validatePrivateReferenceRegistry(raw).references[0],base=privateReferenceBase(ref),paths=privateReferencePaths(raw);
 assert.equal(paths.length,2);for(const p of paths){const hit=resolvePrivateReferenceAsset(new URL('http://localhost'+p),raw);assert(hit);assert.equal(privateReferenceObjectKey(hit.file),'atlas-review-references/v1/'+hit.file.sha256);}
 for(const p of [base+'/models/fda-shoulder-draft/Gcart.glb',base.replace(ref.revision,'0'.repeat(64))+'/models/fda-shoulder-draft/reference.glb','/models/fda-shoulder-draft/reference.glb',paths[1]+'?v='+ref.revision,paths[1]+'?x=1&x=2',paths[1].replace('reference.glb','%72eference.glb'),paths[1].replace('reference.glb','reference.GLB'),paths[1]+'/',paths[1]+'#fragment'])assert.equal(resolvePrivateReferenceAsset(new URL('http://localhost'+p),raw),null,p);
 assert.throws(()=>privateReferenceObjectKey({sha256:'not-a-key'}));
});
