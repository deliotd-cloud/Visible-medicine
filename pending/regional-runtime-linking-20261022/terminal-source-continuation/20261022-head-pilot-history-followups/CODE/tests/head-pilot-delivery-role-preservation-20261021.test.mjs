import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createClosedHead87Reader,readHead87File,listHead87Directory,historicalHead87Runtime} from './historical-head-pilot-87-read.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>readFileSync(new URL(p,import.meta.url));
const raw='fixtures/head-pilot-delivery-before-role-20261021/';
const edits=[
  [
    "import {createHash} from 'node:crypto';",
    "import {createHash} from 'node:crypto';\nimport {readHead87File,listHead87Directory,historicalHead87Runtime} from './historical-head-pilot-87-read.mjs';\nimport {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';"
  ],
  [
    "  assert.equal(current,original.text);",
    "  undo(\"import {readFile as readCurrentFile} from 'node:fs/promises';\\n\",'');\n  undo(\"test('current190 head-neck scene remains separately source-bound and non-clinical',async()=>{\\n  const manifestBytes=await readCurrentFile(new URL('manifest.json',runtime));\\n  assert.equal(sha(manifestBytes),'74ba7688c8dfd8939a160f56a04e7825b11183f947f1074c6825c0f39904d4ec');\\n  const manifest=JSON.parse(manifestBytes.toString());\\n  assert.equal(manifest.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\\n  assert.equal(manifest.region,'head-neck');\\n  assert.equal(manifest.structures,291);assert.equal(manifest.nestedSelections,77);\\n  assert.equal(manifest.clinicalApproved,false);assert.equal(manifest.patientDataIncluded,false);\\n  const scene=manifest.files.filter((file:{path:string})=>file.path.startsWith('assets/body-scene-')&&file.path.endsWith('.js'));\\n  assert.deepEqual(scene,[{path:'assets/body-scene-Bzofy8VU.js',bytes:1119189,\\n    sha256:'8d36d802cfb8690e9bceff8c061bd7fc9e764bb5a6f0efa5a8138ccf8c0a7d0c'}]);\\n  const bytes=await readCurrentFile(new URL(scene[0].path,runtime));\\n  assert.equal(bytes.length,scene[0].bytes);assert.equal(sha(bytes),scene[0].sha256);\\n  assert.notEqual(scene[0].sha256,'1d5cca6d39e99fc8aa1e8c40b7cd10c10cd2b49654314632b66f4990c17d5fea');\\n});\\n\",'');\n  assert.equal(current,original.text);"
  ],
  [
    "test('current head-neck delivery keeps exact source, regional/model scope and licence boundaries',async()=>{\n",
    "test('current head-neck delivery keeps exact source, regional/model scope and licence boundaries',async()=>{\n  // Original complete87ed theorem, authenticated independently of current190.\n  const readFile=readHead87File,readdir=listHead87Directory,runtime=historicalHead87Runtime;\n"
  ]
];
const append="\ntest('current190 head-neck delivery independently keeps the complete source, regional/model scope and licence boundaries',async()=>{\n  assert.equal(validateCurrentAtlasDelivery().source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  const manifestBytes=await readFile(new URL('manifest.json',runtime));\n  assert.equal(sha(manifestBytes),'74ba7688c8dfd8939a160f56a04e7825b11183f947f1074c6825c0f39904d4ec');\n  const manifest=JSON.parse(manifestBytes);\n  assert.equal(manifest.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9');\n  assert.equal(manifest.schemaVersion,2);\n  const inputBytes=await readFile(new URL('source-inputs.json',runtime));\n  assert.equal(sha(inputBytes),'8fa0c2f7108f8735b491f5172a68a31653160d9678654bab7d0fcc4fc03eb04f');\n  const inputs=JSON.parse(inputBytes);\n  assert.equal(inputs.length,1511);\n  assert.equal(new Set(inputs.map(input=>input.path)).size,1511);\n  assert.equal(manifest.files.length,216);\n  assert.equal(new Set(manifest.files.map(file=>file.path)).size,216);\n  assert.equal(manifest.modelBundles.length,136);\n  assert.equal(new Set(manifest.modelBundles.map(bundle=>bundle.url)).size,136);\n  assert.equal(sha(JSON.stringify(manifest.modelBundles)),'2087180cfa9544d079697195186988f0b09ff095f193a6280008042e1416624b');\n  assert.equal(sha(JSON.stringify(manifest.regionalScopes)),'6b42694d072364a93835cd98af9484e0ceace62e9658cb5cef4bd123652f6d55');\n  assert.equal(manifest.region,'head-neck');\n  assert.equal(manifest.structures,291);\n  assert.equal(manifest.nestedSelections,77);\n  assert.equal(new Set(manifest.regionalIds).size,291);\n  assert.equal(new Set(manifest.nestedTargets.map(target=>target.structureId)).size,77);\n  assert.deepEqual(manifest.regionalScopes.map(scope=>[scope.region,scope.regionalIds.length,scope.nestedTargets.length]),\n    [['head-neck',291,77],['thorax',158,11],['abdomen',106,16],['pelvis',82,4],['spine',115,0],['shoulder-arm',115,0],['forearm',86,0],['hand',124,0],['thigh',95,4],['leg',76,4],['foot',122,0],['whole-body',1104,108]]);\n  for(const key of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[key],false);\n\n  const found=[];\n  async function walk(base,prefix=''){\n    for(const entry of await readdir(base,{withFileTypes:true})){\n      assert(!entry.isSymbolicLink());\n      if(entry.isDirectory())await walk(new URL(entry.name+'/',base),prefix+entry.name+'/');\n      else found.push(prefix+entry.name);\n    }\n  }\n  await walk(runtime);\n  assert.deepEqual(found.sort(),['manifest.json',...manifest.files.map(file=>file.path)].sort());\n  assert.equal(found.filter(path=>path.endsWith('.glb')).length,136);\n  for(const file of manifest.files){\n    assert(!file.path.includes('..')&&!file.path.startsWith('/'));\n    assert(!/\\.(dcm|nii|nrrd|stl|vmatlas|vmmr|vmcompare|map)(\\.|$)/i.test(file.path));\n    const bytes=await readFile(new URL(file.path,runtime));\n    assert.equal(bytes.length,file.bytes,file.path);\n    assert.equal(sha(bytes),file.sha256,file.path);\n  }\n  for(const bundle of manifest.modelBundles){\n    const bytes=await readFile(new URL(bundle.url.split('?')[0].slice(1),runtime));\n    assert.equal(bytes.length,bundle.bytes,bundle.url);\n    assert.equal(sha(bytes),bundle.sha256,bundle.url);\n  }\n  const html=await readFile(new URL('index.html',runtime),'utf8');\n  for(const match of html.matchAll(/(?:src|href)=\"([^\"]+)\"/g)){\n    assert(match[1].startsWith('/atlas-runtime/head-neck/'));\n    await readFile(new URL(match[1].slice('/atlas-runtime/head-neck/'.length),runtime));\n  }\n  const deps=JSON.parse(await readFile(new URL('bundled-dependencies.json',runtime),'utf8'));\n  const notices=await readFile(new URL('BUNDLED_NOTICES.txt',runtime),'utf8');\n  assert(deps.length>10);\n  for(const dep of deps){\n    assert(['MIT','ISC','Apache-2.0','BSD-2-Clause','BSD-3-Clause','CC0-1.0','0BSD'].includes(dep.license));\n    assert(notices.includes(dep.name+'@'+dep.version));\n  }\n  const credits=await readFile(new URL('models/bodyparts3d/credits.html',runtime),'utf8');\n  assert(credits.includes('The Database Center for Life Science')&&credits.includes('CC Attribution 4.0'));\n  for(const match of credits.matchAll(/href=\"([^\"]+)\"/g)){\n    if(match[1].startsWith('https:'))continue;\n    if(match[1].startsWith('/'))assert.equal(match[1],'/atlas');\n    else await readFile(new URL(match[1],new URL('models/bodyparts3d/',runtime)));\n  }\n});\n";
function expectedSource(){
 let expected=read(raw+'head-neck-pilot-current.test.mjs.raw').toString();
 assert.equal(sha(expected),'b179146bb530e15890f2351df27df47a6ec87f5d1577e7bc213137eed4d5bd58');
 for(const [before,after]of edits){assert.equal(expected.split(before).length,2);expected=expected.replace(before,after);}
 return expected+append;
}
const undoExact=(source,current,prior)=>{
 assert.equal(source.split(current).length,2,`Exactly one later source seam: ${current.slice(0,72)}`);
 return source.replace(current,prior);
};
function prior190Source(current){
 assert.equal(sha(current),'2891a842e5c4723820ca61cfc51aea533a861809a40c4db8492808584462283d',
  'Pinned entire current head-pilot delivery witness');
 const eras=[
  {
   fixture:'fixtures/colic-fa1-preimage/head-neck-pilot-current.test.mjs.raw',
   sha:'fdfdbaad3d26b8b6d5e4f137718563ef3e5b242b7dbd15fe049e131eb941cc2a',
   edits:[
    ["test('current6d7 head-neck delivery independently","test('currentfa1 head-neck delivery independently"],
    ["validateCurrentAtlasDelivery().runtimeSources['head-neck'],'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'","validateCurrentAtlasDelivery().runtimeSources['head-neck'],'fa1bf9a233c6989fef42b533bbbac9d6ab034311'"],
    ["'19a748c5db1b162fa6968b53bab79aa75c255de19420c145465aed60539ace5b'","'54e3c0d07d834c9e6eb8ae2a7fde76ef9be475cc2aad0b51938aeec10ba52c09'"],
    ["assert.equal(manifest.sourceCommit,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1')","assert.equal(manifest.sourceCommit,'fa1bf9a233c6989fef42b533bbbac9d6ab034311')"],
    ["'b76525d1b8da433e95b8c9c58af675ef2f4d337c8e6fb35e91cf1e5955ba7dba'","'73a2f46adfa79d28035b6bba25839e2bd0f4039f61de7ea1c113edccae30da90'"],
    ['assert.equal(inputs.length,1515);','assert.equal(inputs.length,1513);'],
    ['assert.equal(new Set(inputs.map(input=>input.path)).size,1515);','assert.equal(new Set(inputs.map(input=>input.path)).size,1513);'],
   ],
  },
  {
   fixture:'fixtures/drawable-epoch-preimage/head-neck-pilot-current.test.mjs.raw',
   sha:'416876fb43d5d87f86e4f29a447029ed66c22d907c6162affc1ad746da32d579',
   edits:[
    ["./fixtures/drawable-epoch-preimage/head-neck-pilot.test.ts.raw","./head-neck-pilot.test.ts"],
    ["test('currentfa1 head-neck delivery independently","test('current0df head-neck delivery independently"],
    ["validateCurrentAtlasDelivery().runtimeSources['head-neck'],'fa1bf9a233c6989fef42b533bbbac9d6ab034311'","validateCurrentAtlasDelivery().runtimeSources['head-neck'],'0dfce15890cafc0a2b8e309193531daa29a672ed'"],
    ["'54e3c0d07d834c9e6eb8ae2a7fde76ef9be475cc2aad0b51938aeec10ba52c09'","'3d9d76b574673f40c7d05c5bbf01d58cc534dc0f13ef3f978199a3d26bb98f1b'"],
    ["assert.equal(manifest.sourceCommit,'fa1bf9a233c6989fef42b533bbbac9d6ab034311')","assert.equal(manifest.sourceCommit,'0dfce15890cafc0a2b8e309193531daa29a672ed')"],
    ["'73a2f46adfa79d28035b6bba25839e2bd0f4039f61de7ea1c113edccae30da90'","'842db50d355da8bd3f09950fa81c7ce9f3dfce1b358c190b383797b73174886f'"],
   ],
  },
 ];
 let source=current;
 for(const era of eras){
  for(const [now,before] of era.edits)source=undoExact(source,now,before);
  const frozen=read(era.fixture);
  assert.equal(sha(frozen),era.sha,'Authenticated complete predecessor: '+era.fixture);
  assert.equal(source,frozen.toString(),'No unreviewed changes at '+era.fixture);
 }
 const older=read('fixtures/body-learning-epoch-history/head-neck-pilot-current-190.test.mjs.raw');
 assert.equal(sha(older),'2f8ccf5be49d159d03624c57eee7d698a573df5fb76189a6b52842d1684dff16');
 const oldUndo=older.toString().split('\n').find(line=>line.startsWith('  undo("test(\'current190 head-neck scene'));
 assert(oldUndo);
 const start=source.indexOf('  const priorPilot=');
 const end=source.indexOf("  undo(newScene,'');",start)+"  undo(newScene,'');".length;
 assert(start>0&&end>start);
 source=undoExact(source,source.slice(start,end),oldUndo);
 for(const [now,before] of [
  ["test('current0df head-neck delivery independently","test('current190 head-neck delivery independently"],
  ["validateCurrentAtlasDelivery().runtimeSources['head-neck'],'0dfce15890cafc0a2b8e309193531daa29a672ed'","validateCurrentAtlasDelivery().source,'190a63238eadcf906abe89dcbb6a67c88afe70b9'"],
  ["'3d9d76b574673f40c7d05c5bbf01d58cc534dc0f13ef3f978199a3d26bb98f1b'","'74ba7688c8dfd8939a160f56a04e7825b11183f947f1074c6825c0f39904d4ec'"],
  ["assert.equal(manifest.sourceCommit,'0dfce15890cafc0a2b8e309193531daa29a672ed')","assert.equal(manifest.sourceCommit,'190a63238eadcf906abe89dcbb6a67c88afe70b9')"],
  ["'842db50d355da8bd3f09950fa81c7ce9f3dfce1b358c190b383797b73174886f'","'8fa0c2f7108f8735b491f5172a68a31653160d9678654bab7d0fcc4fc03eb04f'"],
  ['assert.equal(inputs.length,1513);','assert.equal(inputs.length,1511);'],
  ['assert.equal(new Set(inputs.map(input=>input.path)).size,1513);','assert.equal(new Set(inputs.map(input=>input.path)).size,1511);'],
 ])source=undoExact(source,now,before);
 assert.equal(source,older.toString(),'Full current→fa1→0df→190 inverse');
 return source;
}
test('complete head pilot sources retain every assertion outside the exact historical87 and independent190 seams',()=>{
 const current=read('head-neck-pilot-current.test.mjs').toString(),expected=expectedSource();
 const historical190=prior190Source(current);
 assert.equal(historical190,expected,'Whole original proof survives; no assertion may disappear');
 let inverse=historical190.slice(0,-append.length);
 assert(historical190.endsWith(append));
 for(const [before,after]of edits.toReversed()){assert.equal(inverse.split(after).length,2);inverse=inverse.replace(after,before);}
 assert.equal(sha(inverse),'b179146bb530e15890f2351df27df47a6ec87f5d1577e7bc213137eed4d5bd58');
 const ts=read('head-neck-pilot.test.ts'),original=read(raw+'head-neck-pilot.test.ts.raw');
 assert.equal(sha(original),'97d2ab7dfdeab8ac28656bbc779c0a8bec3c08bf98cf05ff545658930372d1e1');
 assert.equal(sha(ts),'5cb326883f1081550cb9940f4a603b2b9258e57ef41cee068ab3d33d786fc7d9');
 let priorPilot=ts.toString();
 for(const [now,before] of [
  ["test('current6d7 head-neck scene","test('current190 head-neck scene"],
  ["'19a748c5db1b162fa6968b53bab79aa75c255de19420c145465aed60539ace5b'","'74ba7688c8dfd8939a160f56a04e7825b11183f947f1074c6825c0f39904d4ec'"],
  ["'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'","'190a63238eadcf906abe89dcbb6a67c88afe70b9'"],
 ])priorPilot=undoExact(priorPilot,now,before);
 assert.deepEqual(Buffer.from(priorPilot),original,'Entire historical9f and current190 scene proof remains byte-exact');
 for(const mutant of [current+'\nunknownAppend();\n',current.replace("'patientDataIncluded'","'foreignFlag'"),current.replace("assert.equal(manifest.modelBundles.length,136);",'')])assert.throws(()=>prior190Source(mutant),'Unknown append or removal must refuse');
});
test('historical87 reader replays all217 exact declared files and refuses unknown or escaping reads',async()=>{
 const manifest=JSON.parse(await readHead87File(new URL('manifest.json',historicalHead87Runtime)));
 assert.equal(sha(await readHead87File(new URL('manifest.json',historicalHead87Runtime))),'d8d5b5aaf4a40252217da56cd5d42c80ade5b43abb090454fd4c616a8e1ee9d8');
 for(const file of manifest.files){const bytes=await readHead87File(new URL(file.path,historicalHead87Runtime));assert.equal(bytes.length,file.bytes);assert.equal(sha(bytes),file.sha256);}
 await assert.rejects(readHead87File(new URL('assets/undeclared.js',historicalHead87Runtime)),/not declared/);
 await assert.rejects(readHead87File(new URL('../shoulder/manifest.json',historicalHead87Runtime)),/canonical|declared/);
 await assert.rejects(listHead87Directory(new URL('assets/missing/',historicalHead87Runtime),{withFileTypes:true}),/not declared/);
 assert.throws(()=>createClosedHead87Reader({root:new URL('./fixtures/missing-head87-root/',import.meta.url).pathname}),/ENOENT|canonical/,'A missing archive cannot fall back to current delivery');
});
