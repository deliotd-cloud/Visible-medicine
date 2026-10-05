import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {plexusFingerprints,plexusHash} from '../scripts/plexus-review-fingerprints.mjs';
import {verifyPlexusReview} from '../scripts/verify-plexus-review.mjs';
const packet=JSON.parse(readFileSync('lib/plexus-review-manifest.json','utf8'));
const module=readFileSync('.local/plexus-review/assets.ts','utf8');
const assets=JSON.parse(module.split('export const plexusReviewAssets: Record<string,string> = ')[1].trim().replace(/;$/,''));
const url='https://review.test/api/atlas-review/source-comparisons/plexus/';
async function delivery(){const result=await build({entryPoints:['lib/plexus-review-delivery.ts'],bundle:true,write:false,format:'esm',platform:'neutral'});return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64'));}
const fingerprintInput=()=>({study:structuredClone(packet.study),topologyInputs:structuredClone(packet.topologyInputs),presentationInputs:structuredClone(packet.presentationInputs),assets:packet.files.filter((f:{name:string})=>f.name!=='index.html').map(({name,sha256}:{name:string;sha256:string})=>({name,sha256})),packages:structuredClone(packet.packages),checklistVersion:packet.context.checklistVersion,checklists:structuredClone(packet.context.checklists)});

test('exact private bytes verify; renderer-only changes preserve topology but graph changes expire both',()=>{
  assert.equal(verifyPlexusReview().materialHash,packet.context.materialHash);
  const baseline=plexusFingerprints(fingerprintInput());assert.equal(baseline.materialHash,packet.context.materialHash);
  const render=fingerprintInput();render.presentationInputs[0].sha256='a'.repeat(64);
  const changed=plexusFingerprints(render);assert.equal(changed.topologyHash,baseline.topologyHash);assert.notEqual(changed.presentationHash,baseline.presentationHash);assert.notEqual(changed.materialHash,baseline.materialHash);
  const graph=fingerprintInput();graph.study.connections[0].to='nerve.radial';
  const altered=plexusFingerprints(graph);assert.notEqual(altered.topologyHash,baseline.topologyHash);assert.notEqual(altered.presentationHash,baseline.presentationHash);
  assert.equal(packet.study.parts.length,35);assert.equal(packet.study.connections.length,38);
  assert(packet.packages.every((p:{license:string})=>['MIT','ISC','BSD-2-Clause','BSD-3-Clause','Apache-2.0','Zlib'].includes(p.license)));
  const broad=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  assert.equal(broad.revision,'5acfa46b7fcef876fc2f55f8ed122de46b29bb03');
  assert(!broad.files.some((f:{path:string})=>f.path.includes('original-plexus')||f.path.startsWith('app/review/candidates/')));
  assert(!readFileSync('lib/atlas-model-delivery.ts','utf8').includes('vm:schematic:brachial-plexus'));
});

test('each GET/HEAD is hash-bound, no-store and fails closed on tampering, frame/admission or query changes',async()=>{
  const {deliverPlexusReview}=await delivery();
  for(const file of packet.files){
    for(const method of ['GET','HEAD']){
      const response=await deliverPlexusReview(new Request(url+file.name+'?revision='+packet.context.materialHash,{method}),packet,assets);
      assert.equal(response.status,200,file.name);assert.equal(response.headers.get('content-length'),String(file.bytes));assert.equal(response.headers.get('x-source-asset-sha256'),file.sha256);
      assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-frame-options'),'SAMEORIGIN');assert.equal(response.headers.get('cross-origin-resource-policy'),'same-origin');assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.match(response.headers.get('content-security-policy')!,/font-src 'none'/);
      const bytes=Buffer.from(await response.arrayBuffer());if(method==='HEAD')assert.equal(bytes.length,0);else assert.equal(plexusHash(bytes),file.sha256);
    }
  }
  const baseRequest=new Request(url+'index.html?revision='+packet.context.materialHash);
  for(const query of ['', '?revision='+'f'.repeat(64),'?revision='+packet.context.materialHash+'&revision='+packet.context.materialHash,'?revision='+packet.context.materialHash+'&userId=someone'])assert.equal((await deliverPlexusReview(new Request(url+'index.html'+query),packet,assets)).status,409);
  assert.equal((await deliverPlexusReview(new Request(url+'other.js?revision='+packet.context.materialHash),packet,assets)).status,404);
  assert.equal((await deliverPlexusReview(new Request(url+'index.html?revision='+packet.context.materialHash,{method:'POST'}),packet,assets)).status,405);
  for(const alteration of [{admissions:1},{clinicalValidation:true},{patientDataIncluded:true},{context:{...packet.context,learnerCatalogAdmission:true}},{context:{...packet.context,frame:{kind:'diagrammatic',units:'mm',patientRegistration:false}}},{context:{...packet.context,partCount:36}}])assert.equal((await deliverPlexusReview(baseRequest,{...packet,...alteration},assets)).status,503);
  const changed=structuredClone(packet);changed.files.find((f:{name:string})=>f.name==='index.html').sha256='f'.repeat(64);
  assert.equal((await deliverPlexusReview(baseRequest,changed,assets)).status,503);
  assert.equal((await deliverPlexusReview(baseRequest,packet,{...assets,'index.html':Buffer.from('counterfeit').toString('base64')})).status,503);
});

test('actual asset route authenticates GET and HEAD before serving private schematic code',{timeout:120000},async()=>{
  const entry=`import * as route from './app/api/atlas-review/source-comparisons/plexus/[asset]/route';export default {async fetch(request){globalThis.__plexusHeaders=request.headers;return route[request.method](request)}};`;
  const result=await build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'plexus-assets-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',external:['cloudflare:workers'],define:{'import.meta.env.DEV':'false'},plugins:[{name:'fixture-only-auth',setup(b){
    b.onResolve({filter:/^(server-only|next\/headers|next\/navigation)$/},a=>({path:a.path,namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='server-only'?'':a.path==='next/headers'?'export async function headers(){return globalThis.__plexusHeaders;}':'export function redirect(){throw Error("Unexpected redirect");}'}));
  }}]});
  const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve('.local/plexus-assets-fixture.mjs'),contents:result.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
  try{
    const db=await mf.getD1Database('DB');
    for(const sql of ['CREATE TABLE users(id TEXT PRIMARY KEY,external_subject TEXT,roles TEXT)','CREATE TABLE account_security_profiles(user_id TEXT PRIMARY KEY,status TEXT)','CREATE TABLE organizations(id TEXT PRIMARY KEY,status TEXT,created_at TEXT)','CREATE TABLE organization_memberships(organization_id TEXT,user_id TEXT,role TEXT,status TEXT)'])await db.prepare(sql).run();
    await db.prepare("INSERT INTO users VALUES ('edu:admin','sites:admin','administrator'),('edu:learner','sites:learner','learner')").run();
    await db.prepare("INSERT INTO account_security_profiles VALUES ('edu:admin','active'),('edu:learner','active')").run();
    await db.prepare("INSERT INTO organizations VALUES ('org','active','2026-01-01')").run();
    await db.prepare("INSERT INTO organization_memberships VALUES ('org','edu:admin','owner','active'),('org','edu:learner','learner','active')").run();
    const call=(method:string,subject?:string)=>mf.dispatchFetch(url+'app.js?revision='+packet.context.materialHash,{method,headers:subject?{'oai-authenticated-user-id':subject,'oai-authenticated-user-email':subject+'@test.invalid'}:{}});
    for(const method of ['GET','HEAD']){
      assert.equal((await call(method)).status,401);assert.equal((await call(method,'learner')).status,403);assert.equal((await call(method,'unknown')).status,403);
      const response=await call(method,'admin');assert.equal(response.status,200,await response.clone().text());assert.equal(response.headers.get('x-source-asset-sha256'),packet.files.find((f:{name:string})=>f.name==='app.js').sha256);
    }
    await db.prepare("UPDATE organization_memberships SET status='revoked' WHERE user_id='edu:admin'").run();assert.equal((await call('GET','admin')).status,403);
  }finally{await mf.dispose();}
});
