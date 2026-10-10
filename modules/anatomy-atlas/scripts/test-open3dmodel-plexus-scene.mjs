import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validatePlexusScene,plexusContextNames} from './open3dmodel-plexus-scene.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const scene=JSON.parse(await readFile('F:/VisibleMedicine/staging/20261003-plexus-conversion-v7/preview/scene.json','utf8'));

test('source-frame context does not alter the 42 nerves or eight held source objects',async()=>{
  const previous=JSON.parse(await readFile('F:/VisibleMedicine/staging/20261003-plexus-conversion-v5/preview/scene.json','utf8'));
  assert.deepEqual(scene.objects,previous.objects);assert.deepEqual(scene.held,previous.held);
  assert.equal(scene.objects.length,42);assert.equal(scene.objects.filter(item=>item.core).length,15);assert.equal(scene.held.length,8);
  const context=validatePlexusScene(scene);assert.deepEqual(context.map(item=>item.sourceName),plexusContextNames);
  const report=JSON.parse(await readFile('docs/open3dmodel-plexus-context-audit.json','utf8'));
  for(const item of context){const pinned=report.objects.find(row=>row.sourceName===item.sourceName);
    assert.equal(sha(JSON.stringify({vertices:item.vertices,faces:item.faces})),pinned.derivedGeometrySha256);
    assert.equal(item.core,false);assert(!scene.objects.some(nerve=>nerve.id===item.id));
  }
  const legacy=structuredClone(scene);delete legacy.contextObjects;assert.deepEqual(validatePlexusScene(legacy),[]);
});

test('malformed context, changed scope and context promoted to neural selections are refused',()=>{
  const cases=[
    data=>data.contextObjects.pop(),
    data=>data.contextObjects.push(structuredClone(data.contextObjects[0])),
    data=>data.contextObjects[0].sourceName='Humerus.l',
    data=>data.contextObjects[0].id=data.objects[0].id,
    data=>data.contextObjects[0].sourceName=data.contextObjects[1].sourceName,
    data=>data.contextObjects[0].role='neural',
    data=>data.contextObjects[0].core=true,
    data=>data.contextObjects[0].groupedDivisions=true,
    data=>data.contextObjects[0].sourceNamedRight=false,
    data=>data.contextObjects[0].vertices[0][0]=NaN,
    data=>data.contextObjects[0].faces[0][0]=data.contextObjects[0].vertices.length,
    data=>data.objects.push(data.contextObjects.shift()),
    data=>data.objects.push({...structuredClone(data.contextObjects[0]),id:'new-id'}),
    data=>data.clinicalApproved=true,
    data=>data.admissions=1,
    data=>data.registered=true,
    data=>data.mirrored=true,
    data=>data.units='mm',
  ];
  for(const mutate of cases){const copy=structuredClone(scene);mutate(copy);assert.throws(()=>validatePlexusScene(copy));}
});

test('viewer keeps bone context separate from selection, labels, export, fit and fade',async()=>{
  const source=await readFile('scripts/open3dmodel-plexus-viewer.mjs','utf8');
  assert.match(source,/const choices = data\.objects\.map/);
  assert.match(source,/intersectObjects\(objects\.filter/);
  assert.match(source,/const selected=data\.objects\.find/);
  assert.match(source,/for \(const mesh of contextMeshes\) mesh\.visible=el\('bone-context'\)\.checked&&!el\('isolate'\)\.checked/);
  assert.match(source,/el\('bone-context'\)\.checked=false/);
  const framing=source.slice(source.indexOf('function frameVisible'),source.indexOf('const choices'));
  assert(!framing.includes('contextMeshes'));
  const html=await readFile('scripts/open3dmodel-plexus-preview.html','utf8');
  assert.match(html,/<input id="bone-context" type="checkbox">/);
  const notices=await readFile('F:/VisibleMedicine/staging/20261003-plexus-conversion-v7/preview/THIRD_PARTY_NOTICES.txt','utf8');
  assert.match(notices,/Bone-context derivative/);assert.match(notices,/CC BY-SA 4\.0/);
});
