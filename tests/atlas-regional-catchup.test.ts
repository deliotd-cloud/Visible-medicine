import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('regional catch-up carries exact saved focus and search inputs without private imaging',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'c8bd68407de72079e793ea059b81703a341bc085a25a50909fe23fc736e5fc18');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'ed5215fcd3a8c4c113f8072b552f0a3cc1b5aa82');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,hash] of Object.entries({
    'content/ophthalmic-nerve-studies.ts':'4dad953a18972048d20d756a4358a52fb3742f4fefe6502e747df7900822581a',
    'content/infrahyoid-layer-study.ts':'fc769248ed0ebe18572288b09793ebc37810d959ab333cde18a58e1f38d10e02',
    'content/mediastinal-organ-study.ts':'4307af9d54321db061a743e24faab1838487c220b3cc110528bf860002200767',
    'lib/anatomy-search.ts':'a761621615a6ba52e8c9742b2d9771f4b3e71447b52229ad78f4883185fedca2',
    'lib/atlas-navigation.ts':'a8d79020c9d9283dfc50f7055b7c8015746a8f13962267c41f63accb200cdb39',
    'lib/study-library.ts':'88b6f0937a24eca205f2f65b878dc2b33958ecbc241949579af62ab563f2cfc1',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256:hash}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const data=readFileSync(base+file.path);assert.equal(sha(data),file.sha256);return data.toString();
  }).join('\n');
  for(const id of ['v1-frontal-lacrimal-subset','v1-nasociliary-subset','infrahyoid-superficial-pair','infrahyoid-deep-pair','mediastinal-conduits-thymus','FMA52656','FMA52657'])assert.ok(runtime.includes(id),id);
});
