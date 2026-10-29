import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { dirname, resolve, join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { collectRenderedPackages } from '../scripts/review-license-notices.mjs';

const site=fileURLToPath(new URL('../',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
function fixture(t){
  const root=fs.mkdtempSync(join(tmpdir(),'review-generator-'));
  t.after(()=>{const target=fs.realpathSync(root),base=fs.realpathSync(tmpdir());
    assert.equal(target,resolve(root));assert(target.startsWith(base+sep));
    assert.match(target.slice(base.length+1),/^review-generator-[^\\/]+$/);
    fs.rmSync(target,{recursive:true,force:true});});
  const put=(p,text)=>{const dest=join(root,p);fs.mkdirSync(dirname(dest),{recursive:true});fs.writeFileSync(dest,text);return dest;};
  const pkg=(copy,name,version)=>{const directory=join(copy,'node_modules',name);
    put(join(directory,'package.json'),JSON.stringify({name,version,license:'MIT'}));
    put(join(directory,'LICENSE'),name+' '+version+' copyright notice.');
    return join(root,directory,'index.js');};
  return {root,put,pkg};
}
const bundle=(...ids)=>({'viewer.js':{type:'chunk',modules:Object.fromEntries(ids.map(id=>[id,{renderedLength:1}]))}});

test('authenticated earlier collector loses one version; current collector preserves both',t=>{
  const f=fixture(t),a=f.pkg('a','example','1.0.0'),b=f.pkg('b','example','2.0.0');
  const old=fs.readFileSync(join(site,'tests/fixtures/review-license-notices.before.mjs.raw'),'utf8');
  assert.equal(sha(old),'ff794e14a3c95e0404f114d364db370a9ef6059cf0dc90c34f004bf9d856cfc4');
  const start=old.indexOf('    const modules = '),end=old.indexOf("  } }, { name: 'review-framework-boundary'");
  assert(start>0&&end>start);
  const legacy=new Map();
  new Function('bundle','packages','dirname','resolve','existsSync','readFileSync',old.slice(start,end))(
    bundle(a,b),legacy,dirname,resolve,fs.existsSync,fs.readFileSync);
  assert.equal(legacy.size,1);assert.equal(legacy.get('example').version,'2.0.0');
  assert.equal(collectRenderedPackages(bundle(a,b)).length,2);
});

test('query suffixes, repeated chunks, assets and virtual modules do not create false packages',t=>{
  const f=fixture(t),a=f.pkg('a','example','1.0.0');
  const input=bundle(a+'?v=test','\0'+a);
  input.other={type:'chunk',modules:{[a]:{renderedLength:2}}};
  input.asset={type:'asset',source:'not a module'};
  const rows=collectRenderedPackages(input);
  assert.equal(rows.length,1);assert.equal(rows[0].directories.length,1);
});

function mockBuild(f,ids){
  f.put('bundle.json',JSON.stringify(bundle(...ids)));
  f.put('atlas-review/manifest.json',JSON.stringify({revision:'synthetic-atlas',websiteIntegrationSha256:'synthetic-binding'}));
  f.put('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','Existing synthetic project notice.');
  return f.put('loader.mjs',`import {registerHooks} from 'node:module';
    const virtual={vite:'export async function build(options){const fs=await import("node:fs");const assert=(await import("node:assert/strict")).default;assert.equal(options.publicDir,false);assert.equal(options.base,"/atlas-review-viewer/");assert.equal(options.build.sourcemap,false);for(const p of options.plugins)if(p.generateBundle)p.generateBundle({},JSON.parse(fs.readFileSync("bundle.json")));fs.mkdirSync("public/atlas-review-viewer/assets",{recursive:true});fs.writeFileSync("public/atlas-review-viewer/index.html","synthetic index");fs.writeFileSync("public/atlas-review-viewer/assets/viewer.js","synthetic bundle");}',
    '@vitejs/plugin-react':'export default ()=>({name:"synthetic-react-adapter"});',
    '@tailwindcss/postcss':'export default ()=>({});'};
    registerHooks({resolve(s,c,next){return Object.hasOwn(virtual,s)?{url:'synthetic:'+s,shortCircuit:true}:next(s,c);},
    load(u,c,next){return u.startsWith('synthetic:')?{format:'module',source:virtual[u.slice(10)],shortCircuit:true}:next(u,c);}});`);
}
for(const debug of [false,true])test(`actual generator emits version-specific notices and unchanged metadata (${debug?'debug':'production'}; synthetic bundler)`,t=>{
  const f=fixture(t),a=f.pkg('a','example','1.0.0'),b=f.pkg('b','example','2.0.0'),loader=mockBuild(f,[b,a]);
  const run=spawnSync(process.execPath,['--import',pathToFileURL(loader).href,join(site,'scripts/build-clinical-review-viewer.mjs'),...(debug?['--debug']:[])],{cwd:f.root,encoding:'utf8',windowsHide:true,timeout:20000});
  assert.equal(run.status,0,run.stderr);assert.equal(run.signal,null);
  const manifest=JSON.parse(fs.readFileSync(join(f.root,'public/atlas-review-viewer/manifest.json')));
  assert.deepEqual(Object.keys(manifest).sort(),['sourceCommit','websiteIntegrationSha256','mode','files','packages','personalRecordsIncluded','modelDelivery'].sort());
  assert.equal(manifest.sourceCommit,'synthetic-atlas');assert.equal(manifest.websiteIntegrationSha256,'synthetic-binding');
  assert.equal(manifest.mode,debug?'debug':'production');assert.equal(manifest.personalRecordsIncluded,false);
  assert.equal(manifest.modelDelivery,'existing-protected-inventory');
  assert.deepEqual(manifest.packages,[{name:'example',version:'1.0.0',license:'MIT'},{name:'example',version:'2.0.0',license:'MIT'}]);
  const notice=fs.readFileSync(join(f.root,'public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt'),'utf8');
  for(const version of ['1.0.0','2.0.0'])assert(notice.includes('example '+version+' copyright notice.'));
  assert(notice.includes('Existing synthetic project notice.'));
  for(const file of manifest.files)assert.equal(file.sha256,sha(fs.readFileSync(join(f.root,'public/atlas-review-viewer',file.path))));
});

test('actual generator rejects Next before emitting a success manifest (synthetic bundler)',t=>{
  const f=fixture(t),loader=mockBuild(f,[f.pkg('a','next','15.0.0')]);
  const run=spawnSync(process.execPath,['--import',pathToFileURL(loader).href,join(site,'scripts/build-clinical-review-viewer.mjs')],{cwd:f.root,encoding:'utf8',windowsHide:true,timeout:20000});
  assert.notEqual(run.status,0);assert.match(run.stderr,/Next\.js must not be bundled/);
  assert(!fs.existsSync(join(f.root,'public/atlas-review-viewer/manifest.json')));
});

test('stock binding logic includes helper bytes and invalidates the renderer when they change',()=>{
  const original=fs.readFileSync(join(site,'scripts/bind-clinical-review.mjs'),'utf8');
  const executable=original.replace(/^import .*;\r?\n/gm,'');
  assert(!executable.includes('import '));
  const run=helper=>{
    const output=new Map();
    const readFileSync=p=>{
      if(p==='atlas-review/manifest.json')return JSON.stringify({revision:'synthetic-atlas',files:[]});
      if(p==='atlas-review/content/body-renderer-revision.json')return JSON.stringify({sha256:'native-body'});
      if(p==='atlas-review/content/review-revisions.json')return JSON.stringify({revisions:{example:{geometry:'native-geometry',teaching:null}}});
      if(p==='scripts/review-license-notices.mjs')return helper;
      return 'Synthetic bound source: '+p;
    };
    vm.runInNewContext(executable,{readFileSync,writeFileSync:(p,b)=>output.set(p,b),readdirSync:()=>[],createHash,structuredClone,console:{log(){}}});
    return Object.fromEntries([...output].map(([p,b])=>[p,JSON.parse(b)]));
  };
  const before=run('helper version A'),after=run('helper version B');
  const receipt=before['atlas-review/integration-inputs.json'];
  assert.equal(receipt.inputs.find(r=>r.path==='scripts/review-license-notices.mjs')?.sha256,sha('helper version A'));
  assert.notEqual(receipt.sha256,after['atlas-review/integration-inputs.json'].sha256);
  assert.notEqual(before['atlas-review/content/body-renderer-revision.json'].sha256,after['atlas-review/content/body-renderer-revision.json'].sha256);
  assert.notEqual(before['atlas-review/content/review-revisions.json'].revisions.example.geometry,after['atlas-review/content/review-revisions.json'].revisions.example.geometry);
  assert.equal(after['atlas-review/content/review-revisions.json'].revisions.example.teaching,null);
});
