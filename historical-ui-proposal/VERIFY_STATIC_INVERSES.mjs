// Pure source/fixture-byte controls for this proposal. It imports no test module.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const candidate='F:/VisibleMedicine/staging/20261026-current-delivery-advance/website';
const oldStage='F:/VisibleMedicine/staging/20261023-head-pan-bound/website';
const v1='F:/VisibleMedicine/staging/20261026-current-ui-role-proposal/patch';
const read=(root,path)=>readFileSync(resolve(root,path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const frozen='tests/fixtures/historical-current-ui-9e14/current-ui-delivery-transition.test.mjs.raw';
const original=read('.',frozen);
assert.equal(sha(original),'d7d18ae9b36cd593475998420137b7611695aba5a12053abe12fb0c18c27b696');
assert.deepEqual(original,read(candidate,'tests/current-ui-delivery-transition.test.mjs'));
assert.deepEqual(original,read(oldStage,'tests/current-ui-delivery-transition.test.mjs'));
for(const path of [frozen,'tests/head-pan-review-binding.test.mjs','tests/window-drag-review-binding.test.mjs'])
 assert.deepEqual(read('.',path),read(v1,path),'Unchanged historical source and companion inverse: '+path);
const imports=path=>[...read(oldStage,path).toString().matchAll(/\bfrom ['"]([^'"]+)['"]/g)].map(row=>row[1]);
assert.deepEqual(imports('tests/current-ui-delivery-transition.test.mjs').filter(name=>!name.startsWith('node:')),
 ['./current-atlas-delivery.mjs']);
assert.deepEqual(imports('tests/current-atlas-delivery.mjs').filter(name=>!name.startsWith('node:')),
 ['./atlas-source-repo.mjs']);
assert.deepEqual(imports('tests/atlas-source-repo.mjs').filter(name=>!name.startsWith('node:')),[]);
for(const path of ['tests/current-ui-delivery-transition.test.mjs','tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs'])
 for(const name of imports(path))assert(name.startsWith('node:')||name.startsWith('./'),'No package import: '+name);
const adapter=read('.','tests/current-ui-delivery-transition.test.mjs').toString();
assert.equal(adapter.split('await checkedHistoricalContext()').length,3,'Full historical gate before and after child');
assert(adapter.includes('postContextVerified:postContextError===null'));
const names=[...original.toString().matchAll(/^test\(['"]([^'"]+)['"]/gm)].map(row=>row[1]);
assert.equal(names.length,3);
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,`Unique inverse seam: ${from}`);return text.replace(from,to);};

const panBefore=read(candidate,'tests/head-pan-review-binding.test.mjs').toString();
let panAfter=read('.', 'tests/head-pan-review-binding.test.mjs').toString();
panAfter=once(panAfter,
 "  const historicalTransition=read('tests/fixtures/historical-current-ui-9e14/current-ui-delivery-transition.test.mjs.raw');\n  assert.equal(sha(historicalTransition),'d7d18ae9b36cd593475998420137b7611695aba5a12053abe12fb0c18c27b696');\n  let transition=historicalTransition.toString();\n  transition=once(transition,'e94dcf1c490f37b9cba6723fb9ef3a0ab0b872a2e3a18d29a6b1d37b8f24a9cf',sha(read(history+'tests/fixtures/current-atlas-delivery.json.raw')));",
 "  let transition=read('tests/current-ui-delivery-transition.test.mjs').toString();\n  transition=once(transition,sha(read('tests/fixtures/current-atlas-delivery.json')),sha(read(history+'tests/fixtures/current-atlas-delivery.json.raw')));");
assert.equal(panAfter,panBefore,'Entire head-pan test inverse');

const dragBefore=read(candidate,'tests/window-drag-review-binding.test.mjs').toString();
let dragAfter=read('.', 'tests/window-drag-review-binding.test.mjs').toString();
dragAfter=once(dragAfter,
 " const historicalTransition=read('tests/fixtures/historical-current-ui-9e14/current-ui-delivery-transition.test.mjs.raw');assert.equal(sha(historicalTransition),'d7d18ae9b36cd593475998420137b7611695aba5a12053abe12fb0c18c27b696');\n let transition=historicalTransition.toString();transition=once(transition,normalizeContrastBindingCount,'');transition=once(transition,'e94dcf1c490f37b9cba6723fb9ef3a0ab0b872a2e3a18d29a6b1d37b8f24a9cf',sha(read(history+'tests/fixtures/current-atlas-delivery.json.raw')));assert.equal(transition,read(history+'tests/current-ui-delivery-transition.test.mjs.raw').toString());",
 " let transition=read('tests/current-ui-delivery-transition.test.mjs').toString();transition=once(transition,normalizeContrastBindingCount,'');transition=once(transition,sha(read('tests/fixtures/current-atlas-delivery.json')),sha(read(history+'tests/fixtures/current-atlas-delivery.json.raw')));assert.equal(transition,read(history+'tests/current-ui-delivery-transition.test.mjs.raw').toString());");
assert.equal(dragAfter,dragBefore,'Entire window-drag test inverse');

const pin='e94dcf1c490f37b9cba6723fb9ef3a0ab0b872a2e3a18d29a6b1d37b8f24a9cf';
let panHistory=original.toString();
panHistory=once(panHistory,pin,sha(read(candidate,'tests/fixtures/head-pan-binding-before/tests/fixtures/current-atlas-delivery.json.raw')));
assert.equal(panHistory,read(candidate,'tests/fixtures/head-pan-binding-before/tests/current-ui-delivery-transition.test.mjs.raw').toString(),
 'Whole 9e-to-head-pan transition inverse');
const dragSource=read('.', 'tests/window-drag-review-binding.test.mjs').toString();
const match=dragSource.match(/export const normalizeContrastBindingCount=("[^\n]*");/);
assert(match,'Exact normalization source');
let dragHistory=original.toString();
dragHistory=once(dragHistory,JSON.parse(match[1]),'');
dragHistory=once(dragHistory,pin,sha(read(candidate,'tests/fixtures/window-drag-binding-before/tests/fixtures/current-atlas-delivery.json.raw')));
assert.equal(dragHistory,read(candidate,'tests/fixtures/window-drag-binding-before/tests/current-ui-delivery-transition.test.mjs.raw').toString(),
 'Whole 9e-to-window-drag transition inverse');
process.stdout.write('Static original-source and both whole-file inverse controls verified.\n');
