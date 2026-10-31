import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const read=p=>readFileSync(new URL('../'+p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');

// Authenticate later quick-review harness additions before checking the unchanged local-reference epoch.
function restoreInboxSuccessor(bytes){
 assert.equal(sha(bytes),'988a290441051577b63f9ffa8694a8b1d3e15d429ed19cfd18853424bc97fada','Exact current complete inbox harness');
 let source=bytes.toString();
 for(const [after,before] of [
  [
    "cleanup = () => { for (const slot of slots) slot?.dispose?.(); };",
    "cleanup = dispose;"
  ],
  [
    "format: 'cjs', jsx: 'automatic', packages: 'external'",
    "format: 'cjs', packages: 'external'"
  ],
  [
    "const quickProps = () => {\n  const quick = walk(render(), n => typeof n.type === 'function' && n.type.name === 'ClinicalReviewQuickStart')[0];\n  assert(quick, 'Quick review stays mounted');\n  return quick.props;\n};\nconst quickKeys = () => [...quickProps().items].map(row => row.key).join('|');\n",
    ""
  ],
  [
    "  for (const link of links) assert.equal(link.props['aria-label'], `${words(link).replace(/ ↗$/, '')} (opens in a new tab)`, 'each destination retains its visible label and announces the new tab');\n",
    ""
  ],
  [
    "  assert(links.every(link => link.props.target === '_blank' && link.props.rel === 'noopener noreferrer'));\r\n",
    "  assert(links.every(link => link.props.target === '_blank' && link.props.rel === 'noopener noreferrer'));\n"
  ],
  [
    "test('Quick review receives the same matching rows in scan order, independent of display sorting and paging', async () => {\n  begin();\n  const rows = [\n    item('biceps', 'changes-required', { title: 'Biceps · long head', scopeLabel: 'Whole body · shoulder-arm · muscles · FMA1 · right' }),\n    item('ethmoid-first', 'not-started', { title: 'Ethmoid bone', scopeLabel: 'Whole body · head-neck · bones · FMA52747 · midline' }),\n    item('ethmoid-second', 'changes-required', { title: 'Ethmoid bone (source group)', scopeLabel: 'Whole body · head-neck · bones · FMA52747 · left' }),\n    item('ethmoid-guide', 'changes-required', { title: 'Ethmoid teaching', area: 'head-learning', scopeLabel: 'FMA52747' }),\n  ];\n  calls[0].resolve(response(batch(1, 1, rows))); await tick();\n  assert.equal(quickKeys(), 'biceps|ethmoid-first|ethmoid-second|ethmoid-guide');\n  assert.equal(quickProps().scanComplete, true);\n  controls()[0].props.onChange({ target: { value: 'fma52747' } });\n  assert.equal(quickKeys(), 'ethmoid-first|ethmoid-second|ethmoid-guide');\n  assert.equal(quickProps().filtersActive, true);\n  controls()[1].props.onChange({ target: { value: 'structures' } });\n  assert.equal(quickKeys(), 'ethmoid-first|ethmoid-second');\n  // Display order puts the reported issue first, but Quick review's source order is unchanged.\n  assert.match(worksheetLinks()[0].props.href, /ethmoid-second/);\n  assert.equal(quickKeys(), 'ethmoid-first|ethmoid-second');\n  controls()[0].props.onChange({ target: { value: 'not present' } });\n  assert.equal(quickKeys(), '');\n  button('Reset filters').props.onClick();\n  assert.equal(quickKeys(), 'biceps|ethmoid-first|ethmoid-second|ethmoid-guide');\n  assert.equal(quickProps().filtersActive, false);\n  finish();\n});\n\ntest('status and change filters narrow Quick review, while incomplete scans remain explicitly partial', async () => {\n  begin();\n  const rows = [\n    item('source', 're-review', { changeReason: 'source-or-teaching' }),\n    item('viewer', 're-review', { changeReason: 'viewer-only' }),\n    item('other', 're-review', { changeReason: 'other-review-material' }),\n    item('issue', 'changes-required'),\n    item('approved', 'approval-recorded'),\n  ];\n  calls[0].resolve(response(batch(1, 2, rows))); await tick();\n  assert.equal(quickProps().scanComplete, false);\n  controls()[2].props.onChange({ target: { value: 're-review' } });\n  assert.equal(quickKeys(), 'source|viewer|other');\n  controls()[3].props.onChange({ target: { value: 'viewer-only' } });\n  assert.equal(quickKeys(), 'viewer');\n  controls()[3].props.onChange({ target: { value: 'other-unclassified' } });\n  assert.equal(quickKeys(), 'other');\n  controls()[2].props.onChange({ target: { value: 'approval-recorded' } });\n  assert.equal(quickKeys(), 'approved');\n  assert.equal(quickProps().scanComplete, false);\n  finish();\n});\n\n",
    ""
  ]
]){assert.equal(source.split(after).length,2,'One admitted successor seam');source=source.replace(after,before);}
 assert.equal(sha(source),'69215611fceda38d119f8952863a8ff74089e3abc539a94d47f7d08e08a1d9b8','Exact complete local-reference admission harness');
 return source;
}
test('every original inbox UI assertion survives the exact additive local-reference workflow expectation',()=>{const old=read('tests/fixtures/local-reference-entry-before/clinical-review-inbox-ui.test.mjs.raw');assert.equal(sha(old),'4d355a9fb73556331400dce32fd56e125b41371302ccf7c022b4f4496fd5574a');let current=restoreInboxSuccessor(read('tests/clinical-review-inbox-ui.test.mjs'));for(const[from,to]of [["links.map(link => link.props.href), ['/workspace/clinical-review-inbox/local-reference', '","links.map(link => link.props.href), ['"],["links.map(link => words(link)), ['Local reference inspection · choose a held packet folder ↗', '","links.map(link => words(link)), ['"]]){assert.equal(current.split(from).length,2);current=current.replace(from,to);}assert.equal(current,old.toString());assert.deepEqual([...current.matchAll(/^test\(['"]([^'"]+)['"]/gm)].map(m=>m[1]),[...old.toString().matchAll(/^test\(['"]([^'"]+)['"]/gm)].map(m=>m[1]));});

test('foreign edits and removed assertions cannot enter the inbox successor layer',()=>{const bytes=read('tests/clinical-review-inbox-ui.test.mjs');for(const changed of [Buffer.concat([bytes,Buffer.from('/* foreign */')]),Buffer.from(bytes.toString().replace('assert.equal(','void('))]){assert.notDeepEqual(changed,bytes);assert.throws(()=>restoreInboxSuccessor(changed));}});
