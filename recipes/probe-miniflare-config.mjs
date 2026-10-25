// Main-only, synthetic Miniflare configuration controls. No application import.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';

const website='F:/VisibleMedicine/staging/20261025-abdominal-us-website/website';
const stage='F:/VisibleMedicine/staging/20261025-miniflare-minimal-configuration-proposal';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(path.resolve(process.cwd()),path.resolve(website),'Use the sealed Website working directory');
for(const [file,hash]of [
 ['F:/VisibleMedicine/staging/20261025-abdominal-us-website/SOURCE_CANDIDATE.json','d1ad04d547ab70a392f3e3ad9f49a026e319abf5cbc0fca1bdd34aa45652490f'],
 ['F:/VisibleMedicine/staging/20261025-private-api-startup-probe-bone/RESULT.json','a12bacbb4411dff5a3cde939d58037697a8c65a5915438d35ec4dcb5a2752052'],
 [path.join(website,'node_modules/miniflare/package.json'),'4b1683c950b3e87a45b985a72a9033a5297594430e3a7b7dc43dd90facbd70e1'],
 [path.join(website,'node_modules/workerd/package.json'),'2185fb2603ae18644b0910ea884a2c9a161beb4c4a745dfc556b4efce2541c7e'],
 [path.join(website,'node_modules/wrangler/package.json'),'2acd581fd6f773f5d5e2aab1433bac9ff5b40d352d18786503dfdfa009823eb8'],
 [path.join(website,'node_modules/miniflare/README.md'),'d39958016f54f3b2b9204737b85a3706008d0bc3c18c3ca688150ac6fbb531f8'],
 [path.join(website,'node_modules/miniflare/dist/src/index.js'),'d15a3b400d159c6f12b828e196d4790875ecd6dc210e27b39134aaa60d6696be'],
 [path.join(website,'vite.config.ts'),'9ea2e538c39d9220f214bbda10fdaab2ff0fc82b834ee83d8a8cfabd7fe1ff8b'],
])assert.equal(sha(readFileSync(file)),hash,`Changed source: ${file}`);
const runName=process.argv[2];
assert(/^[a-z0-9][a-z0-9-]{0,48}$/.test(runName??''),'Supply a short new run name');
const output=path.join(stage,'runs',runName);
assert(!existsSync(output),'Create-only diagnostic run name');
mkdirSync(output,{recursive:true});
const moduleRoot=path.join(output,'module-root');mkdirSync(moduleRoot);
const fileModule=path.join(moduleRoot,'worker-file.mjs');
const moduleSource="export default {async fetch(){return new Response('module-ok')}};\n";
writeFileSync(fileModule,moduleSource,{flag:'wx'});
const require=createRequire(import.meta.url);
const {Miniflare,Log,LogLevel,convertV4MiniflareOptions}=require(path.join(website,'node_modules/miniflare'));
assert(typeof process.env.TEMP==='string'&&path.isAbsolute(process.env.TEMP),
 'The original tests require an absolute TEMP path');
const originalTemp=path.resolve(process.env.TEMP,'vm-miniflare-config-only.mjs');
const compatibilityDate='2026-08-23';
const esm=(modulePath,withContents=true)=>[{type:'ESModule',path:modulePath,
 ...(withContents?{contents:moduleSource}:{})}];
const controls=[
 {id:'legacy-inline-no-db',options:{script:"addEventListener('fetch',event=>event.respondWith(new Response('legacy-ok')));",compatibilityDate}},
 {id:'legacy-inline-with-db',options:{script:"addEventListener('fetch',event=>event.respondWith(new Response('legacy-ok')));",compatibilityDate,d1Databases:['DB']}},
 {id:'esm-inline-no-db',options:{modules:true,script:moduleSource,compatibilityDate}},
 {id:'esm-inline-with-db',options:{modules:true,script:moduleSource,compatibilityDate,d1Databases:['DB']}},
 {id:'original-temp-contents-with-db',options:{modules:esm(originalTemp),compatibilityDate,d1Databases:['DB']}},
 {id:'temp-root-contents-with-db',options:{modules:esm(originalTemp),modulesRoot:path.dirname(originalTemp),compatibilityDate,d1Databases:['DB']}},
 {id:'stage-root-contents-with-db',options:{modules:esm(path.join(moduleRoot,'worker-contents.mjs')),modulesRoot:moduleRoot,compatibilityDate,d1Databases:['DB']}},
 {id:'stage-root-real-file-with-db',options:{modules:esm(fileModule,false),modulesRoot:moduleRoot,compatibilityDate,d1Databases:['DB']}},
];
async function probe(control){
 const result={id:control.id,phase:'convert'};
 let mf;
 try{
  const converted=convertV4MiniflareOptions({...control.options,log:new Log(LogLevel.DEBUG)});
  result.manifest={mainModule:converted.workers?.[0]?.manifest?.mainModule,
   modulesRoot:converted.workers?.[0]?.manifest?.modulesRoot};
  result.phase='construct';mf=new Miniflare(converted);
  if(control.options.d1Databases){result.phase='database';await mf.getD1Database('DB');}
  result.phase='fetch';const response=await mf.dispatchFetch('http://synthetic.invalid/');
  result.status=response.status;result.body=(await response.text()).slice(0,256);
  result.phase='complete';
 }catch(error){result.error={name:error?.name??'Error',message:String(error?.message??error),
  stack:String(error?.stack??'').slice(0,6000)};}
 finally{if(mf)try{await mf.dispose();}catch(error){result.disposeError=String(error);}}
 return result;
}
const results=[];
for(const control of controls){
 const result=await probe(control);results.push(result);
 // An inline Worker failing without D1 makes later path/D1 comparisons inconclusive.
 if(control.id==='legacy-inline-no-db'&&result.phase!=='complete')break;
}
const receipt={schema:'vm-miniflare-minimal-config-probe/1',runName,compatibilityDate,
 sourceCandidateSha256:'d1ad04d547ab70a392f3e3ad9f49a026e319abf5cbc0fca1bdd34aa45652490f',
 originalTemp,siteRoot:website,moduleSourceSha256:sha(Buffer.from(moduleSource)),results,
 syntheticOnly:true,originalTestsChanged:false};
writeFileSync(path.join(output,'RESULT.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
process.stdout.write(JSON.stringify({result:path.join(output,'RESULT.json'),controls:results.map(r=>({id:r.id,phase:r.phase,error:r.error?.name??null,mainModule:r.manifest?.mainModule}))})+'\n');
