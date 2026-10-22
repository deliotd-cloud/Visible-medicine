import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

test('regional export includes tested removal focus, contextual Undo and panel-only reveal',()=>{
  const base='public/atlas-runtime/head-neck/';
  // The original Undo delivery is an immutable website epoch, not the current import.
  const milestone='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
  const at=(path:string)=>execFileSync('git',['show',`${milestone}:${path}`],{maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const manifest=JSON.parse(at(base+'manifest.json').toString());
  assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
  const inputs=JSON.parse(at(base+'source-inputs.json').toString()) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/body-selection-notice.tsx':'585313543be9121cb073f3cb0cb0259f3c9da703b555b77ae5ddf12c706b21aa',
    'lib/contextual-dissection-undo.ts':'628154c5b1ef24e0a1a8f69544fbfeefbd84ab5b950955515a0ca6886d4e93ef',
    'app/body-explorer.tsx':'2dad1c22dfec424db6a4cdf578cb4f9cafe6a0e3295f95ed7d3318976aa62dc0',
    'app/body-explorer.css':'315a5cbfeac80620e6f805b82d409a293acdf07869333438b6eb74dbbb3a826f',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const bytes=at(base+file.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
    return bytes.toString();
  }).join('\n');
  for(const marker of ['body-selection-undo','Undo hiding','Undo removal of','preventScroll','aria-atomic'])assert.ok(runtime.includes(marker),marker);
  assert.match(runtime,/function \w+\((\w+)\)\{if\(!\1\.isConnected\|\|\1\.ownerDocument\.activeElement!==\1\)return;.{0,250}\.querySelector\(`\.body-selection-notice`\);.{0,100}\.focus\(\{preventScroll:!0\}\)/,
    'Compiled focus helper retains active-trigger and persistent-feedback guards');
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[flag],false);
});

test('current a679 import retains contextual Undo and its source-bound focus guards',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.equal(inputs.find(input=>input.path==='app/body-explorer.css')?.sha256,
    '9834c72543476b41ba5acb5a47427dced3596d56320c59502d91f9e9e2524dca',
    'Compact source CSS remains separately pinned');
  for(const path of ['app/body-selection-notice.tsx','lib/contextual-dissection-undo.ts','app/body-explorer.tsx']){
    const source=execFileSync('git',['show',`${manifest.sourceCommit}:${path}`],{cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
    assert.equal(inputs.find(input=>input.path===path)?.sha256,createHash('sha256').update(source).digest('hex'),path);
  }
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const bytes=readFileSync(base+file.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
    return bytes.toString();
  }).join('\n');
  for(const marker of ['body-selection-undo','Undo hiding','Undo removal of','preventScroll','aria-atomic'])assert.ok(runtime.includes(marker),marker);
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(manifest[flag],false);
});
