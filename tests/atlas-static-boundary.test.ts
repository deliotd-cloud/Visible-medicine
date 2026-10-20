import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {atlasDeliveryForwardUrl} from '../lib/atlas-model-delivery.ts';
import {isAtlasModelAssetRequest,isAtlasRuntimeStaticRequest,isFrameworkStaticRequest} from '../lib/atlas-static-boundary.ts';
import {contentSecurityPolicy} from '../lib/content-security-policy.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
assert.equal(source.split('import.meta.env.DEV').length,2);
// Vite supplies this production constant; never enable the local-demo fallback.
const compiled=ts.transpileModule(source.replace('import.meta.env.DEV','false'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function worker(){
 const appRequests:Request[]=[],assetRequests:Request[]=[];
 const app={fetch:async(request:Request)=>{appRequests.push(request);return new Response('protected app',{status:request.url.includes('/api/atlas-delivery/')?401:200,headers:{'Cache-Control':'private, no-store'}});}};
 const module={exports:{} as {default:{fetch:(request:Request,env:unknown,context:unknown)=>Promise<Response>}}};
 const modules:Record<string,unknown>={
  'vinext/server/image-optimization':{handleImageOptimization:()=>assert.fail('image optimizer not requested'),DEFAULT_DEVICE_SIZES:[],DEFAULT_IMAGE_SIZES:[]},
  'vinext/server/app-router-entry':{default:app},
  '../lib/content-security-policy':{contentSecurityPolicy},
  '../lib/atlas-model-delivery':{atlasDeliveryForwardUrl},
  '../lib/atlas-static-boundary':{isAtlasModelAssetRequest,isAtlasRuntimeStaticRequest,isFrameworkStaticRequest},
 };
 new Function('require','module','exports',compiled)((id:string)=>{assert(Object.hasOwn(modules,id),'Unexpected import: '+id);return modules[id];},module,module.exports);
 const env={ASSETS:{fetch:async(request:Request)=>{assetRequests.push(request);const url=new URL(request.url);return new Response(null,{status:307,headers:{Location:url.pathname.replace(/index\.html$/,'')+url.search,'Cache-Control':'public, max-age=0'}});}}};
 return {appRequests,assetRequests,fetch:(request:Request)=>module.exports.default.fetch(request,env,{waitUntil:()=>{},passThroughOnException:()=>assert.fail('No fail-open pass-through')})};
}

test('every registered raw model path uses the existing API before any static read',async()=>{
 const inventory=JSON.parse(readFileSync(new URL('../lib/atlas-model-inventory.json',import.meta.url),'utf8'));
 let paths=0;
 for(const model of inventory.models)for(const path of model.paths)for(const method of ['GET','HEAD']){
  const h=worker(),request=new Request('https://atlas.example'+path+'?v='+model.sha256.slice(0,12),{method,headers:{Range:'bytes=0-9','If-None-Match':'"synthetic"'}});
  const response=await h.fetch(request);assert.equal(response.status,401);assert.equal(h.assetRequests.length,0);assert.equal(h.appRequests.length,1);
  const forwarded=h.appRequests[0];assert.equal(new URL(forwarded.url).pathname,path.replace('/atlas-runtime/','/api/atlas-delivery/'));
  assert.equal(new URL(forwarded.url).search,new URL(request.url).search);assert.equal(forwarded.method,method);assert.equal(forwarded.headers.get('Range'),'bytes=0-9');assert.equal(forwarded.headers.get('If-None-Match'),'"synthetic"');paths++;
 }
 assert.equal(paths,288);
});
test('encoded, case-variant and otherwise noncanonical model names never fall through to assets',async()=>{
 const base='/atlas-runtime/head-neck/models/bodyparts3d/full-body/head-neck-skeleton.glb';
 for(const path of [base.replace('.glb','%2eglb'),base.replace('.glb','%252eglb'),base.replace('head-neck/models','he%61d-neck/models'),base.replace('/atlas-runtime/','/%61tlas-runtime/'),base.replace('full-body/','full-body%2f'),base.replace('.glb','.GLB'),base+'/',base.replace('head-neck/models','foreign/models')]){
  const h=worker(),response=await h.fetch(new Request('https://atlas.example'+path));
  assert([401,404].includes(response.status),path);assert.equal(h.assetRequests.length,0,path);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');
 }
});

test('direct registered-delivery API requests still reach authorization, not the static-alias refusal',async()=>{
 const inventory=JSON.parse(readFileSync(new URL('../lib/atlas-model-inventory.json',import.meta.url),'utf8'));
 for(const model of inventory.models)for(const path of model.paths)for(const method of ['GET','HEAD']){
  const h=worker(),apiPath=path.replace('/atlas-runtime/','/api/atlas-delivery/');
  const request=new Request('https://atlas.example'+apiPath+'?v='+model.sha256,{method,headers:{Range:'bytes=0-9'}});
  const response=await h.fetch(request);assert.equal(response.status,401);assert.equal(h.appRequests.length,1);assert.equal(h.appRequests[0],request);assert.equal(h.assetRequests.length,0);
 }
});
test('static runtime documents retain Cloudflare default-document queries, with no app redirect',async()=>{
 const h=worker(),request=new Request('https://atlas.example/atlas-runtime/head-neck/index.html?region=thorax&study=x%2Fy&revision=17',{method:'HEAD'});
 const response=await h.fetch(request);assert.equal(h.appRequests.length,0);assert.equal(h.assetRequests[0],request);
 assert.equal(response.headers.get('Location'),'/atlas-runtime/head-neck/?region=thorax&study=x%2Fy&revision=17');assert.equal(response.headers.get('X-Frame-Options'),'SAMEORIGIN');
});
test('ordinary app and API routes do not read the static binding first',async()=>{
 for(const path of ['/','/atlas/3d','/workspace/clinical-review-inbox','/api/atlas/search?q=example.glb']){
  const h=worker();await h.fetch(new Request('https://atlas.example'+path));assert.equal(h.appRequests.length,1);assert.equal(h.assetRequests.length,0);
 }
 assert.equal(isAtlasRuntimeStaticRequest(new URL('https://atlas.example/atlas-runtime/head-neck/index.html'),'POST'),false);
});

test('public framework chunks and styles remain readable without model or app fall-through',async()=>{
 for(const path of ['/_next/static/chunks/framework-example.js','/_next/static/css/site-example.css'])for(const method of ['GET','HEAD']){
  const h=worker();await h.fetch(new Request('https://atlas.example'+path,{method}));assert.equal(h.assetRequests.length,1);assert.equal(h.appRequests.length,0);
 }
 for(const path of ['/_next/static/model.glb','/_next/static/model%2eglb']){
  const h=worker();const response=await h.fetch(new Request('https://atlas.example'+path));assert.equal(response.status,404);assert.equal(h.assetRequests.length,0);assert.match(response.headers.get('Cache-Control')??'',/private.*no-store/);
 }
 assert.equal(isFrameworkStaticRequest(new URL('https://atlas.example/_next/static/css/site.css'),'POST'),false);
 assert.equal(isFrameworkStaticRequest(new URL('https://atlas.example/_next/private/server.js'),'GET'),false);
});
test('model classification is bounded, path-only, nonmutating and rejects nested aliases',()=>{
 for(const path of ['/a.glb','/a%2eglb','/a%252eglb','/a%25252eglb']){const u=new URL('https://atlas.example'+path),before=u.href;assert.equal(isAtlasModelAssetRequest(u),true);assert.equal(u.href,before);}
 assert.equal(isAtlasModelAssetRequest(new URL('https://atlas.example/atlas?query=a.glb')),false);
 assert.equal(isAtlasModelAssetRequest(new URL('https://atlas.example/normal.json')),false);
 assert.equal(isAtlasModelAssetRequest(new URL('https://atlas.example/bad%zz')),false);
 let nested='.';for(let i=0;i<12;i++)nested=encodeURIComponent(nested).replace(/\./g,'%2e');
 assert.equal(isAtlasModelAssetRequest(new URL('https://atlas.example/a'+nested+'glb')),true);
});
test('the actual Vite Worker configuration binds assets and always runs the Worker first',()=>{
 const text=readFileSync(new URL('../vite.config.ts',import.meta.url),'utf8'),ast=ts.createSourceFile('vite.config.ts',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 let config:ts.ObjectLiteralExpression|undefined;
 function visit(node:ts.Node){if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='localBindingConfig'&&node.initializer&&ts.isObjectLiteralExpression(node.initializer))config=node.initializer;ts.forEachChild(node,visit);}visit(ast);assert(config);
 const assets=config.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(ast)==='assets');assert(assets&&ts.isPropertyAssignment(assets)&&ts.isObjectLiteralExpression(assets.initializer));
 const props=new Map(assets.initializer.properties.filter(ts.isPropertyAssignment).map(p=>[p.name.getText(ast),p.initializer.getText(ast)]));
 assert.equal(props.get('binding'),"'ASSETS'");assert.equal(props.get('run_worker_first'),'true');
});
