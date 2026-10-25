import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {stripConsumerLoader} from './live-learning-consumer-loader-transition.mjs';
import {restoreStudyTransportQueryHarness} from './page-ssr-query-role.mjs';

const sha=text=>createHash('sha256').update(text).digest('hex');
const original=JSON.parse(readFileSync(new URL('./fixtures/atlas-study-transport-original.json',import.meta.url)));
const expansionSeams=[
  "import {atlasRuntimeExpansionModule} from './atlas-runtime-expansion-loader.mjs';\n",
  "    './atlas-runtime-expansion':atlasRuntimeExpansionModule,\n",
];
const expanded=()=>readFileSync(new URL('./atlas-study-transport.test.ts',import.meta.url),'utf8');
const current=()=>stripConsumerLoader(stripConsumerLoader(restoreStudyTransportQueryHarness(expanded()),expansionSeams),[
  "import {liveLearningConsumerModule} from './live-learning-consumer-loader-transition.mjs';\n",
  ["    './HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:'test-reference-teaching'},\n    './AtlasBodyLearning':liveLearningConsumerModule,\n","    './HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:'test-reference-teaching'},\n"],
  ["    './atlas-runtime-frame.css':{},\n    './AtlasBodyLearning':liveLearningConsumerModule,\n","    './atlas-runtime-frame.css':{},\n"],
  ["return [element,...(element.type===liveLearningConsumerModule.AtlasBodyLearning?[]:typeof element.type==='function'?elements(element.type(element.props)):elements(element.props.children))];","return [element,...(typeof element.type==='function'?elements(element.type(element.props)):elements(element.props.children))];"],
]);
const oldSha='b1c4f68921147d58238c83060493bd1779f7d0b9c5033a610ae09bf258a14305';
const newSha='6d870cbeef5f4a23480af267c1f62fcdddeb0a47caaa1913fe7a20aabc6795ed';
const blockSha='567a0c0f7f0a500bc237d860c01c09d11e4841945ef022296c5372e55c50ff66';
const replace=(text,before,after)=>{assert.equal(text.split(before).length,2,before);return text.replace(before,after);};

function verify(candidate){
  assert.equal(original.schema,'visible-medicine.original-test-text/1');
  assert.equal(original.path,'tests/atlas-study-transport.test.ts');
  assert.equal(original.sha256,oldSha);assert.equal(sha(original.text),oldSha);
  assert.equal(sha(candidate),newSha);
  const begin='  const stateSource=ts.transpileModule';
  const end="  const source=ts.transpileModule(readFileSync(new URL('app/atlas/3d/page.tsx'";
  const start=candidate.indexOf(begin),finish=candidate.indexOf(end,start+begin.length);
  assert(start>=0&&finish>start);assert.equal(candidate.indexOf(begin,start+1),-1);
  const realFrameBlock=candidate.slice(start,finish);
  assert.equal(sha(realFrameBlock),blockSha);
  const oldReact="react:{useEffect:()=>{},useRef:(value:unknown)=>({current:value}),useState:(value:unknown)=>[value,()=>{throw Error('Unexpected render state update');}]}";
  const newReact="react:{useEffect:()=>{},useLayoutEffect:()=>{},useRef:(value:unknown)=>({current:value}),useState:(value:unknown)=>[value,()=>{throw Error('Unexpected render state update');}]}";
  const model='  const HeadAtlasLinkedModel=linkedModel(require);\n';
  const headImport="    '../../../components/HeadAtlasLinkedModel':{HeadAtlasLinkedModel},\n";
  const oldTraversal="return [element,...(element.type===HeadAtlasLinkedModel?elements(HeadAtlasLinkedModel(element.props)):elements(element.props.children))];";
  const newTraversal="return [element,...(typeof element.type==='function'?elements(element.type(element.props)):elements(element.props.children))];";
  let expected=replace(original.text,oldReact,newReact);
  expected=replace(expected,model,model+realFrameBlock);
  expected=replace(expected,headImport,headImport+"    '../../../components/AtlasRuntimeFrame':{AtlasRuntimeFrame},\n");
  expected=replace(expected,oldTraversal,newTraversal);
  assert.equal(candidate,expected,'Every original transport assertion and packet must remain byte-identical');
  assert.match(realFrameBlock,/components\/AtlasRuntimeFrame\.tsx/);
  assert.match(realFrameBlock,/components\/atlas-runtime-state\.ts/);
  assert.match(realFrameBlock,/createAtlasDocumentAttempt:stateExports\.createAtlasDocumentAttempt/);
  assert.match(realFrameBlock,/Unexpected render state update/);
}

test('transport harness expands the real frame chain with only four declared seams',()=>verify(current()));

test('transport migration refuses fake frames, skipped private components and changed source/privacy assertions',()=>{
  const candidate=current();
  for(const [before,after] of [
    ["new URL('components/AtlasRuntimeFrame.tsx'","new URL('components/FakeFrame.tsx'"],
    ['typeof element.type===\'function\'','element.type===HeadAtlasLinkedModel'],
    ['useLayoutEffect:()=>{},',''],
    ["assert.equal(url.searchParams.get(key),value)","assert.equal(url.searchParams.get(key),null)"],
    ["assert.equal(details.props.open,undefined","assert.equal(details.props.open,true"],
    ["assert.equal(frames.length,1","assert.equal(frames.length,2"],
  ]){
    assert(candidate.includes(before),before);
    assert.throws(()=>verify(candidate.replace(before,after)),before);
  }
});

test('transport migration refuses a missing, duplicated or substituted real expansion dependency',()=>{
  const source=expanded();
  for(const changed of [
    source.replace(expansionSeams[0],''),
    source+expansionSeams[1],
    source.replace(expansionSeams[1],"    './atlas-runtime-expansion':{},\n"),
  ])assert.throws(()=>stripConsumerLoader(changed,expansionSeams));
});
