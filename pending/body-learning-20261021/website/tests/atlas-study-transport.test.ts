import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {atlasStudySuffix} from '../lib/atlas-study-transport.ts';
import {atlasBodyRegions, selectedBodyRegion} from '../lib/atlas-navigation.ts';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {atlasReferenceRevisionCurrent} from '../lib/atlas-reference-revision.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headReferenceLearningAvailable} from '../lib/head-learning-resource-availability.ts';
import {liveLearningConsumerModule} from './live-learning-consumer-loader-transition.mjs';
const websiteUrl=new URL('../',import.meta.url);

/** Execute the actual retained frame/notes wrapper, not a fake iframe stub.
 * Effects and message traffic are outside this server-rendered transport check. */
function linkedModel(require:ReturnType<typeof createRequire>){
  const js=ts.transpileModule(readFileSync(new URL('components/HeadAtlasLinkedModel.tsx',websiteUrl),'utf8'),
    {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const exports:Record<string,Function>={};
  const imports:Record<string,unknown>={
    react:{useEffect:()=>{},useLayoutEffect:()=>{},useRef:(value:unknown)=>({current:value}),useState:(value:unknown)=>[value,()=>{throw Error('Unexpected render state update');}]},
    'react/jsx-runtime':require('react/jsx-runtime'),
    '../lib/head-live-selection':{HEAD_SELECTION_PROTOCOL:'not-exercised-in-server-transport',parseHeadSelection:()=>{throw Error('Message parsing is outside this check');}},
    '../lib/head-atlas-import':{HEAD_MANIFEST_SHA256:HEAD_LINK_REVISION},
    '../lib/head-link-availability.ts':{headLinksCurrent:()=>true},
    '../lib/head-learning-resource-availability.ts':{headReferenceLearningAvailable},
    './HeadAtlasComparisonNavigation':{HeadAtlasComparisonNavigation:'test-comparison-navigation'},
    './HeadAtlasReferenceTeaching':{HeadAtlasReferenceTeaching:'test-reference-teaching'},
    './AtlasBodyLearning':liveLearningConsumerModule,
    './useVerifiedFacialTeaching':{FACIAL_CONCEPTS:new Set(['bone-left-zygomatic','bone-right-zygomatic','bone-mandible']),useVerifiedFacialTeaching:()=>false},
  };
  new Function('require','exports',js)((name:string)=>{assert(Object.hasOwn(imports,name),name);return imports[name];},exports);
  return exports.HeadAtlasLinkedModel;
}

test('whole-body continuation relays exact study identity without external routing or unrelated fields',()=>{
  const p={study:'1',structure:'vm:anatomy:body:spine:right:muscle:right-longus-capitis',side:'right',source:'a'.repeat(64)};
  const suffix=atlasStudySuffix({...p,patientId:'private',token:'secret',redirect:'https://example.test',region:'whole-body'});
  assert.ok(suffix);assert.deepEqual(Object.fromEntries(new URLSearchParams(suffix.slice(1))),p);
  assert.equal(atlasStudySuffix({}), '');assert.equal(atlasStudySuffix({unknown:'ignored'}),'');
  for(const key of Object.keys(p)){
    assert.equal(atlasStudySuffix({...p,[key]:[p[key as keyof typeof p],p[key as keyof typeof p]]}),null);
    assert.equal(atlasStudySuffix({...p,[key]:'<script>&region=foot'}),null);
  }
  for(const patch of [{source:'a'.repeat(63)},{structure:'x'.repeat(241)},{study:'3'},{side:'either'},{focus:'../escape'},{detail:'x'.repeat(300)}]){
    assert.equal(atlasStudySuffix({...p,...patch}),null);
  }
  const nested={...p,study:'2',detail:'eye',part:'test:part',partSource:'b'.repeat(64)};
  assert.deepEqual(Object.fromEntries(new URLSearchParams(atlasStudySuffix(nested)!.slice(1))),nested);
  assert.equal(atlasStudySuffix({structure:'valid-id'}),'&structure=valid-id','Partial query retained for module rejection, never silently dropped');
  const page=readFileSync(new URL('app/atlas/3d/page.tsx',websiteUrl),'utf8');
  assert.ok(page.includes('const studySuffix=atlasStudySuffix(params)'));
  assert.ok(page.includes('if(studySuffix===null)notFound()'));
  assert.ok(page.includes('region=${region.id}${studySuffix}'));
  assert.ok(page.includes('src={source}'));
  assert.ok(page.includes("if(!studySuffix&&!region.href.startsWith('/atlas/3d'))redirect(region.href)"),
    'Source-bound head/neck, trunk and pelvic links must not lose the query through a plain regional redirect');
});

test('actual host page keeps source-bound links for all twelve regions and keeps plain redirects',async()=>{
  const require=createRequire(new URL('package.json',websiteUrl));
  const HeadAtlasLinkedModel=linkedModel(require);
  const stateSource=ts.transpileModule(readFileSync(new URL('components/atlas-runtime-state.ts',websiteUrl),'utf8'),
    {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const stateExports:Record<string,Function>={};
  new Function('exports',stateSource)(stateExports);
  const frameSource=ts.transpileModule(readFileSync(new URL('components/AtlasRuntimeFrame.tsx',websiteUrl),'utf8'),
    {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const frameExports:Record<string,Function>={};
  const frameImports:Record<string,unknown>={
    react:{useEffect:()=>{},useRef:(value:unknown)=>({current:value}),useState:(value:unknown)=>[value,()=>{throw Error('Unexpected render state update');}]},
    './atlas-runtime-state':{createAtlasDocumentAttempt:stateExports.createAtlasDocumentAttempt},
    './atlas-runtime-frame.css':{},
    './AtlasBodyLearning':liveLearningConsumerModule,
    'react/jsx-runtime':require('react/jsx-runtime'),
  };
  new Function('require','exports',frameSource)((name:string)=>{assert(Object.hasOwn(frameImports,name),name);return frameImports[name];},frameExports);
  const AtlasRuntimeFrame=frameExports.AtlasRuntimeFrame;
  const source=ts.transpileModule(readFileSync(new URL('app/atlas/3d/page.tsx',websiteUrl),'utf8'),
    {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const exports:Record<string, (props:unknown)=>Promise<unknown>>={};
  const imports:Record<string,unknown>={
    'next/link':{default:'test-link'},
    'next/navigation':{notFound:()=>{throw Error('not-found');},redirect:(href:string)=>{throw Error('redirect:'+href);}},
    '../../../components/AtlasRegionNavigation':{AtlasRegionNavigation:()=>null},
    '../../../components/AtlasWorkspaceNavigation':{AtlasWorkspaceNavigation:()=>null},
    '../../../components/HeadAtlasLinkedModel':{HeadAtlasLinkedModel},
    '../../../components/AtlasRuntimeFrame':{AtlasRuntimeFrame},
    '../../../lib/atlas-navigation':{selectedBodyRegion},
    '../../../lib/atlas-study-transport':{atlasStudySuffix},
    '../../../lib/atlas-reference-revision':{atlasReferenceRevisionCurrent},
    '../../../public/atlas-runtime/head-neck/manifest.json':{default:JSON.parse(readFileSync(new URL('public/atlas-runtime/head-neck/manifest.json',websiteUrl),'utf8'))},
    '../shoulder-3d/shoulder-module.css':{},
    '../head-neck-3d/head-learning.css':{},
    'react/jsx-runtime':require('react/jsx-runtime'),
  };
  new Function('require','exports',source)((name:string)=>{assert(Object.hasOwn(imports,name),name);return imports[name];},exports);
  const params={study:'1',structure:'test:source',source:'a'.repeat(64),side:'right'};
  function elements(node:unknown):Array<{type:unknown;props:Record<string,unknown>}>{
    if(Array.isArray(node))return node.flatMap(elements);
    if(!node||typeof node!=='object'||!('props' in node))return [];
    const element=node as {type:unknown;props:Record<string,unknown>};
    return [element,...(element.type===liveLearningConsumerModule.AtlasBodyLearning?[]:typeof element.type==='function'?elements(element.type(element.props)):elements(element.props.children))];
  }
  for(const region of atlasBodyRegions){
    const tree=await exports.default({searchParams:Promise.resolve({...params,region:region.id})});
    const nodes=elements(tree),frames=nodes.filter(n=>n.type==='iframe');
    assert.equal(frames.length,1,'A region renders exactly one retained viewer');
    const frame=frames[0];
    const hosts=nodes.filter(n=>n.type===HeadAtlasLinkedModel);
    assert.equal(hosts.length,region.id==='head-neck'?1:0,'Only the supported head region mounts the head selection channel');
    if(region.id==='head-neck')assert.equal(hosts[0].props.sourceRevision,JSON.parse(readFileSync(new URL('public/atlas-runtime/head-neck/manifest.json',websiteUrl),'utf8')).sourceCommit);
    assert.equal(String(nodes.find(n=>n.type==='main')?.props.className).includes('head-comparison-module-page'),region.id==='head-neck');
    const url=new URL(String(frame.props.src),'https://atlas.test');
    assert.equal(frame.props.title,`${region.label} 3D anatomy: explore, dissect and practise`);
    assert.equal(frame.props.referrerPolicy,'same-origin');assert.equal(frame.props.allowFullScreen,true);
    const fullscreen=nodes.filter(n=>n.type==='a'&&n.props.children==='Open full screen ↗');
    assert.equal(fullscreen.length,1,'One direct full-screen escape remains available');
    assert.equal(fullscreen[0].props.href,frame.props.src);
    assert.equal(fullscreen[0].props.target,'_blank');
    assert.equal(fullscreen[0].props.rel,'noopener noreferrer');
    assert.equal(url.searchParams.get('region'),region.id);
    for(const [key,value]of Object.entries(params))assert.equal(url.searchParams.get(key),value);
    assert.equal(nodes.find(n=>n.type==='h1')?.props.children,region.label);
    const details=nodes.find(n=>n.type==='details'&&n.props.className==='shoulder-module-notes');assert(details);
    const detailNodes=elements(details);
    assert.deepEqual(detailNodes.filter(n=>n.type==='test-link').map(n=>n.props.href),['/atlas/ct-head','/atlas/mri-head'],
      'Existing imaging viewers remain discoverable inside collapsed source notes, not new top-level controls');
    assert.equal(details.props.open,undefined,'Notes remain collapsed by default');
    const copy=JSON.stringify(details.props.children);
    if(region.id==='head-neck'){
      assert.match(copy,/Learn this structure follows supported head selections/);
      assert.match(copy,/other structures have no exact acquired-image mapping/);
    }else assert.doesNotMatch(copy,/Learn this structure follows supported head selections/);
    assert.match(copy,/These links do not carry the current structure or a spatial registration/);
    assert.match(copy,/not an acquired-scan overlay or validated patient-space registration/);
    assert.match(copy,/does not grant access to separately paid imaging cases or lectures/);
    assert.doesNotMatch(copy,/No scan or spatial registration is connected/);
    if(!region.href.startsWith('/atlas/3d')){
      await assert.rejects(exports.default({searchParams:Promise.resolve({region:region.id})}),
        (error:Error)=>error.message==='redirect:'+region.href);
    }
  }
  await assert.rejects(exports.default({searchParams:Promise.resolve({...params,source:['a','b']})}),/not-found/);
});
