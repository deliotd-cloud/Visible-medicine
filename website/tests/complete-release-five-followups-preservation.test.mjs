import {restoreReleaseDiagnosticContext} from './release-diagnostic-context-inverse.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const rows=[
  {
    "path": "tests/atlas-arterial-evidence-limits.test.mjs",
    "before": "d04a1842fc6b68f0b7be42a2d0206e93598b29e9d34c40ec7b5d3b1914296dbb",
    "after": "35aa317814977114af7caf761ca5b4504b319b92a76e3e18dd8b281fa50d608d",
    "edits": [
      {
        "i": 260,
        "j": 260,
        "before": [
          "  assert.equal(CURRENT_ATLAS_REVISION,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');"
        ],
        "after": [
          "  assert.equal(CURRENT_ATLAS_REVISION,'2381efe43b75f8a7fb768a069eecd7268c508dac');"
        ]
      }
    ],
    "original": "tests/fixtures/complete-release-before/atlas-arterial-evidence-limits.test.mjs.raw"
  },
  {
    "path": "tests/atlas-body-learning-component.test.mjs",
    "before": "fdb9016dee124c1a68278b281ec39a67fe6b27dc30b37161b434932823584c2d",
    "after": "3fcba11946ef40aeb8ad754962a9383851f61fc9950369a6f5c0f65920f159b6",
    "edits": [
      {
        "i": 9,
        "j": 9,
        "before": [],
        "after": [
          "import {restorePreHeadAccessWrapper} from './head-access-wrapper-inverse.mjs';"
        ]
      },
      {
        "i": 184,
        "j": 185,
        "before": [
          "    const beforeLearning=name==='AtlasRuntimeFrame'?restorePreExpansionFrame(candidate):candidate;"
        ],
        "after": [
          "    const beforeLearning=restorePreHeadAccessWrapper(name==='AtlasRuntimeFrame'?restorePreExpansionFrame(candidate):candidate,name);"
        ]
      }
    ],
    "original": "tests/fixtures/complete-release-before/atlas-body-learning-component.test.mjs.raw"
  },
  {
    "path": "tests/atlas-cervical-epoch-preservation.test.mjs",
    "before": "ff62e76523d50e2a9e476bf3d2bda53225a23a2ff7326bc58b2ce693ee994367",
    "after": "bb3c2bb8b360b9d6bbba2e809525366afd5d827f27e9d61e54d01a78e2d28754",
    "edits": [
      {
        "i": 5,
        "j": 5,
        "before": [],
        "after": [
          "import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';"
        ]
      },
      {
        "i": 84,
        "j": 85,
        "before": [
          "  const sourceRepo=process.env.VM_ATLAS_SOURCE_REPO||'F:/VisibleMedicine/atlas';"
        ],
        "after": [
          "  const sourceRepo=currentAtlasDeliveryRoot();"
        ]
      },
      {
        "i": 87,
        "j": 88,
        "before": [
          "  const windows=readFileSync(sourceRepo+'/'+path);"
        ],
        "after": [
          "  assert.equal(raw.length,14682);",
          "  assert.equal(sha(raw),'7a873d9c6ed62578a7ee5603d68d6a8fbf6e3ccc0b52db6a3ad8b952f8cf7271');",
          "  // The authenticated Windows file converts only these twelve LF positions.",
          "  const windowsLines=new Set([207,208,209,211,212,213,214,215,216,217,218,219]);",
          "  let line=0;",
          "  const windows=Buffer.from(raw.toString('utf8').replace(/\\n/g,()=>windowsLines.has(++line)?'\\r\\n':'\\n'));",
          "  assert.equal(line,256);",
          "  assert.equal(windows.length,14694);"
        ]
      },
      {
        "i": 89,
        "j": 97,
        "before": [],
        "after": [
          "  assert.equal((windows.toString('utf8').match(/\\r\\n/g)||[]).length,12);",
          "  assert.ok(Buffer.from(windows.toString('utf8').replaceAll('\\r\\n','\\n')).equals(raw));"
        ]
      },
      {
        "i": 93,
        "j": 103,
        "before": [
          "  for(const bytes of [Buffer.concat([raw,Buffer.from(' ')]),Buffer.from(raw.toString().replaceAll('\\n','\\r\\n')),Buffer.concat([windows,Buffer.from('\\nchanged source')])]){"
        ],
        "after": [
          "  const checkout=readFileSync(sourceRepo+'/'+path);",
          "  assert.ok(checkout.equals(raw)||checkout.equals(windows),'Actual clean checkout is an authenticated representation');",
          "  assert.deepEqual(witness(checkout),{path,sha256:sha(raw)});",
          "  for(const bytes of [Buffer.concat([raw,Buffer.from(' ')]),",
          "    Buffer.from(raw.toString('utf8').replaceAll('\\n','\\r\\n')),",
          "    Buffer.concat([windows,Buffer.from('\\nchanged source')]),",
          "    Buffer.from(raw.toString('utf8').replace('\\n','\\r\\n'))]){"
        ]
      }
    ],
    "original": "tests/fixtures/complete-release-before/atlas-cervical-epoch-preservation.test.mjs.raw"
  },
  {
    "path": "tests/atlas-cranial-bone-quiz.test.ts",
    "before": "74aec9f0f2c65b808ecd01e0cf3594be5878b9df89ae21c3a71f78c3c5ea6885",
    "after": "d51ab678fc56fa382275e891f54dc8e3f30bef3ec11498b46202d36f689107e2",
    "edits": [
      {
        "i": 5,
        "j": 5,
        "before": [
          "import {readFileSync, readdirSync} from 'node:fs';"
        ],
        "after": [
          "import {readFileSync} from 'node:fs';"
        ]
      },
      {
        "i": 8,
        "j": 8,
        "before": [],
        "after": [
          "import {emittedTeaching} from './atlas-emitted-teaching.ts';"
        ]
      },
      {
        "i": 64,
        "j": 65,
        "before": [
          "  const learnerAsset = readdirSync('public/atlas-runtime/head-neck/assets').filter(name => /^body-content-[\\w-]+\\.js$/.test(name));",
          "  assert.equal(learnerAsset.length, 1, 'one lazy body teaching asset');",
          "  const shippedTeaching = readFileSync(`public/atlas-runtime/head-neck/assets/${learnerAsset[0]}`, 'utf8');"
        ],
        "after": [
          "  const learnerBase = 'public/atlas-runtime/head-neck/';",
          "  const learnerManifest = json(learnerBase + 'manifest.json');",
          "  assert.equal(learnerManifest.sourceCommit, pin.runtimeSources['head-neck']);",
          "  const shippedTeaching = emittedTeaching(learnerBase, learnerManifest.files);"
        ]
      }
    ],
    "original": "tests/fixtures/complete-release-before/atlas-cranial-bone-quiz.test.ts.raw"
  },
  {
    "path": "tests/atlas-hand-vessel-xray-preservation.test.mjs",
    "before": "d1d148fbc34145460f6fab7fdef3d2c882e78ff931258b2989ed68b516d69840",
    "after": "993aa0a85e6a27b1de51766c66d878e0a782b79b48bbc5b272439564d5db298e",
    "edits": [
      {
        "i": 11,
        "j": 11,
        "before": [],
        "after": [
          "const rendererEpoch=readFileSync(new URL('./fixtures/atlas-hand-vessel-xray.renderer-epoch-a91e7a.mjs.raw',import.meta.url));"
        ]
      },
      {
        "i": 22,
        "j": 23,
        "before": [],
        "after": [
          "const laterSourceSha='f0c3a3ab07860965154ad8557066da57b343a6d7e98bff1b8436363a223988db';"
        ]
      },
      {
        "i": 96,
        "j": 98,
        "before": [],
        "after": [
          "function inverseLaterSource(bytes){",
          "  const candidate=bytes.toString('utf8'),prior=rendererEpoch.toString('utf8');",
          "  assert.deepEqual(Buffer.from(candidate,'utf8'),bytes,'Current source must decode losslessly');",
          "  assert.equal(sha(rendererEpoch),epochMigrationSha);",
          "  const section=(source,begin,end,from=0)=>{",
          "    const start=source.indexOf(begin,from),finish=source.indexOf(end,start+begin.length);",
          "    assert(start>=0&&finish>start,`Missing inverse seam ${begin}`);",
          "    assert.equal(source.indexOf(begin,start+1),-1,`Repeated inverse seam ${begin}`);",
          "    return source.slice(start,finish);",
          "  };",
          "  const validator=section(candidate,'const historicalValidatorBytes=','const oldOriginal=');",
          "  const admissionCase=\"test('the recovered 589 delivery closes exactly and its selected imported sources match Git',()=>{\\n\";",
          "  const admission=section(candidate,'  assert.throws(()=>validateCurrentAtlasDelivery',",
          "    '  assert.equal(historicalPin.source,historical);',candidate.indexOf(admissionCase));",
          "  const currentCase=\"test('current 7b delivery binds the complete imported graph and retains protected hand teaching',async()=>{\\n\";",
          "  const runtimeBegin='  for(const region of regions){\\n',runtimeEnd='  const catalogPath=';",
          "  const runtime=(source)=>{",
          "    const caseStart=source.indexOf(currentCase);assert(caseStart>=0);",
          "    const start=source.indexOf(runtimeBegin,caseStart)+runtimeBegin.length;",
          "    assert(start>=runtimeBegin.length);",
          "    const end=source.indexOf(runtimeEnd,start);assert(end>start);",
          "    return source.slice(start,end);",
          "  };",
          "  const laterRuntime=runtime(candidate),priorRuntime=runtime(prior);",
          "  assert.equal(sha(validator),'b2240be0c616f339bb0c3efc7a9c2c18e07e13184a61e5d2929c7714b8eae8a1');",
          "  assert.equal(sha(admission),'6bf6c92511209df03102b897cf62433639c37aa9675a571748dca8a7ffd17821');",
          "  assert.equal(sha(laterRuntime),'ab9be06856890de00a1ddc7e6092e51ba52976edab22c64023c3a953c6ba7b44');",
          "  assert.equal(sha(priorRuntime),'70ccdf8d81b6f5e60cd5bae9e9ca8b09c75882a4808f360edb97062c33a3b5dc');",
          "  const replaceOne=(source,old,value)=>{",
          "    assert.equal(source.split(old).length,2,`Inverse seam is not unique: ${old.slice(0,60)}`);",
          "    return source.replace(old,value);",
          "  };",
          "  let restored=replaceOne(candidate,validator,'');",
          "  restored=replaceOne(restored,admission,",
          "    '  validateCurrentAtlasDelivery({pin:historicalPin,read:historicalRead});\\n');",
          "  restored=replaceOne(restored,laterRuntime,priorRuntime);",
          "  assert.equal(restored,prior,'Only the named historical validator and runtime-source seams may follow the renderer epoch');",
          "  assert.equal(sha(bytes),laterSourceSha);",
          "  return Buffer.from(restored,'utf8');",
          "}",
          ""
        ]
      },
      {
        "i": 97,
        "j": 140,
        "before": [
          "  const candidate=bytes.toString(),before=rendererPostimage.toString();"
        ],
        "after": [
          "  const candidate=inverseLaterSource(bytes).toString(),before=rendererPostimage.toString();"
        ]
      },
      {
        "i": 99,
        "j": 142,
        "before": [
          "  assert.equal(sha(bytes),epochMigrationSha);"
        ],
        "after": [
          "  assert.equal(sha(Buffer.from(candidate,'utf8')),epochMigrationSha);"
        ]
      },
      {
        "i": 121,
        "j": 164,
        "before": [],
        "after": [
          "    ['historical validator','const validatorFunctionEnd=','const validatorFunctionStop='],",
          "    ['historical refusal','Schema-1 history cannot be admitted','Schema-1 history was admitted'],",
          "    ['runtime family','pin.runtimeSources[region]','pin.runtimeSources.head-neck'],"
        ]
      }
    ],
    "original": "tests/fixtures/complete-release-before/atlas-hand-vessel-xray-preservation.test.mjs.raw"
  }
],sha=b=>createHash('sha256').update(b).digest('hex');
const successorRoles={
 "tests/atlas-body-learning-component.test.mjs": {
  "sha": "edad2769b2afdd3316d1470c8c72a5321e861638f93bae12ba2e51a7ff4e3bb6",
  "edits": [
   {
    "at": 10,
    "before": [],
    "after": [
     "import {restorePreGuidedCaption} from './head-guided-caption-inverse.mjs';"
    ]
   },
   {
    "at": 27,
    "before": [],
    "after": [
     "    b.onResolve({filter:/^\\.\\/atlas-runtime-state(?:\\.ts)?$/},()=>({path:path.join(root,'components/atlas-runtime-state.ts')}));"
    ]
   },
   {
    "at": 42,
    "before": [
     "function harness(){"
    ],
    "after": [
     "function harness(actualHref=frameHref){"
    ]
   },
   {
    "at": 49,
    "before": [
     "  const contentWindow={location:{href:frameHref},postMessage:(value,origin)=>sent.push({value,origin})};"
    ],
    "after": [
     "  const contentWindow={location:{href:actualHref},postMessage:(value,origin)=>sent.push({value,origin})};"
    ]
   },
   {
    "at": 107,
    "before": [],
    "after": [
     "});",
     "",
     "test('canonical head-neck directory completes a fresh ready and selected handshake',()=>{",
     "  const h=harness('https://vm.test/atlas-runtime/head-neck/?region=whole-body&study=1');",
     "  h.render();assert.equal(h.sent.length,1);",
     "  const first=h.sent[0].value;",
     "  assert.equal(first.type,'vm-atlas-learning-selection-request');",
     "  assert.equal(first.revision,manifest.sourceCommit);assert.equal(first.region,'whole-body');",
     "  assert.equal(h.sent[0].origin,'https://vm.test');",
     "  h.dispatch({type:'vm-atlas-learning-selection-ready',version:1,revision:manifest.sourceCommit,region:'whole-body'});",
     "  assert.equal(h.sent.length,2);assert.notEqual(h.sent[1].value.session,first.session);",
     "  h.dispatch(h.reply());h.render();assert.equal(h.state(),'selected');",
     "  const link=h.anchor();assert.ok(link);",
     "  let prevented=0;link.props.onClick({preventDefault(){prevented++;}});",
     "  assert.equal(prevented,0,'Current canonical document allows its verified related link');",
     "  assert.equal(h.fetches.length,0);h.unmount();",
     "});",
     "",
     "test('canonical alias refuses other origins, paths, query spellings and fragments',()=>{",
     "  const directory='https://vm.test/atlas-runtime/head-neck/';",
     "  for(const actual of [",
     "    'https://wrong.test/atlas-runtime/head-neck/?region=whole-body&study=1',",
     "    'https://vm.test/atlas-runtime/shoulder/?region=whole-body&study=1',",
     "    'https://vm.test/atlas-runtime/head-neck/other/?region=whole-body&study=1',",
     "    directory+'?region=whole-body',",
     "    directory+'?study=1&region=whole-body',",
     "    directory+'?region=whole-body&study=1&study=1',",
     "    directory+'?region=whole-body&study=2',",
     "    directory+'?region=whole-body&study=1#selected',",
     "  ]){",
     "    const h=harness(actual);h.render();",
     "    assert.equal(h.sent.length,0,actual);",
     "    h.dispatch({type:'vm-atlas-learning-selection-ready',version:1,revision:manifest.sourceCommit,region:'whole-body'});",
     "    assert.equal(h.sent.length,0,actual);",
     "    h.render();assert.equal(h.state(),'waiting',actual);assert.equal(h.anchor(),undefined,actual);",
     "    h.unmount();",
     "  }",
     "});",
     "",
     "test('canonical link revokes on later navigation or replacement document',()=>{",
     "  const canonical='https://vm.test/atlas-runtime/head-neck/?region=whole-body&study=1';",
     "  for(const change of [",
     "    h=>{h.contentWindow.location.href='https://vm.test/atlas-runtime/head-neck/?study=1&region=whole-body';},",
     "    h=>{h.element.contentDocument={readyState:'complete'};},",
     "    h=>{h.element.src='/atlas-runtime/head-neck/?region=whole-body&study=1';},",
     "  ]){",
     "    const h=harness(canonical);h.render();h.dispatch(h.reply());h.render();",
     "    const link=h.anchor();assert.ok(link);change(h);",
     "    let prevented=0;link.props.onClick({preventDefault(){prevented++;}});",
     "    assert.equal(prevented,1,'Stale canonical link must be revoked');",
     "    h.dispatch(h.reply('empty',{sequence:2}));h.render();",
     "    assert.equal(h.state(),'selected','Stale document cannot change the accepted snapshot');",
     "    h.unmount();",
     "  }"
    ]
   },
   {
    "at": 241,
    "before": [
     "    const beforeLearning=restorePreHeadAccessWrapper(name==='AtlasRuntimeFrame'?restorePreExpansionFrame(candidate):candidate,name);"
    ],
    "after": [
     "    const beforeLearning=restorePreHeadAccessWrapper(name==='AtlasRuntimeFrame'?restorePreExpansionFrame(candidate):name==='HeadAtlasGuidedModel'?restorePreGuidedCaption(candidate):candidate,name);"
    ]
   }
  ]
 },
 "tests/atlas-cervical-epoch-preservation.test.mjs": {
  "sha": "4d8ff2445019a1ab272e166b23b2246d83681154127e29e83e269ea2a6a6e8e1",
  "edits": [
   {
    "at": 2,
    "before": [
     "import {readFileSync} from 'node:fs';"
    ],
    "after": [
     "import {readFileSync as originalReadFileSync} from 'node:fs';"
    ]
   },
   {
    "at": 6,
    "before": [],
    "after": [
     "import {authenticateCervicalCollector} from './cervical-delivery-roles.mjs';"
    ]
   },
   {
    "at": 11,
    "before": [],
    "after": [
     "// Normalize only the exact collector before the unchanged source hash and seam proof.",
     "const readFileSync=(target,options)=>{",
     " if(String(target)!==String(proposedPath))return originalReadFileSync(target,options);",
     " const original=authenticateCervicalCollector(originalReadFileSync(target));",
     " return options==='utf8'?original.toString('utf8'):original;",
     "};"
    ]
   }
  ]
 }
};
function recoverSuccessor(row,bytes){
 const role=successorRoles[row.path];if(!role||sha(bytes)===row.after)return bytes;
 assert.equal(sha(bytes),role.sha,'Exact later full test root: '+row.path);
 const lines=bytes.toString('utf8').split('\n');
 assert.deepEqual(Buffer.from(lines.join('\n'),'utf8'),bytes,'Lossless successor text');
 for(const edit of [...role.edits].reverse()){
  assert.deepEqual(lines.slice(edit.at,edit.at+edit.after.length),edit.after,'Exact successor lines: '+row.path);
  lines.splice(edit.at,edit.after.length,...edit.before);
 }
 const restored=Buffer.from(lines.join('\n'),'utf8');
 assert.equal(sha(restored),row.after,'Complete prior test root: '+row.path);
 return restored;
}
function inverse(row,bytes){if(row.path==='tests/atlas-arterial-evidence-limits.test.mjs')bytes=restoreReleaseDiagnosticContext(row.path,bytes);bytes=recoverSuccessor(row,bytes);assert.equal(sha(bytes),row.after);const lines=bytes.toString().split('\n');for(const e of [...row.edits].reverse()){assert.deepEqual(lines.slice(e.j,e.j+e.after.length),e.after);lines.splice(e.j,e.after.length,...e.before);}return Buffer.from(lines.join('\n'));}
test('all five reviewed follow-ups retain every complete original test and refusal assertion',()=>{for(const row of rows){const before=readFileSync(new URL('../'+row.original,import.meta.url)),after=readFileSync(new URL('../'+row.path,import.meta.url));assert.equal(sha(before),row.before);assert.deepEqual(inverse(row,after),before);}});
test('foreign additions and removed assertions cannot pass any of the five source inverses',()=>{for(const row of rows){const after=readFileSync(new URL('../'+row.path,import.meta.url));assert.throws(()=>inverse(row,Buffer.concat([after,Buffer.from('/* foreign */')])));const changed=Buffer.from(after);changed[0]^=1;assert.throws(()=>inverse(row,changed));}});
