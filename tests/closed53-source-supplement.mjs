import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const paths=[
  'app/workspace/atlas-review/model/embedded/page.tsx',
  'app/workspace/atlas-review/model/page.tsx',
  'atlas-review/app/body-content.ts',
  'atlas-review/content/body-review-display-pins.json',
  'atlas-review/content/regional-teaching/foot.json',
  'atlas-review/content/regional-teaching/head-neck.json',
  'components/head-atlas.css',
  'components/HeadAtlasViewer.tsx',
  'docs/anatomy-coverage/index.json',
  'lib/anatomy-coverage-view.ts',
  'scripts/import-clinical-review.mjs',
];

// Source text only. Never execute recovered scripts or admit this epoch as current.
export function validateRevision53Supplement(supplement,primaryBytes){
  const primary=JSON.parse(primaryBytes);
  assert.equal(sha(primaryBytes),'963b7b46ee4215f91a47cf133a77a0d597613dea416b124c76f4d530dedfc11f');
  assert.equal(supplement.schema,'vm-closed-delivery-json-text-supplement-1');
  assert.equal(supplement.primaryEpochSha256,sha(primaryBytes));
  assert.equal(supplement.source,primary.source);
  assert.equal(supplement.review,primary.review);
  assert.deepEqual(supplement.provenance,{
    repository:'https://github.com/deliotd-cloud/Visible-medicine.git',
    commit:'86e64291f07677e9d2e2c4612a5070f2cc98e9ec',
    tree:'bb23397b4f4200cb222ab24c111e163b9612b431',
    scope:'Exact source-only historical website53 backup; no current delivery or clinical admission.',
  });
  const parent=new Map(primary.files.map(row=>[row.path,row]));
  const inputRow=parent.get('atlas-review/integration-inputs.json');
  const inputBytes=Buffer.from(inputRow.text,'utf8');
  assert.equal(inputBytes.length,inputRow.bytes);
  assert.equal(sha(inputBytes),inputRow.sha256);
  assert.equal(supplement.integrationInputsSha256,inputRow.sha256);
  const inputs=JSON.parse(inputBytes).inputs;
  assert.equal(inputs.length,1658);
  assert.equal(sha(JSON.stringify(inputs)),primary.review);
  const declared=new Map(inputs.map(row=>[row.path,row]));
  assert.equal(declared.size,1658);
  assert.deepEqual(supplement.files.map(row=>row.path),paths);
  const records=new Map();
  for(const row of supplement.files){
    assert(!parent.has(row.path),'Supplement must not replace primary evidence');
    assert.equal(typeof row.text,'string');
    const frozen=Buffer.from(row.text,'utf8');
    assert.equal(frozen.length,row.bytes,row.path+' archived bytes');
    assert.equal(sha(frozen),row.sha256,row.path+' archived hash');
    assert.equal(row.sha256,declared.get(row.path)?.sha256,row.path+' original declared hash');
    records.set(row.path,row);
  }
  return {records,declared};
}
