import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {atlasWorkerFirst,createDevelopmentModelGuard,localAtlasDevelopmentPlugin} from '../scripts/local-atlas-development-plugin.mjs';
const inventory=JSON.parse(fs.readFileSync('lib/atlas-model-inventory.json'));
const paths=inventory.models.flatMap(model=>model.paths),guard=createDevelopmentModelGuard(paths);
function check(url,method='GET'){
 const request={url,method,headers:{range:'bytes=0-9','if-none-match':'*'}};
 const headers={},response={statusCode:200,setHeader:(key,value)=>{headers[key]=value;},end:()=>{response.ended=true;}};
 let next=0;guard(request,response,()=>{next++;});return{request,response,headers,next};
}
test('build remains Worker-first; development uses the first explicit model guard',()=>{
 assert.equal(atlasWorkerFirst('build'),true);assert.equal(atlasWorkerFirst('serve'),false);
 for(const command of ['',undefined,'preview','production'])assert.throws(()=>atlasWorkerFirst(command));
 const plugin=localAtlasDevelopmentPlugin(paths);assert.equal(plugin.apply,'serve');assert.equal(plugin.enforce,'pre');
 let middleware;plugin.configureServer({middlewares:{use:value=>{middleware=value;}}});assert.equal(typeof middleware,'function');
 const config=fs.readFileSync('vite.config.ts','utf8');
 assert(config.indexOf('localAtlasDevelopmentPlugin(atlasModelInventory')<config.indexOf('localHeadAtlasPlugin({'));
 assert.match(config,/run_worker_first: atlasWorkerFirst\(command\)/);
});
test('every exact registered raw path reaches the existing API, preserving query/method and headers',()=>{
 assert.equal(paths.length,144);
 for(const path of paths)for(const method of ['GET','HEAD','POST']){
  const result=check(path+'?v=0123456789ab',method);assert.equal(result.next,1);assert(!result.response.ended);
  assert.equal(result.request.url,path.replace('/atlas-runtime/','/api/atlas-delivery/')+'?v=0123456789ab');
  assert.equal(result.request.method,method);assert.deepEqual(result.request.headers,{range:'bytes=0-9','if-none-match':'*'});
 }
});
test('registered API URLs are not rewritten or short-circuited before authorization',()=>{
 for(const path of paths){const url=path.replace('/atlas-runtime/','/api/atlas-delivery/');const result=check(url);assert.equal(result.next,1);assert.equal(result.request.url,url);assert(!result.response.ended);}
});
test('encoded, transformed, filesystem and unknown model aliases never reach Vite static serving',()=>{
 const path=paths[0];
 for(const value of [path.replace('.glb','%2eglb'),path.replace('.glb','%252eglb'),path.replace('.glb','%25252eglb'),
  path.replace('/atlas-runtime/','/%61tlas-runtime/'),path.replace('/atlas-runtime/','/%2561tlas-runtime/'),
  path.replace('.glb','.GLB'),path+'/',path+'/index.html','/@fs/F:/private/model.glb?import','/@id/model.glb?import',
  '/node_modules/model.glb?url','/unknown.glb',path.replace('/models/','/models/missing/'),'/api/atlas-delivery/unknown.glb']){
  const result=check(value);assert.equal(result.next,0,value);assert.equal(result.response.statusCode,404);assert(result.response.ended);
  assert.equal(result.headers['Cache-Control'],'private, no-store');assert.equal(result.headers['X-Content-Type-Options'],'nosniff');
 }
});
test('Vite modules, app CSS, pages and normal APIs retain their ordinary pipeline',()=>{
 for(const path of ['/@id/__x00__virtual:vite-rsc/entry-browser','/@vite/client','/components/HeadAtlasViewer.tsx','/app/globals.css',
  '/node_modules/.vite/deps/react.js?v=abc','/atlas/mri-head?concept=brainstem-pons','/api/studio/workbooks']){
  const result=check(path);assert.equal(result.next,1);assert.equal(result.request.url,path);assert(!result.response.ended);
 }
});
test('empty, duplicate and noncanonical model registries cannot create an unprotected guard',()=>{
 for(const value of [[],[paths[0],paths[0]],['/private/model.glb'],['/atlas-runtime/head-neck/models/%61.glb']])assert.throws(()=>createDevelopmentModelGuard(value));
});
