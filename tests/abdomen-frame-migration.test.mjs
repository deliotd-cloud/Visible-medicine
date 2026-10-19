import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

test('abdomen pilot preserves every original assertion except the exact shared-frame source migration',()=>{
  const read=relative=>readFileSync(new URL(relative,import.meta.url),'utf8');
  const original=JSON.parse(read('./fixtures/abdomen-frame-migration/original.json'));
  assert.equal(original.schema,'visible-medicine.original-test-text/1');
  assert.equal(original.path,'tests/abdomen-pilot.test.ts');
  assert.equal(original.sha256,'83cfcce189f97e637724f2d39ff97fd6ddc778f10d14f0f1b6baa1de40a7d282');
  assert.equal(createHash('sha256').update(Buffer.from(original.text,'utf8')).digest('hex'),original.sha256);
  const before=String.raw`  assert.equal((page.match(/<iframe\b/g)||[]).length,1);`;
  const after=[
    '  // The page delegates its single frame to AtlasRuntimeFrame; abdomen-frame-contract.test.mjs',
    '  // renders the actual component chain and asserts the resulting single iframe.',
    String.raw`  assert.equal((page.match(/<AtlasRuntimeFrame\b/g)||[]).length,1);`,
  ].join('\n');
  assert.equal(original.text.split(before).length,2,'one and only one source seam is migrated');
  assert.equal(read('./abdomen-pilot.test.ts').replaceAll('\r\n','\n'),original.text.replace(before,after).replaceAll('\r\n','\n'));
  const actualRenderTest=read('./abdomen-frame-contract.test.mjs');
  assert(actualRenderTest.includes("new URL('../app/atlas/abdomen-3d/page.tsx', import.meta.url)"));
  assert(actualRenderTest.includes('renderToStaticMarkup(React.createElement(module.exports.default))'));
  assert(actualRenderTest.includes("assert.equal(frames.length, 1, 'the rendered page must contain exactly one viewer iframe')"));
});
