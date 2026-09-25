import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('regional export includes tested removal focus, contextual Undo and panel-only reveal',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,'64c1afa92b21c432b1c7f7817d67a616f3e129d3');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/body-selection-notice.tsx':'585313543be9121cb073f3cb0cb0259f3c9da703b555b77ae5ddf12c706b21aa',
    'lib/contextual-dissection-undo.ts':'628154c5b1ef24e0a1a8f69544fbfeefbd84ab5b950955515a0ca6886d4e93ef',
    'app/body-explorer.tsx':'1a24c0ece43111d220f385d2b730c580b34eb161e3c4622aa3a8705ba82350be',
    'app/body-explorer.css':'2cafcdb00ef8ae09842cf1b64cd6ae115c254882c49c86829ba3d9d052142c48',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const bytes=readFileSync(base+file.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
    return bytes.toString();
  }).join('\n');
  for(const marker of ['body-selection-undo','Undo hiding','Undo removal of','preventScroll','aria-atomic'])assert.ok(runtime.includes(marker),marker);
  assert.match(runtime,/function \w+\((\w+)\)\{if\(!\1\.isConnected\|\|\1\.ownerDocument\.activeElement!==\1\)return;.{0,250}\.querySelector\(`\.body-selection-notice`\);.{0,100}\.focus\(\{preventScroll:!0\}\)/,
    'Compiled focus helper retains active-trigger and persistent-feedback guards');
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[flag],false);
});
