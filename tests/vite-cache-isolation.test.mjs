import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,isAbsolute,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const packageSource=[new URL('../package.json',import.meta.url),
  new URL('../../../../website/package.json',import.meta.url)]
  .find(url=>existsSync(fileURLToPath(url)));
assert(packageSource,'website package.json adjacent to canonical tests or parent of staging');
const require=createRequire(packageSource);
const ts=require('typescript');
const priorBytes=readFileSync(new URL('./fixtures/vite-cache-original.ts.raw',import.meta.url));
assert.equal(createHash('sha256').update(priorBytes).digest('hex'),
  'ae714a7cbd5c873dfba3119210f6b0659ebb9061464d84cb22e32351147c5f1a');
const prior=priorBytes.toString('utf8');
// Closed prior configuration epoch: not a claim about the current runtime.
const stagedBytes=readFileSync(new URL('./fixtures/vite-cache-isolated-epoch.ts.raw',import.meta.url));
assert.equal(createHash('sha256').update(stagedBytes).digest('hex'),
  '44007a6002a31fc997de5d8a57ca50e81eb88ebef5c1c78e002188d96c7345e1');
const staged=stagedBytes.toString('utf8');
const syntheticParent=resolve(dirname(fileURLToPath(packageSource)),'..');
const checkouts=[resolve(syntheticParent,'__vite_cache_checkout_a__'),
  resolve(syntheticParent,'__vite_cache_checkout_b__')];
const compiled=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,
  target:ts.ScriptTarget.ES2022,esModuleInterop:true},reportDiagnostics:true});

async function evaluate(source,root,command){
  const output=compiled(source);assert.equal(output.diagnostics.length,0);
  const env={VM_LOCAL_PREVIEW_STABLE:'1',VM_LOCAL_HEAD_DIAGNOSTICS:'1'};
  const localProcess={cwd:()=>root,env};
  const plugin=(name,options)=>({name,options});
  const stubs={
    '@openai/sites-vite-plugin':{sites:()=>plugin('sites',{})},
    '@tailwindcss/postcss':()=>plugin('tailwind-postcss',{}),
    vinext:()=>plugin('vinext',{}),
    vite:{defineConfig:value=>value,loadEnv:(mode,dir,prefix)=>({
      VM_LOCAL_HEAD_ROOT:prefix==='VM_LOCAL_HEAD_'?'synthetic-head':undefined,
      VM_LOCAL_REGIONAL_REVIEW_MANIFEST:prefix==='VM_LOCAL_REGIONAL_'?'synthetic-regional':undefined,
    })},
    './scripts/local-head-atlas-plugin.mjs':{localHeadAtlasPlugin:options=>plugin('local-head-atlas',options)},
    './scripts/head-transfer-diagnostics.mjs':{headTransferDiagnosticsEnabled:(cmd,value)=>cmd==='serve'&&value==='1'},
    './scripts/local-regional-mri-review-plugin.mjs':{localRegionalMriReviewPlugin:options=>plugin('local-regional-review',options)},
    './scripts/local-preview-policy.mjs':{localPreviewServerOptions:options=>({host:'127.0.0.1',strictPort:true,options})},
    'node:path':require('node:path'),
    './lib/head-atlas-import.ts':{HEAD_MANIFEST_SHA256:'f'.repeat(64)},
    './.openai/hosting.json':{d1:'TEST_D1',r2:'TEST_R2'},
    '@cloudflare/vite-plugin':{cloudflare:options=>plugin('cloudflare',options)},
  };
  const module={exports:{}};
  new Function('require','module','exports','process',output.outputText)(id=>{
    assert(Object.hasOwn(stubs,id),`Unexpected config import: ${id}`);return stubs[id];
  },module,module.exports,localProcess);
  const factory=module.exports.default;
  assert.equal(typeof factory,'function');
  return {config:await factory({mode:command==='serve'?'development':'production',command}),env};
}

test('actual config factory isolates two synthetic checkouts sharing one dependency source',async()=>{
  assert.equal(typeof require('typescript').transpileModule,'function');
  const cachePaths=[];
  for(const root of checkouts)for(const command of ['serve','build']){
    const original=await evaluate(prior,root,command);
    const revised=await evaluate(staged,root,command);
    assert.equal(original.config.cacheDir,undefined);
    assert.equal(revised.config.cacheDir,resolve(root,'.local/vite-cache'));
    assert(isAbsolute(revised.config.cacheDir));
    const inside=relative(root,revised.config.cacheDir);
    assert(!inside.startsWith('..')&&!isAbsolute(inside));
    assert.equal(inside.replaceAll('\\','/'),'.local/vite-cache');
    cachePaths.push(revised.config.cacheDir);
    const {cacheDir,...rest}=revised.config;
    assert.deepEqual(rest,original.config);
    assert.deepEqual(revised.env,original.env);
  }
  assert.notEqual(cachePaths[0],cachePaths[2]);
});

test('the staged source is the exact canonical preimage plus one cacheDir entry',()=>{
  const normalized=value=>value.replaceAll('\r\n','\n').replace(/\n+$/,'\n');
  const original=normalized(prior);
  const expected=original.replace('  return {\n',
    "  return {\n    cacheDir: resolve(process.cwd(), '.local/vite-cache'),\n");
  assert.notEqual(expected,original);
  assert.equal(normalized(staged),expected);
});
