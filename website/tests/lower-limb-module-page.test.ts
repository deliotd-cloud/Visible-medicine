import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {atlasReferenceRevisionCurrent} from '../lib/atlas-reference-revision.ts';
import {atlasStudySuffix} from '../lib/atlas-study-transport.ts';
import {selectedBodyRegion} from '../lib/atlas-navigation.ts';
import {build} from 'esbuild';
import {assertRuntimeFramePage} from './atlas-runtime-page-contract.ts';

const require=createRequire(import.meta.url);
const lowerManifest=JSON.parse(readFileSync(new URL('../public/atlas-runtime/lower-limb/manifest.json',import.meta.url),'utf8'));
const headManifest=JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/manifest.json',import.meta.url),'utf8'));
const bundled=await build({stdin:{contents:`
  export {lowerLimbStudySuffix} from './lib/lower-limb-study-transport';
  export {regionalTourEntrySuffix} from './lib/regional-tour-entry-navigation';
  export {hasHeadLearningQuery} from './lib/head-atlas-learning';
  export {makeSpecimenLink} from './atlas-review/lib/um-limb-navigation';
  export {limbDefinitions} from './atlas-review/lib/um-limb-studies';
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {lowerLimbStudySuffix,makeSpecimenLink,limbDefinitions,regionalTourEntrySuffix,hasHeadLearningQuery}=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`);
type Node={type:unknown;key?:string;props:Record<string,any>};
function nodes(value:any):Node[]{return Array.isArray(value)?value.flatMap(nodes):value?.props?[value,...nodes(value.props.children)]:[];}
function page(path:string,imports:Record<string,unknown>){
  const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const exports={default:null as null|((props:any)=>Promise<Node>)};
  new Function('require','exports',code)((id:string)=>{assert(Object.hasOwn(imports,id),`unexpected page import ${id}`);return imports[id];},exports);
  assert(exports.default);return exports.default;
}
const notFound=()=>{throw new Error('not-found');};
for(const path of ['../app/atlas/lower-limb-3d/page.tsx','../app/atlas/3d/page.tsx'])
  assertRuntimeFramePage(readFileSync(new URL(path,import.meta.url),'utf8'),'source');
// The scoped loader represents the audited shared component's single emitted iframe.
const shared={'next/link':{default:'test-link'},'next/navigation':{notFound,redirect:(href:string)=>{throw new Error('redirect:'+href);}},
  '../../../components/AtlasRuntimeFrame':{AtlasRuntimeFrame:'iframe'},
  '../../../components/HeadAtlasLinkedModel':{HeadAtlasLinkedModel:()=>null},
  '../../../components/AtlasRegionNavigation':{AtlasRegionNavigation:()=>null},'../../../components/AtlasWorkspaceNavigation':{AtlasWorkspaceNavigation:()=>null},'../shoulder-3d/shoulder-module.css':{},'../head-neck-3d/head-learning.css':{},'react/jsx-runtime':require('react/jsx-runtime')};
const lowerPage=page('../app/atlas/lower-limb-3d/page.tsx',{
  ...shared,'../../../lib/atlas-reference-revision':{atlasReferenceRevisionCurrent},
  '../../../lib/lower-limb-study-transport':{lowerLimbStudySuffix},
  '../../../public/atlas-runtime/lower-limb/manifest.json':{default:lowerManifest},
});
const rootPage=page('../app/atlas/3d/page.tsx',{
  '../../../components/AtlasRegionalNavigation':{AtlasRegionalNavigation:()=>null},
  ...shared,'../../../lib/atlas-navigation':{selectedBodyRegion},'../../../lib/atlas-study-transport':{atlasStudySuffix},
  '../../../lib/regional-tour-entry-navigation':{regionalTourEntrySuffix},
  '../../../lib/head-atlas-learning':{hasHeadLearningQuery},
  '../../../lib/atlas-reference-revision':{atlasReferenceRevisionCurrent},
  '../../../public/atlas-runtime/head-neck/manifest.json':{default:headManifest},
});
function authored(){const definition=limbDefinitions.knee,study=definition.studies[0];
  const link=makeSpecimenLink(definition,{selectedId:study.selectedId,studyId:study.id,view:study.view});assert(link);
  return Object.fromEntries(new URL(link,'https://atlas.test').searchParams);}

test('lower-limb wrapper forwards an actual current specimen tuple to iframe and fullscreen only',async()=>{
  const params={...authored(),atlasRevision:lowerManifest.sourceCommit,patientId:'private',scanUrl:'https://scan.test',token:'secret'};
  const tree=await lowerPage({searchParams:Promise.resolve(params)}),all=nodes(tree),frame=all.find(n=>n.type==='iframe');assert(frame);
  const source=String(frame.props.src),url=new URL(source,'https://atlas.test');
  assert.equal(url.pathname,'/atlas-runtime/lower-limb/index.html');assert.equal(frame.key,source);
  assert.deepEqual(Object.fromEntries(url.searchParams),authored());
  assert.equal(all.find(n=>n.type==='a'&&String(n.props.href).startsWith('/atlas-runtime/lower-limb/'))?.props.href,source);
  assert(!source.includes('patientId')&&!source.includes('scanUrl')&&!source.includes('token')&&!source.includes('atlasRevision'));
  const notes=all.find(n=>n.type==='details');assert(notes);assert.equal(notes.props.open,undefined);
  const copy=JSON.stringify(notes.props.children);
  assert.match(copy,/source-bound semantic anatomy link/);assert.match(copy,/not registered/);assert.match(copy,/no scan or mask is mirrored/);
  assert.match(copy,/lecture access remains separate/);
});

test('lower-limb plain view stays unchanged; stale or mixed source references notFound',async()=>{
  const plain=await lowerPage({searchParams:Promise.resolve({})});
  assert.equal(nodes(plain).find(n=>n.type==='iframe')?.props.src,'/atlas-runtime/lower-limb/index.html');
  const base=authored();
  for(const bad of [
    {...base,atlasRevision:'f'.repeat(40)},
    {...base,atlasRevision:[lowerManifest.sourceCommit,lowerManifest.sourceCommit]},
    {...base,specimenSource:'f'.repeat(64)},
    {...base,study:'1'},
  ])await assert.rejects(lowerPage({searchParams:Promise.resolve(bad)}),/not-found/);
});

test('root body wrapper validates optional head-neck source pin before forwarding',async()=>{
  const params={region:'leg',study:'1',structure:'vm:anatomy:body:leg:left:bone:tibia',side:'left',source:'a'.repeat(64),atlasRevision:headManifest.sourceCommit,scanUrl:'https://private.test'};
  const tree=await rootPage({searchParams:Promise.resolve(params)}),frame=nodes(tree).find(n=>n.type==='iframe');assert(frame);
  const url=new URL(String(frame.props.src),'https://atlas.test');
  assert.equal(url.searchParams.get('region'),'leg');
  for(const key of ['study','structure','side','source'])assert.equal(url.searchParams.get(key),params[key as keyof typeof params]);
  assert.equal(url.searchParams.has('atlasRevision'),false);assert.equal(url.searchParams.has('scanUrl'),false);
  await assert.rejects(rootPage({searchParams:Promise.resolve({...params,atlasRevision:'f'.repeat(40)})}),/not-found/);
  await assert.rejects(rootPage({searchParams:Promise.resolve({...params,atlasRevision:[headManifest.sourceCommit]})}),/not-found/);
  const old=await rootPage({searchParams:Promise.resolve({region:'leg'})});assert(nodes(old).some(n=>n.type==='iframe'));
});
