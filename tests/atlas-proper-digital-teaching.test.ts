import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {nonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('proper digital artery teaching reaches the shared viewer without new models or access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'4c546a73ea08bac20bc887ceda2abfd1e7e83557849311e14231ad5c4ac29b7f');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'2c9d80ba1eaba9f520a7da9ac7fcb1201ca42a65');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/body-content.ts':'a974be279f6dc96660d838fa0323f5ccbf48104d536fba688e141de3159dac71',
    'content/proper-digital-teaching.ts':'e3d3bfd651987ba881c3b7a11dc6a0a07ef9135c73554d43de2a74b839952012',
    'lib/proper-digital-teaching.ts':'9e072b27456a485d71364eb35fcca7939b64d7af7049b07933d15ec548c63c71',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const data=readFileSync(base+f.path);assert.equal(sha(data),f.sha256);return data.toString();
  }).join('\n');
  for(const marker of ['FMA22858','FMA22860','FMA23050','FMA23051','FMA23052','FMA23054','FMA23055','FMA85112','FMA85115','FMA85116',
    'A common palmar digital artery is a proximal trunk that divides into proper branches running along named digits.',
    'Radial and ulnar here describe anatomical source labels, unchanged by camera rotation',
    'Proper palmar digital arteries contribute to palmar digit supply and to the distal dorsal surface and nail bed.',
    'The ten retained selections are incomplete bilateral coverage.',
    'Case, Atlas and lecture access remain independent.',
    'https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_tables.html',
  ])assert.ok(runtime.includes(marker),marker);
  const previous=JSON.parse(execFileSync('git',['show','ae5cb2cb278b4596c04caacc64a5b3ebd1a69c10:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),previous.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),nonregionalAtlasSources);
  assert.equal(current.models.length,137);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
});
