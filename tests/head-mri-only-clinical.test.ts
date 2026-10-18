import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {facialAwareRequire} from './head-facial-hook-loader.ts';
import {headAnatomyCheckModule} from './head-anatomy-check-loader.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';
import * as links from '../lib/head-atlas-links.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import * as clinical from '../lib/head-mri-only-clinical.ts';

const require=facialAwareRequire(createRequire(import.meta.url));
const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const ids=['endocrine-pituitary-gland','commissure-corpus-callosum'];
const content=clinical.mriOnlyClinicalContent;
const escaped=(value:string)=>value.replaceAll('&','&amp;').replaceAll("'",'&#x27;').replaceAll('"','&quot;');
const hrefAttribute=(href:string)=>`href="${escaped(href)}"`;

function compile(path:string,imports:Record<string,unknown>={}){
  const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{
    compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
  const mod={exports:{} as Record<string,any>};
  new Function('require','module','exports',code)((name:string)=>imports[name]??(
    name==='./HeadAnatomyCheck'?headAnatomyCheckModule:
    name==='./HeadReviewImageLink'?headReviewImageLinkModule:
    path.startsWith('../lib/')&&name.startsWith('./head-')?require('../lib/'+name.slice(2)):
    name.startsWith('../lib/')?require(name.endsWith('.ts')?name:name+'.ts'):
    require(name)
  ),mod,mod.exports);
  return mod.exports;
}

test('two MRI-only draft notes have an exact independent packet and complete sources',async()=>{
  const packet=clinical.mriOnlyClinicalPacket();
  assert.equal(sha(packet),clinical.MRI_ONLY_CLINICAL_REVISION);
  assert.equal(await clinical.verifiedMriOnlyClinicalRevision(links.HEAD_LINK_REVISION),clinical.MRI_ONLY_CLINICAL_REVISION);
  assert.equal(await clinical.verifiedMriOnlyClinicalRevision('stale'),null);
  assert.equal(content.schema,'vm-head-mri-only-clinical-1');
  assert.equal(content.headRevision,links.HEAD_LINK_REVISION);
  assert.equal(content.status,'draft');
  for(const key of ['clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(content[key],false);
  assert.deepEqual(content.notes.map(note=>note.conceptId),ids);
  assert.equal(packet.bindings.length,2);
  assert.deepEqual(content.sources.map(source=>source.id),['pituitary-society-2025','splenium-2022']);
  const sourceIds=new Set(content.sources.map(source=>source.id));
  for(const source of content.sources)assert(source.title&&/^https:\/\//.test(source.url)&&source.evidence);
  for(const note of content.notes){
    assert(note.text&&note.caution&&note.question&&note.answer&&note.imaging.text);
    for(const id of [...note.sources,...note.imaging.sources])assert(sourceIds.has(id),`unknown source ${id}`);
  }
  assert.match(content.scope,/separate, unregistered subjects/);
  assert.match(content.scope,/No exact CT correspondence/);
  assert.doesNotMatch(JSON.stringify(packet),/data:image|\.(?:png|jpe?g|svg|webp|mp4)(?:["?])/i);
});

test('only exact current pituitary and callosal MRI placements resolve; 3D has common reflection only',()=>{
  for(const [index,note] of content.notes.entries()){
    const binding=links.headConceptById(note.conceptId)!;
    assert.deepEqual(clinical.mriOnlyClinicalPacket().bindings[index],binding);
    assert.equal(binding.headRevision,links.HEAD_LINK_REVISION);
    assert(!Object.hasOwn(binding,'ctHref'));
    assert(binding.mriHref&&binding.atlasHref);
    const native=clinical.mriOnlyClinicalForConcept(note.conceptId,'MRI',links.HEAD_LINK_REVISION)!;
    assert.equal(native.note.title,note.title);
    assert.equal(native.imaging,note.imaging);
    assert.deepEqual(native.binding,binding);
    assert.equal(native.revision,clinical.MRI_ONLY_CLINICAL_REVISION);
    const reference=clinical.mriOnlyClinicalForReference(note.conceptId,links.HEAD_LINK_REVISION)!;
    assert.equal(reference.note.title,note.title);
    assert.equal(reference.note.question,note.question);
    assert.equal(reference.note.answer,note.answer);
    assert(!Object.hasOwn(reference.note,'imaging'));
    assert(!Object.hasOwn(reference,'imaging'));
    assert.equal(reference.sources.length,1);
    assert.equal(clinical.mriOnlyClinicalForConcept(note.conceptId,'CT',links.HEAD_LINK_REVISION),null);
    assert.equal(clinical.mriOnlyClinicalForConcept(note.conceptId,'MRI','stale'),null);
    assert.equal(clinical.mriOnlyClinicalForReference(note.conceptId,'stale'),null);
  }
  for(const id of ['limbic-left-amygdala','limbic-right-amygdala','brainstem-pons','unknown']){
    assert.equal(clinical.mriOnlyClinicalForConcept(id,'MRI',links.HEAD_LINK_REVISION),null);
    assert.equal(clinical.mriOnlyClinicalForReference(id,links.HEAD_LINK_REVISION),null);
  }
  assert.equal(clinical.mriOnlyClinicalForConcept(ids[0],'US' as 'MRI',links.HEAD_LINK_REVISION),null);
});

test('verification refuses manifest drift, missing/foreign/altered/CT bindings and complete source changes',async()=>{
  const isolated=(lookup:typeof links.headConceptById,availability=true)=>compile('../lib/head-mri-only-clinical.ts',{
    './head-atlas-links.ts':{...links,headConceptById:lookup},
    './head-link-availability.ts':{headLinksCurrent:()=>availability},
  }) as typeof clinical;
  const changed=(transform:(binding:NonNullable<ReturnType<typeof links.headConceptById>>)=>ReturnType<typeof links.headConceptById>)=>
    isolated(id=>{const binding=links.headConceptById(id);return binding&&id===ids[0]?transform(binding):binding;});
  assert.equal(await isolated(links.headConceptById,false).verifiedMriOnlyClinicalRevision(links.HEAD_LINK_REVISION),null);
  assert.equal(await isolated(()=>null).verifiedMriOnlyClinicalRevision(links.HEAD_LINK_REVISION),null);
  assert.equal(await changed(()=>links.headConceptById(ids[1])).verifiedMriOnlyClinicalRevision(links.HEAD_LINK_REVISION),null);
  assert.equal(await changed(binding=>({...binding,headRevision:'stale'})).verifiedMriOnlyClinicalRevision(links.HEAD_LINK_REVISION),null);
  assert.equal(await changed(binding=>({...binding,ctHref:'/atlas/ct-head?foreign=1'})).verifiedMriOnlyClinicalRevision(links.HEAD_LINK_REVISION),null);
  for(const field of ['mriHref','atlasHref'] as const){
    assert.equal(await changed(binding=>({...binding,[field]:''})).verifiedMriOnlyClinicalRevision(links.HEAD_LINK_REVISION),null,`missing ${field}`);
    assert.equal(await changed(binding=>({...binding,[field]:'/wrong-target'})).verifiedMriOnlyClinicalRevision(links.HEAD_LINK_REVISION),null,`altered ${field}`);
  }
  for(const mutate of [
    (draft:typeof clinical)=>{(draft.mriOnlyClinicalContent.notes[0] as {text:string}).text+=' changed';},
    (draft:typeof clinical)=>{(draft.mriOnlyClinicalContent.notes[0].imaging as {text:string}).text+=' changed';},
    (draft:typeof clinical)=>{(draft.mriOnlyClinicalContent.notes[1] as {answer:string}).answer+=' changed';},
    (draft:typeof clinical)=>{(draft.mriOnlyClinicalContent.sources[0] as {evidence:string}).evidence+=' changed';},
    (draft:typeof clinical)=>{(draft.mriOnlyClinicalContent.sources[1] as {url:string}).url='https://example.invalid/changed';},
    (draft:typeof clinical)=>{(draft.mriOnlyClinicalContent as {scope:string}).scope+=' changed';},
    (draft:typeof clinical)=>{(draft.mriOnlyClinicalContent as unknown as {reviewChecks:string[]}).reviewChecks.push('Changed review requirement');},
  ]){
    const draft=isolated(links.headConceptById);
    mutate(draft);
    assert.notEqual(sha(draft.mriOnlyClinicalPacket()),clinical.MRI_ONLY_CLINICAL_REVISION);
    assert.equal(await draft.verifiedMriOnlyClinicalRevision(links.HEAD_LINK_REVISION),null);
  }
});

test('actual native MRI and existing 3D teaching fold clinical content with their distinct scopes',()=>{
  const Teaching=compile('../components/HeadAtlasTeaching.tsx').HeadAtlasTeaching;
  const Reference=compile('../components/HeadAtlasReferenceTeaching.tsx').HeadAtlasReferenceTeaching;
  for(const note of content.notes){
    const native=renderToStaticMarkup(React.createElement(Teaching,{conceptId:note.conceptId,modality:'MRI',revision:links.HEAD_LINK_REVISION}));
    for(const phrase of [note.text,note.caution,note.imaging.text,note.question,note.answer,clinical.MRI_ONLY_CLINICAL_REVISION])assert(native.includes(escaped(phrase)),`native ${phrase}`);
    assert.match(native,/<details><summary>Clinical correlation · Draft<\/summary>/);
    assert.match(native,/<details><summary>Reveal explanation<\/summary>/);
    assert.match(native,/no score or completion recorded/);
    assert(!native.includes('checked=""'));
    const ct=renderToStaticMarkup(React.createElement(Teaching,{conceptId:note.conceptId,modality:'CT',revision:links.HEAD_LINK_REVISION}));
    assert(!ct.includes(escaped(note.text)));
    assert(!ct.includes(escaped(note.imaging.text)));
    assert(!ct.includes(clinical.MRI_ONLY_CLINICAL_REVISION));
    const reference=renderToStaticMarkup(React.createElement(Reference,{conceptId:note.conceptId,revision:links.HEAD_LINK_REVISION}));
    for(const phrase of [note.text,note.caution,note.question,note.answer,clinical.MRI_ONLY_CLINICAL_REVISION])assert(reference.includes(escaped(phrase)),`3D ${phrase}`);
    assert(!reference.includes(escaped(note.imaging.text)));
    assert.match(reference,/<details><summary>Clinical correlation &amp; reflection · Draft<\/summary>/);
    assert.match(reference,/separate, unregistered subjects/);
    assert.equal(renderToStaticMarkup(React.createElement(Teaching,{conceptId:note.conceptId,modality:'MRI',revision:'stale'})),'');
    assert.equal(renderToStaticMarkup(React.createElement(Reference,{conceptId:note.conceptId,revision:'stale'})),'');
  }
});

test('read-only Review uses exact MRI/3D links and withholds all targets on packet mismatch',()=>{
  const Review=compile('../components/HeadMriOnlyClinicalReview.tsx').HeadMriOnlyClinicalReview as React.ComponentType<{revision:string;clinicalRevision:string|null}>;
  const render=(revision:string,clinicalRevision:string|null)=>renderToStaticMarkup(React.createElement(Review,{revision,clinicalRevision}));
  const html=render(links.HEAD_LINK_REVISION,clinical.MRI_ONLY_CLINICAL_REVISION);
  assert(html.includes('id="mri-only-clinical-review"'));
  for(const phrase of [content.scope,clinical.MRI_ONLY_CLINICAL_REVISION,...content.reviewChecks,content.reuse])assert(html.includes(escaped(phrase)),phrase);
  for(const note of content.notes){
    const section=html.slice(html.indexOf(`id="mri-only-clinical-${note.conceptId}"`));
    for(const phrase of [note.text,note.caution,note.imaging.text,note.question,note.answer])assert(section.includes(escaped(phrase)),phrase);
    const binding=links.headConceptById(note.conceptId)!;
    const mri=headImageHref('MRI',note.conceptId,null,links.HEAD_LINK_REVISION)!;
    assert(section.includes(hrefAttribute(mri)));
    assert(section.includes(hrefAttribute(binding.atlasHref)));
    assert(section.includes(escaped(binding.mriHref!)));
  }
  for(const source of content.sources){assert(html.includes(hrefAttribute(source.url)));assert(html.includes(escaped(source.evidence)));}
  assert.doesNotMatch(html,/<form\b|<input\b|<button\b|action=|\/atlas\/ct-head|<details open/);
  for(const [revision,clinicalRevision] of [
    ['stale',clinical.MRI_ONLY_CLINICAL_REVISION],
    [links.HEAD_LINK_REVISION,'stale'],
    [links.HEAD_LINK_REVISION,null],
  ] as const){
    const unavailable=render(revision,clinicalRevision);
    assert.match(unavailable,/MRI-only clinical draft unavailable/);
    assert.match(unavailable,/No targets have been substituted/);
    assert(!unavailable.includes(escaped(content.notes[0].text)));
    assert.doesNotMatch(unavailable,/<a\b|<form\b|<input\b|<button\b/);
  }
});

test('authorized page verifies before exposing MRI-only picker targets and separate corrections',()=>{
  const page=readFileSync(new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url),'utf8');
  const authorization=page.indexOf('await authorizeClinicalReview()');
  const verification=page.indexOf('await verifiedMriOnlyClinicalRevision(');
  const targets=page.indexOf('...(mriOnlyClinicalRevision?[');
  const render=page.indexOf('return <HeadAtlasTeachingReview');
  assert(authorization>=0&&authorization<verification&&verification<targets&&targets<render);
  assert.match(page,/\.\.\.\(mriOnlyClinicalRevision\?\[\s*\{id:'mri-only-clinical-review'/);
  assert.match(page,/\.\.\.mriOnlyClinicalContent\.notes\.map\(note=>\(\{id:'mri-only-clinical-'\+note\.conceptId/);
  assert.match(page,/mriOnlyClinicalReview=\{mriOnlyClinicalRevision\?<HeadMriOnlyClinicalReview/);
  assert.match(page,/if\(mriOnlyClinicalRevision\)try\{mriOnlyClinicalContext=await headTeachingDraftContext\(HEAD_MANIFEST_SHA256,'mri-only-clinical'\)/);
  const review=readFileSync(new URL('../components/HeadMriOnlyClinicalReview.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(review,/HeadTeachingReviewNotes|<form\b|<button\b/);
});

test('actual page withholds new picker entries until authorization and independent packet verification',async()=>{
  const source=readFileSync(new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const page=(authorized:boolean,verified:boolean)=>{
    const calls:string[]=[],mod={exports:{} as {default:()=>Promise<React.ReactElement<any>>}};
    const empty=new Proxy({}, {get:()=>async()=>null});
    const imports:Record<string,unknown>={
      'react/jsx-runtime':require('react/jsx-runtime'),
      '@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{calls.push('authorize');if(!authorized)throw Error('private denial');}},
      '@/lib/head-atlas-import':{HEAD_MANIFEST_SHA256:links.HEAD_LINK_REVISION},
      '@/lib/head-teaching-review-contract':{headTeachingDraftContext:async()=>({packetId:'fixture'})},
      '@/lib/head-mri-only-clinical':{
        mriOnlyClinicalContent:content,
        verifiedMriOnlyClinicalRevision:async(revision:string)=>{
          calls.push('mri-only-clinical');
          assert.equal(revision,links.HEAD_LINK_REVISION);
          return verified?clinical.MRI_ONLY_CLINICAL_REVISION:null;
        },
      },
      '@/components/HeadAtlasTeachingReview':{HeadAtlasTeachingReview:()=>null},
    };
    new Function('require','module','exports',code)((name:string)=>imports[name]??(name.startsWith('@/')?empty:require(name)),mod,mod.exports);
    return {run:mod.exports.default,calls};
  };
  const denied=page(false,true),denial=await denied.run();
  assert.deepEqual(denied.calls,['authorize']);
  assert.match(renderToStaticMarkup(denial),/authorized administrator account/);
  const absent=page(true,false),unverified=await absent.run();
  assert.deepEqual(absent.calls,['authorize','mri-only-clinical']);
  assert(!unverified.props.additionalTargets.some((target:{id:string})=>target.id.startsWith('mri-only-clinical-')));
  assert.equal(unverified.props.mriOnlyClinicalReview,undefined);
  const present=page(true,true),verifiedPage=await present.run();
  assert.deepEqual(present.calls,['authorize','mri-only-clinical']);
  assert.deepEqual(verifiedPage.props.additionalTargets.filter((target:{id:string})=>target.id.startsWith('mri-only-clinical-')).map((target:{id:string})=>target.id),[
    'mri-only-clinical-corrections','mri-only-clinical-review',...ids.map(id=>'mri-only-clinical-'+id),
  ]);
  assert.equal(verifiedPage.props.mriOnlyClinicalReview.props.clinicalRevision,clinical.MRI_ONLY_CLINICAL_REVISION);
});
