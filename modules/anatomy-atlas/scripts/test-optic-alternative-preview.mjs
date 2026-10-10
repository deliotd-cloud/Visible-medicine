import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {request} from 'node:http';
import {opticAlternativeScene,opticHash,opticGeometryHash,opticReviewDraft} from './optic-alternative-scene.mjs';
import {opticAlternativeReport} from './optic-alternative-report.mjs';
import {opticPreviewServer} from './optic-alternative-server.mjs';
import {opticCameraArc} from './optic-alternative-camera.mjs';
import {opticSceneRequest,assertOpticSceneRevision} from './optic-alternative-request.mjs';
test('protected inspector carries its exact report revision to the scene and rejects mixed evidence',()=>{
 const hash='a'.repeat(64),base='https://review.test/api/atlas-review/source-comparisons/optic/index.html';
 const bound=opticSceneRequest(base+'?revision='+hash);
 assert.equal(bound.url,base.replace('index.html','scene.json')+'?revision='+hash);
 assert.equal(bound.expectedRevision,hash);assertOpticSceneRevision({reportSha256:hash},hash);
 assert.throws(()=>assertOpticSceneRevision({reportSha256:'b'.repeat(64)},hash),/changed/);
 assert.throws(()=>assertOpticSceneRevision({},null),/Missing/);
 for(const q of ['?revision=wrong','?revision=','?revision='+hash+'&revision='+hash])assert.throws(()=>opticSceneRequest(base+q),/Invalid/);
 const local=opticSceneRequest('http://127.0.0.1:60371/');assert.equal(local.expectedRevision,null);assert.equal(local.url,'http://127.0.0.1:60371/scene.json');
});
const shape={vertices:[[0,0,0],[1,0,0],[0,1,0]],faces:[[0,1,2]],min:[0,0,0],max:[1,1,0]};
const pairData=[{side:'right',id:'FMA50875',files:['FJ1364','FJ1819']},{side:'left',id:'FMA50878',files:['FJ1313','FJ1772']}];
test('shared camera follows a continuous eased orbit, with exact endpoints and no zero-radius chord',()=>{
 const sample=t=>opticCameraArc([0,0,10],[0,0,0],[2,0,0],[1,0,0],10,t);
 assert.deepEqual(sample(0),{position:[0,0,10],target:[0,0,0]});
 const end=sample(1);assert(Math.abs(end.position[0]-12)<1e-10);assert(Math.abs(end.position[2])<1e-10);assert.deepEqual(end.target,[2,0,0]);
 let previous=sample(0);for(let i=1;i<=100;i++){const pose=sample(i/100),offset=pose.position.map((p,j)=>p-pose.target[j]);assert(Math.abs(Math.hypot(...offset)-10)<1e-9);assert(Math.hypot(...pose.position.map((p,j)=>p-previous.position[j]))<.3);previous=pose;}
 assert(Math.hypot(...sample(.001).position.map((p,i)=>p-sample(0).position[i]))<.0001);
 assert.throws(()=>sample(2));assert.throws(()=>opticCameraArc([0,0,0],[0,0,0],[0,0,0],[1,0,0],10,.5));
});
function fixture(){const meshes=pairData.flatMap(p=>p.files.map(file=>({key:'isa/'+file,id:p.id,name:file,side:p.side,role:'candidate',tree:'isa',held:true,sources:[{file,sha256:'a'.repeat(64)}],shape:structuredClone(shape)})));
 const report={purpose:'source-only-optic-alternative-review',admissions:0,clinicalValidation:false,sourceGeometryChanged:false,pairs:structuredClone(pairData),evidence:{synthetic:true},limitations:[],coordinateSystem:{},credit:'Synthetic fixture',license:'CC0',
  meshes:meshes.map(({shape,...m})=>({...m,vertices:3,triangles:1,degenerateTriangles:0,bounds:{min:shape.min,max:shape.max},geometrySha256:opticGeometryHash(shape)}))};return {report,meshes};}
test('scene preserves all original coordinates/faces and bound held identities',()=>{
 const {report,meshes}=fixture(),before=structuredClone(meshes),scene=opticAlternativeScene(report,meshes);assert.deepEqual(meshes,before);assert.equal(scene.meshes.length,4);
 for(let i=0;i<4;i++){assert.deepEqual(scene.meshes[i].vertices,meshes[i].shape.vertices);assert.deepEqual(scene.meshes[i].faces,meshes[i].shape.faces);}
 const bad=structuredClone(meshes);bad[0].shape.vertices[1][0]=2;assert.throws(()=>opticAlternativeScene(report,bad),/Geometry changed/);
 for(const delta of [{admissions:1},{clinicalValidation:true},{sourceGeometryChanged:true},{purpose:'learner'}])assert.throws(()=>opticAlternativeScene({...report,...delta},meshes));
 assert.throws(()=>opticAlternativeScene(report,meshes.slice(1)));const wrong=structuredClone(report);wrong.pairs[0].files.reverse();wrong.pairs[0].id='FMA50878';assert.throws(()=>opticAlternativeScene(wrong,meshes),/Wrong-side pair/);
});
test('local draft opinions bind exact side/files/report, never remove hold or create approval',()=>{
 const {report,meshes}=fixture(),scene=opticAlternativeScene(report,meshes);
 for(const side of ['right','left'])for(const choice of ['retain-hold','compare-both',...pairData.find(p=>p.side===side).files]){
  const draft=opticReviewDraft(scene,side,choice,'Synthetic review note');assert.equal(draft.reportSha256,scene.reportSha256);assert.equal(draft.holdRetained,true);assert.equal(draft.clinicalApproval,false);assert.equal(draft.admissions,0);assert.equal(draft.sources.length,2);
 }
 assert.throws(()=>opticReviewDraft(scene,'right','FJ1313'),/Foreign/);assert.throws(()=>opticReviewDraft(scene,'left','retain-hold','x'.repeat(4001)));
 for(const delta of [{admissions:1},{clinicalValidation:true},{sourceGeometryChanged:true},{reportSha256:'foreign'}])assert.throws(()=>opticReviewDraft({...scene,...delta},'left','retain-hold'));
 const duplicate=structuredClone(scene);duplicate.meshes[1]=structuredClone(duplicate.meshes[0]);assert.throws(()=>opticReviewDraft(duplicate,'right','retain-hold'),/Duplicate/);
});
test('actual scene is reproducible and contains ten unchanged source contexts',async()=>{
 const {report,meshes}=await opticAlternativeReport(),scene=opticAlternativeScene(report,meshes);assert.deepEqual(report,JSON.parse(await readFile('docs/optic-nerve-alternatives.json')));assert.equal(scene.meshes.length,10);
 assert.equal(scene.meshes.filter(m=>m.role==='candidate').length,4);assert.equal(scene.meshes.filter(m=>m.role==='bone-context').length,1);assert(scene.limitations.some(l=>l.includes('NOT a segmented optic canal')));
 for(const pair of scene.pairs)assert.equal(opticReviewDraft(scene,pair.side,'retain-hold').id,pair.id);
});
test('loopback preview allows only pinned assets and rejects rebinding, POST and altered startup',async()=>{
 const root=await mkdtemp(join(tmpdir(),'vm-optic-preview-test-'));let server;
 try{
  const reportBytes=Buffer.from(JSON.stringify({admissions:0,clinicalValidation:false,sourceGeometryChanged:false})),reportSha256=opticHash(reportBytes);
  const data={'index.html':'<!doctype html><title>Synthetic</title>','app.js':'// synthetic','THIRD_PARTY_NOTICES.txt':'Synthetic notice','scene.json':JSON.stringify({purpose:'source-only-optic-alternative-review',reportSha256,admissions:0,clinicalValidation:false,sourceGeometryChanged:false})};
  const manifest={purpose:'source-only-optic-alternative-review',reportSha256,files:[]};for(const[name,text]of Object.entries(data)){const bytes=Buffer.from(text);await writeFile(join(root,name),bytes);manifest.files.push({name,bytes:bytes.length,sha256:opticHash(bytes)});}await writeFile(join(root,'manifest.json'),JSON.stringify(manifest));
  ({server}=await opticPreviewServer({root,reportBytes}));await new Promise(done=>server.listen(0,'127.0.0.1',done));const url='http://127.0.0.1:'+server.address().port+'/';
  const response=await fetch(url);assert.equal(response.status,200);assert.equal(await response.text(),data['index.html']);assert.equal(response.headers.get('cache-control'),'no-store');assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  assert.equal((await fetch(url+'scene.json',{method:'HEAD'})).status,200);assert.equal((await fetch(url,{method:'POST'})).status,404);assert.equal((await fetch(url+'manifest.json')).status,404);
  const status=await new Promise((done,reject)=>{const req=request(url,{headers:{Host:'attacker.invalid'}},res=>{res.resume();res.on('end',()=>done(res.statusCode));});req.on('error',reject);req.end();});assert.equal(status,403);
  await assert.rejects(opticPreviewServer({root,reportBytes:Buffer.from('{}')}),/stale/);
  await writeFile(join(root,'app.js'),'changed');await assert.rejects(opticPreviewServer({root,reportBytes}));
  manifest.files[0].name='../escape';await writeFile(join(root,'manifest.json'),JSON.stringify(manifest));await assert.rejects(opticPreviewServer({root,reportBytes}));
 }finally{if(server)await new Promise(done=>server.close(done));const target=resolve(root);assert.equal(dirname(target),resolve(tmpdir()));assert.match(basename(target),/^vm-optic-preview-test-/);await rm(target,{recursive:true,force:true});}
});
