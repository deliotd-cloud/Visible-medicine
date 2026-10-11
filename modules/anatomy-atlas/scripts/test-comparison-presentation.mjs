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

test('narrow comparison discloses complete toolbar and keeps nested model reachable',async()=>{
  const main=await readFile(new URL('../integration/head-neck/main.tsx',import.meta.url),'utf8');
  const explorer=await readFile(new URL('../app/body-explorer.tsx',import.meta.url),'utf8');
  const css=await readFile(new URL('../integration/head-neck/panel-host.css',import.meta.url),'utf8');
  assert.match(main,/const comparisonMode=comparisonPresentationEnabled\(/);
  assert.match(main,/comparisonMode=\{comparisonMode\}/);
  assert.match(explorer,/const compactComparison = sharedHeader && comparisonMode/);
  assert.match(explorer,/<details className="atlas-comparison-tools">\s*<summary>3D tools &amp; modes<\/summary>/);
  assert.match(explorer,/<div className="atlas-comparison-tools-content">\{headerContent\}<\/div>/);
  assert.match(explorer,/\{compactComparison \? <details[\s\S]*<\/details> : headerContent\}/);
  for(const control of ['RegionHeading','WorkspaceModes','AtlasSearch','WorkspaceFocus','vm-practice-start'])
    assert.match(explorer.slice(explorer.indexOf('const headerContent ='),explorer.indexOf('const headerContent =')+1500),new RegExp(control));
  assert.match(css,/@media\s*\(max-width:700px\)/);
  assert.match(css,/html\[data-comparison-presentation='compare'\] \.body-app\[data-presentation='panel'\]/);
  assert.match(css,/overflow-y:auto/);
  assert.match(css,/> \.body-topbar\s*\{[^}]*max-height:min\(190px,65dvh\);[^}]*overflow:auto/s);
  assert.match(css,/\.atlas-comparison-tools > summary\s*\{[^}]*min-height:36px/s);
  assert.match(css,/> :is\(\.body-layout,\.atlas-inline-study\)\s*\{[^}]*flex:none/s);
  assert.match(css,/\.body-canvas\s*\{[^}]*minmax\(240px,40dvh\)/s);
  assert.match(css,/\.atlas-inline-study \.eye-layer-viewport\s*\{[^}]*minmax\(250px,42dvh\)/s);
  assert.match(css,/\.brain-study-heading \[data-slot='dialog-description'\]\s*\{[^}]*font-size:\.75rem/s);
  assert.match(css,/\.brain-study-heading :is\(\[data-slot='select-trigger'\],button\)\s*\{[^}]*min-height:32px/s);
  assert.doesNotMatch(css,/display:none|visibility:hidden|pointer-events:none/);
});
