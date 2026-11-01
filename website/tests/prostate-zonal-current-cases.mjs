import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const json=p=>JSON.parse(read(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const native='0d9750af66d92aa5a421b34ac6d0c8dd3e5bfd66';
const currentRevision='70b6c0b4065dd2a9d550bece8574efee24dd535af5c4f0fbced3324a04f6f70e';
const base='public/atlas-runtime/head-neck/';
const atlas=process.env.VM_ATLAS_SOURCE_REPO;
assert(atlas,'Explicit Atlas checkout required');
const committed=(rev,path)=>execFileSync('git',['--no-replace-objects','-C',atlas,'show',rev+':'+path],{windowsHide:true});
const review=json('atlas-review/manifest.json'),runtime=json(base+'manifest.json');
const revision=json('atlas-review/content/prostate-zones-revision.json');
const inputs=json(base+'source-inputs.json');
const renderer=json('atlas-review/content/body-renderer-revision.json');

function assertCurrentIdentity(r=review,run=runtime,z=revision){
 assert.equal(r.revision,native,'Exact current native source');
 assert.equal(run.sourceCommit,native,'Exact current learner source');
 assert.equal(z.sha256,currentRevision,'Exact orientation-era zonal source');
 assert.equal(z.clinicalReview,'pending');assert.equal(z.patientSpaceRegistration,null);
 assert.equal(run.patientDataIncluded,false);assert.equal(run.clinicalApproved,false);
}

test('four focus-era prostate cases retain every original assertion with only two read-context seams',()=>{
 const prefix='tests/fixtures/prostate-zonal-focus/';
 const original=read(prefix+'prostate-zonal-delivery.test.mjs.raw');
 assert.equal(sha(original),'1cb20d1828d0273834d1334591c68c497e2958192dc937ff746e5fcc82eabd67');
 const before="const read=p=>readFileSync(new URL('../'+p,import.meta.url));";
 const after="import {historicalProstateRead} from './prostate-zonal-historical-context.mjs';\nconst read=historicalProstateRead;";
 const buildBefore="import {build} from 'esbuild';";
 const buildAfter="import {historicalProstateBuild as build} from './prostate-zonal-historical-context.mjs';";
 const suffix="\n// The four original cases above retain their exact focus-era delivery role.\nimport './prostate-zonal-current-cases.mjs';\n";
 const source=original.toString().replaceAll('\r\n','\n');
 assert.equal(source.split(before).length,2);
 assert.equal(source.split(buildBefore).length,2);
 assert.equal(sha(read('tests/prostate-zonal-historical-context.mjs')),'9ee0f92de8f5107c4f207395993edef641a019e1e7cc367f944242b1e7e256e6','Exact inert transport and strict historical bundler adapter');
 const expected=source.replace(before,after).replace(buildBefore,buildAfter)+suffix;
 assert.equal(read('tests/prostate-zonal-delivery.test.mjs').toString().replaceAll('\r\n','\n'),expected);
 assert.equal((source.match(/^test\(/gm)||[]).length,4);
});

test('current prostate native, imported Review, runtime inputs and renderer bind every current dependency',()=>{
 assertCurrentIdentity();
 const pin=json('tests/fixtures/current-atlas-delivery.json');
 assert.equal(pin.source,native);assert.equal(pin.runtimeSources['head-neck'],native);
 for(const path of ['atlas-review/manifest.json',base+'manifest.json',base+'source-inputs.json'])
  assert.equal(sha(read(path)),pin.documents[path],'Current delivery pin: '+path);
 const paths=[...revision.inputs.map(row=>row.file),'content/prostate-zones-revision.json','content/body-renderer-revision.json'];
 assert.equal(new Set(paths).size,paths.length,'No duplicated current inputs');
 for(const path of paths){
  const bytes=committed(native,path),digest=sha(bytes);
  const imported=review.files.filter(row=>row.path===path),learner=inputs.filter(row=>row.path===path);
  assert.equal(imported.length,1,path);
  const nonExecutable=['LICENSES/prostate-zones-original.md','docs/PROSTATE_ZONES.md','content/body-renderer-revision.json'].includes(path);
  assert.equal(learner.length,nonExecutable?0:1,'Runtime executable inputs: '+path);
  assert.equal(imported[0].sourceSha256,digest,path);
  assert.equal(sha(read('atlas-review/'+path)),imported[0].importedSha256,path);
  if(!nonExecutable)assert.equal(learner[0].sha256,digest,path);
  const zonal=revision.inputs.find(row=>row.file===path);
  if(zonal)assert.equal(zonal.sha256,digest,'Current zonal dependency: '+path);
  // Documentation/licence are source-bound above; every displayed dependency is renderer-bound too.
  if(!['LICENSES/prostate-zones-original.md','docs/PROSTATE_ZONES.md','content/body-renderer-revision.json'].includes(path)){
   const row=renderer.dependencies.filter(row=>row.path===path);
   assert.equal(row.length,1,'Renderer dependency: '+path);assert.equal(row[0].sha256,digest,path);
  }
 }
 // The saved renderer record is checked at export, rather than consumed by the
 // learner module graph. Bind the actual generator/auditor/export gate bytes.
 const gates=['integration/module-audit.mjs','integration/head-neck/vite.config.mjs',
  'scripts/export-head-neck-module.mjs','scripts/require-body-renderer-seal.mjs','scripts/body-renderer-revisions.mjs'];
 for(const path of gates){
  const rows=inputs.filter(row=>row.path===path);assert.equal(rows.length,1,path);
  assert.equal(rows[0].sha256,sha(committed(native,path)),'Runtime generator/export gate: '+path);
 }
 const gateSource=Object.fromEntries(gates.map(path=>[path,committed(native,path).toString()]));
 const audit=gateSource['integration/module-audit.mjs'];
 assert(audit.includes('for (const id of this.getModuleIds())'));
 assert(audit.includes('...extraInputs'));
 assert(audit.includes("fileName:'source-inputs.json'"));
 const config=gateSource['integration/head-neck/vite.config.mjs'];
 for(const path of ['scripts/require-body-renderer-seal.mjs','scripts/body-renderer-revisions.mjs'])assert(config.includes("'"+path+"'"));
 const exporter=gateSource['scripts/export-head-neck-module.mjs'];
 assert(exporter.includes("import {requireBodyRendererSeal} from './require-body-renderer-seal.mjs';"));
 assert.equal(exporter.split('requireBodyRendererSeal();').length,2);
 assert(exporter.indexOf('requireBodyRendererSeal();')<exporter.indexOf('for(const [from,name]of copies)'));
 const gate=gateSource['scripts/require-body-renderer-seal.mjs'];
 assert(gate.includes("[command,'--check']"));assert(gate.includes('result.status!==0'));
 const generator=gateSource['scripts/body-renderer-revisions.mjs'];
 assert(generator.includes("if (process.argv.includes('--check'))"));
 assert(generator.includes("(await readFile(destination, 'utf8')).replace("));
 assert(generator.includes("'Body renderer revision is stale; regenerate and require re-review'"));
 assert(generator.includes("sha256: sha(JSON.stringify(dependencies))"));
 const nativeRenderer=JSON.parse(committed(native,'content/body-renderer-revision.json'));
 assert.equal(nativeRenderer.sha256,sha(JSON.stringify(nativeRenderer.dependencies)),'Exact native renderer dependency seal');
 assert.equal(renderer.sourceRendererSha256,nativeRenderer.sha256,'Imported Review retains native renderer seal');
 assert.equal(renderer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(renderer.sha256,sha(JSON.stringify({source:nativeRenderer.sha256,website:review.websiteIntegrationSha256})),'Exact website-bound Review renderer seal');
 assert.throws(()=>assertCurrentIdentity({...review,revision:'7d3ab00f500a738d4f2d261ca6cd768e7f6ce1bc'}));
 assert.throws(()=>assertCurrentIdentity(review,{...runtime,sourceCommit:'7d3ab00f500a738d4f2d261ca6cd768e7f6ce1bc'}));
 assert.throws(()=>assertCurrentIdentity(review,runtime,{...revision,sha256:'bcb94d540dbcc011219aaeabd24dede3d9667eb6ff1470b66db52201354c0c7f'}));
 assert.throws(()=>assertCurrentIdentity(review,runtime,{...revision,clinicalReview:'approved'}));
 assert.throws(()=>assertCurrentIdentity(review,runtime,{...revision,patientSpaceRegistration:{}}));
});

test('current zones remain pelvis/whole-body-only schematic concepts with no patient coordinates',async()=>{
 const bundle=await build({stdin:{contents:"export * from './atlas-review/lib/prostate-zones';",resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false});
 const api=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
 const scopes=runtime.regionalScopes.filter(scope=>scope.schematicStudies?.some(study=>study.key==='prostate-zones'));
 assert.deepEqual(scopes.map(s=>s.region).sort(),['pelvis','whole-body']);assert.equal(api.prostateZones.length,4);
 for(const scope of scopes){
  const studies=scope.schematicStudies.filter(s=>s.key==='prostate-zones');assert.equal(studies.length,1);
  const study=studies[0];assert.equal(study.parentId,api.PROSTATE_PARENT_ID);
  assert.deepEqual(study.conceptIds,api.prostateZones.map(z=>z.id));
  assert.equal(study.sourceRevision,currentRevision);assert.equal(api.PROSTATE_ZONE_REVISION,currentRevision);
  assert.equal(study.clinicalReview,'pending');assert.equal(study.representation,'original-schematic');
  assert.equal(study.patientSpaceRegistration,null);assert.equal(study.license,'MIT');
 }
 for(const zone of api.prostateZones){const selection=api.prostateConceptSelection(zone.key);
  assert.equal(selection.conceptId,zone.id);assert.equal(selection.parentId,api.PROSTATE_PARENT_ID);
  assert.equal(selection.atlasRevision,currentRevision);assert.equal(selection.patientSpaceRegistration,null);
  assert.equal(selection.representation,'original-schematic');assert.equal(selection.coordinateFrame,'vm:prostate:schematic:local-v1');
  for(const field of ['worldPoint','voxel','seriesUid','caseId','transform'])assert.equal(field in selection,false);
 }
 assert.throws(()=>api.prostateConceptSelection('not-a-zone'));
 const inventory=json('lib/atlas-model-inventory.json');
 assert(!inventory.models.some(model=>model.paths.some(path=>/prostate-zones/i.test(path))));
 const source=read('atlas-review/lib/prostate-zones.ts').toString();assert(source.includes('FJ3139'));assert(source.includes('FMA9600'));
});

test('current orientation successor still satisfies the complete keyboard-era geometry theorem',()=>{
 const previous='df175264724a98ca4f70de19e1bfabd325084fdb';
 const former=committed(previous,'lib/prostate-zones.ts').toString();
 const importBefore="import revision from '../content/prostate-zones-revision.json';";
 assert.equal(former.split(importBefore).length,2);
 assert.equal(committed(native,'lib/prostate-zones.ts').toString(),former.replace(importBefore,"import revision from '../content/prostate-zones-revision.json' with { type: 'json' };"));
 assert.deepEqual(committed(native,'lib/prostate-zone-geometry.ts'),committed(previous,'lib/prostate-zone-geometry.ts'));
 for(const path of ['lib/camera-keyboard.ts','app/camera-keyboard.css']){
  const row=revision.inputs.find(row=>row.file===path);assert(row,path);assert.equal(row.sha256,sha(committed(native,path)));
 }
 assert.notEqual(renderer.sha256,JSON.parse(committed(previous,'content/body-renderer-revision.json')).sha256);
 assert.notEqual(revision.sha256,JSON.parse(committed(previous,'content/prostate-zones-revision.json')).sha256);
});
