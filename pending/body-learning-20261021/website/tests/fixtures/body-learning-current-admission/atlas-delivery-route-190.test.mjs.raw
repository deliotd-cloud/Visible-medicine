import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test,{afterEach} from 'node:test';
import {build} from 'esbuild';

const root=fileURLToPath(new URL('../',import.meta.url));
const route=join(root,'app/api/atlas-delivery/[...asset]/route.ts');
const current=join(root,'lib/atlas-delivery-policy.ts');
const stale=fileURLToPath(new URL('./fixtures/atlas-delivery-policy-before-head-loading-20261017.txt',import.meta.url));
const inventory=join(root,'lib/atlas-model-inventory.json');
// Current admission is explicitly pinned, not inferred from whichever inventory
// happens to be on disk. Historical policy bytes remain independently frozen.
const admission=JSON.parse(readFileSync(new URL('./fixtures/current-atlas-delivery.json',import.meta.url),'utf8'));
const inventoryHash=admission.documents['lib/atlas-model-inventory.json'];
const stalePolicyHash='0f7266ac0acb13f666392218bf1455754cabe8a01a3d8f8a64dfe48e17592c65';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const url='https://atlas.test/api/atlas-delivery/head-neck/model.glb';
afterEach(()=>{delete globalThis.__vmRouteProbe;});

async function routeWith(policyPath,inventoryOverride=null){
  const stubs=new Map([
    ['cloudflare:workers',"export const env={DB:{},FILES:{}};"],
    ['@/app/chatgpt-auth',"export async function getChatGPTUser(){globalThis.__vmRouteProbe.push('user');return {userId:'edu:admin'};}"],
    ['@/lib/atlas-model-delivery',"export async function handleAtlasDelivery(request,models,files,authorize){globalThis.__vmRouteProbe.push(['models',models.length]);try{await authorize();return new Response(null,{status:204});}catch(error){globalThis.__vmRouteProbe.push(['error',error.message]);return new Response(null,{status:error.status||500});}}"],
    ['@/lib/atlas-delivery-access',"export async function authorizeAtlasDelivery(db,userId,policy){globalThis.__vmRouteProbe.push(['authorize',userId,policy.audience,policy.manifestRevision,Object.hasOwn(policy,'approvedRevision')]);}"],
    ['@/lib/atlas-model-storage',"export class AtlasModelError extends Error{constructor(message,status){super(message);this.status=status;}}"],
  ]);
  const output=await build({entryPoints:[route],bundle:true,write:false,platform:'node',format:'esm',plugins:[{
    name:'atlas-delivery-route-policy-probe',setup(plugin){
      plugin.onResolve({filter:/^(cloudflare:workers|@\/)/},args=>{
        if(args.path==='@/lib/atlas-model-inventory.json')return inventoryOverride
          ?{path:'forged-inventory',namespace:'route-probe-json'}:{path:inventory};
        if(args.path==='@/lib/atlas-delivery-policy')return {path:policyPath,namespace:'route-probe-policy'};
        assert(stubs.has(args.path),'Unexpected route dependency: '+args.path);
        return {path:args.path,namespace:'route-probe'};
      });
      plugin.onLoad({filter:/.*/,namespace:'route-probe'},args=>({contents:stubs.get(args.path),loader:'js'}));
      plugin.onLoad({filter:/.*/,namespace:'route-probe-policy'},args=>({contents:readFileSync(args.path,'utf8'),loader:'ts'}));
      plugin.onLoad({filter:/.*/,namespace:'route-probe-json'},()=>({contents:JSON.stringify(inventoryOverride),loader:'json'}));
    },
  }]});
  return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
}

function assertPinnedSources(){
  assert.equal(admission.schema,'vm-current-atlas-test-delivery-1');
  assert.match(admission.source,/^[a-f0-9]{40}$/);assert.match(inventoryHash,/^[a-f0-9]{64}$/);
  const raw=readFileSync(inventory);
  assert.equal(digest(raw),inventoryHash,'this test applies to the exact registered inventory');
  assert.deepEqual(raw,Buffer.from(JSON.stringify(JSON.parse(raw),null,2)+'\n'));
  assert(JSON.parse(raw).sources.every(source=>source.sourceCommit===admission.source),'source identity must match the explicit current admission');
  assert.equal(digest(readFileSync(stale)),stalePolicyHash,'stale fixture must remain the exact pre-head-loading policy');
  const source=readFileSync(route,'utf8');
  const mismatch=source.indexOf('revision !== ATLAS_DELIVERY_POLICY.manifestRevision');
  const downstream=source.indexOf('await authorizeAtlasDelivery(');
  assert(mismatch>=0&&downstream>mismatch,'the actual route must reject a mismatched inventory before downstream authorization');
}

async function exerciseBoth(module,expectedStatus){
  for(const method of ['GET','HEAD']){
    const response=await module[method](new Request(url,{method}));
    assert.equal(response.status,expectedStatus,`${method} status`);
  }
  return globalThis.__vmRouteProbe;
}

test('exact stale policy refuses GET and HEAD before administrator authorization',async()=>{
  assertPinnedSources();
  globalThis.__vmRouteProbe=[];
  const calls=await exerciseBoth(await routeWith(stale),503);
  assert.deepEqual(calls.filter(row=>Array.isArray(row)&&row[0]==='models').map(row=>row[1]),[137,137]);
  assert.equal(calls.filter(row=>Array.isArray(row)&&row[0]==='authorize').length,0);
  assert.equal(calls.filter(row=>Array.isArray(row)&&row[0]==='error'&&/policy does not match/.test(row[1])).length,2);
});

test('current route reaches private administrator review with exact inventory digest for GET and HEAD',async()=>{
  assertPinnedSources();
  globalThis.__vmRouteProbe=[];
  const calls=await exerciseBoth(await routeWith(current),204);
  assert.deepEqual(calls.filter(row=>Array.isArray(row)&&row[0]==='authorize'),[
    ['authorize','edu:admin','administrator-review',inventoryHash,false],
    ['authorize','edu:admin','administrator-review',inventoryHash,false],
  ]);
});

test('one-field forged inventory refuses GET and HEAD before authorization',async()=>{
  assertPinnedSources();
  const altered=structuredClone(JSON.parse(readFileSync(inventory,'utf8')));
  altered.sources[0].sourceCommit='0'.repeat(40);
  globalThis.__vmRouteProbe=[];
  const calls=await exerciseBoth(await routeWith(current,altered),503);
  assert.equal(calls.filter(row=>Array.isArray(row)&&row[0]==='authorize').length,0);
  assert.equal(calls.filter(row=>Array.isArray(row)&&row[0]==='error'&&/policy does not match/.test(row[1])).length,2);
});
