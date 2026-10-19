import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateRevision53Supplement} from './closed53-source-supplement.mjs';
const primary=readFileSync(new URL('./fixtures/head-manual-recovery-53/epoch.json',import.meta.url));
const bytes=readFileSync(new URL('./fixtures/head-manual-recovery-53/supplement.json',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const fixture=JSON.parse(bytes);
test('all eleven exact archived texts preserve the original 1658-input historical53 closure',()=>{
  assert.equal(sha(bytes),'2031cd6e889c11563b5e95800d4e3f1763e6ed9d3f9b7a87dd864e026855ad6e');
  const {records,declared}=validateRevision53Supplement(fixture,primary);
  assert.equal(records.size,11);assert.equal(declared.size,1658);
  assert.equal(records.get('components/HeadAtlasViewer.tsx').sha256,'06b4c293f5931f5cd0e36471de46718c6bbf26ea3500ec24c57c4de15e476841');
});
test('source, revision, provenance, path, hash and text mutations refuse historical substitution',()=>{
  const edits=[
    s=>{s.source='0'.repeat(40);},
    s=>{s.review='0'.repeat(64);},
    s=>{s.primaryEpochSha256='0'.repeat(64);},
    s=>{s.integrationInputsSha256='0'.repeat(64);},
    s=>{s.provenance.commit='0'.repeat(40);},
    s=>{s.files.pop();},
    s=>{s.files.push(s.files[0]);},
    s=>{s.files[0].path='../outside';},
    s=>{s.files[0].text+=' ';},
    s=>{s.files[0].bytes++;},
    s=>{s.files[0].text+=' ';s.files[0].bytes=Buffer.byteLength(s.files[0].text);s.files[0].sha256=sha(s.files[0].text);},
  ];
  for(const edit of edits){const candidate=structuredClone(fixture);edit(candidate);assert.throws(()=>validateRevision53Supplement(candidate,primary));}
  assert.equal(edits.length,11);
});
