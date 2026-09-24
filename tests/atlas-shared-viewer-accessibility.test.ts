import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('shared viewer binds reset wording and keyboard-only orientation status to exact Atlas source',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'c9c25b983482587a139150736a6564cb9b034e0562241610fe560cafa9d5c554');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'15029f9075b6a252d0b594e6e8229bea2bf01d94');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,expected] of Object.entries({
    'app/body-explorer.tsx':'ebe9126a898abfa0f8b658a4a9fd19dbe03eb342b8cc1cde875a40ba8ebb4565',
    'app/body-scene.tsx':'a45ed62ff777f5850fc6a30cd2dd9234a17d4b163d905495acc2fc357d1d4132',
    'app/fitted-camera.tsx':'25af90a65131b77375c437a62b69288a95aeee6a224b417e7d595c5c72cc6c54',
    'lib/camera-keyboard.ts':'d26c359d9ccd7820c15099e36f7f6712d7e4a6ecbdc12fa3dc3d83ec8091acf2',
  }))assert.equal(inputs.find(input=>input.path===path)?.sha256,expected,path);
  const script=(name:string)=>{
    const file=(manifest.files as {path:string;sha256:string}[])
      .find(file=>file.path.startsWith(`assets/${name}-`)&&file.path.endsWith('.js'));
    assert.ok(file,`${name} bundle`);
    const bytes=readFileSync(base+file.path);
    assert.equal(sha(bytes),file.sha256,file.path);
    return bytes.toString();
  };
  const explorer=script('index');
  assert.ok(explorer.includes('"aria-label":`Reset camera, layout, cutaway, focus, isolation, and separation`'));
  assert.ok(explorer.includes('"aria-describedby":`reset-view-help`'));
  assert.ok(explorer.includes('System visibility and removed structures are preserved.'));
  assert.ok(explorer.includes('id:`reset-view-help`,className:`sr-only`,children:`System visibility and removed structures remain unchanged.`'));

  const scene=script('body-scene');
  assert.ok(scene.includes('className:`anatomy-live-orientation`,"aria-live":`off`'));
  assert.ok(scene.includes('className:`sr-only`,"aria-live":`polite`,"aria-atomic":`true`'));
  assert.ok(scene.includes('i.textContent=`View from: ${a}. Orbit angle: ${o(n)}° around, ${o(r)}° from above.`'));
  assert.ok(scene.includes('r.shiftKey?2:10'), 'Arrow and Shift-arrow steps share the keyboard path');
  assert.ok(scene.includes('e.addEventListener(`keydown`,i)'), 'Only the focused keyboard handler calls the status callback');
  assert.ok(scene.includes('return nw(v.domElement,()=>y.current,()=>{j(),_(),m&&y.current&&m('));
  assert.ok(scene.includes('onChange:j})'), 'Pointer orbit keeps the camera capture callback only');
});
