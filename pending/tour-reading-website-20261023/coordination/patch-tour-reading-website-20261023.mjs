// Emits an apply_patch payload; full inverse checks preserve all historical assertions.
import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-tour-reading-website',site=stage+'/website',prep=json(stage+'/PREPARATION.json'),parent=json(prep.parentReceipt),phase=process.argv[2],transitions=[];
function change(p,edits){const before=fs.readFileSync(site+'/'+p,'utf8');let after=before;for(const[a,b,n=1]of edits){assert.equal(after.split(a).length-1,n,p+' unique seam '+a);after=after.split(a).join(b);}let inverse=after;for(const[a,b,n=1]of [...edits].reverse()){assert.equal(inverse.split(b).length-1,n,p+' inverse seam');inverse=inverse.split(b).join(a);}assert.equal(inverse,before);transitions.push({path:p,beforeSha256:hash(site+'/'+p),edits,after});}
if(phase==='policy')change('lib/atlas-delivery-policy.ts',[[hash(parent.website+'/lib/atlas-model-inventory.json'),hash(site+'/lib/atlas-model-inventory.json')]]);
else if(phase==='admissions'){
 const cap=json(stage+'/CAPTURE.json');assert.equal(cap.sourceFiles,1579);assert.equal(cap.inputs,1748);
 change('tests/current-atlas-delivery.test.mjs',[[parent.atlasHead,prep.atlasHead,3],[parent.atlasTree,prep.atlasTree],['assert.equal(sourceFiles,1578);assert.equal(inputs,1747);','assert.equal(sourceFiles,1579);assert.equal(inputs,1748);']]);
 change('tests/regional-tour-entry-delivery.test.mjs',[['assert.equal(binding.inputs.length,1747);','assert.equal(binding.inputs.length,1748);']]);
 // The carpal introduction theorem remains source5f/parentbe9. Only its current-delivery roles advance.
 change('tests/carpal-reasoning-current-delivery.test.mjs',[
  ["const priorSource = 'be9b53d96c37f1ea973e60f5981ad80db0893177';",`const currentSource = '${prep.atlasHead}';\nconst currentSourceTree = '${prep.atlasTree}';\nconst currentSourceRoot = '${prep.atlas}';\nconst currentReceiptPath = '${prep.atlasReceipt}';\nconst currentReceiptSha = '${prep.atlasReceiptSha256}';\nconst priorSource = 'be9b53d96c37f1ea973e60f5981ad80db0893177';`],
  ['const sourceReceipt = JSON.parse(sourceReceiptBytes);',`const sourceReceipt = JSON.parse(sourceReceiptBytes);\nconst currentReceiptBytes = readFileSync(currentReceiptPath);\nassert.equal(sha(currentReceiptBytes), currentReceiptSha);\nconst currentSourceReceipt = JSON.parse(currentReceiptBytes);\nassert.equal(currentSourceReceipt.head, currentSource);\nassert.equal(currentSourceReceipt.tree, currentSourceTree);\nassert.equal(currentSourceReceipt.parent, source);\nconst currentGit = path => execFileSync('git', ['show', currentSource + ':' + path], {\n  cwd: currentSourceRoot, windowsHide: true, maxBuffer: 32e6,\n  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},\n});`],
  ['assert.equal(pin.source, source);','assert.equal(pin.source, currentSource);'],
  ['assert.equal(pin.sourceTree, sourceTree);','assert.equal(pin.sourceTree, currentSourceTree);'],
  ['assert.equal(pin.runtimeSources[module], source);','assert.equal(pin.runtimeSources[module], currentSource);'],
  ['assert.equal(review.revision, source);','assert.equal(review.revision, currentSource);'],
  ['assert.equal(viewer.sourceCommit, source);','assert.equal(viewer.sourceCommit, currentSource);'],
  ['assert.equal(manifest.sourceCommit, source);','assert.equal(manifest.sourceCommit, currentSource);'],
  ['const sourceRow = sourceReceipt.sourceRows.find(row => row.path === input.path);','const sourceRow = currentSourceReceipt.sourceRows.find(row => row.path === input.path);'],
  ['const authored = git(source, path);',"const authored = currentGit(path);\n    assert.deepEqual(authored, git(source, path), 'Carpal feature remains byte-exact to its introduction');"],
 ]);
}else throw Error('Unknown patch phase');
const patch='*** Begin Patch\n'+transitions.map(r=>'*** Update File: '+site+'/'+r.path+'\n@@\n'+fs.readFileSync(site+'/'+r.path,'utf8').trimEnd().split('\n').map(l=>'-'+l).join('\n')+'\n'+r.after.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n').join('')+'*** End Patch';
const receipt={at:new Date().toISOString(),phase,transitions,previewChanged:false};fs.writeFileSync(stage+'/PATCH_'+phase+'.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({patch}));
