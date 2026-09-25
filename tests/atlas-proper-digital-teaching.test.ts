import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('proper digital artery teaching reaches the shared viewer without new models or access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'196afd420067da394d2e048af1751f2314522dcfe346781d0e8907dc3c1967c2');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'a22e4d36b899a649cdcd30ec05ced3bb74bb3261');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/body-content.ts':'2343b8b61f7dfd1cf5f419a376bd19850ee09f9238eff7412215e5b25cca41bc',
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
  assert.deepEqual(current.models,previous.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),previous.sources.filter((s:{module:string})=>s.module!=='head-neck'));
  assert.equal(current.models.length,136);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,143);
});
