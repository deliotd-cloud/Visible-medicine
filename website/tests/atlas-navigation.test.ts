import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {atlasModalities,atlasBodyRegions,atlasRegionLinks,atlas3dReturnRegionForImaging,selectedBodyRegion,selectedImagingRegion,legacyModalityHref} from '../lib/atlas-navigation.ts';
test('all five modalities have local destinations, preview images and honest status',()=>{
  assert.deepEqual(atlasModalities.map(m=>m.label),['3D','CT','MRI','Ultrasound','X-ray']);
  for(const m of atlasModalities){
    assert.ok(existsSync(new URL('../app'+m.href+'/page.tsx',import.meta.url)));
    assert.ok(existsSync(new URL('../public'+m.image,import.meta.url)));
    assert.ok(m.alt.length>20);
  }
  for(const id of ['ct','mri']){
    const modality=atlasModalities.find(m=>m.id===id)!;
    assert.equal(modality.status,'Integrated viewer · local scans');
    assert.match(modality.overview,/Automatic loading in the configured local preview; approved folder selection elsewhere/);
    assert.match(modality.overview,/not spatially registered/);
  }
  assert.equal(atlasModalities.find(m=>m.id==='x-ray')?.status,'In preparation');
  const ultrasound=atlasModalities.find(m=>m.id==='ultrasound')!;
  assert.equal(ultrasound.status,'Local folders · review pending');
  assert.match(ultrasound.overview,/local still-image teaching folder/);
  assert.match(ultrasound.overview,/Published studies remain in preparation/);
  assert.match(ultrasound.alt,/diastasis recti/,'the existing pathological thumbnail is not relabelled normal');
});
test('every current 3D route is retained and wired to the compact region bar',()=>{
  const regions=atlasRegionLinks('3d');
  assert.equal(regions[0].id,'whole-body');
  assert.equal(regions[0].href,'/atlas/3d');
  assert.equal(regions.length,15);
  assert.equal(new Set(regions.map(r=>r.href)).size,15);
  for(const r of regions){
    const path=new URL(r.href,'https://atlas.invalid').pathname;
    const source=readFileSync(new URL('../app'+path+'/page.tsx',import.meta.url),'utf8');
    assert.ok(source.includes(path==='/atlas/3d'?'<AtlasRegionalNavigation regionId={region.id}/>':`<AtlasWorkspaceNavigation modality="3d" regionId="${r.id}"/>`));
    if(path==='/atlas/head-neck-3d'||path==='/atlas/3d'){
      // Head views keep linked/guided hosts; the shared route also has a plain non-head iframe.
      for(const host of path==='/atlas/3d'?['HeadAtlasLinkedModel']:['HeadAtlasLinkedModel','HeadAtlasGuidedModel']){
        assert.ok(source.includes(`<${host} `));
        const hostSource=readFileSync(new URL(`../components/${host}.tsx`,import.meta.url),'utf8');
        assert.match(hostSource,/<iframe[\s\S]*?allowFullScreen/);
      }
      if(path==='/atlas/3d'){
        assert.match(source,/const headComparison=region\.id==='head-neck'/);
        assert.match(source,/<AtlasRuntimeFrame\b[^>]*allowFullScreen\/>/);
        const frameSource=readFileSync(new URL('../components/AtlasRuntimeFrame.tsx',import.meta.url),'utf8');
        assert.match(frameSource,/<iframe\b[\s\S]*?allowFullScreen=\{allowFullScreen\}/);
        assert.match(frameSource,/className=\{className\} src=\{src\} title=\{title\}/);
      }
    }else assert.ok(source.includes('allowFullScreen'));
    assert.equal(r.planned,undefined);
  }
  for(const id of ['head-neck','shoulder','thorax','abdomen','pelvis','spine','lower-limb','female-pelvis'])assert.ok(regions.some(region=>region.id===id));
});
test('all eleven regions and whole body are bound to the actual exported scopes',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../public/atlas-runtime/head-neck/manifest.json',import.meta.url),'utf8'));
  assert.equal(atlasBodyRegions.length,12);
  assert.equal(manifest.regionalScopes.length,12);
  for(const region of atlasBodyRegions){
    const scope=manifest.regionalScopes.find((s:{region:string})=>s.region===region.id);
    assert.ok(scope);assert.equal(scope.regionalIds.length,region.structures);
    assert.equal(selectedBodyRegion(region.id),region);
  }
  assert.equal(selectedBodyRegion()?.id,'whole-body');
  for(const bad of ['', '__proto__','constructor','../hand','https://example.test',['hand','hand'],['hand','foot']])assert.equal(selectedBodyRegion(bad),null);
  const page=readFileSync(new URL('../app/atlas/3d/page.tsx',import.meta.url),'utf8');
  for(const snippet of ['if(!region)notFound()', 'key={region.id}', 'region=${region.id}', 'not an acquired-scan overlay or validated patient-space registration']){
    assert.ok(page.includes(snippet),snippet);
  }
  assert.ok(readFileSync(new URL('../components/SiteFrame.tsx',import.meta.url),'utf8').includes("pathname === '/atlas/3d'"));
});
test('imaging regions are modality scoped; CT and MRI head support private imports only',()=>{
  for(const modality of ['ct','mri','ultrasound','x-ray'] as const){
    const links=atlasRegionLinks(modality);
    assert.equal(links.length,8);
    for(const region of links){
      const url=new URL(region.href,'https://example.test');
      if(!region.planned){assert.ok(modality==='ct'||modality==='mri');assert.equal(region.id,'head-neck');assert.equal(url.pathname,`/atlas/${modality}-head`);}
      else {assert.equal(url.pathname,'/atlas/'+modality);assert.equal(url.searchParams.get('region'),region.id);}
      assert.equal(selectedImagingRegion(modality,region.id).id,region.id);
    }
  }
  assert.equal(selectedImagingRegion('mri','javascript:alert(1)').id,'head-neck');
  assert.equal(selectedImagingRegion('ultrasound',['thorax','abdomen']).id,'abdomen');
});
test('imaging return links use only existing 3D regions, not inferred image registration',()=>{
  const expected=[
    ['head-neck','head-neck','Head & neck','/atlas/head-neck-3d'],
    ['spine','spine','Spine & back','/atlas/spine-3d'],
    ['thorax','thorax','Thorax','/atlas/thorax-3d'],
    ['abdomen','abdomen','Abdomen','/atlas/abdomen-3d'],
    ['pelvis','pelvis','Pelvis','/atlas/pelvis-3d'],
    ['shoulder','shoulder','Shoulder detail','/atlas/shoulder-3d'],
    ['knee','leg','Knee & leg','/atlas/3d?region=leg'],
    ['ankle-foot','foot','Ankle & foot','/atlas/3d?region=foot'],
  ] as const;
  for(const [imaging,id,label,href] of expected){
    const link=atlas3dReturnRegionForImaging(imaging);
    assert.equal(link,atlasRegionLinks('3d').find(region=>region.id===id));
    assert.equal(link?.label,label);
    assert.equal(link?.href,href);
  }
  for(const invalid of ['', 'hand', 'constructor', '__proto__', '../thorax', 'https://example.test'])
    assert.equal(atlas3dReturnRegionForImaging(invalid),null);
});
test('actual pending imaging page preserves selected 3D return and CT-demo disclosure',()=>{
  const source=readFileSync(new URL('../components/ImagingAtlasPage.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const module={exports:{} as Record<string,unknown>};
  const require=createRequire(import.meta.url);
  const mockRequire=(name:string):unknown=>{
    if(name==='next/link')return ({href,children}:{href:string;children:React.ReactNode})=>React.createElement('a',{href},children);
    if(name==='./AtlasRegionNavigation')return {AtlasRegionNavigation:()=>React.createElement('nav',{'aria-label':'Regions'})};
    if(name==='../lib/atlas-navigation')return {atlasModalities,atlasRegionLinks,atlas3dReturnRegionForImaging,selectedImagingRegion};
    if(name==='../lib/head-atlas-navigation')return require('../lib/head-atlas-navigation.ts');
    if(name==='../lib/imaging-pane-focus')return require('../lib/imaging-pane-focus.ts');
    if(name==='../lib/head-disclosure-keyboard')return require('../lib/head-disclosure-keyboard.ts');
    if(name.endsWith('.css'))return {};
    if(name==='./ImagingAtlasShell'||name==='./ImagingPaneNavigation'||name==='./AtlasWorkspaceNavigation'||name==='./NativeDisclosure'){
      const shellSource=readFileSync(new URL(`../components/${name.slice(2)}.tsx`,import.meta.url),'utf8');
      const shellCode=ts.transpileModule(shellSource,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
      const shell={exports:{}};
      new Function('require','module','exports',shellCode)(mockRequire,shell,shell.exports);
      return shell.exports;
    }
    return require(name);
  };
  new Function('require','module','exports',compiled)(mockRequire,module,module.exports);
  const Page=module.exports.ImagingAtlasPage as (props:{modality:'ct'|'mri'|'ultrasound'|'x-ray';region?:string|string[]})=>React.ReactNode;
  for(const [modality,region,href,label] of [
    ['mri','knee','/atlas/3d?region=leg','Knee & leg'],
    ['ultrasound','abdomen','/atlas/abdomen-3d','Abdomen'],
    ['x-ray','thorax','/atlas/thorax-3d','Thorax'],
    ['ct','spine','/atlas/spine-3d','Spine & back'],
  ] as const){
    const html=renderToStaticMarkup(React.createElement(Page,{modality,region}));
    assert.ok(html.includes(`href="${href.replaceAll('&','&amp;')}"`),`${modality}:${region}: 3D return`);
    assert.ok(html.includes(`Explore ${label.replaceAll('&','&amp;')} in 3D`),`${modality}:${region}: destination label`);
    assert.ok(html.includes('There is no released'),`${modality}:${region}: readiness`);
    assert.equal(html.includes('head viewer · local scans'),modality==='ct'||modality==='mri');
    for(const pane of ['sidebar','viewer','info'])assert.ok(html.includes(`class="imaging-workspace-${pane}"`),`${modality}:${pane} shared layout`);
    assert.match(html,/<input type="search" disabled=""/);
    assert.ok(html.includes('Published annotations'));
    assert.ok(!html.includes('<canvas')&&!html.includes('<img'),'pending studies are not replaced with fake scans');
  }
});
test('legacy filter links are allowlisted, including Ultrasound and X-ray aliases',()=>{
  for(const m of atlasModalities)assert.equal(legacyModalityHref(m.label),m.href);
  assert.equal(legacyModalityHref('US'),'/atlas/ultrasound');
  assert.equal(legacyModalityHref('XRAY'),'/atlas/x-ray');
  for(const invalid of [undefined,'', 'https://example.test', '//example.test', 'javascript:alert(1)', ['CT','MRI']])assert.equal(legacyModalityHref(invalid),null);
});
test('credits and image hashes bind the reviewed preview bytes',()=>{
  const notices=readFileSync(new URL('../public/media/atlas/NOTICES.md',import.meta.url),'utf8');
  assert.ok(notices.includes('CC BY 4.0'));
  assert.ok(notices.includes('CC0'));
  assert.ok(notices.includes('diastasis recti'));
  assert.ok(notices.includes('Ex vivo'));
  const manifest=JSON.parse(readFileSync(new URL('../public/media/atlas/manifest.json',import.meta.url),'utf8'));
  assert.equal(manifest.images.length,5);
  for(const image of manifest.images){
    const bytes=readFileSync(new URL('../public/media/atlas/'+image.file,import.meta.url));
    assert.equal(bytes.length,image.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),image.sha256);
  }
});
test('homepage and Atlas overview share the same five-modality cards and honest availability',()=>{
  const home=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
  const atlas=readFileSync(new URL('../app/atlas/page.tsx',import.meta.url),'utf8');
  const cards=readFileSync(new URL('../components/AtlasModalityCards.tsx',import.meta.url),'utf8');
  assert.ok(home.includes('<AtlasModalityCards headingLevel={3}/>'));
  assert.ok(atlas.includes('<AtlasModalityCards layout="list"/>'));
  for(const page of [home,atlas])assert.ok(page.includes('<AtlasImageNotes/>'));
  assert.ok(cards.includes('atlasModalities.map'));
  for(const field of ['modality.href','modality.status','modality.image','modality.alt'])assert.ok(cards.includes(field));
  assert.ok(home.includes('<AtlasModalityPreview/>'));
  assert.ok(cards.includes('aria-label="Atlas modality previews"'));
  assert.ok(cards.includes('homepage-modality-mosaic'));
  assert.ok(cards.includes("layout==='list'?modality.overview:modality.description"));
  assert.ok(cards.includes('Reference previews · image credits'));
  assert.ok(home.includes('Start with whole-body 3D anatomy'));
  assert.ok(!home.includes('Shoulder preview from the 3D viewer'));
  assert.ok(!home.includes('atlasModules.slice'));
  assert.ok(!home.includes('One normal study'));
  assert.ok(!home.includes('className="ct-scan"'));
});

test('homepage previews use matching image frames without an oversized 3D tile',()=>{
  const cards=readFileSync(new URL('../components/AtlasModalityCards.tsx',import.meta.url),'utf8');
  const preview=cards.slice(cards.indexOf('export function AtlasModalityPreview'),cards.indexOf('export function AtlasImageNotes'));
  const css=readFileSync(new URL('../app/atlas-navigation.css',import.meta.url),'utf8');
  assert.ok(preview.includes('atlasModalities.map'));
  assert.ok(cards.includes("import Image from 'next/image'"));
  assert.equal([...cards.matchAll(/<Image\s+src=\{modality\.image\}[^>]*\bunoptimized\s*\/>/g)].length,2,'both Atlas preview surfaces use static files without image transformations');
  assert.ok(preview.includes('<div className="homepage-modality-artwork"><Image src={modality.image} alt={modality.alt} width={640} height={440} unoptimized/>'));
  assert.ok(preview.includes('href={modality.href}'));
  assert.ok(preview.includes('Reference previews · image credits'));
  assert.match(css,/\.homepage-modality-preview\{grid-column:span 2;/);
  assert.match(css,/\.homepage-modality-artwork\{position:relative;aspect-ratio:1\.15;/);
  assert.ok(!/\.homepage-modality-preview[^{}]*\{[^{}]*grid-row/.test(css));
  assert.match(css,/@media\(max-width:360px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.homepage-modality-preview\{transition:none\}\}/);
});
