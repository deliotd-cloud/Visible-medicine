import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

// Read only source bytes. No website modules, tests, SSR, transpiler or validators load.
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const atlas='F:/VisibleMedicine/atlas';
const stage='F:/VisibleMedicine/staging/20261022-tour-reading-family-admission';
const queue='F:/VisibleMedicine/staging/20261022-spinal-step-wrist-consolidated/QUEUE.json';
const read=(base,path)=>readFileSync(join(base,path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(readFileSync(queue)),'9de5a86b16d6cd39e935a566ae94c38fdebe2015cb74517c86541b8768c1d62d');
for(const name of ['atlas-tour-reading-focus.test.ts','atlas-tour-reference-reading.test.ts'])
  assert.equal(readFileSync(queue,'utf8').includes(name),false,`${name}: already owned by queue`);
const pinned={
  'tests/atlas-tour-reading-focus.test.ts':'fa381c5f25bb9b9877bbba0bab615c2b4a2b96d02005c01bce2c7a75bf5d3246',
  'tests/atlas-tour-reference-reading.test.ts':'252f5eaa094a6c5943a43cc9f38112fa441d8e309c987007b32e1230ac58e9b1',
  'tests/current-atlas-delivery.mjs':'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5',
  'tests/fixtures/current-atlas-delivery.json':'db46c1722ed839a4c8a57bd9bad4028dd90f5cb765641172ab4cdc9581e0d80f',
};
for(const [path,digest] of Object.entries(pinned))assert.equal(sha(read(website,path)),digest,`frozen source drift: ${path}`);
const declarations=[
  {
    name:'atlas-tour-reading-focus.test.ts',tests:2,
    candidateSha:'5934c407f3ca59a9eee8e5d7294deefcd5f4a934c85d285bd85a80e1eee637cd',
    seams:[
      ["  const committed=execFileSync('git',['--no-replace-objects','show',revision+':'+path],{cwd:sourceRoot});\n  const runtimeCommitted=execFileSync('git',['--no-replace-objects','show',pin.runtimeSources[module]+':'+path],{cwd:sourceRoot});\n  const historical=",
       "  const committed=execFileSync('git',['show',revision+':'+path],{cwd:sourceRoot});\n  const historical="],
      ["  assert.equal(manifest.sourceCommit,pin.runtimeSources[module]);\n",
       "  assert.equal(manifest.sourceCommit,revision);\n"],
      ["  const inputs=json(prefix+'source-inputs.json');assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,sha(runtimeCommitted));\n",
       "  const inputs=json(prefix+'source-inputs.json');assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,currentHash);\n"],
      [" const sourceRoot=currentAtlasDeliveryRoot(),review=json('atlas-review/manifest.json'),pin=validateCurrentAtlasDelivery();\n assert.equal(pin.source,revision);\n for(const [path,,module] of bindings){",
       " const sourceRoot=currentAtlasDeliveryRoot(),review=json('atlas-review/manifest.json');\n for(const [path,,module] of bindings){"],
      ["  const committed=execFileSync('git',['--no-replace-objects','show',revision+':'+path],{cwd:sourceRoot});\n  const runtimeCommitted=execFileSync('git',['--no-replace-objects','show',pin.runtimeSources[module]+':'+path],{cwd:sourceRoot});\n  const imported=",
       "  const committed=execFileSync('git',['show',revision+':'+path],{cwd:sourceRoot});\n  const imported="],
      ["   assert.deepEqual(learnerInputs.filter((file:any)=>file.path===path),[{path,sha256:sha(runtimeCommitted)}],'learner input');\n",
       "   assert.deepEqual(learnerInputs.filter((file:any)=>file.path===path),[{path,sha256:sha(committed)}],'learner input');\n"],
    ],
  },
  {
    name:'atlas-tour-reference-reading.test.ts',tests:2,
    candidateSha:'c1e5cdb42f885ee95a0ce71e371057aab3b07722cd46a50d54445dc3adbc3a24',
    seams:[
      ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",
       "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n"],
      [" const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,current);\n",''],
      ["  assert.equal(learner.sourceCommit,pin.runtimeSources[module]);\n",
       "  assert.equal(learner.sourceCommit,current);\n"],
      ["  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,sha(git(sourceRepo,pin.runtimeSources[module],path)));\n",
       "  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,record.sourceSha256);\n"],
    ],
  },
];
function restore(text,seams,original){
  let value=text;
  for(const [added,prior] of seams){
    assert.equal(value.split(added).length,2,`missing or duplicated seam: ${added}`);
    value=value.replace(added,prior);
  }
  assert.deepEqual(Buffer.from(value,'utf8'),original,'whole original source inverse');
}
for(const {name,tests,candidateSha,seams} of declarations){
  const original=read(stage,`tests/preimages/${name}.raw`);
  const candidate=read(stage,`tests/${name}`);
  const text=candidate.toString('utf8');
  assert.deepEqual(original,read(website,`tests/${name}`),`${name}: frozen preimage`);
  assert.equal(sha(candidate),candidateSha,`${name}: exact proposal`);
  assert.equal(original.includes(13),false,`${name}: original LF`);
  assert.equal(candidate.includes(13),false,`${name}: proposal LF`);
  assert.equal((text.match(/^test\(/gm)||[]).length,tests,`${name}: test registration count`);
  restore(text,seams,original);
  const bad=[
    text.replace(seams[0][0],''),
    text+seams.at(-1)[0],
    text.replace('pin.runtimeSources','pin.source'),
  ];
  for(const changed of bad)assert.throws(()=>restore(changed,seams,original),`${name}: edit seam refusal`);
  assert.match(original.toString('utf8'),/test\('historical reading-focus delivery|test\('Both learner modules/);
}
const pin=JSON.parse(read(website,'tests/fixtures/current-atlas-delivery.json'));
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(pin.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
assert.equal(pin.runtimeSources['head-neck'],pin.source);
const review=JSON.parse(read(website,'atlas-review/manifest.json'));
assert.equal(sha(read(website,'atlas-review/manifest.json')),pin.documents['atlas-review/manifest.json']);
assert.equal(review.revision,pin.source);
const committed=(revision,path)=>execFileSync('git',['--no-replace-objects','show',`${revision}:${path}`],{cwd:atlas,maxBuffer:32e6,windowsHide:true});
for(const [module,path] of [['head-neck','app/regional-guided-learning.tsx'],['shoulder','app/shoulder-tour-player.tsx']]){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=JSON.parse(read(website,base+'manifest.json'));
  const inputs=JSON.parse(read(website,base+'source-inputs.json'));
  assert.equal(sha(read(website,base+'manifest.json')),pin.documents[base+'manifest.json']);
  assert.equal(sha(read(website,base+'source-inputs.json')),pin.documents[base+'source-inputs.json']);
  assert.equal(manifest.sourceCommit,pin.runtimeSources[module]);
  const runtimeRows=inputs.filter(row=>row.path===path);
  const reviewRows=review.files.filter(row=>row.path===path);
  assert.equal(runtimeRows.length,1);assert.equal(reviewRows.length,1);
  assert.equal(runtimeRows[0].sha256,sha(committed(pin.runtimeSources[module],path)),`${module}: literal family Git source`);
  assert.equal(reviewRows[0].sourceSha256,sha(committed(pin.source,path)),`${module}: literal current Review Git source`);
  assert.equal(reviewRows[0].importedSha256,sha(read(website,`atlas-review/${path}`)),`${module}: Review import`);
}
process.stdout.write(JSON.stringify({status:'PASS_SOURCE_ONLY',originals:Object.fromEntries(declarations.map(({name})=>[name,sha(read(stage,`tests/preimages/${name}.raw`))])),proposals:Object.fromEntries(declarations.map(({name})=>[name,sha(read(stage,`tests/${name}`))])),reviewRevision:pin.source,headRuntime:pin.runtimeSources['head-neck'],shoulderRuntime:pin.runtimeSources.shoulder,inverseSeams:10,mutantRefusals:6})+'\n');
