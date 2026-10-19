import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const packageSource=[new URL('../package.json',import.meta.url),new URL('../../../website/package.json',import.meta.url)]
  .find(url=>existsSync(fileURLToPath(url)));
assert(packageSource,'website package.json adjacent to canonical tests or parent of staging');
const require=createRequire(packageSource);
const ts=require('typescript');
const read=url=>readFileSync(new URL(url,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const originalBytes=read('./fixtures/vite-cache-original.ts.raw');
const isolatedBytes=read('./fixtures/vite-cache-isolated-epoch.ts.raw');
const candidateBytes=read('../vite.config.ts');
const original=originalBytes.toString('utf8');
const isolated=isolatedBytes.toString('utf8');
const candidate=candidateBytes.toString('utf8');
const cacheLine="    cacheDir: resolve(process.cwd(), '.local/vite-cache'),\n";

test('rollback deletes only the cacheDir line from the frozen installed source',()=>{
  assert.equal(sha(originalBytes),'ae714a7cbd5c873dfba3119210f6b0659ebb9061464d84cb22e32351147c5f1a');
  assert.equal(sha(isolatedBytes),'44007a6002a31fc997de5d8a57ca50e81eb88ebef5c1c78e002188d96c7345e1');
  assert.equal(isolated.split(cacheLine).length,2);
  assert.equal(candidate,isolated.replace(cacheLine,''));
  // The old fixture predates one trailing blank line; executable source is otherwise exact.
  assert.equal(candidate.replaceAll('\r\n','\n').trimEnd(),original.replaceAll('\r\n','\n').trimEnd());
  assert.doesNotMatch(candidate,/\bcacheDir\s*:/);
});

async function evaluate(source,root,command){
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},reportDiagnostics:true});
  assert.equal(compiled.diagnostics.length,0);
  const env={VM_LOCAL_PREVIEW_STABLE:'1',VM_LOCAL_HEAD_DIAGNOSTICS:'1'};
  const plugin=(name,options)=>({name,options});
  const stubs={
    '@openai/sites-vite-plugin':{sites:()=>plugin('sites',{})},
    '@tailwindcss/postcss':()=>plugin('tailwind-postcss',{}),
    vinext:()=>plugin('vinext',{}),
    vite:{defineConfig:value=>value,loadEnv:(mode,dir,prefix)=>({VM_LOCAL_HEAD_ROOT:prefix==='VM_LOCAL_HEAD_'?'synthetic-head':undefined,VM_LOCAL_REGIONAL_REVIEW_MANIFEST:prefix==='VM_LOCAL_REGIONAL_'?'synthetic-regional':undefined})},
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
  new Function('require','module','exports','process',compiled.outputText)(id=>{assert(Object.hasOwn(stubs,id),`Unexpected import: ${id}`);return stubs[id];},module,module.exports,{cwd:()=>root,env});
  return {config:await module.exports.default({mode:command==='serve'?'development':'production',command}),env};
}

test('current default config matches pre-cache serve/build behavior and retains boundaries',async()=>{
  for(const root of [resolve('F:/VisibleMedicine/staging/__rollback_a__'),resolve('F:/VisibleMedicine/staging/__rollback_b__')]){
    for(const command of ['serve','build']){
      const before=await evaluate(original,root,command);
      const after=await evaluate(candidate,root,command);
      assert.deepEqual(after,before);
      assert.equal(after.config.cacheDir,undefined);
      assert.deepEqual(after.config.plugins.map(item=>item.name),['local-head-atlas','local-regional-review','vinext','sites','cloudflare']);
      assert.equal(after.config.plugins.at(-1).options.viteEnvironment.name,'rsc');
      assert.deepEqual(after.config.plugins.at(-1).options.viteEnvironment.childEnvironments,['ssr']);
      assert.equal(after.config.server.host,'127.0.0.1');
      assert.equal(after.config.server.strictPort,true);
      assert.equal(after.config.define.__VM_LOCAL_HEAD_DIAGNOSTICS__,JSON.stringify(command==='serve'));
      assert.deepEqual(after.config.plugins.at(-1).options.config, before.config.plugins.at(-1).options.config);
    }
  }
});
