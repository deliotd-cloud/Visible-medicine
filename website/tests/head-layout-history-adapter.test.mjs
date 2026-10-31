import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restoreHeadViewerTo20261023,restoreHeadToolsEpochViewer,restoreBeforeFilteredViewer,restoreHeadFilteredCssCurrent} from './head-layout-history-adapter.mjs';
import {restoreHeadClearFocusViewer} from './head-clear-focus-history.mjs';
import {sourceHunks} from './head-tools-wider-consumer-inverse.mjs';

const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,'one exact test-source seam');return text.replace(from,to);};
const viewer=()=>restoreHeadClearFocusViewer(read('../components/HeadAtlasViewer.tsx'));
const css=()=>read('../components/head-atlas.css');
const priorViewer='F:/VisibleMedicine/staging/20261023-linked-head-region-picker/website/components/HeadAtlasViewer.tsx';

test('Clear selection successor restores only the fixed previous viewer',()=>{
 const current=read('../components/HeadAtlasViewer.tsx');
 assert.equal(sha(current),'4a6ead3cfb9d2e70fcf2cede92a1ebd230758767808c08944a6535624c5f77d9');
 assert.equal(sha(restoreHeadClearFocusViewer(current)),'65407ec32882f84f215f0df3210b0c632452592a0cef63b5c76eb3849c85d159');
 const foreign=Buffer.from(current);foreign[100]^=1;
 assert.throws(()=>restoreHeadClearFocusViewer(foreign),/exact current binding/);
 assert.throws(()=>restoreHeadClearFocusViewer(viewer()),/exact current binding/);
});

test('complete pre-filter viewer and filtered CSS survive the exact later roles',()=>{
 const original=read('./fixtures/head-viewer-before-filtered-layout.tsx.raw');
 assert.equal(sha(original),'871d02c03888f904d6bbb1458148b4b6320fe9a4a83b5c948f38d0969b6a24e8');
 assert.deepEqual(restoreBeforeFilteredViewer(viewer()),original);
 const beforeCss=read('./fixtures/head-css-before-filtered-layout.raw').toString();
 const from='.head-structure-list{overflow:auto;min-height:0;flex:1;border-top:1px solid var(--imaging-line);padding-top:8px;scrollbar-color:#3d5b53 transparent}';
 const to='.head-structure-list{overflow:auto;min-height:144px;flex:1 0 144px;border-top:1px solid var(--imaging-line);padding-top:8px;scrollbar-color:#3d5b53 transparent}\n.head-filtered-practice{flex-shrink:0}\n.head-filtered-practice[open]{max-height:260px;overflow:auto;overscroll-behavior:contain}\n.head-filtered-practice-options{display:grid;gap:10px;padding-top:10px}';
 assert.equal(restoreHeadFilteredCssCurrent(css()).toString(),once(beforeCss,from,to));
});

test('foreign and stale viewer/CSS bytes fail closed',()=>{
 const current=viewer(),before=readFileSync(priorViewer),currentCss=css();
 const foreign=Buffer.from(current);foreign[100]^=1;
 assert.throws(()=>restoreHeadToolsEpochViewer(foreign));
 assert.throws(()=>restoreHeadToolsEpochViewer(before),'stale prior viewer cannot masquerade as current');
 const stalePrevious=Buffer.from(before);stalePrevious[100]^=1;
 assert.throws(()=>restoreHeadViewerTo20261023(current,{previousBytes:stalePrevious}));
 const foreignCss=Buffer.from(currentCss);foreignCss[100]^=1;
 assert.throws(()=>restoreHeadFilteredCssCurrent(foreignCss));
});

test('the two patched tests retain every original byte outside named adapter seams',()=>{
 const filtered=read('./head-filtered-layout.test.mjs').toString();
 let current=once(filtered,"import {restoreHeadClearFocusViewer} from './head-clear-focus-history.mjs';\n",'');
 current=once(current,"restoreHeadToolsEpochViewer(restoreHeadClearFocusViewer(read('components/HeadAtlasViewer.tsx')))","restoreHeadToolsEpochViewer(read('components/HeadAtlasViewer.tsx'))");
 current=once(current,"['components/HeadAtlasViewer.tsx',bytes=>restoreCurrentHeadLayoutViewer(restoreHeadClearFocusViewer(bytes))]","['components/HeadAtlasViewer.tsx',restoreCurrentHeadLayoutViewer]");
 assert.equal(sha(current),'a8cb6b761c1c66f1c99ea0843c8027bcb5e41021ea27a5204ea670360fe422d8','exact previous filtered test');
 const prior=readFileSync('F:/VisibleMedicine/staging/20261024-head-study-set-website/website/tests/head-filtered-layout.test.mjs').toString();
 assert.equal(sha(prior),'5dc4a8d99ee20f02d8724bc6d952fe039a83f32c6245eb85b2efee28c646ff27','authenticated original filtered test');
 const hunks=sourceHunks(prior,current);
 assert.equal(hunks.length,4,'four later filtered test seams');
 assert.equal(sha(JSON.stringify(hunks)),'c86e3cbe009de30fa60ee8a3d3bf096b62cfe2fb42455a489a30fb7b667c6e72','exact later filtered test changes');
 const reverse=current.split('\n'),forward=prior.split('\n');
 for(const h of hunks.toReversed()){
  assert.deepEqual(reverse.slice(h.newStart,h.newStart+h.added.length),h.added);
  reverse.splice(h.newStart,h.added.length,...h.removed);
  assert.deepEqual(forward.slice(h.oldStart,h.oldStart+h.removed.length),h.removed);
  forward.splice(h.oldStart,h.removed.length,...h.added);
 }
 const old=reverse.join('\n');
 assert.equal(forward.join('\n'),current,'whole previous filtered test rebuilt');
 assert.equal(old,prior,'whole original filtered test recovered');
 assert.equal(sha(old),'5dc4a8d99ee20f02d8724bc6d952fe039a83f32c6245eb85b2efee28c646ff27','whole original filtered-layout test');
 const toolbar=read('./head-toolbar-compact.test.mjs').toString();
 assert.equal(sha(toolbar),'251e010af4cc7272e2ce5195dc52d986a5df89b3d93ce1ceb9867975e865c130','exact current toolbar test');
 const toolbarPrior=readFileSync('G:/VisibleMedicine-temp/staging/20261031-head-clear-focus/website/tests/head-toolbar-compact.test.mjs').toString();
 assert.equal(sha(toolbarPrior),'aff24afffa864bbcbb2f8932cef7f05855841c81a9eeffa9e9a728e502deb63c','sealed previous toolbar test');
 const toolbarHunks=sourceHunks(toolbarPrior,toolbar);
 assert.equal(toolbarHunks.length,8,'eight exact toolbar harness seams');
 assert.equal(sha(JSON.stringify(toolbarHunks)),'ed56a2c2334ba6cf9f437b4f111abd0b7ed3d44d969170379ab60e1324a5815b','full current dropdown and historical-button changes');
 const toolbarReverse=toolbar.split('\n'),toolbarForward=toolbarPrior.split('\n');
 for(const h of toolbarHunks.toReversed()){
  assert.deepEqual(toolbarReverse.slice(h.newStart,h.newStart+h.added.length),h.added);
  toolbarReverse.splice(h.newStart,h.added.length,...h.removed);
  assert.deepEqual(toolbarForward.slice(h.oldStart,h.oldStart+h.removed.length),h.removed);
  toolbarForward.splice(h.oldStart,h.removed.length,...h.added);
 }
 assert.equal(toolbarReverse.join('\n'),toolbarPrior,'whole previous toolbar test restored');
 assert.equal(toolbarForward.join('\n'),toolbar,'whole current toolbar test rebuilt');
 let toolbarOld=once(toolbarPrior,"import {restoreHeadClearFocusViewer} from './head-clear-focus-history.mjs';\n",'');
 toolbarOld=once(toolbarOld,'restoreHeadToolsEpochViewer(restoreHeadClearFocusViewer(Buffer.from(source)))','restoreHeadToolsEpochViewer(Buffer.from(source))');
 toolbarOld=once(toolbarOld,"find(tree,'button','Clear selection').props.onClick({detail:1});","find(tree,'button','Clear selection').props.onClick();");
 toolbarOld=once(toolbarOld,"import {restoreHeadToolsEpochViewer} from './head-layout-history-adapter.mjs';\n",'');
 toolbarOld=once(toolbarOld,'let normalized=restoreHeadToolsEpochViewer(Buffer.from(source)).toString();','let normalized=source;');
 toolbarOld=once(toolbarOld,'paneLabels.map(([approved])=>normalized.split(approved).length-1)','paneLabels.map(([approved])=>source.split(approved).length-1)');
 toolbarOld=once(toolbarOld,"writeNavigation,rememberCurrentSelection,changeImageLayout,toggleInlineComparison","writeNavigation,changeImageLayout,toggleInlineComparison");
 toolbarOld=once(toolbarOld,"    writeNavigation:(a,b)=>calls.push(['navigation',a,b]),\n    rememberCurrentSelection:entry=>calls.push(['remember-selection',entry]),","    writeNavigation:(a,b)=>calls.push(['navigation',a,b]),");
 toolbarOld=once(toolbarOld,"    find(tree,'button','Multiplanar').props.onClick();\n    if(renderer===render){assert.deepEqual(calls.splice(calls.length-2,1),[['remember-selection',null]],'current Clear selection explicitly retires remembered selection');}\n    assert.deepEqual(calls,[","    find(tree,'button','Multiplanar').props.onClick();\n    assert.deepEqual(calls,[");
 assert.equal(sha(toolbarOld),'650daf34edcc3cd8de98c91fbe045bdf1250945356ceb3947cf14e55d1f2a3b8','whole original compact-toolbar test');
 assert.notEqual(sha(toolbarOld+'\n// foreign assertion'),'650daf34edcc3cd8de98c91fbe045bdf1250945356ceb3947cf14e55d1f2a3b8');
});
