// Main-only synthetic diagnostic. Do not use production identity or storage.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';

const site='F:/VisibleMedicine/staging/20261025-abdominal-us-website/website';
const stage='F:/VisibleMedicine/staging/20261025-private-api-startup-diagnosis';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const targets={
 bone:{test:'head-ct-bone-decisions.test.ts',hash:'9e2bbba4e3d41a51be4ab75bee9558994c8ae0a22ae63c4b4a403ba38ebfab02',sourcefile:'ct-bone-decision-fixture.ts',url:'/fixture'},
 mri:{test:'head-mri-review-api.test.ts',hash:'b51ca41eae93fb339a4271ff7215db154343b833f01050d1ca2b1b75be9c9557',sourcefile:'head-mri-review-fixture.ts',url:'/__fixture'},
 paired:{test:'head-paired-decisions.test.ts',hash:'fcae301f591128d7be7c0cdee9606a7173dc35aa107c3164afcfb00bbc02bf37',sourcefile:'paired-decision-fixture.ts',url:'/fixture'},
};
const key=process.argv[2];assert(Object.hasOwn(targets,key),'Select bone, mri or paired');
assert.equal(path.resolve(process.cwd()),path.resolve(site),'Run from the sealed Website root');
for(const [file,hash]of [
 ['F:/VisibleMedicine/staging/20261025-abdominal-us-website/SOURCE_CANDIDATE.json','d1ad04d547ab70a392f3e3ad9f49a026e319abf5cbc0fca1bdd34aa45652490f'],
 ['F:/VisibleMedicine/staging/20261025-head-review-regression-batch/baseline/RESULT.json','0b3f9c06dccb1eb2190231e1a58deeb87ece5072a4b00f2d6c61b3cd4412dc6b'],
 [path.join(site,'vite.config.ts'),'9ea2e538c39d9220f214bbda10fdaab2ff0fc82b834ee83d8a8cfabd7fe1ff8b'],
 [path.join(site,'node_modules/miniflare/package.json'),'4b1683c950b3e87a45b985a72a9033a5297594430e3a7b7dc43dd90facbd70e1'],
 [path.join(site,'node_modules/wrangler/package.json'),'2acd581fd6f773f5d5e2aab1433bac9ff5b40d352d18786503dfdfa009823eb8'],
 [path.join(site,'node_modules/workerd/package.json'),'2185fb2603ae18644b0910ea884a2c9a161beb4c4a745dfc556b4efce2541c7e'],
 [path.join(site,'node_modules/esbuild/package.json'),'9d0bc453f4e791553c4cc2298ba023b409241fd9801e494741666eb0f6051490'],
])assert.equal(sha(readFileSync(file)),hash,`Changed diagnostic source: ${file}`);
const target=targets[key],source=readFileSync(path.join(site,'tests',target.test),'utf8');
assert.equal(sha(Buffer.from(source)),target.hash);
const entries=[...source.matchAll(/const entry=`([^`]*)`;/g)];
assert.equal(entries.length,1,'Require the one complete original synthetic Worker entry');
const entry=entries[0][1];assert(!entry.includes('${'),'No interpolated test entry');
assert(entry.includes("cloudflare:workers"));
assert(entry.includes('globalThis.__reviewTestHeaders=request.headers;'));

const require=createRequire(import.meta.url);
const {build}=require(path.join(site,'node_modules/esbuild'));
const {Miniflare,Log,LogLevel,convertV4MiniflareOptions}=require(
 path.join(site,'node_modules/miniflare'));
const bundled=await build({stdin:{contents:entry,resolveDir:site,sourcefile:target.sourcefile},
 bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',
 external:['cloudflare:workers'],define:{'import.meta.env.DEV':'false'},
 plugins:[{name:'test-headers',setup(b){
  b.onResolve({filter:/^next\/(headers|navigation)$/},a=>({path:a.path,namespace:'fixture'}));
  b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='next/headers'?
   'export async function headers(){return globalThis.__reviewTestHeaders;}':
   'export function redirect(){throw Error("Unexpected redirect");}'}));
 }}]});
const bundle=bundled.outputFiles[0].text;
assert(bundle.includes('globalThis.__reviewTestHeaders'),'Original synthetic entry lost');

const base=path.join(stage,'module-uris',key);
const module=(name,contents)=>({type:'ESModule',path:path.join(base,name),contents});
async function probe(label,modules,url){
 const result={label,phase:'construct',bundleSha256:label.startsWith('actual')?sha(Buffer.from(bundle)):null};
 let mf;
 try{
  mf=new Miniflare(convertV4MiniflareOptions({modules,compatibilityDate:'2026-08-23',
   d1Databases:['DB'],log:new Log(LogLevel.DEBUG)}));
  result.phase='database';await mf.getD1Database('DB');
  result.phase='fetch';
  const response=await mf.dispatchFetch(new Request('http://synthetic.invalid'+url));
  result.status=response.status;result.body=(await response.text()).slice(0,4000);
  result.phase='complete';
 }catch(error){result.error={name:error?.name??'Error',message:String(error?.message??error),
  stack:String(error?.stack??'').slice(0,12000)};}
 finally{if(mf)try{await mf.dispose();}catch(error){result.disposeError=String(error);}}
 return result;
}
const minimal=await probe('minimal',[module('entry.mjs',
 "export default {async fetch(){return new Response('minimal-ok')}};\n")],'/health');
const env=await probe('env-import',[module('entry.mjs',
 "import {env} from 'cloudflare:workers'; export default {async fetch(){return new Response(env.DB?'env-db-ok':'env-db-missing')}};\n")],'/health');
const results=[minimal,env];
if(minimal.phase==='complete'&&env.phase==='complete'){
 results.push(await probe('actual-top-level',[module('entry.mjs',bundle)],target.url));
 const deferred=`export default {async fetch(request){try{const actual=await import('./actual.mjs');return actual.default.fetch(request);}catch(error){return Response.json({name:error?.name??'Error',message:String(error?.message??error),stack:String(error?.stack??'').slice(0,12000)},{status:599});}}};`;
 results.push(await probe('actual-deferred-import',[
  module('entry.mjs',deferred),module('actual.mjs',bundle)],target.url));
}
process.stdout.write(JSON.stringify({schema:'vm-private-api-startup-probe/1',target:key,
 sourceSha256:target.hash,compatibilityDate:'2026-08-23',compatibilityFlags:[],
 installed:{miniflare:'5.20260820.0-alpha',workerd:'1.20260820.1',wrangler:'4.125.0'},
 bundleSha256:sha(Buffer.from(bundle)),results},null,2)+'\n');
