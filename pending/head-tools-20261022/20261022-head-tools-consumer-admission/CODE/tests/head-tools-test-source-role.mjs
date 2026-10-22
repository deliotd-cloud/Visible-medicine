// Test-only exact current-to-pre-tools source roles; no current production or delivery substitution.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const specs={
  "head-filtered-layout.test.mjs": {
    "beforeSha256": "151e0511ce7ce925ff7a58469100759586f7aae3b40b85458db4da1ae7c05e3e",
    "afterSha256": "5dc4a8d99ee20f02d8724bc6d952fe039a83f32c6245eb85b2efee28c646ff27",
    "hunks": [
      {
        "beforeStart": 4,
        "afterStart": 4,
        "removed": [],
        "added": [
          "import {restoreHeadToolsBefore20261022} from './head-tools-epoch-20261022.mjs';"
        ]
      },
      {
        "beforeStart": 10,
        "afterStart": 11,
        "removed": [
          " let candidate=read('components/HeadAtlasViewer.tsx').toString();"
        ],
        "added": [
          " let candidate=restoreHeadToolsBefore20261022(read('components/HeadAtlasViewer.tsx'),read('tests/fixtures/head-toolbar-before-compaction-20261022.tsx.raw'));"
        ]
      }
    ]
  },
  "head-disclosure-current-delivery.test.mjs": {
    "beforeSha256": "6feb900f5db6124b287629a669267736baf22751d3142aea15f8d4eda87d0e31",
    "afterSha256": "999704133a16bff87fb69948a0ef67ba3b5973218235ee3b99ef2d455cbfe58d",
    "hunks": [
      {
        "beforeStart": 34,
        "afterStart": 34,
        "removed": [
          " assert.equal(now.reviewSourceFiles,1558);assert.equal(binding.inputs.length,1724);assert.equal(binding.sha256,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');assert.equal(binding.sha256,now.reviewIntegration);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);"
        ],
        "added": [
          " assert.equal(now.reviewSourceFiles,1558);assert.equal(binding.inputs.length,1724);assert.equal(binding.sha256,'3ed1585515a52a0480bc433aa135309abc38bace5f9a581cffe3b48660f23a9a');assert.equal(binding.sha256,now.reviewIntegration);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);"
        ]
      },
      {
        "beforeStart": 40,
        "afterStart": 40,
        "removed": [],
        "added": [
          "test('pre-head-tools Review pin remains an authenticated older role and cannot approve the changed viewer',()=>{",
          " const beforeBytes=read('tests/fixtures/current-delivery-before-head-tools-20261022.json');",
          " assert.equal(sha(beforeBytes),'422a105495609f03a1e20660716406c737e1a14337843ed61d084bf95c7c7bed');",
          " const before=JSON.parse(beforeBytes);",
          " assert.equal(before.reviewIntegration,'525f8fbe122bf6bdc15d8b89f572e49e3ac0ce09cd411b8009f67454d938a163');",
          " const current=validateCurrentAtlasDelivery();",
          " assert.equal(current.reviewIntegration,'3ed1585515a52a0480bc433aa135309abc38bace5f9a581cffe3b48660f23a9a');",
          " assert.notEqual(before.reviewIntegration,current.reviewIntegration);",
          " assert.throws(()=>validateCurrentAtlasDelivery({pin:before}));",
          "});",
          ""
        ]
      }
    ]
  }
};
export function restoreHeadToolsTestRole(name,bytes){
 const spec=specs[name];assert(spec,'Only two explicit historical test roles');
 assert.equal(sha(bytes),spec.afterSha256,name+': authenticated complete current test source');
 const text=bytes.toString('utf8');assert.deepEqual(Buffer.from(text),bytes,'Lossless current source');
 const lines=text.split('\n');
 for(const hunk of spec.hunks.toReversed()){assert.deepEqual(lines.slice(hunk.afterStart,hunk.afterStart+hunk.added.length),hunk.added,'Complete exact later hunk');lines.splice(hunk.afterStart,hunk.added.length,...hunk.removed);}
 const before=Buffer.from(lines.join('\n'));assert.equal(sha(before),spec.beforeSha256,name+': authenticated complete prior test source');
 const forward=before.toString().split('\n');
 for(const hunk of spec.hunks.toReversed()){assert.deepEqual(forward.slice(hunk.beforeStart,hunk.beforeStart+hunk.removed.length),hunk.removed,'Complete exact original hunk');forward.splice(hunk.beforeStart,hunk.removed.length,...hunk.added);}
 assert.equal(forward.join('\n'),text,'Complete round-trip, including every later assertion');return before;
}
