import assert from 'node:assert/strict';
import test from 'node:test';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
const require=createRequire(import.meta.url);
const bundle=await build({stdin:{contents:`
export {relatedJointStudies} from './lib/atlas-related-joint-studies';
export {limbDefinitions} from './atlas-review/lib/um-limb-studies';
export {parseSpecimenLink} from './atlas-review/lib/specimen-links';
export {resolveSpecimenLink} from './atlas-review/lib/um-limb-navigation';
export {lowerLimbStudySuffix} from './lib/lower-limb-study-transport';
export {atlasReferenceRevisionCurrent} from './lib/atlas-reference-revision';
export {default as limbManifest} from './public/atlas-runtime/lower-limb/manifest.json';
export {default as bodyManifest} from './public/atlas-runtime/head-neck/manifest.json';
export {default as reviewManifest} from './atlas-review/manifest.json';
export {default as limbInputs} from './public/atlas-runtime/lower-limb/source-inputs.json';
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].contents).toString('base64'));
const {relatedJointStudies,limbDefinitions,parseSpecimenLink,resolveSpecimenLink,lowerLimbStudySuffix,atlasReferenceRevisionCurrent,limbManifest,bodyManifest,reviewManifest,limbInputs}=api;
const params=link=>Object.fromEntries(new URL(link.href,'https://atlas.test').searchParams);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('joint bridge admits only exact committed shared inputs at runtime and Review revisions',()=>{
 const source=currentAtlasDeliveryRoot();
 assert.equal(limbManifest.sourceCommit,'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');
 assert.equal(reviewManifest.revision,'ad82a5a96d8303c54eeea3926a6df8d31f9ae611');
 assert.equal(bodyManifest.sourceCommit,reviewManifest.revision);
 const paths=['lib/um-limb-studies.ts','lib/um-knee-study.ts','lib/um-limb-navigation.ts',
  'lib/specimen-links.ts','content/um-limb-navigation.v1.json',
  'public/models/um-limb/catalog.json','public/models/um-knee/catalog.json'];
 for(const path of paths){
  const committed=revision=>execFileSync('git',['--no-replace-objects','-C',source,'show',`${revision}:${path}`],{maxBuffer:16e6});
  const runtimeSha=sha(committed(limbManifest.sourceCommit));
  assert.equal(sha(committed(reviewManifest.revision)),runtimeSha,`${path}: committed bytes match`);
  assert.equal(limbInputs.find(item=>item.path===path)?.sha256,runtimeSha,`${path}: runtime input`);
  const imported=reviewManifest.files.find(item=>item.path===path);assert(imported);
  assert.equal(imported.sourceSha256,runtimeSha,`${path}: Review source`);
  assert.equal(imported.importedSha256,runtimeSha,`${path}: Review import`);
  assert.equal(sha(readFileSync('atlas-review/'+path)),runtimeSha,`${path}: imported bytes`);
 }
});

test('a missing or altered bridge input hides every related study',()=>{
 const runtime=limbInputs.find(item=>item.path==='lib/um-limb-studies.ts');
 const imported=reviewManifest.files.find(item=>item.path==='lib/um-limb-navigation.ts');
 for(const [row,key] of [[runtime,'sha256'],[imported,'sourceSha256'],[imported,'importedSha256']]){
  const saved=row[key];try{row[key]='0'.repeat(64);assert.deepEqual(relatedJointStudies('thigh'),[]);assert.deepEqual(relatedJointStudies('leg'),[]);}finally{row[key]=saved;}
 }
 const index=limbInputs.indexOf(runtime);try{limbInputs.splice(index,1);assert.deepEqual(relatedJointStudies('leg'),[]);}finally{limbInputs.splice(index,0,runtime);}
});

test('four current links open the exact supplied study, selection, view and source revision',()=>{
 const expected={thigh:['hip-cartilage'],leg:['cruciates','collaterals','articular']};
 for(const [region,ids]of Object.entries(expected)){
  const links=relatedJointStudies(region);assert.deepEqual(links.map(s=>s.id),ids);
  for(const link of links){
   const url=new URL(link.href,'https://atlas.test');assert.equal(url.pathname,'/atlas/lower-limb-3d');
   const p=params(link);assert(atlasReferenceRevisionCurrent(p,limbManifest.sourceCommit));
   const resolved=resolveSpecimenLink(parseSpecimenLink(p));assert.equal(resolved.status,'ready');
   const definition=limbDefinitions[p.specimenScope],study=definition.studies.find(s=>s.id===link.id);
   assert(study);assert.equal(resolved.selectedId,study.selectedId);assert.equal(resolved.view,study.view);
   assert.equal(p.specimenStudy,study.id);assert.equal(link.title,study.title);assert.equal(link.note,study.note);
   assert.deepEqual(definition.surfaces.filter(s=>!resolved.state.hidden.includes(s.id)).map(s=>s.id).sort(),[...study.ids].sort());
   const suffix=lowerLimbStudySuffix(p);assert(suffix);assert(!suffix.includes('atlasRevision'));
   const forwarded=Object.fromEntries(new URLSearchParams(suffix));delete p.atlasRevision;assert.deepEqual(forwarded,p);
  }
 }
});

test('unrelated regions and malformed region arguments do not invent a study or mirror a limb',()=>{
 for(const region of ['whole-body','head-neck','shoulder-arm','forearm','hand','foot','pelvis','knee','hip','left','',null,undefined,['leg'],{},'leg?patientId=private'])assert.deepEqual(relatedJointStudies(region),[]);
 const links=[...relatedJointStudies('thigh'),...relatedJointStudies('leg')];
 for(const link of links)assert.deepEqual(Object.keys(params(link)).sort(),['specimen','specimenScope','specimenPart','specimenSource','specimenRevision','specimenView','specimenStudy','atlasRevision'].sort());
});

test('mismatched or malformed installed module revisions hide links without substitution',()=>{
 for(const [object,key]of [[limbManifest,'sourceCommit'],[bodyManifest,'sourceCommit'],[reviewManifest,'revision']]){
  const saved=object[key];try{for(const wrong of ['f'.repeat(40),'',null,'private']){object[key]=wrong;assert.deepEqual(relatedJointStudies('leg'),[]);assert.deepEqual(relatedJointStudies('thigh'),[]);}}finally{object[key]=saved;}
 }
});

test('changed source study payload or missing study fails closed instead of pointing to another preset',()=>{
 const definition=limbDefinitions.knee,study=definition.studies.find(s=>s.id==='articular'),title=study.title;
 try{study.title+=' changed';assert.deepEqual(relatedJointStudies('leg'),[]);}finally{study.title=title;}
 const saved=definition.studies;
 try{definition.studies=saved.filter(s=>s.id!=='articular');assert.deepEqual(relatedJointStudies('leg'),[]);}finally{definition.studies=saved;}
 assert.equal(relatedJointStudies('leg').length,3);
});

test('source bundle changes cannot silently remap the selected structure',()=>{
 const bundle=limbDefinitions.knee.catalog.bundles[0],saved=bundle.sha256;
 try{bundle.sha256='0'.repeat(64);assert.deepEqual(relatedJointStudies('leg'),[]);}finally{bundle.sha256=saved;}
 assert.equal(relatedJointStudies('leg').length,3);
});

test('grouped cartilage and menisci and missing hip surfaces retain authored limits',()=>{
 const hip=relatedJointStudies('thigh')[0],knee=relatedJointStudies('leg').find(s=>s.id==='articular');
 assert.match(hip.note,/Acetabular cartilage, labrum and capsule are absent/);
 assert.match(knee.note,/one source group/);assert.match(knee.note,/not separately labelled/);
 assert.match(params(knee).specimenPart,/:meniscus-group$/);
});

const ts=require('typescript');
const code=ts.transpileModule(readFileSync('components/AtlasRegionalNavigation.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const exports={};const imports={'./AtlasWorkspaceNavigation':{AtlasWorkspaceNavigation:'workspace-navigation'},'../lib/atlas-related-joint-studies':{relatedJointStudies},'./atlas-regional-navigation.module.css':{default:{}},'react/jsx-runtime':require('react/jsx-runtime')};
new Function('require','exports',code)(id=>{assert(Object.hasOwn(imports,id),id);return imports[id];},exports);
function nodes(n){return Array.isArray(n)?n.flatMap(nodes):n?.props?[n,...nodes(n.props.children)]:[];}

test('compact native disclosure is closed initially and links preserve the current tab',()=>{
 const tree=exports.AtlasRegionalNavigation({regionId:'leg'}),all=nodes(tree);
 const nav=all.find(n=>n.type==='workspace-navigation');assert.deepEqual(nav.props,{modality:'3d',regionId:'leg'});
 assert.equal(all.filter(n=>n.type==='details').length,1);assert.equal(all.find(n=>n.type==='details').props.open,undefined);
 assert.equal(all.filter(n=>n.type==='summary').length,1);assert.equal(all.filter(n=>n.type==='a').length,3);
 for(const a of all.filter(n=>n.type==='a')){assert.equal(a.props.target,'_blank');assert.equal(a.props.rel,'noopener noreferrer');assert.match(JSON.stringify(a.props.children),/new tab/);}
 const text=JSON.stringify(tree);assert.match(text,/Independent right-limb/);assert.match(text,/clinical review pending/);assert.match(text,/not aligned/);
 assert(!all.some(n=>n.type==='iframe'||n.type==='form'||n.type==='script'));
});

test('unsupported regions retain standard navigation without an empty disclosure',()=>{
 for(const regionId of ['whole-body','head-neck','hand']){
  const all=nodes(exports.AtlasRegionalNavigation({regionId}));assert.equal(all.filter(n=>n.type==='workspace-navigation').length,1);assert(!all.some(n=>n.type==='details'||n.type==='a'));
 }
});
