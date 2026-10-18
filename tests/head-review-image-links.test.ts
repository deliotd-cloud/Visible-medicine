import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headImageConceptById} from '../lib/head-image-only-links.ts';
import {parseHeadImageNavigation} from '../lib/head-atlas-navigation.ts';
import {headTeachingPacket} from '../lib/head-atlas-teaching.ts';
import {verifiedHeadCtBoneComparisonPacket} from '../lib/head-ct-bone-comparison-review.ts';
import {verifiedHeadMriComparisonPacket} from '../lib/head-mri-comparison-review.ts';
import {verifiedHeadInsulaComparisonPacket} from '../lib/head-insula-comparison-review.ts';
import {verifiedHeadOrbitalComparisonPacket} from '../lib/head-orbital-comparison-review.ts';
import {verifiedHeadImageOnlyComparisonPacket} from '../lib/head-image-only-comparison-review.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';

const require=createRequire(import.meta.url);
function component(name:string):React.ComponentType<any>{
  const source=readFileSync(new URL(`../components/${name}.tsx`,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{} as Record<string,React.ComponentType<any>>};
  const load=(id:string):unknown=>{
    if(id==='./HeadReviewImageLink')return headReviewImageLinkModule;
    if(id.startsWith('../lib/'))return require(/\.(ts|mjs)$/.test(id)?id:id+'.ts');
    // Unrelated notes/forms are inert: the real Review markup and link render.
    if(id.startsWith('./'))return new Proxy({}, {get:()=>()=>null});
    return require(id);
  };
  new Function('require','module','exports',code)(load,mod,mod.exports);
  return mod.exports[name];
}
function imageTargets(html:string){
  return [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].flatMap(([,href])=>{
    const url=new URL(href.replaceAll('&amp;','&'),'https://review.invalid');
    return /^\/atlas\/(ct|mri)-head$/.test(url.pathname)&&!url.searchParams.has('headTour')?[url]:[];
  });
}
const cases=[
  ['HeadCtBoneComparisonReview',verifiedHeadCtBoneComparisonPacket],
  ['HeadMriComparisonReview',verifiedHeadMriComparisonPacket],
  ['HeadInsulaComparisonReview',verifiedHeadInsulaComparisonPacket],
  ['HeadOrbitalComparisonReview',verifiedHeadOrbitalComparisonPacket],
  ['HeadImageOnlyComparisonReview',verifiedHeadImageOnlyComparisonPacket],
] as const;

for(const [name,verify] of cases)test(`${name} inspection links retain packet revision without mutating evidence`,async()=>{
  const packet=await verify(HEAD_LINK_REVISION);assert(packet);
  const before=JSON.stringify(packet),Component=component(name);
  const html=renderToStaticMarkup(React.createElement(Component,{packet}));
  const targets=imageTargets(html);assert(targets.length>0);
  const items='items' in packet?packet.items:packet.bindings;
  const expected=items.flatMap(item=>{
    const binding=headImageConceptById(item.conceptId);assert(binding);
    return (['CT','MRI'] as const).flatMap(modality=>(modality==='CT'?binding.ctHref:binding.mriHref)
      ?[`${modality}:${item.conceptId}`]:[]);
  });
  assert.deepEqual(targets.map(url=>`${url.pathname.includes('/ct-')?'CT':'MRI'}:${url.searchParams.get('concept')}`).sort(),expected.sort());
  for(const url of targets){
    assert.deepEqual([...url.searchParams.keys()],['concept','headRevision']);
    assert.equal(url.searchParams.get('headRevision'),packet.headRevision);
    const modality=url.pathname.includes('/ct-')?'CT':'MRI';
    assert.equal(parseHeadImageNavigation(url.searchParams,packet.headRevision,modality).invalid,false);
  }
  const stale=renderToStaticMarkup(React.createElement(Component,{packet:{...packet,headRevision:'f'.repeat(64)}}));
  assert.deepEqual(imageTargets(stale),[],'stale packet must not open current-source substitutes');
  assert.match(stale,/target unavailable/);
  const missing=renderToStaticMarkup(React.createElement(Component,{packet:null}));
  assert.deepEqual(imageTargets(missing),[]);
  assert.equal(JSON.stringify(packet),before,'rendering must not rebind or approve a packet');
});

test('teaching review targets use its verified revision and stale teaching remains unavailable',()=>{
  const Component=component('HeadAtlasTeachingReview'),packet=headTeachingPacket(),before=JSON.stringify(packet);
  const html=renderToStaticMarkup(React.createElement(Component,{revision:HEAD_LINK_REVISION}));
  const targets=imageTargets(html);
  assert.equal(targets.length,packet.content.notes.length*2+14,'three brainstem and four ventricular summaries add exact CT/MRI inspection links');
  for(const note of packet.content.notes){
    const expected=note.conceptId.startsWith('brainstem-')||note.conceptId.startsWith('ventricle-')?4:2;
    assert.equal(targets.filter(url=>url.searchParams.get('concept')===note.conceptId).length,expected,note.conceptId);
  }
  for(const url of targets)assert.equal(url.searchParams.get('headRevision'),HEAD_LINK_REVISION);
  const stale=renderToStaticMarkup(React.createElement(Component,{revision:'f'.repeat(64)}));
  assert.deepEqual(imageTargets(stale),[]);assert.match(stale,/draft unavailable/);
  assert.equal(JSON.stringify(headTeachingPacket()),before);
});

test('review link refuses unknown anatomy and unsupported modality without a substitute',()=>{
  const Link=headReviewImageLinkModule.HeadReviewImageLink;
  for(const props of [
    {conceptId:'unknown',modality:'CT',revision:HEAD_LINK_REVISION},
    {conceptId:'bone-occipital',modality:'MRI',revision:HEAD_LINK_REVISION},
    {conceptId:'brainstem-pons',modality:'CT',revision:'old'},
  ]){
    const html=renderToStaticMarkup(React.createElement(Link,{...props,children:'Inspect'} as any));
    assert(!html.includes('<a'));assert.match(html,/target unavailable/);
  }
});
