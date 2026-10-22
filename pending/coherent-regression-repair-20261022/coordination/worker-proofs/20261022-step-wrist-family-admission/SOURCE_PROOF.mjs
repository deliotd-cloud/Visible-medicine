import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

// Pure source-byte proof; no website modules, test runner, transpiler or validator loaded.
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website';
const atlas='F:/VisibleMedicine/atlas';
const stage='F:/VisibleMedicine/staging/20261022-step-wrist-family-admission';
const read=(base,path)=>readFileSync(join(base,path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pinned={
  'tests/atlas-tour-step-navigation.test.ts':'d28269ffa5b667a7f039468a4c26e53f5e494ec2e5525eb96f9dcf39bd7b0534',
  'tests/atlas-wrist-imaging-correction.test.ts':'a25df4cfcfde998403b55aa8016626451b164625e4606b0f3c002b8e800da7a4',
  'tests/current-atlas-delivery.mjs':'52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5',
  'tests/fixtures/current-atlas-delivery.json':'db46c1722ed839a4c8a57bd9bad4028dd90f5cb765641172ab4cdc9581e0d80f',
};
for(const [path,hash] of Object.entries(pinned))assert.equal(sha(read(website,path)),hash,`frozen source drift: ${path}`);
const files=[
  {
    name:'atlas-tour-step-navigation.test.ts',
    expected:'d30957715cf6d525f058682564c158ac9ca43fde4eeefb6a4136377297a2abe3',
    newline:'\n',tests:2,
    seams:[
      ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n",
       "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';\n"],
      [" const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,current);\n",''],
      ["  assert.equal(manifest.sourceCommit,pin.runtimeSources[module]);\n",
       "  assert.equal(manifest.sourceCommit,current);\n"],
      ["   assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,sha(git(sourceRepo,pin.runtimeSources[module],path)));\n",
       "   assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);\n"],
    ],
  },
  {
    name:'atlas-wrist-imaging-correction.test.ts',
    expected:'80885a37bd0edeb9525fbf75551bf9afc8c8b8c6e16c9984851d053ebc773025',
    newline:'\r\n',tests:1,
    seams:[
      ["  assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);\r\n",
       "  assert.equal(manifest.sourceCommit,pin.source);\r\n"],
      ["   if(actual){\r\n    assert(imported,path);\r\n    const runtimeSource=execFileSync('git',['--no-replace-objects','show',`${pin.runtimeSources[name]}:${path}`],{...options,cwd:currentAtlas});\r\n    assert.equal(actual.sha256,hash(runtimeSource));\r\n   }\r\n",
       "   if(actual)assert.equal(actual.sha256,imported.sourceSha256);\r\n"],
    ],
  },
];
function inverse(text,seams,original){
  let restored=text;
  for(const [added,prior] of seams){
    assert.equal(restored.split(added).length,2,`missing or duplicated edit seam: ${added}`);
    restored=restored.replace(added,prior);
  }
  assert.deepEqual(Buffer.from(restored,'utf8'),original,'whole original test failed byte inverse');
}
for(const {name,expected,newline,tests,seams} of files){
  const original=read(stage,`tests/preimages/${name}.raw`);
  const candidate=read(stage,`tests/${name}`);
  const text=candidate.toString('utf8');
  assert.deepEqual(original,read(website,`tests/${name}`));
  assert.equal(sha(candidate),expected);
  assert.equal((text.match(/^test\(/gm)||[]).length,tests,`${name}: all registered tests`);
  if(newline==='\r\n'){
    assert.equal((text.match(/\r\n/g)||[]).length,(text.match(/\n/g)||[]).length,`${name}: CRLF intact`);
    assert.equal((original.toString('utf8').match(/\r\n/g)||[]).length,(original.toString('utf8').match(/\n/g)||[]).length,`${name}: original CRLF`);
  }else{
    assert.equal(candidate.includes(13),false,`${name}: no inserted CR`);
    assert.equal(original.includes(13),false,`${name}: original LF`);
  }
  inverse(text,seams,original);
  for(const changed of [
    text.replace(seams[0][0],''),
    text+seams.at(-1)[0],
    text.replace(seams.at(-1)[0],seams.at(-1)[0].replace('pin.runtimeSources','pin.source')),
  ])assert.throws(()=>inverse(changed,seams,original),`${name}: source inverse refusal`);
  assert.match(original.toString('utf8'),/assert\.equal\(review\.revision,(?:current|pin\.source)\)/,`${name}: current Review source preserved`);
}
const pin=JSON.parse(read(website,'tests/fixtures/current-atlas-delivery.json'));
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(pin.runtimeSources['head-neck'],pin.source);
for(const name of ['shoulder','female-pelvis','lower-limb'])assert.equal(pin.runtimeSources[name],'190a63238eadcf906abe89dcbb6a67c88afe70b9');
const review=JSON.parse(read(website,'atlas-review/manifest.json'));
assert.equal(sha(read(website,'atlas-review/manifest.json')),pin.documents['atlas-review/manifest.json']);
assert.equal(review.revision,pin.source);
const committed=(revision,path)=>execFileSync('git',['--no-replace-objects','show',`${revision}:${path}`],{cwd:atlas,maxBuffer:32e6,windowsHide:true});
const selections={
  'head-neck':['app/tour-step-picker.tsx','app/tour-step-picker.css','lib/wrist-imaging.ts','content/wrist-imaging-concepts.ts','content/wrist-imaging-pins.json'],
  shoulder:['app/tour-step-picker.tsx','app/tour-step-picker.css','lib/wrist-imaging.ts','content/wrist-imaging-concepts.ts','content/wrist-imaging-pins.json'],
  'female-pelvis':[],
  'lower-limb':[],
};
for(const [name,paths] of Object.entries(selections)){
  const base=`public/atlas-runtime/${name}/`;
  const manifest=JSON.parse(read(website,base+'manifest.json'));
  const inputs=JSON.parse(read(website,base+'source-inputs.json'));
  assert.equal(sha(read(website,base+'manifest.json')),pin.documents[base+'manifest.json']);
  assert.equal(sha(read(website,base+'source-inputs.json')),pin.documents[base+'source-inputs.json']);
  assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);
  for(const path of paths){
    const runtimeRows=inputs.filter(row=>row.path===path);
    const reviewRows=review.files.filter(row=>row.path===path);
    assert.equal(runtimeRows.length,1,`${name}: exact runtime input ${path}`);
    assert.equal(reviewRows.length,1,`Review: exact source ${path}`);
    assert.equal(runtimeRows[0].sha256,sha(committed(pin.runtimeSources[name],path)),`${name}: family Git bytes ${path}`);
    assert.equal(reviewRows[0].sourceSha256,sha(committed(pin.source,path)),`Review: current Git bytes ${path}`);
  }
}
for(const name of ['female-pelvis','lower-limb']){
  const inputs=JSON.parse(read(website,`public/atlas-runtime/${name}/source-inputs.json`));
  for(const path of ['lib/wrist-imaging.ts','content/wrist-imaging-concepts.ts','content/wrist-imaging-pins.json'])
    assert.equal(inputs.some(row=>row.path===path),false,`${name}: no wrist-imaging input ${path}`);
}
process.stdout.write(JSON.stringify({status:'PASS_SOURCE_ONLY',originals:Object.fromEntries(files.map(({name})=>[name,sha(read(stage,`tests/preimages/${name}.raw`))])),proposals:Object.fromEntries(files.map(({name})=>[name,sha(read(stage,`tests/${name}`))])),runtimeSources:pin.runtimeSources,reviewSource:pin.source,selectedFamilySourcePaths:10,inverseSeams:6,mutantRefusals:6})+'\n');
