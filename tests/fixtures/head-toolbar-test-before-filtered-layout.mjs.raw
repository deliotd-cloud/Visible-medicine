import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';

const require=createRequire(import.meta.url);
const postcss=require('postcss');
const ts=require('typescript');
const originalBytes=readFileSync(new URL('./fixtures/native-head-toolbar-before.css.txt',import.meta.url));
assert.equal(createHash('sha256').update(originalBytes).digest('hex'),'214fbad37e04a7ecd371c073ffb13c36cbcb5eccb208201a314bc6f0d0fdfb15');
const original=originalBytes.toString('utf8');
const candidate=readFileSync(new URL('../components/head-atlas.css',import.meta.url),'utf8');
const css=postcss.parse(candidate,{from:'components/head-atlas.css'});
const desktop=css.nodes.filter(node=>node.type==='atrule'&&node.name==='media'&&node.params==='(min-width:1200px)');
const selector='.imaging-workspace-grid:not(.has-reference-comparison) .imaging-workspace-toolbar:has(> .head-inline-launch > button:first-child:not(:disabled))';

test('candidate changes only one parsed, wide-desktop toolbar block',()=>{
  assert.equal(desktop.length,1);
  const addition=desktop[0].toString()+'\n';
  assert.equal(candidate.replace(addition,''),original,'all pre-existing CSS stays byte-for-byte equivalent');
  assert.equal(desktop[0].nodes.length,5);
  for(const rule of desktop[0].nodes){
    assert(rule.selector.startsWith(selector));
    assert.doesNotMatch(rule.toString(),/display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:/);
  }
  assert.equal(desktop[0].nodes[0].selector,selector);
  assert.equal(desktop[0].nodes[0].nodes.find(node=>node.prop==='display')?.value,'grid');
  assert.equal(desktop[0].nodes[0].nodes.find(node=>node.prop==='grid-template-columns')?.value,'max-content minmax(0,1fr)');
  assert.equal(desktop[0].nodes.find(rule=>rule.selector.endsWith('>.head-window-controls'))?.nodes.find(node=>node.prop==='grid-column')?.value,'1/-1');
});

test('selectors match the current toolbar sibling contract and retain other flows',()=>{
  const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  const ast=ts.createSourceFile('HeadAtlasViewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let toolbar;
  function visit(node){
    if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='toolbar')toolbar=node.initializer?.getText(ast);
    ts.forEachChild(node,visit);
  }
  visit(ast);
  assert(toolbar,'read the actual head toolbar declaration');
  const groups=['className="head-inline-launch"','className="head-view-options"','className="head-window-controls"'];
  const positions=groups.map(group=>toolbar.indexOf(group));
  assert(positions.every(position=>position>=0));
  assert(positions[0]<positions[1]&&positions[1]<positions[2]);
  assert.match(toolbar,/!quizActive&&<div className="head-inline-launch"/);
  assert.match(toolbar,/disabled=\{!comparisonOpen&&!concept\?\.atlasHref\}/);
  assert.match(toolbar,/Select a structure marked “3D Atlas link”/);
  assert.match(toolbar,/\[\.\.\.planes,'multiplanar','3d'\]/);
  assert.match(toolbar,/className="head-display-settings"/);
  assert.match(toolbar,/Clear selection/);
  assert.match(toolbar,/HeadTourPlayback/);
  assert.match(toolbar,/HeadComparisonTour/);
  assert(selector.includes(':not(.has-reference-comparison)'),'inline comparison keeps its own toolbar flow');
  assert(selector.includes('button:first-child:not(:disabled)'),'only the comparison button activates compaction; Find linked structures cannot activate it');
  assert.match(toolbar,/className="head-inline-launch"><button ref=\{comparisonButtonRef\}/,'the comparison action is the first child, before any secondary launch action');
});
