import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('shared viewer binds reset wording and keyboard-only orientation status to exact Atlas source',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'abd2471d5fb617eb9e8d9d881f3a539043acec019537aae1054b5591bb655501');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'08ef3834b790763917fd45ad5a3e404da3cdf2f0');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,expected] of Object.entries({
    'app/body-explorer.tsx':'aa5eef6a1429f28243aaaab185bc29b54bbdd3aa06c4990cefc767126796dc30',
    'app/body-scene.tsx':'2876f4674b4f1fedabdcb6f6aaef8f0085dfd9deb8e1c3bc8d68705931cecf7e',
    'app/fitted-camera.tsx':'ff59cb133b53a6ea728dc0aa902a1530559e375a834ec5eb7d0d7b5509a73e5c',
    'lib/camera-keyboard.ts':'9a0a095306c6687ca7fd568570c7a66363566ac3a70f2916bc1e8f74aa405220',
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
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const cameraFile=review.files.find((f:{path:string})=>f.path==='app/fitted-camera.tsx');
  assert.equal(cameraFile.sourceSha256,inputs.find(i=>i.path==='app/fitted-camera.tsx')?.sha256);
  const cameraBytes=readFileSync('atlas-review/app/fitted-camera.tsx');
  assert.equal(sha(cameraBytes),cameraFile.importedSha256);
  const cameraSource=cameraBytes.toString();
  assert.match(cameraSource,/return bindCameraKeyboard\(gl\.domElement, \(\) => controls\.current, \(\) => \{\s+capture\(\);\s+invalidate\(\);\s+if \(onKeyboardRotate && controls\.current\)/);
  assert.ok(cameraSource.includes('onChange={capture}'), 'Pointer orbit keeps the camera capture callback only');
});
