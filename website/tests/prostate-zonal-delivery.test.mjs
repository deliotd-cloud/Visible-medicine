import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {historicalProstateBuild as build} from './prostate-zonal-historical-context.mjs';

import {historicalProstateRead} from './prostate-zonal-historical-context.mjs';
const read=historicalProstateRead;
const json=p=>JSON.parse(read(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const root='public/atlas-runtime/head-neck/';
const review=json('atlas-review/manifest.json'),runtime=json(root+'manifest.json');
const revision=json('atlas-review/content/prostate-zones-revision.json');

test('prostate learner and Review use the same committed zonal source',()=>{
 assert.equal(runtime.sourceCommit,review.revision);
 assert.equal(revision.sha256,'bcb94d540dbcc011219aaeabd24dede3d9667eb6ff1470b66db52201354c0c7f');
 const atlas=process.env.VM_ATLAS_SOURCE_REPO;assert(atlas,'Explicit Atlas checkout required');
 const inputs=json(root+'source-inputs.json');
 for(const path of ['app/prostate-zones.tsx','app/prostate-zones.css','app/prostate-education-link.ts','lib/prostate-education-binding.ts','lib/prostate-zones.ts','lib/prostate-zone-geometry.ts','content/prostate-zones-revision.json']){
  const committed=execFileSync('git',['--no-replace-objects','-C',atlas,'show',review.revision+':'+path],{windowsHide:true});
  const imported=review.files.find(row=>row.path===path),learner=inputs.find(row=>row.path===path);
  assert(imported&&learner,path);assert.equal(sha(committed),imported.sourceSha256,path);
  assert.equal(sha(read('atlas-review/'+path)),imported.importedSha256,path);assert.equal(learner.sha256,imported.sourceSha256,path);
 }
 assert.equal(runtime.patientDataIncluded,false);assert.equal(runtime.clinicalApproved,false);
});

test('only pelvis and whole body expose the draft, without patient coordinates',async()=>{
 const bundle=await build({stdin:{contents:"export * from './atlas-review/lib/prostate-zones';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false});
 const api=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
 const scopes=runtime.regionalScopes.filter(scope=>scope.schematicStudies?.some(study=>study.key==='prostate-zones'));
 assert.deepEqual(scopes.map(s=>s.region).sort(),['pelvis','whole-body']);assert.equal(api.prostateZones.length,4);
 for(const scope of scopes){const study=scope.schematicStudies.find(s=>s.key==='prostate-zones');
  assert.equal(study.parentId,api.PROSTATE_PARENT_ID);assert.deepEqual(study.conceptIds,api.prostateZones.map(z=>z.id));
  assert.equal(study.sourceRevision,api.PROSTATE_ZONE_REVISION);assert.equal(study.clinicalReview,'pending');
  assert.equal(study.representation,'original-schematic');assert.equal(study.patientSpaceRegistration,null);assert.equal(study.license,'MIT');
 }
 for(const zone of api.prostateZones){const selection=api.prostateConceptSelection(zone.key);
  assert.equal(selection.conceptId,zone.id);assert.equal(selection.parentId,api.PROSTATE_PARENT_ID);
  assert.equal(selection.atlasRevision,revision.sha256);assert.equal(selection.patientSpaceRegistration,null);
  assert.equal(selection.coordinateFrame,'vm:prostate:schematic:local-v1');
  for(const field of ['worldPoint','voxel','seriesUid','caseId','transform'])assert.equal(field in selection,false);
 }
 assert.throws(()=>api.prostateConceptSelection('not-a-zone'));
});

test('zonal geometry remains distinct from the licensed outer-prostate model',()=>{
 const inventory=json('lib/atlas-model-inventory.json');
 assert(!inventory.models.some(model=>model.paths.some(path=>/prostate-zones/i.test(path))));
 assert.equal(revision.clinicalReview,'pending');assert.equal(revision.patientSpaceRegistration,null);
 const source=read('atlas-review/lib/prostate-zones.ts').toString();
 assert(source.includes('FJ3139'));assert(source.includes('FMA9600'));
 assert.equal(runtime.regionalScopes.find(s=>s.region==='pelvis').schematicStudies[0].representation,'original-schematic');
});

test('keyboard successor preserves zonal geometry and pins every displayed prostate dependency',()=>{
 const atlas=process.env.VM_ATLAS_SOURCE_REPO;assert(atlas);
 const committed=(rev,path)=>execFileSync('git',['--no-replace-objects','-C',atlas,'show',rev+':'+path],{windowsHide:true});
 const previous='df175264724a98ca4f70de19e1bfabd325084fdb';
 const formerZones=committed(previous,'lib/prostate-zones.ts').toString();
 const currentZones=committed(review.revision,'lib/prostate-zones.ts').toString();
 const formerImport="import revision from '../content/prostate-zones-revision.json';";
 assert.equal(formerZones.split(formerImport).length,2,'One former zonal revision import');
 assert.equal(currentZones,formerZones.replace(formerImport,"import revision from '../content/prostate-zones-revision.json' with { type: 'json' };"),'Zonal source changes only the JSON import syntax');
 assert.deepEqual(committed(review.revision,'lib/prostate-zone-geometry.ts'),committed(previous,'lib/prostate-zone-geometry.ts'),'lib/prostate-zone-geometry.ts');
 const renderer=json('atlas-review/content/body-renderer-revision.json');
 for(const path of ['app/prostate-zones.tsx','app/prostate-zones.css','app/prostate-education-link.ts','lib/prostate-education-binding.ts','lib/prostate-zones.ts','lib/prostate-zone-geometry.ts','content/prostate-zones-revision.json']){
  const row=renderer.dependencies.find(r=>r.path===path);assert(row,path);assert.equal(row.sha256,sha(committed(review.revision,path)),path);
 }
 assert.notEqual(renderer.sha256,JSON.parse(committed(previous,'content/body-renderer-revision.json')).sha256);
 for(const path of ['lib/camera-keyboard.ts','app/camera-keyboard.css']){
  const row=revision.inputs.find(r=>r.file===path);assert(row,path);assert.equal(row.sha256,sha(committed(review.revision,path)),path);
 }
 assert.notEqual(revision.sha256,JSON.parse(committed(previous,'content/prostate-zones-revision.json')).sha256);
});

// The four original cases above retain their exact focus-era delivery role.
import './prostate-zonal-current-cases.mjs';
