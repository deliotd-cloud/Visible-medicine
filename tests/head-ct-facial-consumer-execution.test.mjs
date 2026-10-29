import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import * as teaching from '../lib/head-ct-facial-teaching.ts';
import * as clinical from '../lib/head-ct-facial-clinical.ts';

const require=createRequire(import.meta.url);
const ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const root=new URL('../components/',import.meta.url);
const ids=['bone-left-zygomatic','bone-right-zygomatic','bone-mandible'];
const libImports=new Map([
  ['../lib/head-atlas-teaching','../lib/head-atlas-teaching.ts'],
  ['../lib/head-brainstem-clinical.ts','../lib/head-brainstem-clinical.ts'],
  ['../lib/head-cerebellar-clinical.ts','../lib/head-cerebellar-clinical.ts'],
  ['../lib/head-cerebellar-teaching','../lib/head-cerebellar-teaching.ts'],
  ['../lib/head-ct-bone-teaching','../lib/head-ct-bone-teaching.ts'],
  ['../lib/head-ct-facial-clinical.ts','../lib/head-ct-facial-clinical.ts'],
  ['../lib/head-ct-facial-teaching.ts','../lib/head-ct-facial-teaching.ts'],
  ['../lib/head-deep-grey-clinical.ts','../lib/head-deep-grey-clinical.ts'],
  ['../lib/head-hippocampal-clinical.ts','../lib/head-hippocampal-clinical.ts'],
  ['../lib/head-insula-teaching','../lib/head-insula-teaching.ts'],
  ['../lib/head-lobar-clinical.ts','../lib/head-lobar-clinical.ts'],
  ['../lib/head-mri-only-clinical.ts','../lib/head-mri-only-clinical.ts'],
  ['../lib/head-mri-only-teaching','../lib/head-mri-only-teaching.ts'],
  ['../lib/head-orbital-teaching','../lib/head-orbital-teaching.ts'],
  ['../lib/head-ventricular-clinical.ts','../lib/head-ventricular-clinical.ts'],
]);
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const settle=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};

async function load(name,resolve){
  const source=await readFile(new URL(name,root),'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  vm.runInNewContext(js,{module,exports:module.exports,require:resolve,Set,Promise,Object,crypto:globalThis.crypto},{filename:name});
  return module.exports;
}

function hookHarness(){
  let state,scheduled,cleanup,dependency,requests=[];
  const mockReact={
    useState(initial){if(state===undefined)state=initial;return [state,next=>{state=next;}];},
    useEffect(effect,deps){if(dependency!==deps[0])scheduled={effect,revision:deps[0]};},
  };
  const probe=async()=>load('useVerifiedFacialTeaching.ts',specifier=>{
    if(specifier==='react')return mockReact;
    if(specifier.includes('head-atlas-links'))return {HEAD_LINK_REVISION};
    if(specifier.includes('head-ct-facial-teaching'))return {HEAD_CT_FACIAL_TEACHING_REVISION:teaching.HEAD_CT_FACIAL_TEACHING_REVISION,verifiedHeadCtFacialTeachingRevision:revision=>{const d=deferred();requests.push({kind:'teaching',revision,...d});return d.promise;}};
    if(specifier.includes('head-ct-facial-clinical'))return {HEAD_CT_FACIAL_CLINICAL_REVISION:clinical.HEAD_CT_FACIAL_CLINICAL_REVISION,verifiedHeadCtFacialClinicalRevision:revision=>{const d=deferred();requests.push({kind:'clinical',revision,...d});return d.promise;}};
    throw Error(specifier);
  });
  return {probe,render:(hook,revision)=>hook(revision),flush(){if(scheduled){cleanup?.();cleanup=scheduled.effect();dependency=scheduled.revision;scheduled=undefined;}},requests:()=>requests,unmount(){cleanup?.();cleanup=undefined;}};
}

test('executed verifier hook waits for both exact pins, rejects partial/rejected and stale revision',async()=>{
  const h=hookHarness(),{useVerifiedFacialTeaching:hook}=await h.probe();
  assert.equal(h.render(hook,HEAD_LINK_REVISION),false);h.flush();
  h.requests()[0].resolve(teaching.HEAD_CT_FACIAL_TEACHING_REVISION);await settle();
  assert.equal(h.render(hook,HEAD_LINK_REVISION),false);
  h.requests()[1].resolve('wrong clinical pin');await settle();
  assert.equal(h.render(hook,HEAD_LINK_REVISION),false);
  assert.equal(h.render(hook,'stale'),false);h.flush();
  assert.equal(h.requests().length,2);
  assert.equal(h.render(hook,HEAD_LINK_REVISION),false);h.flush();
  h.requests()[2].resolve(teaching.HEAD_CT_FACIAL_TEACHING_REVISION);
  h.requests()[3].resolve(clinical.HEAD_CT_FACIAL_CLINICAL_REVISION);await settle();
  assert.equal(h.render(hook,HEAD_LINK_REVISION),true);
  assert.equal(h.render(hook,'stale'),false,'revision switch must hide verified content before effect flush');
  h.flush();
});

test('executed verifier hook ignores late retired resolution, rejection and unmount',async()=>{
  const h=hookHarness(),{useVerifiedFacialTeaching:hook}=await h.probe();
  h.render(hook,HEAD_LINK_REVISION);h.flush();
  assert.equal(h.render(hook,'stale'),false);h.flush();
  h.requests()[0].resolve(teaching.HEAD_CT_FACIAL_TEACHING_REVISION);
  h.requests()[1].resolve(clinical.HEAD_CT_FACIAL_CLINICAL_REVISION);await settle();
  assert.equal(h.render(hook,'stale'),false);
  h.render(hook,HEAD_LINK_REVISION);h.flush();
  h.requests()[2].reject(Error('verifier failed'));h.requests()[3].resolve(clinical.HEAD_CT_FACIAL_CLINICAL_REVISION);await settle();
  assert.equal(h.render(hook,HEAD_LINK_REVISION),false);
  h.render(hook,'stale');h.flush();h.render(hook,HEAD_LINK_REVISION);h.flush();h.unmount();
  h.requests()[4].resolve(teaching.HEAD_CT_FACIAL_TEACHING_REVISION);
  h.requests()[5].resolve(clinical.HEAD_CT_FACIAL_CLINICAL_REVISION);await settle();
  assert.equal(h.render(hook,HEAD_LINK_REVISION),false);
});

async function consumer(name,ready){
  return load(name,specifier=>{
    if(specifier==='react/jsx-runtime'||specifier==='react')return require(specifier);
    if(specifier.includes('head-ct-facial-teaching'))return teaching;
    if(specifier.includes('head-ct-facial-clinical'))return clinical;
    if(specifier==='./useVerifiedFacialTeaching')return {FACIAL_CONCEPTS:new Set(ids),useVerifiedFacialTeaching:()=>ready};
    if(specifier==='./HeadAnatomyCheck')return {HeadAnatomyCheck:()=>React.createElement('span',null,'Anatomy check')};
    if(libImports.has(specifier))return require(fileURLToPath(new URL(libImports.get(specifier),root)));
    throw Error(specifier);
  });
}

test('transpiled SSR consumers show three CT drafts only after dual readiness; 3D has no CT task or imaging; MRI refuses',async()=>{
  const ctReady=await consumer('HeadAtlasTeaching.tsx',true),ctPending=await consumer('HeadAtlasTeaching.tsx',false);
  const refReady=await consumer('HeadAtlasReferenceTeaching.tsx',true),refPending=await consumer('HeadAtlasReferenceTeaching.tsx',false);
  const noMaskReady=await consumer('HeadAtlasConceptTeaching.tsx',true);
  for(const id of ids){
    const render=(Component,props)=>renderToStaticMarkup(React.createElement(Component,{conceptId:id,revision:HEAD_LINK_REVISION,...props}));
    const ct=render(ctReady.HeadAtlasTeaching,{modality:'CT'});
    assert.match(ct,/Anatomy &amp; relationships/);assert.match(ct,/CT · reading the image/);assert.match(ct,/Try this/);
    assert.match(ct,/Clinical correlation/);assert.match(ct,/CT pitfall/);
    assert.equal(render(ctPending.HeadAtlasTeaching,{modality:'CT'}),'');
    assert.equal(render(ctReady.HeadAtlasTeaching,{modality:'MRI'}),'');
    const generic=render(refReady.HeadAtlasReferenceTeaching,{});
    assert.match(generic,/Anatomy &amp; relationships/);assert.match(generic,/Clinical orientation/);
    assert.doesNotMatch(generic,/reading the image|Try this|CT pitfall|Trace the limited region|Inspect the saved mandible region/);
    assert.equal(render(refPending.HeadAtlasReferenceTeaching,{}),'');
    const noMask=render(noMaskReady.HeadAtlasConceptTeaching,{modality:'CT'});
    assert.match(noMask,/Anatomy &amp; relationships/);
    assert.doesNotMatch(noMask,/Trace the limited region|Inspect the saved mandible region/);
    assert.equal(render(noMaskReady.HeadAtlasConceptTeaching,{modality:'MRI'}),'');
  }
});
