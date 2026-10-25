import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BASELINE_SHA256,CANDIDATE_SHA256,invertGuestCorePrerequisites} from './guest-core-prerequisites-source.mjs';

const root=process.env.VM_WEBSITE_ROOT??fileURLToPath(new URL('../',import.meta.url));
const ts=createRequire(path.join(root,'package.json'))('typescript');
const source=Object.fromEntries(Object.keys(BASELINE_SHA256).map(key=>[key,readFileSync(path.join(root,key),'utf8')]));
const sha=value=>createHash('sha256').update(value).digest('hex');

test('both complete production modules invert only the approved prerequisites to exact current source',()=>{
  for(const [name,body] of Object.entries(source)){
    assert.equal(sha(body),CANDIDATE_SHA256[name]);
    assert.equal(sha(invertGuestCorePrerequisites(body,name)),BASELINE_SHA256[name]);
    assert.throws(()=>invertGuestCorePrerequisites(body.replace('await ensureDatabase();','await ensureEducationUser(null);'),name),/guest core seam|outside/);
    assert.throws(()=>invertGuestCorePrerequisites(body+'// altered',name),/outside/);
  }
});

function fixture(name,{failCore=false,failPlatform=false}={}){
  const events=[];
  let identityCalls=0;
  let emailCalls=0;
  const coreError=new Error('synthetic core failure');
  const platformError=new Error('synthetic platform failure');
  const DB={prepare(sql){
    events.push('query');
    return {bind(){return {
      all:async()=>({success:true,results:[{count:1,window_start:new Date().toISOString()}]}),
      first:async()=>null,
      run:async()=>({success:true}),
    };}};
  }};
  const mocks={
    'cloudflare:workers':{env:{DB}},
    '@/db/bootstrap':{
      ensureDatabase:async()=>{events.push('core');if(failCore)throw coreError;},
      ensureEducationUser:async()=>{identityCalls++;throw Error('unexpected identity creation');},
      appendAudit:async()=>{identityCalls++;throw Error('unexpected audit');},
    },
    '@/db/platform':{
      ensurePlatformSchema:async()=>{events.push('platform');if(failPlatform)throw platformError;},
      getPlatformSnapshot:async()=>{throw Error('unexpected snapshot');},
    },
    '@/lib/auth':{},
    '@/lib/catalog':{atlasModules:[],findCourse:()=>null},
    '@/lib/domain':{sha256:async()=>{throw Error('unexpected hash');}},
    '@/lib/atlas-structure-search':{searchAtlasStructureLearning:()=>[]},
    '@/lib/search-kind':{filterSearchKind:()=>[],parseSearchKind:()=> 'all'},
    '@/lib/pilot-readiness':{normaliseEmail:()=> 'test@example.invalid',normaliseInvitationRole:()=> 'learner',parseRosterInput:()=>[],PILOT_READINESS_GATES:[],READINESS_STATUSES:[]},
    '@/lib/transactional-email':{
      emailProviderReadiness:()=>{emailCalls++;throw Error('unexpected email');},
      getEmailProviderConfig:()=>{emailCalls++;throw Error('unexpected email');},
      organizationInvitationEmail:()=>{emailCalls++;throw Error('unexpected email');},
      sendTransactionalEmail:()=>{emailCalls++;throw Error('unexpected email');},
    },
  };
  const output={};
  const code=ts.transpileModule(source[name],{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('exports','require',code)(output,key=>{assert(Object.hasOwn(mocks,key),key);return mocks[key];});
  return {output,events,coreError,platformError,identityCalls:()=>identityCalls,emailCalls:()=>emailCalls};
}
const calls=[
  ['lib/institution-operations.ts','enforceRateLimit',api=>api.enforceRateLimit('guest','pilot',1,60)],
  ['lib/institution-operations.ts','submitPilotApplication',api=>api.submitPilotApplication(null,{})],
  ['lib/platform-governance.ts','validateEmbedLaunch',api=>api.validateEmbedLaunch('bad','https://example.invalid')],
  ['lib/platform-governance.ts','verifyCertificate',api=>api.verifyCertificate('bad')],
];
test('actual-source repository functions require core before platform or queries, and core failures stop cleanly',async()=>{
  const prior=process.env.EMBED_SIGNING_SECRET;
  process.env.EMBED_SIGNING_SECRET='synthetic-test-secret';
  try{
    for(const [name,label,invoke] of calls){
      const failed=fixture(name,{failCore:true});
      await assert.rejects(invoke(failed.output),failed.coreError,label);
      assert.deepEqual(failed.events,['core'],label);
      assert.equal(failed.identityCalls(),0,label);
      assert.equal(failed.emailCalls(),0,label);
      const blocked=fixture(name,{failPlatform:true});
      await assert.rejects(invoke(blocked.output),blocked.platformError,label);
      assert.deepEqual(blocked.events,['core','platform'],label);
      assert.equal(blocked.identityCalls(),0,label);
      assert.equal(blocked.emailCalls(),0,label);
    }
  }finally{
    if(prior===undefined)delete process.env.EMBED_SIGNING_SECRET;
    else process.env.EMBED_SIGNING_SECRET=prior;
  }
});
test('valid rate-limit configuration reaches its unchanged query only after core and platform',async()=>{
  const f=fixture('lib/institution-operations.ts');
  await assert.rejects(f.output.enforceRateLimit('guest','pilot',0,60),error=>error.status===500);
  assert.deepEqual(f.events,[]);
  await f.output.enforceRateLimit('guest','pilot',1,60);
  assert.deepEqual(f.events,['core','platform','query']);
  assert.equal(f.identityCalls(),0);
  assert.equal(f.emailCalls(),0);
});
test('other guest validation outcomes retain the same bootstrap order and avoid identity or email work',async()=>{
  const pilot=fixture('lib/institution-operations.ts');
  await assert.rejects(pilot.output.submitPilotApplication(null,{}),error=>error.status===422);
  assert.deepEqual(pilot.events,['core','platform']);
  const cert=fixture('lib/platform-governance.ts');
  assert.equal(await cert.output.verifyCertificate('bad'),null);
  assert.deepEqual(cert.events,['core','platform']);
  const prior=process.env.EMBED_SIGNING_SECRET;
  process.env.EMBED_SIGNING_SECRET='synthetic-test-secret';
  try{
    const embed=fixture('lib/platform-governance.ts');
    await assert.rejects(embed.output.validateEmbedLaunch('bad','https://example.invalid'),error=>error.status===401);
    assert.deepEqual(embed.events,['core','platform']);
    assert.equal(embed.identityCalls(),0);
  }finally{
    if(prior===undefined)delete process.env.EMBED_SIGNING_SECRET;
    else process.env.EMBED_SIGNING_SECRET=prior;
  }
  for(const f of [pilot,cert]){assert.equal(f.identityCalls(),0);assert.equal(f.emailCalls(),0);}
});
