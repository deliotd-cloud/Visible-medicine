import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('regional export includes tested removal focus, contextual Undo and panel-only reveal',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,'1ccfb21d4dcb07fd6a9a1ef8306b6c1d13dfea1d');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/body-selection-notice.tsx':'585313543be9121cb073f3cb0cb0259f3c9da703b555b77ae5ddf12c706b21aa',
    'lib/contextual-dissection-undo.ts':'628154c5b1ef24e0a1a8f69544fbfeefbd84ab5b950955515a0ca6886d4e93ef',
    'app/body-explorer.tsx':'6e93637ab53c186a8513a0314fd5d8fdfacbf6665e1443d3b6a31f6b411b9ba9',
    'app/body-explorer.css':'315a5cbfeac80620e6f805b82d409a293acdf07869333438b6eb74dbbb3a826f',
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
