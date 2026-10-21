import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const websiteEpoch='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const historical=(path:string)=>execFileSync('git',['--no-replace-objects','show',`${websiteEpoch}:${path}`]);

test('original shared viewer source and manifest hashes remain pinned to their immutable website epoch',()=>{
  const manifestBytes=historical(base+'manifest.json');
  assert.equal(sha(manifestBytes),'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
  const inputs=JSON.parse(historical(base+'source-inputs.json').toString()) as {path:string;sha256:string}[];
  for(const [path,expected] of Object.entries({
    'app/body-explorer.tsx':'2dad1c22dfec424db6a4cdf578cb4f9cafe6a0e3295f95ed7d3318976aa62dc0',
    'app/body-scene.tsx':'3350aeb0ef4dfa7b4fd884f0877d8ce0166a90f2a1d49d1df987e68c5c613f9f',
    'app/fitted-camera.tsx':'9d13fb2b2c498fff6fae7944b4f6ed95d4563dc9d0e1653eed0cb716aa6743a0',
    'lib/camera-keyboard.ts':'9a0a095306c6687ca7fd568570c7a66363566ac3a70f2916bc1e8f74aa405220',
  }))assert.equal(inputs.find(input=>input.path===path)?.sha256,expected,path);
});

test('shared viewer binds reset wording and keyboard-only orientation status to exact Atlas source',()=>{
  const atlasRoot=currentAtlasDeliveryRoot();
  const manifestBytes=readFileSync(base+'manifest.json');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  assert.equal(review.revision,CURRENT_ATLAS_REVISION);
  for(const path of ['app/body-explorer.tsx','app/body-scene.tsx','app/fitted-camera.tsx','lib/camera-keyboard.ts']){
    const source=execFileSync('git',['--no-replace-objects','-C',atlasRoot,'show',`${CURRENT_ATLAS_REVISION}:${path}`]);
    assert.equal(inputs.find(input=>input.path===path)?.sha256,sha(source),path);
    assert.equal(review.files.find((file:{path:string})=>file.path===path)?.sourceSha256,sha(source),path);
  }
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
  assert.ok(explorer.includes('id:`reset-view-help`,className:`sr-only`,children:`Original-position guides and bone pinning are reset. System visibility and removed structures remain unchanged.`'));

  const scene=script('body-scene');
  assert.ok(scene.includes('className:`anatomy-live-orientation`,"aria-live":`off`'));
  assert.ok(scene.includes('className:`sr-only`,"aria-live":`polite`,"aria-atomic":`true`'));
  assert.ok(scene.includes('i.textContent=`View from: ${a}. Orbit angle: ${o(n)}° around, ${o(r)}° from above.`'));
  assert.ok(scene.includes('r.shiftKey?2:10'), 'Arrow and Shift-arrow steps share the keyboard path');
  assert.ok(scene.includes('e.addEventListener(`keydown`,i)'), 'Only the focused keyboard handler calls the status callback');
  // Perspective keyboard binding is now one branch of the orthographic/perspective
  // dispatch. Match its callback wiring without depending on the minified callee.
  // Bind the readable implementation to the exported source hash instead of
  // depending on local names changed by the guided-camera minification.
  const cameraFile=review.files.find((f:{path:string})=>f.path==='app/fitted-camera.tsx');
  assert.equal(cameraFile.sourceSha256,inputs.find(i=>i.path==='app/fitted-camera.tsx')?.sha256);
  const cameraBytes=readFileSync('atlas-review/app/fitted-camera.tsx');
  assert.equal(sha(cameraBytes),cameraFile.importedSha256);
  const cameraSource=cameraBytes.toString();
  const keyboardPrelude=cameraSource.match(/return bindCameraKeyboard\(gl\.domElement, \(\) => controls\.current, \(\) => \{([\s\S]*?)capture\(\);\s+invalidate\(\);\s+if \(onKeyboardRotate && controls\.current\)/);
  assert.ok(keyboardPrelude, 'Accepted keyboard input retains capture, invalidation and orientation callback');
  assert.ok(keyboardPrelude[1].includes('transition.current = null;'), 'Keyboard inspection interrupts the sweep before capture');
  assert.ok(cameraSource.includes('onChange={capture}'), 'Pointer orbit keeps the camera capture callback only');
});
