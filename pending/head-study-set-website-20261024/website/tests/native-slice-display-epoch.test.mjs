import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {assertNativeSliceCurrentDisplay} from './native-slice-current-display.mjs';import {assertCurrentTourSource} from './adjacent-current-tour-source-role.mjs';
import {historicalWebsiteRoot,readHistoricalSource} from './head-study-set-historical-source.mjs';
const root=historicalWebsiteRoot,stage='F:/VisibleMedicine/staging/20261024-native-slice-website',read=p=>readHistoricalSource(p),normal=s=>s.replaceAll('\r\n','\n'),sha=b=>createHash('sha256').update(b).digest('hex');
test('new current display epoch preserves and executes the exact previous native/tour assertions',()=>{
 const before=readFileSync(stage+'/preimages/tests/adjacent-current-tour-source-role.mjs.raw','utf8');let now=normal(read('tests/adjacent-current-tour-source-role.mjs').toString());
 const parent=JSON.parse(readFileSync('F:/VisibleMedicine/staging/20261024-regional-discovery-ui/SOURCE_BOUND.json'));assert.equal(sha(Buffer.from(before)),parent.sourceRows.find(r=>r.path==='tests/adjacent-current-tour-source-role.mjs').sha256);
 for(const seam of ["import {assertNativeSliceCurrentDisplay} from './native-slice-current-display.mjs';\n","  if(binding.sha256==='e5e71eaee78003764fd2fdc9e7a85907751ef44c566cf2ac953318c1937c9969'){\n","  }else assertNativeSliceCurrentDisplay({root:site,manifest,binding});\n"]){assert.equal(now.split(seam).length,2);now=now.replace(seam,'');}
 assert.equal(now,normal(before),'Entire old helper reconstructs; no historical theorem or negative case removed');
 assertCurrentTourSource();
});
test('display admission rejects unrelated input, stale imported display, fake renderer/approval fields and private output',()=>{
 const manifest=JSON.parse(read('atlas-review/manifest.json')),binding=JSON.parse(read('atlas-review/integration-inputs.json'));
 assertNativeSliceCurrentDisplay({root,manifest,binding});
 const fake=structuredClone(binding);fake.inputs[0].sha256='f'.repeat(64);fake.sha256=sha(Buffer.from(JSON.stringify(fake.inputs)));assert.throws(()=>assertNativeSliceCurrentDisplay({root,manifest,binding:fake}));
 const altered=structuredClone(manifest);altered.files[0].importedSha256='f'.repeat(64);assert.throws(()=>assertNativeSliceCurrentDisplay({root,manifest:altered,binding}));
 for(const [p,change]of [['atlas-review/content/body-renderer-revision.json',v=>({...v,clinicalApproved:true})],['atlas-review/content/review-revisions.json',v=>({...v,approvalsInherited:true})],['public/atlas-review-viewer/manifest.json',v=>({...v,personalRecordsIncluded:true})]]){
  const readMutated=file=>file===p?Buffer.from(JSON.stringify(change(JSON.parse(read(file))))):read(file);
  assert.throws(()=>assertNativeSliceCurrentDisplay({root,manifest,binding,read:readMutated}),p);
 }
});
