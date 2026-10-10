import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {request} from 'node:http';
import {mkdtemp, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import test from 'node:test';
import {open3dmodelPlexusPreviewServer} from './open3dmodel-plexus-preview-server.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const revision = 'a'.repeat(64);
const scene = {schemaVersion:1,purpose:'open3dmodel-plexus-source-review',sourceObjSha256:revision,
  sourceInventorySha256:revision,conversionReportSha256:revision,units:'unknown-source-units',
  coordinateFrame:'unaltered-source-OBJ',registered:false,mirrored:false,clinicalApproved:false,
  admissions:0,license:'CC-BY-SA-4.0',credit:'Synthetic test source',limitations:['Synthetic fixture'],
  objects:[{id:'opaque-1',sourceName:'synthetic root.r',core:true,sourceNamedRight:true,groupedDivisions:false,
    vertices:[[0,0,0],[1,0,0],[0,1,0]],faces:[[0,1,2]],quality:{closedOrientedManifold:false,components:1,boundaryEdges:3,degenerateFaces:0}}],held:[]};
const files = {'index.html':'<!doctype html><title>Synthetic</title>','app.js':'// synthetic\n',
  'scene.json':JSON.stringify(scene),'THIRD_PARTY_NOTICES.txt':'Synthetic fixture; no real source.\n'};
async function fixture(){const folder=await mkdtemp(join(tmpdir(),'plexus-preview-test-'));
  for(const [name,body] of Object.entries(files))await writeFile(join(folder,name),body);
  const manifest={purpose:scene.purpose,files:Object.entries(files).map(([name,body])=>({name,bytes:Buffer.byteLength(body),sha256:sha(body)}))};
  await writeFile(join(folder,'manifest.json'),JSON.stringify(manifest));return {folder,manifest};}
async function cleanup(folder){const target=resolve(folder);assert.equal(dirname(target),resolve(tmpdir()));assert.match(basename(target),/^plexus-preview-test-/);await rm(target,{recursive:true,force:true});}
function statusWithHost(url, host){return new Promise((done,reject)=>{const req=request(url,{headers:{Host:host}},res=>{res.resume();res.on('end',()=>done(res.statusCode));});req.on('error',reject);req.end();});}
function statusWithRawPath(url,path){return new Promise((done,reject)=>{const req=request(url,{path},res=>{res.resume();res.on('end',()=>done(res.statusCode));});req.on('error',reject);req.end();});}

test('pinned candidate preview stays on loopback and serves only read-only allowlisted files',async()=>{
  const {folder}=await fixture();let server;
  try {server=await open3dmodelPlexusPreviewServer(folder);const base=`http://127.0.0.1:${server.address().port}/`;
    assert.equal(server.address().address,'127.0.0.1');
    const index=await fetch(base);assert.equal(index.status,200);assert.equal(await index.text(),files['index.html']);
    assert.equal(index.headers.get('cache-control'),'no-store');assert.match(index.headers.get('content-security-policy'),/frame-ancestors 'none'/);
    const head=await fetch(base+'scene.json',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
    assert.equal((await fetch(base+'manifest.json')).status,404);
    assert.equal((await fetch(base+'../manifest.json')).status,404);
    assert.equal((await fetch(base+'scene.json?x=1')).status,404);
    for(const path of ['/../scene.json','/%2e%2e/scene.json','/x/../scene.json','/scene.json?x=1','/%73cene.json'])
      assert.equal(await statusWithRawPath(base,path),404,`Raw path accepted: ${path}`);
    assert.equal((await fetch(base,{method:'POST'})).status,405);
    assert.equal((await fetch(base,{headers:{Origin:'https://example.org'}})).status,403);
    assert.equal(await statusWithHost(base,'localhost:'+server.address().port),403);
    await writeFile(join(folder,'app.js'),'// tampered\n');
    assert.equal((await fetch(base+'app.js')).status,503);
  } finally {if(server)await new Promise(done=>server.close(done));await cleanup(folder);}
});

test('rejects stale manifest, unsafe scene and linked assets before listening',async()=>{
  for(const mutate of [
    async ({folder})=>writeFile(join(folder,'scene.json'),JSON.stringify({...scene,admissions:1})),
    async ({folder,manifest})=>{manifest.files[0].name='../escape';await writeFile(join(folder,'manifest.json'),JSON.stringify(manifest));},
    async ({folder})=>{await rm(join(folder,'app.js'));await symlink(join(folder,'scene.json'),join(folder,'app.js'));},
  ]) {const context=await fixture();try{try{await mutate(context);}catch(error){if(error.code==='EPERM')continue;throw error;}
      await assert.rejects(open3dmodelPlexusPreviewServer(context.folder));}finally{await cleanup(context.folder);}}
});
