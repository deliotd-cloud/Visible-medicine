import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createDevelopmentModelGuard} from '../scripts/local-atlas-development-plugin.mjs';
import {privateReferencePaths} from '../lib/clinical-review-reference-registry.ts';
const paths=JSON.parse(fs.readFileSync('lib/atlas-model-inventory.json')).models.flatMap(m=>m.paths),registry=JSON.parse(fs.readFileSync('lib/clinical-review-reference-assets.json')),privatePaths=privateReferencePaths(registry);
function exercise(guard,url,method='GET'){const req={url,method,headers:{range:'bytes=0-20'}},headers={},res={statusCode:200,setHeader:(k,v)=>{headers[k]=v;},end(){this.ended=true;}};let calls=0;guard(req,res,()=>calls++);return{req,res,headers,calls};}
test('exact private API paths reach authorization unchanged; every old model rewrite stays exact',()=>{
 const guard=createDevelopmentModelGuard(paths,privatePaths);
 for(const p of privatePaths)for(const m of ['GET','HEAD','PUT']){const r=exercise(guard,p,m);assert.equal(r.calls,1);assert.equal(r.req.url,p);assert.equal(r.req.method,m);assert.equal(r.res.ended,undefined);}
 for(const p of paths){const r=exercise(guard,p+'?v=0123456789ab');assert.equal(r.calls,1);assert.equal(r.req.url,p.replace('/atlas-runtime/','/api/atlas-delivery/')+'?v=0123456789ab');}
});
test('private geometry cannot fall back to raw/static/encoded/foreign aliases',()=>{
 const guard=createDevelopmentModelGuard(paths,privatePaths),glb=privatePaths.find(p=>p.endsWith('.glb'));
 for(const p of ['/models/fda-shoulder-draft/reference.glb','/atlas-runtime/head-neck/models/fda-shoulder-draft/reference.glb',glb.replace('56cf325c','00000000'),glb.replace('reference.glb','Gcart.glb'),glb.replace('.glb','%2eglb'),glb.replace('.glb','.GLB'),glb+'/', '/@fs/F:/private/reference.glb?import']){const r=exercise(guard,p);assert.equal(r.calls,0,p);assert.equal(r.res.statusCode,404);assert.equal(r.headers['Cache-Control'],'private, no-store');}
 for(const invalid of [[privatePaths[0],privatePaths[0]],['/models/private.glb'],[glb.replace('reference.glb','%72eference.glb')]])assert.throws(()=>createDevelopmentModelGuard(paths,invalid));
 const worker=fs.readFileSync('worker/index.ts','utf8'),before=fs.readFileSync('F:/VisibleMedicine/staging/20261023-midfoot-website/website/worker/index.ts','utf8');assert.equal(worker,before,'Production static-model firewall is unchanged');
 const config=fs.readFileSync('vite.config.ts','utf8');assert.match(config,/localAtlasDevelopmentPlugin\(atlasModelInventory\.models\.flatMap\(model => model\.paths\), privateReferencePaths\(privateReferenceRegistry\)\)/);
});
