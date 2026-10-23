// Each current-role change retains the complete original test as an exact inverse.
import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-review-ui-website',site=stage+'/website',prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt),phase=process.argv[2],transitions=[];
function change(p,edits){const before=fs.readFileSync(site+'/'+p,'utf8');let after=before;for(const[a,b,n=1]of edits){assert.equal(after.split(a).length-1,n,p+' unique seam '+a);after=after.split(a).join(b);}let inverse=after;for(const[a,b,n=1]of [...edits].reverse()){assert.equal(inverse.split(b).length-1,n,p+' inverse');inverse=inverse.split(b).join(a);}assert.equal(inverse,before);transitions.push({path:p,beforeSha256:hash(site+'/'+p),edits,after});}
if(phase==='import')change('scripts/import-clinical-review.mjs',[[parent.atlasHead,prep.atlasHead]]);
else if(phase==='policy')change('lib/atlas-delivery-policy.ts',[[hash(parent.website+'/lib/atlas-model-inventory.json'),hash(site+'/lib/atlas-model-inventory.json')]]);
else if(phase==='admissions'){
 const cap=json(stage+'/CAPTURE.json');assert.equal(cap.sourceFiles,1579);assert.equal(cap.inputs,1748);
 change('tests/current-atlas-delivery.test.mjs',[[parent.atlasHead,prep.atlasHead,3],[parent.atlasTree,prep.atlasTree]]);
 change('tests/carpal-reasoning-current-delivery.test.mjs',[
  [`const currentSource = '${parent.atlasHead}';`,`const currentSource = '${prep.atlasHead}';`],
  [`const currentSourceTree = '${parent.atlasTree}';`,`const currentSourceTree = '${prep.atlasTree}';`],
  [`const currentSourceRoot = '${parent.atlas}';`,`const currentSourceRoot = '${prep.atlas}';`],
  ["const currentReceiptPath = 'F:/VisibleMedicine/staging/20261023-tour-reading/SOURCE_BOUND.json';",`const currentReceiptPath = '${prep.atlasReceipt}';`],
  ["const currentReceiptSha = '2d2a76bb1fae54be189ff2e4a02636c8352a37bb6ca59d13a52050c10c8f3cdb';",`const currentReceiptSha = '${prep.atlasReceiptSha256}';`],
  ['assert.equal(currentSourceReceipt.parent, source);',`const readerReceiptBytes = readFileSync('F:/VisibleMedicine/staging/20261023-tour-reading/SOURCE_BOUND.json');\nassert.equal(sha(readerReceiptBytes), '2d2a76bb1fae54be189ff2e4a02636c8352a37bb6ca59d13a52050c10c8f3cdb');\nconst readerReceipt = JSON.parse(readerReceiptBytes);\nassert.equal(readerReceipt.head, '${parent.atlasHead}');\nassert.equal(readerReceipt.parent, source);\nassert.equal(currentSourceReceipt.parent, readerReceipt.head);`],
 ]);
 // The full reader-introduction theorem remains9eac/parent5f; only transport roles advance.
 change('tests/tour-reading-current-delivery.test.mjs',[
  ["const source='9eac0806a7869cfae435010b013ae611d748c0c9';",`const currentSource='${prep.atlasHead}';\nconst currentTree='${prep.atlasTree}';\nconst currentReceipt='${prep.atlasReceipt}';\nconst currentReceiptSha='${prep.atlasReceiptSha256}';\nconst source='9eac0806a7869cfae435010b013ae611d748c0c9';`],
  ["assert.equal(json('atlas-review/manifest.json').revision,source);",`const currentBytes=readFileSync(currentReceipt);assert.equal(sha(currentBytes),currentReceiptSha);\n  const current=JSON.parse(currentBytes);assert.equal(current.head,currentSource);assert.equal(current.tree,currentTree);assert.equal(current.parent,source);\n  for(const name of ['app/tour-reading-notes.tsx','app/regional-guided-learning.tsx','app/regional-guided-learning.css','lib/regional-tours.ts'])assert.equal(sourceRow(current,name).sha256,sourceRow(next,name).sha256);\n  assert.equal(json('atlas-review/manifest.json').revision,currentSource);`],
  ['assert.equal(shared.sourceCommit,source);','assert.equal(shared.sourceCommit,currentSource);'],
  ["[['shoulder',source],","[['shoulder',currentSource],"],
  ['assert.equal(inputs.sourceCommit,source);','assert.equal(inputs.sourceCommit,currentSource);'],
  ['assert.equal(review.sourceCommit,source);','assert.equal(review.sourceCommit,currentSource);'],
 ]);
 // Preserve the proposal's stale-binding theorem at its actual old source; separately prove current admission.
 change('tests/compact-head-provenance.test.mjs',[
  ["test('the saved binding is intentionally not relabelled as admission for this unintegrated UI proposal',()=>{\n const binding=JSON.parse(read('atlas-review/integration-inputs.json'));",`test('historical UI proposal retains its refusal while the new binding admits exact current bytes',()=>{\n const oldRoot='F:/VisibleMedicine/staging/20261023-compact-head-provenance/website/';\n const binding=JSON.parse(readFileSync(oldRoot+'atlas-review/integration-inputs.json'));`],
  ["assert.equal(JSON.parse(read('public/atlas-review-viewer/manifest.json')).websiteIntegrationSha256,binding.sha256);",`assert.equal(JSON.parse(readFileSync(oldRoot+'public/atlas-review-viewer/manifest.json')).websiteIntegrationSha256,binding.sha256);\n const current=JSON.parse(read('atlas-review/integration-inputs.json'));\n assert.equal(current.sourceCommit,'${prep.atlasHead}');assert.notEqual(current.sha256,binding.sha256);\n assert.equal(current.sha256,sha(JSON.stringify(current.inputs)));\n for(const p of ['components/HeadAtlasViewer.tsx','components/head-atlas.css']){const row=current.inputs.find(r=>r.path===p);assert(row);assert.equal(sha(read(p)),row.sha256);}\n assert.equal(JSON.parse(read('public/atlas-review-viewer/manifest.json')).websiteIntegrationSha256,current.sha256);`],
 ]);
}else throw Error('Unknown phase');
const patch='*** Begin Patch\n'+transitions.map(r=>'*** Update File: '+site+'/'+r.path+'\n@@\n'+fs.readFileSync(site+'/'+r.path,'utf8').trimEnd().split('\n').map(l=>'-'+l).join('\n')+'\n'+r.after.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n').join('')+'*** End Patch';fs.writeFileSync(stage+'/PATCH_'+phase+'.json',JSON.stringify({at:new Date().toISOString(),phase,transitions,previewChanged:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({patch}));
