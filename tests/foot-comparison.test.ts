import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import {registerHooks} from 'node:module';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {calculateRevision,verifyPinnedBytes,verifySha256} from '../scripts/prepare-foot-comparison-local.mjs';
registerHooks({resolve(specifier,context,next){return specifier==='server-only'?{url:'data:text/javascript,export%20%7B%7D',shortCircuit:true}:next(specifier,context);}});
const {deliverFootComparison}=await import('../lib/foot-comparison-delivery.ts');

const packet=JSON.parse(readFileSync('lib/foot-comparison-manifest.json','utf8'));
const base='/api/atlas-review/source-comparisons/foot/';
const sha=(v:string|Uint8Array)=>createHash('sha256').update(v).digest('hex');
const asset=(name:string)=>readFileSync(resolve(process.env.VM_FOOT_PRIVATE_ASSET_ROOT||'private-assets',name));
test('preparation revision binds trusted package, viewer input, and exact preparer bytes',()=>{
 const recipe=packet.revisionRecipe;
 assert.equal(calculateRevision(recipe).revision,packet.revision);
 assert.equal(sha(readFileSync('scripts/prepare-foot-comparison-local.mjs')),recipe.preparerSha256);
 const different=(value:string)=>sha(value);
 const packageBytes=readFileSync('F:/VisibleMedicine/recovery/checkpoints/20261029-foot-interossei-source-review/PACKAGE.json');
 assert.equal(verifySha256(packageBytes,recipe.packageSha256,'trusted PACKAGE.json'),packageBytes);
 assert.throws(()=>verifySha256(Buffer.concat([packageBytes,Buffer.from('x')]),recipe.packageSha256,'trusted PACKAGE.json'));
 assert.notEqual(calculateRevision({...recipe,packageSha256:different('changed package')}).revision,packet.revision);
 assert.notEqual(calculateRevision({...recipe,preparerSha256:different('changed preparer')}).revision,packet.revision);
 const inputs=recipe.authenticatedInputs.map((pin:any)=>pin.path==='package/review/viewer.js'?{...pin,sha256:different('changed viewer')}:pin);
 assert(inputs.some((pin:any)=>pin.path==='package/review/viewer.js'&&pin.sha256===different('changed viewer')));
 assert.notEqual(calculateRevision({...recipe,authenticatedInputs:inputs}).revision,packet.revision);
 const vendorInputs=recipe.authenticatedInputs.map((pin:any)=>pin.path==='vendor/node_modules/three/build/three.module.js'?{...pin,sha256:different('changed vendor')}:pin);
 assert(vendorInputs.some((pin:any)=>pin.path==='vendor/node_modules/three/build/three.module.js'&&pin.sha256===different('changed vendor')));
 assert.notEqual(calculateRevision({...recipe,authenticatedInputs:vendorInputs}).revision,packet.revision);
 const viewerPin=recipe.authenticatedInputs.find((pin:any)=>pin.path==='package/review/viewer.js');
 assert.throws(()=>verifyPinnedBytes(Buffer.from('changed viewer'),{...viewerPin,bytes:14},'review/viewer.js'));
});
test('private source pins, notices and every nested viewer URL are revision bound',()=>{
 assert.equal(packet.admissions,0);assert.equal(packet.clinicalValidation,false);assert.equal(packet.registered,false);
 assert.equal(packet.sourceGeometryChanged,false);assert.equal(packet.license,'CC BY-SA 2.1 Japan');
 for(const pin of packet.files){assert.equal(asset(pin.name).length,pin.bytes);assert.equal(sha(asset(pin.name)),pin.sha256);}
 for(const name of ['index.html','viewer.js','three.module.js']){
  const body=asset(name).toString();
  assert(!/['"]\/(?:vendor|model|viewer|NOTICE|REVIEW_PACKET)/.test(body),`Unpinned path in ${name}`);
  if(name==='three.module.js')assert(!body.includes("'./three.core.js'"));
  assert(body.includes(`revision=${packet.revision}`));
 }
 assert.match(asset('NOTICE.md').toString(),/CC BY-SA 2\.1 Japan|CC Attribution-Share Alike 2\.1 Japan/);
 assert.match(asset('index.html').toString(),/original-95-FMA74140\.obj/);
 assert.match(asset('index.html').toString(),/original-99-FMA74141\.obj/);
});
test('delivery denies methods, stale or extra query, unknown path, tampering and lifted holds',async()=>{
 const name='NOTICE.md',bytes=asset(name),fixture={...packet,files:[packet.files.find((f:any)=>f.name===name)]};
 const assets={[name]:gzipSync(bytes).toString('base64')},href=`https://review.test${base}${name}?revision=${packet.revision}`;
 const call=(url=href,p=fixture,a=assets,method='GET')=>deliverFootComparison(new Request(url,{method}),p,a);
 assert.equal((await call()).status,200);assert.equal((await call(href,fixture,assets,'HEAD')).status,200);
 for(const url of [href.split('?')[0],href+'&q=1',href+'&revision='+packet.revision,href.replace(packet.revision,'a'.repeat(64)),href+'&detail=95'])assert.equal((await call(url)).status,409);
 for(const path of ['unknown.obj','viewer.js/extra','../other'])assert.equal((await call(`https://review.test${base}${path}?revision=${packet.revision}`)).status,404);
 assert.equal((await call(href,fixture,assets,'POST')).status,405);
 for(const delta of [{admissions:1},{clinicalValidation:true},{registered:true},{sourceGeometryChanged:true},{purpose:'learner'}])assert.equal((await call(href,{...fixture,...delta})).status,503);
 assert.equal((await call(href,fixture,{[name]:gzipSync(Buffer.from(bytes.toString()+'x')).toString('base64')})).status,503);
 assert.equal((await call(href,{...fixture,files:[...fixture.files,...fixture.files]})).status,503);
});
test('protected route denies unauthenticated and learner requests before asset delivery',async()=>{
 const entry=`import * as route from './app/api/atlas-review/source-comparisons/foot/[asset]/route'; export default {async fetch(request){globalThis.__footHeaders=request.headers;return route[request.method]?.(request)??new Response('Read only',{status:405});}};`;
 const bundled=await build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'foot-route-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',external:['cloudflare:workers'],define:{'import.meta.env.DEV':'false'},plugins:[{name:'fixture-auth-context',setup(b){b.onResolve({filter:/^(next\/(headers|navigation)|server-only)$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='next/headers'?'export async function headers(){return globalThis.__footHeaders;}':a.path==='next/navigation'?'export function redirect(){throw Error("Unexpected redirect");}':''}));}}]});
 const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve('.local/foot-route-fixture.mjs'),contents:bundled.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
 try{
  const db=await mf.getD1Database('DB');
  for(const sql of ['CREATE TABLE users (id TEXT PRIMARY KEY, external_subject TEXT NOT NULL, roles TEXT NOT NULL)','CREATE TABLE account_security_profiles (user_id TEXT PRIMARY KEY, status TEXT NOT NULL)','CREATE TABLE organizations (id TEXT PRIMARY KEY, status TEXT NOT NULL, created_at TEXT NOT NULL)','CREATE TABLE organization_memberships (organization_id TEXT, user_id TEXT, role TEXT, status TEXT, PRIMARY KEY(organization_id,user_id))'])await db.prepare(sql).run();
  await db.prepare("INSERT INTO organizations VALUES ('test-org','active','2026-01-01')").run();
  for(const [who,roles,member] of [['reviewer','administrator','owner'],['learner','learner','learner']]){
   await db.prepare('INSERT INTO users VALUES (?,?,?)').bind('edu:'+who,'sites:'+who,roles).run();await db.prepare('INSERT INTO account_security_profiles VALUES (?,?)').bind('edu:'+who,'active').run();await db.prepare('INSERT INTO organization_memberships VALUES (?,?,?,?)').bind('test-org','edu:'+who,member,'active').run();
  }
  const call=(name:string,who:string|null,method='GET')=>mf.dispatchFetch(`https://review.test${base}${name}?revision=${packet.revision}`,{method,headers:who?{'oai-authenticated-user-id':who,'oai-authenticated-user-email':who+'@test.invalid'}:{}});
  for(const {name} of packet.files)for(const method of ['GET','HEAD']){
   assert.equal((await call(name,null,method)).status,401);assert.equal((await call(name,'learner',method)).status,403);
   const approved=await call(name,'reviewer',method);assert.equal(approved.status,200);assert.equal(approved.headers.get('x-source-asset-sha256'),packet.files.find((f:any)=>f.name===name).sha256);
   assert.equal(approved.headers.get('cache-control'),'private, no-store');
   const body=new Uint8Array(await approved.arrayBuffer());
   assert.equal(body.length,method==='HEAD'?0:packet.files.find((f:any)=>f.name===name).bytes);
   if(method==='GET')assert.equal(sha(body),packet.files.find((f:any)=>f.name===name).sha256);
  }
  await db.prepare("UPDATE account_security_profiles SET status='suspended' WHERE user_id='edu:reviewer'").run();
  for(const method of ['GET','HEAD'])assert.equal((await call('model-99.json','reviewer',method)).status,403);
 }finally{await mf.dispose();}
});
