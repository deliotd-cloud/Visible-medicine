import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {assertHeadStudySetCurrentDisplay} from './head-study-set-current-display.mjs';import {assertCurrentTourSource} from './adjacent-current-tour-source-role.mjs';import {readHistoricalSource} from './head-study-set-historical-source.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),stage='F:/VisibleMedicine/staging/20261024-head-study-set-website',read=p=>readFileSync(root+'/'+p),sha=b=>createHash('sha256').update(b).digest('hex');
function invert(text,old,next){assert.equal(text.split(next).length,2,'exact single adapter seam');return text.replace(next,old);}
test('the complete older source admission and every historical test body reconstruct exactly',()=>{
 const prep=JSON.parse(readFileSync(stage+'/PREPARATION.json'));
 let tour=read('tests/adjacent-current-tour-source-role.mjs').toString();for(const[old,next]of prep.sourceRoleSeams)tour=invert(tour,old,next);assert.equal(tour,readHistoricalSource('tests/adjacent-current-tour-source-role.mjs').toString());
 const edits={
  'tests/native-slice-commit-scope.test.mjs':[
   ['',"import {readHistoricalSource} from './head-study-set-historical-source.mjs';\n"],
   ["  let current=normal(read('../components/HeadAtlasViewer.tsx'));","  let current=normal(readHistoricalSource('components/HeadAtlasViewer.tsx').toString());"]
  ],
  'tests/native-slice-website-composition.test.mjs':[
   ["import {fileURLToPath} from 'node:url';\n",''],
   ['',"import {historicalWebsiteRoot,readHistoricalSource} from './head-study-set-historical-source.mjs';\n"],
   ["// This is a current-source proof. Fixed historical epoch tests retain their own inputs.\nconst site=fileURLToPath(new URL('../',import.meta.url));","// This proves the exact native-slice Website epoch, which is historical to its successor.\nconst site=historicalWebsiteRoot;"],
   ['const bytes=(root,path)=>readFileSync(resolve(root,path));','const bytes=(root,path)=>root===site?readHistoricalSource(path):readFileSync(resolve(root,path));']
  ],
  'tests/native-slice-display-epoch.test.mjs':[
   ["import {fileURLToPath} from 'node:url';",''],
   ['',"import {historicalWebsiteRoot,readHistoricalSource} from './head-study-set-historical-source.mjs';\n"],
   ["const root=fileURLToPath(new URL('../',import.meta.url)),stage=",'const root=historicalWebsiteRoot,stage='],
   ["read=p=>readFileSync(root+'/'+p)",'read=p=>readHistoricalSource(p)']
  ]
 };
 for(const[file,seams]of Object.entries(edits)){
  let text=read(file).toString();for(const[old,next]of seams)if(next)text=invert(text,old,next);
  // Deleted imports are restored at their exact original neighbours.
  if(file==='tests/native-slice-website-composition.test.mjs')text=text.replace("import {resolve} from 'node:path';","import {fileURLToPath} from 'node:url';\nimport {resolve} from 'node:path';");
  if(file==='tests/native-slice-display-epoch.test.mjs')text=text.replace("import {assertNativeSliceCurrentDisplay}","import {fileURLToPath} from 'node:url';import {assertNativeSliceCurrentDisplay}");
  assert.equal(text,readHistoricalSource(file).toString(),file+': every original assertion retained');
 }
 assertCurrentTourSource();
});
test('new exact display validator is derived without weakening a single old check',()=>{
 const prep=JSON.parse(readFileSync(stage+'/PREPARATION.json')),row=prep.generatedExactCurrentProofs.find(r=>r.to==='tests/head-study-set-current-display.mjs');assert(row);
 let text=read(row.to).toString();assert.equal(sha(Buffer.from(text)),row.sha256);for(const[old,next]of [...row.seams].reverse())text=invert(text,old,next);assert.equal(text,readHistoricalSource(row.from).toString());
});
test('current display refuses unrelated, stale, extra-approval and private-output mutations',()=>{
 const manifest=JSON.parse(read('atlas-review/manifest.json')),binding=JSON.parse(read('atlas-review/integration-inputs.json'));assertHeadStudySetCurrentDisplay({root,manifest,binding});
 const fake=structuredClone(binding);fake.inputs[0].sha256='f'.repeat(64);fake.sha256=sha(Buffer.from(JSON.stringify(fake.inputs)));assert.throws(()=>assertHeadStudySetCurrentDisplay({root,manifest,binding:fake}));
 const previous=JSON.parse(readHistoricalSource('atlas-review/integration-inputs.json'));assert.throws(()=>assertHeadStudySetCurrentDisplay({root,manifest,binding:previous}));
 for(const[p,change]of [['atlas-review/content/body-renderer-revision.json',v=>({...v,clinicalApproved:true})],['atlas-review/content/review-revisions.json',v=>({...v,approvalsInherited:true})],['public/atlas-review-viewer/manifest.json',v=>({...v,personalRecordsIncluded:true})]]){
  const readMutated=file=>file===p?Buffer.from(JSON.stringify(change(JSON.parse(read(file))))):read(file);assert.throws(()=>assertHeadStudySetCurrentDisplay({root,manifest,binding,read:readMutated}),p);
 }
});
test('new current composition proof retains all previous checks with only explicit parent/proposal operands changed',()=>{
 const prep=JSON.parse(readFileSync(stage+'/PREPARATION.json')),row=prep.generatedExactCurrentProofs.find(r=>r.to==='tests/head-study-set-website-composition.test.mjs');assert(row);let text=read(row.to).toString();assert.equal(sha(Buffer.from(text)),row.sha256);for(const[old,next]of [...row.seams].reverse())text=invert(text,old,next);assert.equal(text,readHistoricalSource(row.from).toString());
});
