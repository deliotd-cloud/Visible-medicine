import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('shared viewer binds reset wording and keyboard-only orientation status to exact Atlas source',()=>{
  const manifestBytes=readFileSync(base+'manifest.json');
  assert.equal(sha(manifestBytes),'cd0153780348320b65287d48618d1281bcdad8e68c03fc418231ce605d708467');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'0ff5e51a5fb9e6b660a16d1531da5c92a74317c2');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,expected] of Object.entries({
    'app/body-explorer.tsx':'8d2a95f39f61db6660745fedbe2dd52fc8df16d497cfc0e6d390b8d2be5491c5',
    'app/body-scene.tsx':'7117993fb76445f522d303c664fb5405ac07344f5e255906e2ee47640dc4acbc',
    'app/fitted-camera.tsx':'8621b76137dc18b1200cffb5fc79a0e38d55bb95d933978e7d73e43727850a49',
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
  assert.ok(explorer.includes('id:`reset-view-help`,className:`sr-only`,children:`System visibility and removed structures remain unchanged.`'));

  const scene=script('body-scene');
  assert.ok(scene.includes('className:`anatomy-live-orientation`,"aria-live":`off`'));
  assert.ok(scene.includes('className:`sr-only`,"aria-live":`polite`,"aria-atomic":`true`'));
  assert.ok(scene.includes('i.textContent=`View from: ${a}. Orbit angle: ${o(n)}° around, ${o(r)}° from above.`'));
  assert.ok(scene.includes('r.shiftKey?2:10'), 'Arrow and Shift-arrow steps share the keyboard path');
  assert.ok(scene.includes('e.addEventListener(`keydown`,i)'), 'Only the focused keyboard handler calls the status callback');
  // Perspective keyboard binding is now one branch of the orthographic/perspective
  // dispatch. Match its callback wiring without depending on the minified callee.
  assert.match(scene,/\w+\(v\.domElement,\(\)=>y\.current,\(\)=>\{j\(\),_\(\),m&&y\.current&&m\(/);
  assert.ok(scene.includes('onChange:j})'), 'Pointer orbit keeps the camera capture callback only');
});
