import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,readdirSync,rmSync,realpathSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve,join,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {requireBodyRendererSeal} from './require-body-renderer-seal.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('body delivery gate invokes the unchanged generator in read-only check mode and fails closed',()=>{
  const calls=[];
  const run=(program,args,options)=>{calls.push({program,args,options});return {status:0,signal:null,error:undefined};};
  requireBodyRendererSeal({root,run});
  assert.equal(calls.length,1);
  assert.equal(calls[0].program,process.execPath);
  assert.deepEqual(calls[0].args,[resolve(root,'scripts/body-renderer-revisions.mjs'),'--check']);
  assert.equal(calls[0].options.cwd,root);
  for(const failure of [{status:1,signal:null,stderr:'stale'},
    {status:null,signal:'SIGTERM'}, {status:null,error:new Error('checker unavailable')}])
    assert.throws(()=>requireBodyRendererSeal({root,run:()=>failure}),/Body renderer revision is stale/);
});

test('body export and normal typecheck require freshness before content work',()=>{
  const source=readFileSync(resolve(root,'scripts/export-content.mjs'),'utf8');
  const guard=source.indexOf("if(scope==='body')requireBodyRendererSeal();");
  assert(guard>source.indexOf("const scope ="));
  assert(guard<source.indexOf('await contentContext()'));
  assert(guard<source.indexOf('writeFile(target'));
  const scripts=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8')).scripts;
  assert(scripts.typecheck.startsWith('node scripts/body-renderer-revisions.mjs --check && '));
  assert(scripts['body-decisions:test'].startsWith('node scripts/body-renderer-revisions.mjs --check && '));
});

test('head-neck delivery binds the gate as an input and checks after preflight before the first write',()=>{
  const source=readFileSync(resolve(root,'scripts/export-head-neck-module.mjs'),'utf8');
  const binding=source.indexOf("'scripts/require-body-renderer-seal.mjs'");
  const preflight=source.indexOf('await assertExportSpace(target,copies)');
  const guard=source.indexOf('requireBodyRendererSeal();');
  const firstWrite=source.indexOf('await mkdir(');
  assert(binding>0&&binding<preflight);
  assert(preflight>0&&preflight<guard&&guard<firstWrite);
  assert(guard<source.indexOf('await copyFile('));
  assert(guard<source.indexOf("await writeFile(join(target,'manifest.json')"));
  const config=readFileSync(resolve(root,'integration/head-neck/vite.config.mjs'),'utf8');
  assert(config.includes("'scripts/require-body-renderer-seal.mjs'"),
    'Generated runtime source-inputs must bind the gate source');
});

test('real renderer generator accepts a sealed fixture, then rejects stale source without writes',t=>{
  const base=realpathSync(tmpdir()),fixture=mkdtempSync(join(base,'renderer-seal-gate-'));
  t.after(()=>{
    const target=realpathSync(fixture),inside=relative(base,target);
    assert(inside.startsWith('renderer-seal-gate-')&&!inside.includes(sep)&&!inside.startsWith('..'));
    rmSync(target,{recursive:true,force:true});
  });
  const put=(name,source)=>{const target=resolve(fixture,name);assert(!relative(fixture,target).startsWith('..'));
    mkdirSync(resolve(target,'..'),{recursive:true});writeFileSync(target,source);};
  put('app/body-explorer.tsx',"import {orientation} from './orientation'; export const body=orientation;\n");
  put('app/orientation.ts',"export const orientation='original';\n");
  put('app/layout.tsx','export default function Layout(){return null;}\n');
  put('app/globals.css',':root{color:black}\n');
  put('vite.config.ts','export default {};\n');
  put('package.json','{"private":true}\n');
  put('package-lock.json','{"lockfileVersion":3}\n');
  put('scripts/compress-model-delivery.mjs','export const codec=true;\n');
  put('scripts/glb-lossless-codec.mjs','export const lossless=true;\n');
  mkdirSync(resolve(fixture,'content'),{recursive:true});
  const generator=resolve(root,'scripts/body-renderer-revisions.mjs');
  const generated=spawnSync(process.execPath,[generator],{cwd:fixture,encoding:'utf8',windowsHide:true});
  assert.equal(generated.status,0,generated.stderr);
  const seal=JSON.parse(readFileSync(resolve(fixture,'content/body-renderer-revision.json'),'utf8'));
  assert(seal.dependencies.some(row=>row.path==='app/orientation.ts'));
  assert.doesNotThrow(()=>requireBodyRendererSeal({root:fixture,generator}));
  const snapshot=(directory,prefix='')=>Object.fromEntries(readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const name=prefix+entry.name,absolute=join(directory,entry.name);
    return entry.isDirectory()?Object.entries(snapshot(absolute,name+'/')):[[name,sha(readFileSync(absolute))]];
  }));
  const before=snapshot(fixture);
  put('app/orientation.ts',"export const orientation='changed';\n");
  assert.throws(()=>requireBodyRendererSeal({root:fixture,generator}),/Body renderer revision is stale/);
  const after=snapshot(fixture);
  assert.deepEqual(Object.keys(after).sort(),Object.keys(before).sort(),'failed check creates no files');
  for(const path of Object.keys(before).filter(path=>path!=='app/orientation.ts'))
    assert.equal(after[path],before[path],`failed check rewrote ${path}`);
});

test('the exact current source seal controls the real read-only gate',()=>{
  const seal=JSON.parse(readFileSync(resolve(root,'content/body-renderer-revision.json'),'utf8'));
  assert.equal(seal.scope,'root-body-renderer');
  assert.equal(seal.schemaVersion,1);
  assert.equal(seal.sha256,sha(JSON.stringify(seal.dependencies)));
  const mismatches=seal.dependencies.filter(row=>{
    const file=resolve(root,row.path);
    return !existsSync(file)||sha(readFileSync(file,'utf8').replaceAll('\r\n','\n'))!==row.sha256;
  });
  if(mismatches.length)assert.throws(()=>requireBodyRendererSeal({root}),/Body renderer revision is stale/);
  else assert.doesNotThrow(()=>requireBodyRendererSeal({root}));
});
