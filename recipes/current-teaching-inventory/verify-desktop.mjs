import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';

const root='G:/VisibleMedicine-temp/staging/20261031-head-desktop-scroll';
const website='F:/VisibleMedicine/website';
const observationPath=root+'/local-only/observations.json',o=json(observationPath);
const checks=[];
function check(name,test){test();checks.push(name);}
check('CT image wheel changes slice without moving the document',()=>{
  assert.equal(o.ct.before.slice,'67');assert.equal(o.ct.after.slice,'70');
  assert.equal(o.ct.before.width,1280);assert.equal(o.ct.before.height,720);
  assert.equal(o.ct.after.scrollTop,o.ct.before.scrollTop);assert.equal(o.ct.after.scrollLeft,o.ct.before.scrollLeft);
});
check('CT final slice remains at the boundary without page scrolling',()=>{
  assert.match(o.ct.boundarySet,/slice 199 of 199/);assert.equal(o.ct.boundary.slice,'199');
  assert.equal(o.ct.boundary.scrollTop,0);assert.equal(o.ct.boundary.scrollLeft,0);
});
check('CT skip link focuses the image viewer',()=>assert.match(o.ct.skip,/focused UI element is \d+ container Image viewer/));
check('CT to MRI retains the selected concept and the exact head revision',()=>{
  const match=o.ct.loaded.match(/Continue this anatomy on MRI, Value: (\S+)/);assert(match);
  const target=new URL('http://'+match[1]);assert.equal(target.pathname,'/atlas/mri-head');
  assert.equal(target.searchParams.get('concept'),'brainstem-pons');
  assert.match(target.searchParams.get('headRevision'),/^[a-f0-9]{64}$/);
  assert(o.mri.loaded.includes(target.href));
  assert.match(o.mri.loaded,/selected Pons/);
});
check('MRI image wheel changes slice without moving the document',()=>{
  assert.equal(o.mri.before.slice,'145');assert.equal(o.mri.after.slice,'148');
  assert.equal(o.mri.before.width,1280);assert.equal(o.mri.before.height,720);
  assert.equal(o.mri.after.scrollTop,o.mri.before.scrollTop);assert.equal(o.mri.after.scrollLeft,o.mri.before.scrollLeft);
});
check('MRI crosshair starts hidden and can be turned on and back off',()=>{
  assert.match(o.mri.settings,/Crosshair localizer, Value: 0/);
  assert.match(o.mri.on,/Crosshair localizer, Value: 1/);assert.match(o.mri.off,/Crosshair localizer, Value: 0/);
});
check('MRI first slice remains at the boundary without page scrolling',()=>{
  assert.match(o.mri.boundarySet,/slice 1 of 256/);assert.equal(o.mri.boundary.slice,'1');
  assert.equal(o.mri.boundary.scrollTop,0);assert.equal(o.mri.boundary.scrollLeft,0);
});
assert.equal(o.patientPixelsIncluded,false);assert.equal(o.localOnly,true);
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:website,encoding:'utf8'}).trim();
assert.equal(head,'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(hash(website+'/components/HeadAtlasViewer.tsx'),'4233e1fb1e3dcd961a4f5d8de19fa3bb4a21fdc200fafa7129eb6b7a6dd52d2c');
assert.equal(json(website+'/atlas-review/integration-inputs.json').sha256,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
const sourceFiles=['components/HeadAtlasViewer.tsx','lib/slice-wheel.mjs'].map(path=>({path,sha256:hash(website+'/'+path)}));
const result={schema:'vm-installed-head-desktop-verification/1',at:new Date().toISOString(),observedAt:o.at,website,head,sourceFiles,
  viewport:{width:1280,height:720},checks,passing:true,observation:{path:observationPath,sha256:hash(observationPath)},
  scope:'Actual installed localhost CT/MRI viewer only. This is not verification of the later staged candidate, other viewports, all routes, clinical accuracy or patient-space registration.',
  privateEvidenceLocalOnly:true,patientPixelsIncluded:false,reviewDecisionsWritten:false,sourceScansOrMasksChanged:false,temporaryTabClosed:true};
fs.writeFileSync(root+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checks:checks.length,passing:true,result:root+'/RESULT.json'}));
