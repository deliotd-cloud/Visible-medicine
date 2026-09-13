import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {atlasModalities,atlasRegionLinks,selectedImagingRegion,legacyModalityHref} from '../lib/atlas-navigation.ts';
test('all five modalities have local destinations, preview images and honest status',()=>{
  assert.deepEqual(atlasModalities.map(m=>m.label),['3D','CT','MRI','Ultrasound','X-ray']);
  for(const m of atlasModalities){
    assert.ok(existsSync(new URL('../app'+m.href+'/page.tsx',import.meta.url)));
    assert.ok(existsSync(new URL('../public'+m.image,import.meta.url)));
    assert.ok(m.alt.length>20);
  }
  assert.equal(atlasModalities.find(m=>m.id==='ct')?.status,'Demonstration available');
  for(const id of ['mri','ultrasound','x-ray'])assert.equal(atlasModalities.find(m=>m.id===id)?.status,'In preparation');
});
test('every current 3D route is retained and wired to the compact region bar',()=>{
  const regions=atlasRegionLinks('3d');
  assert.equal(regions.length,8);
  assert.equal(new Set(regions.map(r=>r.href)).size,8);
  for(const r of regions){
    const source=readFileSync(new URL('../app'+r.href+'/page.tsx',import.meta.url),'utf8');
    assert.ok(source.includes(`<AtlasRegionNavigation modality="3d" selected="${r.id}"/>`));
    assert.ok(source.includes('allowFullScreen'));
    assert.equal(r.planned,undefined);
  }
});
test('imaging regions are modality scoped; only the CT demonstration is available',()=>{
  for(const modality of ['ct','mri','ultrasound','x-ray'] as const){
    const links=atlasRegionLinks(modality);
    assert.equal(links.length,8);
    for(const region of links){
      const url=new URL(region.href,'https://example.test');
      if(!region.planned){assert.equal(modality,'ct');assert.equal(region.id,'head-neck');assert.equal(url.pathname,'/atlas/ct-head');}
      else {assert.equal(url.pathname,'/atlas/'+modality);assert.equal(url.searchParams.get('region'),region.id);}
      assert.equal(selectedImagingRegion(modality,region.id).id,region.id);
    }
  }
  assert.equal(selectedImagingRegion('mri','javascript:alert(1)').id,'knee');
  assert.equal(selectedImagingRegion('ultrasound',['thorax','abdomen']).id,'abdomen');
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
