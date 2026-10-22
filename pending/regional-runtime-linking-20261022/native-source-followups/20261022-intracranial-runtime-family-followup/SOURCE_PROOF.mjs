import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const stage='F:/VisibleMedicine/staging/20261022-intracranial-runtime-family-followup/';
const website='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/';
const atlas='F:/VisibleMedicine/atlas';
const name='tests/atlas-intracranial-arterial-ultrasound.test.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const read=p=>readFileSync(p);
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,'Unique exact test seam');return s.replace(a,b);};
const raw=read(stage+'RAW/'+name),code=read(stage+'CODE/'+name);
assert.equal(sha(raw),'34c72bc49fd71233b055340cecf3b81bd423bac6291aad0d66d56d6a64374c32');
assert.equal(sha(code),'be62fa493b5e4c3bcb951233cb432a874a25119fa4e92b7bea25e91c9dd55c39');
assert(raw.equals(read(website+name)),'Exact current V5 source');
let inverse=code.toString('utf8');
const originalTrees=`  const paths = [...new Set([...currentReview.files.map(row => row.path),
    ...currentRegions.flatMap(item => item.inputs.map(row => row.path))])];
  const ids = [...new Set(paths.map(path => {
    const id = currentTree.get(path); assert(id, 'Current Git source path: ' + path); return id;
  }))];`;
const familyTrees=`  const sourceTrees = new Map([[current.source, currentTree]]);
  for (const revision of Object.values(current.runtimeSources))
    if (!sourceTrees.has(revision)) sourceTrees.set(revision, tree(revision));
  const required = [
    ...currentReview.files.map(row => [current.source, row.path]),
    ...currentRegions.flatMap(item => item.inputs.map(row => [current.runtimeSources[item.region], row.path])),
    ...currentRegions.flatMap(item => item.inputs.map(row => [current.source, row.path])),
  ];
  const ids = [...new Set(required.map(([revision, path]) => {
    const id = sourceTrees.get(revision)?.get(path);
    assert(id, 'Pinned Git source path: ' + revision + ':' + path); return id;
  }))];`;
const originalBlob='  const currentBlob = path => currentObjects.get(currentTree.get(path));';
const familyBlob=`  const sourceBlob = (revision, path) => {
    const id = sourceTrees.get(revision)?.get(path);
    assert(id, 'Pinned Git source path: ' + revision + ':' + path);
    const blob = currentObjects.get(id);
    assert(blob, 'Pinned Git blob loaded: ' + revision + ':' + path);
    return blob;
  };
  const currentBlob = path => sourceBlob(current.source, path);`;
inverse=once(inverse,familyTrees,originalTrees);
inverse=once(inverse,familyBlob,originalBlob);
inverse=once(inverse,"    assert.equal(manifest.sourceCommit, current.runtimeSources[region], 'Pinned runtime source: ' + region);","    assert.equal(manifest.sourceCommit, current.source, 'Current runtime source: ' + region);");
inverse=once(inverse,`      const committed = sourceBlob(current.runtimeSources[region], row.path);
      assert.equal(row.sha256, sha(committed), region + ' pinned runtime input ' + row.path);
      const checkoutCommit = currentBlob(row.path);
      verifyCurrentCommittedBinding({path: row.path, sha256: sha(checkoutCommit)}, checkoutCommit, working);`,`      const committed = currentBlob(row.path);
      verifyCurrentCommittedBinding(row, committed, working);`);
const first=read('F:/VisibleMedicine/staging/20261022-intracranial-license-checkout-followup/CODE/'+name).toString('utf8');
assert.equal(inverse,first,'Exact first licence-only proposal preserved');
inverse=once(inverse,"import {verifyCurrentCommittedBinding} from './cerebral-checkout-current-adapter.mjs';\n",'');
inverse=once(inverse,'      verifyCurrentCommittedBinding(row, committed, working);',`      assert.ok(working.equals(committed) ||
        Buffer.from(working.toString('utf8').replaceAll('\\r\\n', '\\n')).equals(committed),
        'Current Git/working source: ' + row.path);
      assert.equal(row.sha256, sha(working), region + ' current source input ' + row.path);`);
assert.equal(inverse,raw.toString('utf8'),'Complete V5 original test recovered');
assert.notEqual(code.toString('utf8').replace('assert.equal(row.sha256, sha(committed)','assert.notEqual(row.sha256, sha(committed)'),code.toString('utf8'),'Assertion mutation changes exact proposal');

const pin=JSON.parse(read(website+'tests/fixtures/current-atlas-delivery.json'));
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.deepEqual(pin.runtimeSources,{'head-neck':pin.source,shoulder:'190a63238eadcf906abe89dcbb6a67c88afe70b9','lower-limb':'190a63238eadcf906abe89dcbb6a67c88afe70b9','female-pelvis':'190a63238eadcf906abe89dcbb6a67c88afe70b9'});
assert.equal(execFileSync('git',['-C',atlas,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),pin.source);
const revisions=[...new Set([pin.source,...Object.values(pin.runtimeSources)])];
const trees=new Map();
for(const revision of revisions){
 const entries=execFileSync('git',['-C',atlas,'ls-tree','-r','-z','--full-tree',revision]);
 const map=new Map();for(const item of entries.toString('utf8').split('\0')){const match=/^(100644|100755) blob ([a-f0-9]{40})\t([\s\S]+)$/.exec(item);if(match)map.set(match[3],match[2]);}
 trees.set(revision,map);
}
const regions=['head-neck','shoulder','lower-limb','female-pelvis'];
const lists=new Map(regions.map(region=>[region,JSON.parse(read(website+`public/atlas-runtime/${region}/source-inputs.json`))]));
const review=JSON.parse(read(website+'atlas-review/manifest.json'));
assert.equal(review.revision,pin.source);
const required=[...review.files.map(row=>[pin.source,row.path]),...regions.flatMap(region=>lists.get(region).flatMap(row=>[[pin.runtimeSources[region],row.path],[pin.source,row.path]]))];
const ids=[...new Set(required.map(([rev,path])=>{const id=trees.get(rev)?.get(path);assert(id,'Missing pinned path '+rev+':'+path);return id;}))];
const stream=execFileSync('git',['-C',atlas,'cat-file','--batch'],{input:ids.join('\n')+'\n',maxBuffer:256e6});
const objects=new Map();let offset=0;
for(const id of ids){const end=stream.indexOf(10,offset);const match=/^([a-f0-9]{40}) blob ([0-9]+)$/.exec(stream.subarray(offset,end).toString());assert(match&&match[1]===id);const finish=end+1+Number(match[2]);assert.equal(stream[finish],10);objects.set(id,stream.subarray(end+1,finish));offset=finish+1;}
assert.equal(offset,stream.length);
const blob=(rev,path)=>{const id=trees.get(rev)?.get(path);assert(id,'Missing pinned path');const bytes=objects.get(id);assert(bytes,'Missing batch blob');return bytes;};
const helper=await import(pathToFileURL(website+'tests/cerebral-checkout-current-adapter.mjs').href);
function check(region,row,{familyBytes,currentBytes,workingBytes}={}){
 assert(row&&row.path&&row.sha256,'Missing runtime input record');
 const family=pin.runtimeSources[region];assert.equal(row.sha256,sha(familyBytes??blob(family,row.path)),'Runtime input binds its own Git family');
 const current=currentBytes??blob(pin.source,row.path),working=workingBytes??read(atlas+'/'+row.path);
 helper.verifyCurrentCommittedBinding({path:row.path,sha256:sha(current)},current,working);
}
let count=0;
for(const region of regions){
 const manifest=JSON.parse(read(website+`public/atlas-runtime/${region}/manifest.json`));
 assert.equal(manifest.sourceCommit,pin.runtimeSources[region]);
 const rows=lists.get(region);assert.equal(new Set(rows.map(row=>row.path)).size,rows.length);
 for(const row of rows){check(region,row);count++;}
}
for(const row of review.files)assert.equal(row.sourceSha256,sha(blob(pin.source,row.path)),'Review stays on current Git source');
const foreign=lists.get('shoulder').find(row=>row.path==='app/body-content.ts');assert(foreign);
assert.notEqual(sha(blob(pin.source,foreign.path)),foreign.sha256,'Real current/old-family difference witnessed');
assert.throws(()=>check('shoulder',{...foreign,sha256:sha(blob(pin.source,foreign.path))}),'Foreign-family substitution refused');
const changed=Buffer.from(blob(pin.runtimeSources.shoulder,foreign.path));changed[0]^=1;
assert.throws(()=>check('shoulder',foreign,{familyBytes:changed}),'Changed family Git blob refused');
const alteredInput={...foreign,sha256:'0'.repeat(64)};
assert.throws(()=>check('shoulder',alteredInput),'Changed input manifest digest refused');
const changedCurrent=Buffer.from(blob(pin.source,foreign.path));changedCurrent[0]^=1;
assert.throws(()=>check('shoulder',foreign,{currentBytes:changedCurrent}),'Changed current Git blob refused');
assert.throws(()=>check('shoulder',undefined),'Missing record refused');
console.log(JSON.stringify({raw:sha(raw),code:sha(code),regions:regions.map(region=>[region,lists.get(region).length,pin.runtimeSources[region]]),records:count,gitBlobs:ids.length,proof:'PASS'}));
