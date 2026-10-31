import {restoreReleaseDiagnosticContext} from './release-diagnostic-context-inverse.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const rows=[
  {
    "path": "tests/atlas-arterial-evidence-limits.test.mjs",
    "before": "d04a1842fc6b68f0b7be42a2d0206e93598b29e9d34c40ec7b5d3b1914296dbb",
    "after": "35aa317814977114af7caf761ca5b4504b319b92a76e3e18dd8b281fa50d608d",
    "original": "tests/fixtures/complete-release-before/atlas-arterial-evidence-limits.test.mjs.raw",
    "edits": [
      {
        "i": 260,
        "j": 260,
        "before": [
          "  assert.equal(CURRENT_ATLAS_REVISION,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');"
        ],
        "after": [
          "  assert.equal(CURRENT_ATLAS_REVISION,'2381efe43b75f8a7fb768a069eecd7268c508dac');"
        ]
      }
    ]
  },
  {
    "path": "tests/atlas-body-learning-component.test.mjs",
    "before": "fdb9016dee124c1a68278b281ec39a67fe6b27dc30b37161b434932823584c2d",
    "after": "3fcba11946ef40aeb8ad754962a9383851f61fc9950369a6f5c0f65920f159b6",
    "original": "tests/fixtures/complete-release-before/atlas-body-learning-component.test.mjs.raw",
    "edits": [
      {
        "i": 9,
        "j": 9,
        "before": [],
        "after": [
          "import {restorePreHeadAccessWrapper} from './head-access-wrapper-inverse.mjs';"
        ]
      },
      {
        "i": 184,
        "j": 185,
        "before": [
          "    const beforeLearning=name==='AtlasRuntimeFrame'?restorePreExpansionFrame(candidate):candidate;"
        ],
        "after": [
          "    const beforeLearning=restorePreHeadAccessWrapper(name==='AtlasRuntimeFrame'?restorePreExpansionFrame(candidate):candidate,name);"
        ]
      }
    ]
  },
  {
    "path": "tests/atlas-cervical-epoch-preservation.test.mjs",
    "before": "ff62e76523d50e2a9e476bf3d2bda53225a23a2ff7326bc58b2ce693ee994367",
    "after": "bb3c2bb8b360b9d6bbba2e809525366afd5d827f27e9d61e54d01a78e2d28754",
    "original": "tests/fixtures/complete-release-before/atlas-cervical-epoch-preservation.test.mjs.raw",
    "edits": [
      {
        "i": 5,
        "j": 5,
        "before": [],
        "after": [
          "import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"
        ]
      },
      {
        "i": 84,
        "j": 85,
        "before": [
          "  const sourceRepo=process.env.VM_ATLAS_SOURCE_REPO||'F:/VisibleMedicine/atlas';"
        ],
        "after": [
          "  const sourceRepo=currentAtlasDeliveryRoot();"
        ]
      },
      {
        "i": 87,
        "j": 88,
        "before": [
          "  const windows=readFileSync(sourceRepo+'/'+path);"
        ],
        "after": [
          "  assert.equal(raw.length,14682);",
          "  assert.equal(sha(raw),'7a873d9c6ed62578a7ee5603d68d6a8fbf6e3ccc0b52db6a3ad8b952f8cf7271');",
          "  // The authenticated Windows file converts only these twelve LF positions.",
          "  const windowsLines=new Set([207,208,209,211,212,213,214,215,216,217,218,219]);",
          "  let line=0;",
          "  const windows=Buffer.from(raw.toString('utf8').replace(/\\n/g,()=>windowsLines.has(++line)?'\\r\\n':'\\n'));",
          "  assert.equal(line,256);",
          "  assert.equal(windows.length,14694);"
        ]
      },
      {
        "i": 89,
        "j": 97,
        "before": [],
        "after": [
          "  assert.equal((windows.toString('utf8').match(/\\r\\n/g)||[]).length,12);",
          "  assert.ok(Buffer.from(windows.toString('utf8').replaceAll('\\r\\n','\\n')).equals(raw));"
        ]
      },
      {
        "i": 93,
        "j": 103,
        "before": [
          "  for(const bytes of [Buffer.concat([raw,Buffer.from(' ')]),Buffer.from(raw.toString().replaceAll('\\n','\\r\\n')),Buffer.concat([windows,Buffer.from('\\nchanged source')])]){"
        ],
        "after": [
          "  const checkout=readFileSync(sourceRepo+'/'+path);",
          "  assert.ok(checkout.equals(raw)||checkout.equals(windows),'Actual clean checkout is an authenticated representation');",
          "  assert.deepEqual(witness(checkout),{path,sha256:sha(raw)});",
          "  for(const bytes of [Buffer.concat([raw,Buffer.from(' ')]),",
          "    Buffer.from(raw.toString('utf8').replaceAll('\\n','\\r\\n')),",
          "    Buffer.concat([windows,Buffer.from('\\nchanged source')]),",
          "    Buffer.from(raw.toString('utf8').replace('\\n','\\r\\n'))]){"
        ]
      }
    ]
  }
],sha=b=>createHash('sha256').update(b).digest('hex');
function recoverFiveFollowupSuccessor(row,bytes){
 if(!['tests/atlas-body-learning-component.test.mjs','tests/atlas-cervical-epoch-preservation.test.mjs'].includes(row.path))return bytes;
 // Reuse the exact later seam inventory already proved by the complete five-root audit.
 const proof=readFileSync(new URL('./complete-release-five-followups-preservation.test.mjs',import.meta.url));
 assert.equal(sha(proof),'7a82b36f76b883fb16df1af64adeb329f7ff7418658131fcda2060f9c0201bfb');
 const text=proof.toString('utf8'),start='const successorRoles=',end=';\nfunction recoverSuccessor(row,bytes){';
 assert.equal(text.split(start).length,2);assert.equal(text.split(end).length,2);
 const role=JSON.parse(text.split(start)[1].split(end)[0])[row.path];
 assert.ok(role,'Named successor role exists');
 assert.equal(sha(bytes),role.sha,'Exact complete current test root: '+row.path);
 const lines=bytes.toString('utf8').split('\n');assert.deepEqual(Buffer.from(lines.join('\n')),bytes);
 for(const edit of role.edits.toReversed()){
  assert.deepEqual(lines.slice(edit.at,edit.at+edit.after.length),edit.after);
  lines.splice(edit.at,edit.after.length,...edit.before);
 }
 const restored=Buffer.from(lines.join('\n'));assert.equal(sha(restored),row.after);
 return restored;
}
function original(row,bytes){if(row.path==='tests/atlas-arterial-evidence-limits.test.mjs')bytes=restoreReleaseDiagnosticContext(row.path,bytes);bytes=recoverFiveFollowupSuccessor(row,bytes);assert.equal(sha(bytes),row.after);const lines=bytes.toString().split('\n');for(const e of [...row.edits].reverse()){assert.deepEqual(lines.slice(e.j,e.j+e.after.length),e.after);lines.splice(e.j,e.after.length,...e.before);}return Buffer.from(lines.join('\n'));}
test('complete source/history and refusal assertions survive the three reviewed release follow-up seams',()=>{for(const row of rows){const before=readFileSync(new URL('../'+row.original,import.meta.url)),after=readFileSync(new URL('../'+row.path,import.meta.url));assert.equal(sha(before),row.before);assert.deepEqual(original(row,after),before);}});
test('missing assertions and foreign additions cannot pass the complete original-source inverse',()=>{for(const row of rows){const after=readFileSync(new URL('../'+row.path,import.meta.url));assert.throws(()=>original(row,Buffer.concat([after,Buffer.from('/* foreign */')])));const changed=Buffer.from(after);changed[0]^=1;assert.throws(()=>original(row,changed));}});
