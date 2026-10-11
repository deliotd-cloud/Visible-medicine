import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {comparisonPresentationEnabled} from '../integration/head-neck/comparison-presentation.ts';

const enabled = (search, region='head-neck', embedded=true, specimen='none') =>
  comparisonPresentationEnabled(new URLSearchParams(search),region,embedded,specimen);

test('comparison presentation requires one exact opt-in in an embedded head-neck region',()=>{
  assert.equal(enabled('region=head-neck&presentation=compare'),true);
  for(const search of [
    'region=head-neck',
    'region=head-neck&presentation=',
    'region=head-neck&presentation=Compare',
    'region=head-neck&presentation=compare&presentation=compare',
    'region=head-neck&presentation=compare&presentation=panel',
  ]) assert.equal(enabled(search),false,search);
  assert.equal(enabled('presentation=compare','head-neck',false),false);
  assert.equal(enabled('presentation=compare','thorax'),false);
  assert.equal(enabled('presentation=compare',null),false);
  assert.equal(enabled('presentation=compare','head-neck',true,'ready'),false);
  assert.equal(enabled('presentation=compare','head-neck',true,'invalid'),false);
});

test('narrow comparison layout keeps model first and all controls reachable',async()=>{
  const main=await readFile(new URL('../integration/head-neck/main.tsx',import.meta.url),'utf8');
  const css=await readFile(new URL('../integration/head-neck/panel-host.css',import.meta.url),'utf8');
  assert.match(main,/document\.documentElement\.dataset\.comparisonPresentation\s*=\s*comparisonPresentationEnabled\(/);
  assert.match(css,/@media\s*\(max-width:700px\)/);
  assert.match(css,/html\[data-comparison-presentation='compare'\] \.body-app\[data-presentation='panel'\]/);
  assert.match(css,/overflow-y:auto/);
  assert.match(css,/> \.body-topbar\s*\{[^}]*max-height:72px;[^}]*overflow-y:auto/s);
  assert.match(css,/> :is\(\.body-layout,\.atlas-inline-study\)\s*\{[^}]*flex:none/s);
  assert.match(css,/\.body-canvas\s*\{[^}]*minmax\(240px,40dvh\)/s);
  assert.match(css,/\.atlas-inline-study \.eye-layer-viewport\s*\{[^}]*minmax\(250px,42dvh\)/s);
  assert.doesNotMatch(css,/display:none|visibility:hidden|pointer-events:none/);
});
