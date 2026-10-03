import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {deliverDiscComparison} from '../lib/disc-comparison-delivery.ts';
const packet=JSON.parse(readFileSync('lib/disc-comparison-manifest.json','utf8'));
const base='/api/atlas-review/source-comparisons/disc/';
const sha=(bytes:string|Uint8Array)=>createHash('sha256').update(bytes).digest('hex');

test('disc comparison remains held and separate from unchanged learner and optic imports',()=>{
 assert.equal(packet.atlasInspectorRevision,'952d758104102f5853e00e846cb3448511daa960');
 assert.equal(packet.meshCount,8);assert.equal(packet.admissions,0);assert.equal(packet.levelAssigned,false);assert.equal(packet.clinicalValidation,false);
 assert.deepEqual(packet.meshes.filter((m:any)=>m.role==='candidate').map((m:any)=>[m.key,m.id,m.held]),[['isa/FJ3211','FMA10446',true],['partof/FJ3211','FMA25511',true]]);
 assert.equal(JSON.parse(readFileSync('lib/optic-comparison-manifest.json','utf8')).atlasInspectorRevision,'d9cd141f1fefae6842754e134a1ef18d5661c727');
 for(const path of ['atlas-review/manifest.json','public/atlas-runtime/head-neck/manifest.json','public/atlas-review-viewer/manifest.json']) {
  const imported=JSON.parse(readFileSync(path,'utf8'));assert.equal(imported.sourceCommit??imported.revision,'4b6f0629ffedd99c5529882ed74341d9402e6ef0');
 }
 assert.match(readFileSync('.local/disc-review/assets.ts','utf8'),/^import 'server-only';/);
 for(const path of ['public/disc-review','public/disc-comparison','public/atlas-review-viewer/scene.json'])assert.equal(existsSync(path),false);
 for(const page of ['app/workspace/atlas-review/source-comparisons/page.tsx','app/workspace/atlas-review/source-comparisons/disc/page.tsx'])assert.match(readFileSync(page,'utf8'),/await authorizeClinicalReview\(\)/);
 const navigation=readFileSync('components/SiteFrame.tsx','utf8');assert.match(navigation,/href="\/workspace\/atlas-review\/source-comparisons"/);
 assert.match(navigation,/pathname === '\/workspace\/atlas-review\/source-comparisons'/);
});

test('disc delivery rejects stale queries, altered evidence, assigned levels and lifted holds',async()=>{
 const content='Synthetic disc review',assets={'index.html':Buffer.from(content).toString('base64')};
 const fixture={...packet,files:[{name:'index.html',bytes:Buffer.byteLength(content),sha256:sha(content)}]};
 const href='https://review.test'+base+'index.html?revision='+packet.reportSha256;
 const call=(url=href,p=fixture,a=assets,method='GET')=>deliverDiscComparison(new Request(url,{method}),p,a);
 const good=await call();assert.equal(good.status,200);assert.equal(await good.text(),content);
 assert.equal((await call(href,fixture,assets,'HEAD')).status,200);
 for(const url of [href.split('?')[0],href+'&revision='+packet.reportSha256,href+'&other=1',href.replace(packet.reportSha256,'b'.repeat(64)),href.replace('?revision=','?rev=')])assert.equal((await call(url)).status,409);
 for(const path of ['manifest.json','unknown.obj','../scene.json','app.js/extra'])assert.equal((await call('https://review.test'+base+path+'?revision='+packet.reportSha256)).status,404);
 for(const delta of [{admissions:1},{levelAssigned:true},{clinicalValidation:true},{sourceGeometryChanged:true},{purpose:'learner'},{meshCount:7}])assert.equal((await call(href,{...fixture,...delta})).status,503);
 for(const transform of [(m:any)=>({...m,held:false}),(m:any)=>({...m,id:'named-level'}),(m:any)=>({...m,key:'isa/unknown'})]) {
  const changed=fixture.meshes.map((m:any,i:number)=>i===0?transform(m):m);assert.equal((await call(href,{...fixture,meshes:changed})).status,503);
 }
 for(const a of [{},{'index.html':'!bad base64'},{'index.html':Buffer.from(content+'changed').toString('base64')},{'index.html':Buffer.from('x'.repeat(content.length)).toString('base64')}])assert.equal((await call(href,fixture,a as typeof assets)).status,503);
 assert.equal((await call(href,{...fixture,files:[...fixture.files,...fixture.files]})).status,503);
 assert.equal((await call(href,fixture,assets,'POST')).status,405);
});

test('actual disc route and pages recheck reviewer authority and exact bytes on every request',{timeout:120000},async()=>{
 const entry=`
  import * as route from './app/api/atlas-review/source-comparisons/disc/[asset]/route';
  import discPage from './app/workspace/atlas-review/source-comparisons/disc/page';
  import listPage from './app/workspace/atlas-review/source-comparisons/page';
  function inspect(node,out=[]){if(node==null)return out;if(Array.isArray(node)){node.forEach(n=>inspect(n,out));return out;}
    if(typeof node==='object'){if(typeof node.type==='string')out.push({tag:node.type,src:node.props.src,href:node.props.href,role:node.props.role});inspect(node.props?.children,out);}return out;}
  export default {async fetch(request){globalThis.__discTestHeaders=request.headers;
    const path=new URL(request.url).pathname;if(path==='/test-disc-page'||path==='/test-list-page')return Response.json(inspect(await (path==='/test-disc-page'?discPage():listPage())));
    return route[request.method]?.(request)??new Response('Read only',{status:405});}};`;
 const bundled=await build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'disc-route-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',external:['cloudflare:workers'],define:{'import.meta.env.DEV':'false'},
  plugins:[{name:'fixture-auth-context',setup(b){
   b.onResolve({filter:/^(next\/(headers|navigation)|server-only)$/},a=>({path:a.path,namespace:'fixture'}));
   b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='next/headers'?'export async function headers(){return globalThis.__discTestHeaders;}':a.path==='next/navigation'?'export function redirect(){throw Error("Unexpected redirect");}':''}));
  }}]});
 const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve('.local/disc-route-fixture.mjs'),contents:bundled.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
 try {
  const db=await mf.getD1Database('DB');
  for(const sql of [
   'CREATE TABLE users (id TEXT PRIMARY KEY, external_subject TEXT NOT NULL, roles TEXT NOT NULL)',
   'CREATE TABLE account_security_profiles (user_id TEXT PRIMARY KEY, status TEXT NOT NULL)',
   'CREATE TABLE organizations (id TEXT PRIMARY KEY, status TEXT NOT NULL, created_at TEXT NOT NULL)',
   'CREATE TABLE organization_memberships (organization_id TEXT, user_id TEXT, role TEXT, status TEXT, PRIMARY KEY(organization_id,user_id))',
  ])await db.prepare(sql).run();
  await db.prepare("INSERT INTO organizations VALUES ('test-org','active','2026-01-01')").run();
  for(const [subject,roles,member] of [['reviewer','administrator','owner'],['learner','learner','learner'],['instructor','instructor','educator'],['admin-learner','administrator','learner']]) {
   await db.prepare('INSERT INTO users VALUES (?,?,?)').bind('edu:'+subject,'sites:'+subject,roles).run();
   await db.prepare('INSERT INTO account_security_profiles VALUES (?,?)').bind('edu:'+subject,'active').run();
   await db.prepare('INSERT INTO organization_memberships VALUES (?,?,?,?)').bind('test-org','edu:'+subject,member,'active').run();
  }
  const identity=(who:string|null)=>who?{'oai-authenticated-user-id':who,'oai-authenticated-user-email':who+'@test.invalid'}:{};
  const call=(name:string,who:string|null='reviewer',method='GET',query='?revision='+packet.reportSha256)=>mf.dispatchFetch('https://review.test'+base+name+query,{method,headers:identity(who)});
  for(const file of packet.files) {
   for(const method of ['GET','HEAD']) {
    for(const who of [null,'unknown','learner','instructor','admin-learner']) {
     const response=await call(file.name,who,method);assert.equal(response.status,who?403:401,file.name+' '+method+' '+who);
     assert.match(response.headers.get('cache-control')??'',/private, no-store/);assert(!response.headers.has('x-source-asset-sha256'));assert(!response.headers.has('content-length'));await response.arrayBuffer();
    }
    const response=await call(file.name,'reviewer',method);assert.equal(response.status,200,await response.clone().text());
    assert.equal(response.headers.get('cross-origin-resource-policy'),'same-origin');assert.equal(response.headers.get('x-source-asset-bytes'),String(file.bytes));assert.equal(response.headers.get('x-source-asset-sha256'),file.sha256);
    const raw=new Uint8Array(await response.arrayBuffer());
    if(method==='HEAD')assert.equal(raw.length,0);
    else {
     assert.equal(raw.length,file.bytes);assert.equal(sha(raw),file.sha256);
     if(file.name==='index.html')for(const name of ['app.js','THIRD_PARTY_NOTICES.txt'])assert(new TextDecoder().decode(raw).includes('./'+name+'?revision='+packet.reportSha256));
     if(file.name==='scene.json') {
      const scene=JSON.parse(new TextDecoder().decode(raw));assert.equal(scene.reportSha256,packet.reportSha256);assert.equal(scene.levelAssigned,false);assert.equal(scene.admissions,0);assert.equal(scene.meshes.length,8);
      for(const mesh of scene.meshes){const pin=packet.meshes.find((m:any)=>m.key===mesh.key);assert.equal(sha(JSON.stringify({vertices:mesh.vertices,faces:mesh.faces})),pin.geometrySha256);assert.deepEqual(mesh.sources,pin.sources);}
     }
     if(file.name==='THIRD_PARTY_NOTICES.txt')assert.match(new TextDecoder().decode(raw),/creativecommons.org\/licenses\/by\/4.0\/[\s\S]*MIT License/);
    }
   }
   for(const query of ['','?revision='+('f'.repeat(64)),'?revision='+packet.reportSha256+'&revision='+packet.reportSha256])assert.equal((await call(file.name,'reviewer','GET',query)).status,409);
  }
  for(const name of ['manifest.json','unknown.obj','../index.html'])assert.equal((await call(name)).status,404);
  assert.equal((await call('scene.json','reviewer','POST')).status,405);
  for(const path of ['/test-disc-page','/test-list-page'])for(const who of [null,'learner','reviewer']) {
   const nodes=await (await mf.dispatchFetch('https://review.test'+path,{headers:identity(who)})).json() as Array<{tag:string;src?:string;href?:string;role?:string}>;
   if(who!=='reviewer') {assert(nodes.some(n=>n.role==='alert'));assert(!nodes.some(n=>n.tag==='iframe'||n.tag==='a'));}
   else if(path==='/test-disc-page')assert.equal(nodes.find(n=>n.tag==='iframe')?.src,base+'index.html?revision='+packet.reportSha256);
   else for(const name of ['optic','disc'])assert(nodes.some(n=>n.href==='/workspace/atlas-review/source-comparisons/'+name));
  }
  for(const [disable,restore] of [
   ["UPDATE users SET roles='learner' WHERE id='edu:reviewer'","UPDATE users SET roles='administrator' WHERE id='edu:reviewer'"],
   ["UPDATE account_security_profiles SET status='suspended' WHERE user_id='edu:reviewer'","UPDATE account_security_profiles SET status='active' WHERE user_id='edu:reviewer'"],
   ["UPDATE organization_memberships SET status='revoked' WHERE user_id='edu:reviewer'","UPDATE organization_memberships SET status='active' WHERE user_id='edu:reviewer'"],
   ["UPDATE organizations SET status='suspended'","UPDATE organizations SET status='active'"],
  ]) {
   await db.prepare(disable).run();for(const file of packet.files)for(const method of ['GET','HEAD'])assert.equal((await call(file.name,'reviewer',method)).status,403);
   const nodes=await (await mf.dispatchFetch('https://review.test/test-disc-page',{headers:identity('reviewer')})).json() as Array<{tag:string;role?:string}>;assert(nodes.some(n=>n.role==='alert'));assert(!nodes.some(n=>n.tag==='iframe'));
   await db.prepare(restore).run();
  }
  assert.equal((await db.prepare('SELECT count(*) AS n FROM users').first<{n:number}>())?.n,4);
  assert.equal((await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%review%'").all()).results.length,0,'No opinion/admission writes');
 } finally {await mf.dispose();}
});

test('client source never imports the held disc server packet',()=>{
 const files:string[]=[];
 function walk(dir:string){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(tsx?|mts|mjs)$/.test(e.name))files.push(p);}}
 for(const dir of ['app','components','lib'])walk(dir);
 const clients:string[]=[];for(const path of files){const text=readFileSync(path,'utf8');if(/^\s*["']use client["']/.test(text)){clients.push(path);assert(!/discComparisonAssets|\.local\/disc-review|disc-comparison-manifest/.test(text),path);}}
 assert(clients.includes(join('components','SiteFrame.tsx')),'Known client navigation is included in the exhaustive directive scan');
 assert.equal(existsSync('public/disc-review'),false);
});
