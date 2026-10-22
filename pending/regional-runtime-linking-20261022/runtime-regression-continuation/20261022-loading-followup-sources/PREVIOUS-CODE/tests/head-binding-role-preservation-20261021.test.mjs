import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

// Exact, enumerated whole-file role seams; no runtime diff or generic inverse.
const entries=[
  {
    "name": "head-practice-binding.test.mjs",
    "rawSha256": "2419b38ce72e3c4a6ba292a2d94029b8b0707375d221d4abf5bdf2c6d72a16f9",
    "hunks": [
      {
        "at": 233,
        "before": "",
        "after": "import {inflateSync} from 'node:zlib';\n"
      },
      {
        "at": 486,
        "before": "",
        "after": "const historic=readFileSync(new URL('./fixtures/head-binding-before-role-batch-20261021/practice-binder-after-keyboard.mjs.raw',import.meta.url),'utf8');\n"
      },
      {
        "at": 1400,
        "before": "",
        "after": "const witnessRoot='./fixtures/head-binding-before-role-batch-20261021/';\nfunction decodeHistorical(encoded,length,sha256){\n  assert(encoded.length<200000 && /^[A-Za-z0-9+/]+={0,2}\\n$/.test(encoded),'Bounded canonical base64 witness');\n  const compressed=Buffer.from(encoded.trim(),'base64');\n  assert.equal(compressed.toString('base64')+'\\n',encoded,'Canonical base64 encoding');\n  const bytes=inflateSync(compressed,{maxOutputLength:length});\n  assert.equal(bytes.length,length,'Exact historical witness byte length');\n  assert.equal(hash(bytes),sha256,'Exact historical witness SHA-256');\n  return bytes;\n}\nfunction historicalBytes(name,length,sha256){\n  return decodeHistorical(readFileSync(new URL(witnessRoot+name+'.deflate-base64.raw',import.meta.url),'utf8'),length,sha256);\n}\nconst historicalManifest=historicalBytes('practice-manifest-before-keyboard.json',376467,'1e3de01b08f3d1e9fefc3510f4996eb6e23615a5a23587f2d9d2e555dd0a1350');\nconst historicalBody=historicalBytes('practice-body-before-keyboard.json',214575,'191995f1f55843c4fc8f0996939da2313d76dd5dd2bf7526ff93f0d6753323fc');\nconst historicalRevisions=historicalBytes('practice-revisions-before-keyboard.json',12713,'25b9e20fe175ab4b75d8482929bb93e62725c4537c19a1f195968cf94f3bc99e');\nconst historicalBeforeInputs=JSON.parse(historicalBytes('practice-inputs-before-keyboard.json',266682,'0f82510f9243fa4615cf43a210bcdd4e284e6a4d771ab1e5ec17667eb867a746'));\nconst historicalAfterInputs=JSON.parse(historicalBytes('practice-inputs-after-keyboard.json',266822,'acbad30ecf452317221384c708022b3f5f2d4c3e8042ca82e572f91507bb43d7'));\nconst historicalOverride=new Map([\n  ['atlas-review/manifest.json',historicalManifest],\n  ['atlas-review/content/body-renderer-revision.json',historicalBody],\n  ['atlas-review/content/review-revisions.json',historicalRevisions],\n]);\ntest('historical witness decoder refuses malformed, oversized, and digest-altered input',()=>{\n  const encoded=readFileSync(new URL(witnessRoot+'practice-revisions-before-keyboard.json.deflate-base64.raw',import.meta.url),'utf8');\n  assert.throws(()=>decodeHistorical('!\\n',12713,'25b9e20fe175ab4b75d8482929bb93e62725c4537c19a1f195968cf94f3bc99e'));\n  assert.throws(()=>decodeHistorical(encoded,12712,'25b9e20fe175ab4b75d8482929bb93e62725c4537c19a1f195968cf94f3bc99e'));\n  assert.throws(()=>decodeHistorical(encoded,12713,'0'.repeat(64)));\n});\n"
      },
      {
        "at": 1585,
        "before": "function run(source,overrides=new Map()){\n",
        "after": "function run(source,overrides=new Map(),historicalInputs=null){\n"
      },
      {
        "at": 2248,
        "before": "    file=>overrides.get(file)??originalFile(file),\n",
        "after": "    file=>overrides.get(file)??(historicalInputs?.has(file)?historicalInputs.get(file):originalFile(file)),\n"
      },
      {
        "at": 2341,
        "before": "    (file,options)=>readdirSync(join(root,file),options),createHash,{log(){}});\n",
        "after": "    (file,options)=>historicalInputs ? historicalBeforeInputs.inputs\n      .map(input=>input.path).filter(path=>path.startsWith(file+'/'))\n      .map(path=>path.slice(file.length+1)).filter(path=>options?.recursive || !path.includes('/'))\n      : readdirSync(join(root,file),options),createHash,{log(){}});\n"
      },
      {
        "at": 3053,
        "before": "",
        "after": "function runHistorical(source,overrides=new Map()){\n  const inputs=new Map(historicalOverride);\n  // Match the original test's same-run resolver: executed body varies, but\n  // the bound source file is the unchanged archived candidate in each run.\n  inputs.set('scripts/bind-clinical-review.mjs',Buffer.from(historic));\n  return run(source,overrides,inputs);\n}\n\n"
      },
      {
        "at": 3657,
        "before": "test('practice binding retains the original binder and covers every new source and mutation',()=>{\n",
        "after": "test('historical practice binder inverse and current binding cover every new source and mutation',()=>{\n"
      },
      {
        "at": 3853,
        "before": "  assert.equal(candidate.split(fullAdded).length,2);\n  assert.equal(candidate.replace(fullAdded,''),before,'Complete original binder byte inverse');\n  const baseline=run(before),bound=run(candidate);\n",
        "after": "  assert.equal(hash(historic),'ab50acaf277aec8b7385b342c4c1a36fc607a351e1612e482ec6d95d6da7f5b7');\n  assert.equal(historic.split(fullAdded).length,2);\n  assert.equal(historic.replace(fullAdded,''),before,'Complete original binder byte inverse');\n  const baseline=runHistorical(before),bound=runHistorical(historic);\n"
      },
      {
        "at": 4463,
        "before": "  const originalBody=JSON.parse(readFileSync(join(root,'atlas-review/content/body-renderer-revision.json')));\n  const originalShoulder=JSON.parse(readFileSync(join(root,'atlas-review/content/review-revisions.json')));\n",
        "after": "  const originalBody=JSON.parse(historicalBody);\n  const originalShoulder=JSON.parse(historicalRevisions);\n"
      },
      {
        "at": 5136,
        "before": "",
        "after": "  const current=run(candidate);\n  exactCoverage(current);\n  const currentRecorded=JSON.parse(readFileSync(join(root,'atlas-review/integration-inputs.json')));\n  assert.equal(current.inputs.sourceCommit,currentRecorded.sourceCommit);\n  assert.equal(current.inputs.sha256,currentRecorded.sha256,'Current binder matches recorded source binding');\n"
      },
      {
        "at": 5316,
        "before": "    assert.notEqual(mutated.inputs.sha256,bound.inputs.sha256,`Mutation escaped binding: ${file}`);\n",
        "after": "    assert.notEqual(mutated.inputs.sha256,current.inputs.sha256,`Mutation escaped binding: ${file}`);\n"
      },
      {
        "at": 6173,
        "before": "  const liveTest=readFileSync(fileURLToPath(import.meta.url),'utf8');\n",
        "after": "  const liveTest=readFileSync(new URL(witnessRoot+'head-practice-binding.test.mjs.raw',import.meta.url),'utf8');\n  assert.equal(hash(liveTest),'2419b38ce72e3c4a6ba292a2d94029b8b0707375d221d4abf5bdf2c6d72a16f9');\n"
      },
      {
        "at": 6945,
        "before": "  assert.equal(inverse,oldTest,'Complete old test byte inverse; its assertions still execute above');\n  assert.equal(candidate.split(keyboardAdded).length,2,'One new keyboard binding line');\n  const oldBinding=run(candidate.replace(keyboardAdded,''));\n  const newBinding=run(candidate);\n",
        "after": "  assert.equal(inverse,oldTest,'Complete archived old test byte inverse; its assertions still execute above');\n  assert.equal(historic.split(keyboardAdded).length,2,'One historical keyboard binding line');\n  const oldBinding=runHistorical(historic.replace(keyboardAdded,''));\n  const newBinding=runHistorical(historic);\n"
      },
      {
        "at": 7764,
        "before": "    assert.equal(input.sha256,hash(originalFile(input.path)),`Current file bytes bound: ${input.path}`);\n",
        "after": "    assert.equal(input.sha256,hash(input.path==='scripts/bind-clinical-review.mjs'?Buffer.from(historic):originalFile(input.path)),`Same-run source bytes bound: ${input.path}`);\n  }\n  assert.equal(newInputs.get('scripts/bind-clinical-review.mjs'),hash(historic));\n  assert.notEqual(hash(historic),hash(historic.replace(keyboardAdded,'')),'Binder source changed for new input');\n  for(const [archive,count,binderHash] of [\n    [historicalBeforeInputs,1695,'b99a1e205774d68c5d8c65cf70e6e0f93e82a06e620177ea345aaacd66092bad'],\n    [historicalAfterInputs,1696,hash(historic)],\n  ]){\n    assert.equal(archive.sourceCommit,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');\n    assert.equal(archive.inputs.length,count,'Authentic source-path inventory count');\n    assert.equal(archive.sha256,hash(JSON.stringify(archive.inputs)),'Authentic source-path inventory digest');\n    assert.equal(archive.inputs.find(input=>input.path==='scripts/bind-clinical-review.mjs').sha256,binderHash);\n"
      },
      {
        "at": 7873,
        "before": "  assert.equal(newInputs.get('scripts/bind-clinical-review.mjs'),hash(candidate));\n  assert.notEqual(hash(candidate),hash(candidate.replace(keyboardAdded,'')),'Binder source changed for new input');\n",
        "after": "  assert.deepEqual(oldBinding.inputs.inputs.map(input=>input.path),historicalBeforeInputs.inputs.map(input=>input.path));\n  assert.deepEqual(newBinding.inputs.inputs.map(input=>input.path),historicalAfterInputs.inputs.map(input=>input.path));\n  const archivedOld=new Map(historicalBeforeInputs.inputs.map(input=>[input.path,input.sha256]));\n  const archivedNew=new Map(historicalAfterInputs.inputs.map(input=>[input.path,input.sha256]));\n  assert.equal(archivedOld.has('lib/head-index-keyboard.ts'),false);\n  assert.equal(archivedNew.has('lib/head-index-keyboard.ts'),true);\n  assert.deepEqual([...archivedOld].filter(([path,digest])=>archivedNew.get(path)!==digest).map(([path])=>path),[\n    'components/head-atlas.css','components/HeadAtlasViewer.tsx','scripts/bind-clinical-review.mjs',\n  ],'The archived snapshots also contain the genuine contemporaneous CSS/viewer changes');\n"
      }
    ]
  },
  {
    "name": "head-loading-review-binding.test.mjs",
    "rawSha256": "7a918dab1d3963a742c550c3f1a432b8ef42b9f0df6a6c6da1b9a5ee858773d2",
    "hunks": [
      {
        "at": 1932,
        "before": "  assert.equal(previous.source,pin.source);\n  assert.equal(previous.sourceTree,pin.sourceTree);\n  assert.notEqual(previous.reviewIntegration,pin.reviewIntegration);\n",
        "after": "  const afterBytes=readFileSync(new URL('./fixtures/head-binding-before-role-batch-20261021/head-loading-after-pin.json.raw',import.meta.url));\n  assert.equal(sha(afterBytes),'903fc8b1eb81ac3b2eefd2b1756222a2003a90dbb074e7227a2ac0fad76f618c','Authentic retained head-loading after-pin');\n  const after=JSON.parse(afterBytes);\n  assert.equal(previous.source,'bc925194ce3b388d4b6d9f73b4b3362ed4f2ad5f');\n  assert.equal(previous.source,after.source);\n  assert.equal(previous.sourceTree,after.sourceTree);\n  assert.notEqual(previous.reviewIntegration,after.reviewIntegration);\n  assert.notEqual(after.source,pin.source);\n"
      },
      {
        "at": 2164,
        "before": "",
        "after": "  assert.throws(()=>validateCurrentAtlasDelivery({pin:after}));\n"
      },
      {
        "at": 2320,
        "before": "      assert.equal(pin.documents[path],digest,path+' must retain its exact bytes');\n",
        "after": "      assert.equal(after.documents[path],digest,path+' must retain its exact bytes');\n"
      }
    ]
  },
  {
    "name": "native-focus-review-binding.test.mjs",
    "rawSha256": "4f69c6db89d21be5b3d9ab936695b239af18b1b1be88bde22d9081b2cb49ac21",
    "hunks": [
      {
        "at": 561,
        "before": " assert.equal(pin.source,'aaa8a6a428e74a2055310630f9dfee8731fe0eee');\n assert.equal(pin.sourceTree,'7c0b886d66d2adf64d6d29e44938f39d8cd61046');\n assert.equal(pin.reviewIntegration,'d7036f8da6dae70ead5f54469c8e8a9511a94aecfc8da3833d26f20476012e1b');\n assert.equal(review.revision,pin.source);assert.equal(review.files.length,pin.reviewSourceFiles);assert.equal(pin.reviewSourceFiles,1544);\n",
        "after": " const historicalBytes=readFileSync('tests/fixtures/current-atlas-delivery-aaa8a6a4.json');\n assert.equal(sha(historicalBytes),'d0550d6202c5121489f16a1ce292226994d7f525c9c1d8da8b0822822ecb48d2');\n const historical=JSON.parse(historicalBytes);\n assert.equal(historical.source,'aaa8a6a428e74a2055310630f9dfee8731fe0eee');\n assert.equal(historical.sourceTree,'7c0b886d66d2adf64d6d29e44938f39d8cd61046');\n assert.equal(historical.reviewIntegration,'d7036f8da6dae70ead5f54469c8e8a9511a94aecfc8da3833d26f20476012e1b');\n assert.equal(historical.reviewSourceFiles,1544);\n assert.throws(()=>validateCurrentAtlasDelivery({pin:historical}));\n assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');\n assert.equal(pin.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');\n assert.equal(review.revision,pin.source);assert.equal(review.files.length,pin.reviewSourceFiles);assert.equal(pin.reviewSourceFiles,1558);\n"
      },
      {
        "at": 950,
        "before": " assert.equal(binding.sourceCommit,pin.source);assert.equal(binding.sha256,pin.reviewIntegration);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);\n",
        "after": " assert.equal(binding.sourceCommit,pin.source);assert.equal(binding.sha256,pin.reviewIntegration);assert.equal(binding.inputs.length,1723);assert.equal(sha(JSON.stringify(binding.inputs)),binding.sha256);\n"
      }
    ]
  }
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const entry of entries){
  test('preserves complete original '+entry.name+' outside enumerated role seams',()=>{
    const raw=readFileSync(new URL('./fixtures/head-binding-before-role-batch-20261021/'+entry.name+'.raw',import.meta.url),'utf8');
    const candidate=readFileSync(new URL('./'+entry.name,import.meta.url),'utf8');
    assert.equal(hash(raw),entry.rawSha256,'Authenticated full original preimage');
    let expected=raw;
    for(const hunk of [...entry.hunks].reverse()){
      assert.equal(expected.slice(hunk.at,hunk.at+hunk.before.length),hunk.before,'Exact old hunk at original offset');
      expected=expected.slice(0,hunk.at)+hunk.after+expected.slice(hunk.at+hunk.before.length);
    }
    assert.equal(candidate,expected,'Whole candidate differs only at enumerated exact role seams');
    assert.throws(()=>assert.equal(candidate+'\n// unexpected assertion append\n',expected),'Unknown append must be refused');
    if(entry.name==='head-practice-binding.test.mjs'){
      const refusal="    assert.throws(()=>exactCoverage(run(candidate.replace(quoted,''))),/Missing or duplicate bound input/);\n";
      assert.equal(candidate.split(refusal).length,2,'One original omission-refusal assertion');
      assert.throws(()=>assert.equal(candidate.replace(refusal,''),expected),'Removed refusal must be rejected');
    }
  });
}
