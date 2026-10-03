import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {deliverOpticComparison} from '../lib/optic-comparison-delivery.ts';

const packet=JSON.parse(readFileSync('lib/optic-comparison-manifest.json','utf8'));
const base='/api/atlas-review/source-comparisons/optic/';
const sha=(bytes:string|Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
test('held packet is distinct from unchanged learner and admitted review exports',()=>{
 assert.equal(packet.admissions,0);assert.equal(packet.clinicalValidation,false);assert.equal(packet.sourceGeometryChanged,false);
 assert.equal(packet.meshCount,10);assert.equal(packet.pairs.length,2);
 assert.equal(packet.meshes.filter((m:any)=>m.role==='candidate'&&m.held).length,4);
 assert.equal(packet.atlasInspectorRevision,'d9cd141f1fefae6842754e134a1ef18d5661c727');
 for(const path of ['atlas-review/manifest.json','public/atlas-runtime/head-neck/manifest.json','public/atlas-review-viewer/manifest.json']){
  const imported=JSON.parse(readFileSync(path,'utf8'));assert.equal(imported.sourceCommit??imported.revision,'4b6f0629ffedd99c5529882ed74341d9402e6ef0');
 }
 for(const path of ['public/optic-review','public/optic-comparison','public/atlas-review-viewer/scene.json'])assert.equal(existsSync(path),false,'Held geometry must not be public');
 assert.match(readFileSync('.local/optic-review/assets.ts','utf8'),/^import 'server-only';/);
 assert.match(readFileSync('components/SiteFrame.tsx','utf8'),/Source comparisons/);
 assert.match(readFileSync('app/workspace/atlas-review/source-comparisons/optic/page.tsx','utf8'),/authorizeClinicalReview/);
});
test('delivery rejects stale URLs, extra query keys, unknown paths, altered bytes and lifted holds',async()=>{
 const bytes='Synthetic source review',assets={'index.html':Buffer.from(bytes).toString('base64')};
 const fixture={purpose:'source-only-optic-alternative-review',reportSha256:'a'.repeat(64),admissions:0,clinicalValidation:false,sourceGeometryChanged:false,
  files:[{name:'index.html',bytes:Buffer.byteLength(bytes),sha256:sha(bytes)}]};
 const href='https://review.test'+base+'index.html?revision='+fixture.reportSha256;
 const call=(url=href,p=fixture,a=assets,method='GET')=>deliverOpticComparison(new Request(url,{method}),p,a);
 const good=await call();assert.equal(good.status,200);assert.equal(await good.text(),bytes);
 const head=await call(href,fixture,assets,'HEAD');assert.equal(head.status,200);assert.equal(await head.text(),'');
 for(const url of [href.replace('?revision=','?rev='),href+'&revision='+fixture.reportSha256,href+'&side=left',href.replace(fixture.reportSha256,'b'.repeat(64)),href.split('?')[0]])assert.equal((await call(url)).status,409);
 for(const path of ['manifest.json','../scene.json','app.js/extra'])assert.equal((await call('https://review.test'+base+path+'?revision='+fixture.reportSha256)).status,404);
 for(const delta of [{admissions:1},{clinicalValidation:true},{sourceGeometryChanged:true},{purpose:'learner'}])assert.equal((await call(href,{...fixture,...delta})).status,503);
 for(const a of [{},{'index.html':'!not base64'},{'index.html':Buffer.from(bytes+'changed').toString('base64')},{'index.html':Buffer.from('x'.repeat(bytes.length)).toString('base64')}])assert.equal((await call(href,fixture,a as typeof assets)).status,503);
 assert.equal((await call(href,{...fixture,files:[...fixture.files,...fixture.files]})).status,503);
 assert.equal((await call(href,fixture,assets,'POST')).status,405);
});
test('actual protected route: every asset checks current staff authority, bytes and report; no learner access', {timeout:120000},async()=>{
 const entry=`
  import * as route from './app/api/atlas-review/source-comparisons/optic/[asset]/route';
  export default {async fetch(request){
    globalThis.__opticTestHeaders=request.headers;
    return route[request.method]?.(request) ?? new Response('Read only',{status:405});
  }};`;
 const bundled=await build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'optic-route-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',external:['cloudflare:workers'],define:{'import.meta.env.DEV':'false'},
  plugins:[{name:'fixture-auth-context',setup(b){
   b.onResolve({filter:/^(next\/(headers|navigation)|server-only)$/},a=>({path:a.path,namespace:'fixture'}));
   b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='next/headers'?'export async function headers(){return globalThis.__opticTestHeaders;}':a.path==='next/navigation'?'export function redirect(){throw Error("Unexpected redirect");}':''}));
  }}]});
 const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve('.local/optic-route-fixture.mjs'),contents:bundled.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
 try{
  const db=await mf.getD1Database('DB');
  for(const sql of [
   'CREATE TABLE users (id TEXT PRIMARY KEY, external_subject TEXT NOT NULL, roles TEXT NOT NULL)',
   'CREATE TABLE account_security_profiles (user_id TEXT PRIMARY KEY, status TEXT NOT NULL)',
   'CREATE TABLE organizations (id TEXT PRIMARY KEY, status TEXT NOT NULL, created_at TEXT NOT NULL)',
   'CREATE TABLE organization_memberships (organization_id TEXT, user_id TEXT, role TEXT, status TEXT, PRIMARY KEY(organization_id,user_id))',
  ])await db.prepare(sql).run();
  await db.prepare("INSERT INTO organizations VALUES ('test-org','active','2026-01-01')").run();
  for(const [subject,roles,member] of [['reviewer','administrator','owner'],['learner','learner','learner'],['instructor','instructor','educator'],['admin-learner','administrator','learner']]){
   await db.prepare('INSERT INTO users VALUES (?,?,?)').bind('edu:'+subject,'sites:'+subject,roles).run();
   await db.prepare('INSERT INTO account_security_profiles VALUES (?,?)').bind('edu:'+subject,'active').run();
   await db.prepare('INSERT INTO organization_memberships VALUES (?,?,?,?)').bind('test-org','edu:'+subject,member,'active').run();
  }
  const call=(name:string,who:string|null='reviewer',method='GET',query='?revision='+packet.reportSha256)=>mf.dispatchFetch('https://review.test'+base+name+query,{method,headers:who?{'oai-authenticated-user-id':who,'oai-authenticated-user-email':who+'@test.invalid'}:{}});
  for(const file of packet.files){
   for(const method of ['GET','HEAD']){
    for(const who of [null,'unknown','learner','instructor','admin-learner']){
     const response=await call(file.name,who,method);assert.equal(response.status,who?403:401,file.name+' '+method+' '+who);
     assert.match(response.headers.get('cache-control')??'',/private, no-store/);
     assert(!response.headers.get('content-type')?.includes('javascript'));
     assert(!response.headers.has('content-length'),'No asset length exposed before authorization');
     await response.arrayBuffer();
    }
    const response=await call(file.name,'reviewer',method);assert.equal(response.status,200,await response.clone().text());
    assert.equal(response.headers.get('cross-origin-resource-policy'),'same-origin');
    // Miniflare's HTTP bridge removes Content-Length when applying compression.
    // Require the original-byte evidence headers for GET/HEAD and hash every GET.
    assert.equal(response.headers.get('x-source-asset-bytes'),String(file.bytes));
    assert.equal(response.headers.get('x-source-asset-sha256'),file.sha256);
    const raw=new Uint8Array(await response.arrayBuffer());
    if(method==='HEAD')assert.equal(raw.length,0);
    else{
     assert.equal(raw.length,file.bytes);assert.equal(sha(raw),file.sha256);
     if(file.name==='index.html'){
      const html=new TextDecoder().decode(raw);assert(html.includes('./app.js?revision='+packet.reportSha256));assert(html.includes('./THIRD_PARTY_NOTICES.txt?revision='+packet.reportSha256));
     }
     if(file.name==='scene.json'){
      const scene=JSON.parse(new TextDecoder().decode(raw));assert.equal(scene.reportSha256,packet.reportSha256);assert.equal(scene.admissions,0);assert.equal(scene.meshes.length,10);
      assert.deepEqual(scene.meshes.filter((m:any)=>m.role==='candidate').map((m:any)=>[m.id,m.side,m.held,m.sources[0].file]),
       [['FMA50875','right',true,'FJ1364'],['FMA50875','right',true,'FJ1819'],['FMA50878','left',true,'FJ1313'],['FMA50878','left',true,'FJ1772']]);
      for(const mesh of scene.meshes){const pin=packet.meshes.find((m:any)=>m.key===mesh.key);assert.equal(sha(JSON.stringify({vertices:mesh.vertices,faces:mesh.faces})),pin.geometrySha256);}
     }
     if(file.name==='THIRD_PARTY_NOTICES.txt')assert.match(new TextDecoder().decode(raw),/creativecommons.org\/licenses\/by\/4.0\/[\s\S]*MIT License/);
    }
   }
   for(const query of ['', '?revision='+('f'.repeat(64)), '?revision='+packet.reportSha256+'&revision='+packet.reportSha256])assert.equal((await call(file.name,'reviewer','GET',query)).status,409);
  }
  for(const name of ['manifest.json','unknown.obj','../index.html'])assert.equal((await call(name)).status,404);
  assert.equal((await call('scene.json','reviewer','POST')).status,405);
  // Already loaded HTML is not a capability: revocation blocks every later file.
  for(const [disable,restore] of [
   ["UPDATE users SET roles='learner' WHERE id='edu:reviewer'","UPDATE users SET roles='administrator' WHERE id='edu:reviewer'"],
   ["UPDATE account_security_profiles SET status='suspended' WHERE user_id='edu:reviewer'","UPDATE account_security_profiles SET status='active' WHERE user_id='edu:reviewer'"],
   ["UPDATE organization_memberships SET status='revoked' WHERE user_id='edu:reviewer'","UPDATE organization_memberships SET status='active' WHERE user_id='edu:reviewer'"],
   ["UPDATE organizations SET status='suspended'","UPDATE organizations SET status='active'"],
  ]){
   await db.prepare(disable).run();
   for(const file of packet.files)for(const method of ['GET','HEAD'])assert.equal((await call(file.name,'reviewer',method)).status,403,'Recheck revocation: '+file.name);
   await db.prepare(restore).run();
  }
  assert.equal((await db.prepare('SELECT count(*) AS n FROM users').first<{n:number}>())?.n,4,'Never provisions accounts');
  const tables=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%review%' ").all();assert.equal(tables.results.length,0,'No opinion/admission writes');
 }finally{await mf.dispose();}
});
