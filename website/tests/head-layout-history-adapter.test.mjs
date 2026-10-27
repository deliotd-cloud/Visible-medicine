import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {restoreHeadViewerTo20261023,restoreHeadToolsEpochViewer,restoreBeforeFilteredViewer,restoreHeadFilteredCssCurrent} from './head-layout-history-adapter.mjs';

const read=p=>readFileSync(new URL(p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,'one exact test-source seam');return text.replace(from,to);};
const viewer=()=>read('../components/HeadAtlasViewer.tsx');
const css=()=>read('../components/head-atlas.css');
const priorViewer='F:/VisibleMedicine/staging/20261023-linked-head-region-picker/website/components/HeadAtlasViewer.tsx';

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
 let old=once(filtered,"import {restoreHeadToolsEpochViewer,restoreHeadFilteredCssCurrent} from './head-layout-history-adapter.mjs';\n",'');
 old=once(old,"restoreHeadToolsBefore20261022(restoreHeadToolsEpochViewer(read('components/HeadAtlasViewer.tsx')),read('tests/fixtures/head-toolbar-before-compaction-20261022.tsx.raw'))","restoreHeadToolsBefore20261022(read('components/HeadAtlasViewer.tsx'),read('tests/fixtures/head-toolbar-before-compaction-20261022.tsx.raw'))");
 old=once(old,"restoreHeadFilteredCssCurrent(read('components/head-atlas.css')).toString()","read('components/head-atlas.css').toString()");
 assert.equal(sha(old),'5dc4a8d99ee20f02d8724bc6d952fe039a83f32c6245eb85b2efee28c646ff27','whole original filtered-layout test');
 const toolbar=read('./head-toolbar-compact.test.mjs').toString();
 let toolbarOld=once(toolbar,"import {restoreHeadToolsEpochViewer} from './head-layout-history-adapter.mjs';\n",'');
 toolbarOld=once(toolbarOld,'let normalized=restoreHeadToolsEpochViewer(Buffer.from(source)).toString();','let normalized=source;');
 toolbarOld=once(toolbarOld,'paneLabels.map(([approved])=>normalized.split(approved).length-1)','paneLabels.map(([approved])=>source.split(approved).length-1)');
 toolbarOld=once(toolbarOld,"writeNavigation,rememberCurrentSelection,changeImageLayout,toggleInlineComparison","writeNavigation,changeImageLayout,toggleInlineComparison");
 toolbarOld=once(toolbarOld,"    writeNavigation:(a,b)=>calls.push(['navigation',a,b]),\n    rememberCurrentSelection:entry=>calls.push(['remember-selection',entry]),","    writeNavigation:(a,b)=>calls.push(['navigation',a,b]),");
 toolbarOld=once(toolbarOld,"    find(tree,'button','Multiplanar').props.onClick();\n    if(renderer===render){assert.deepEqual(calls.splice(calls.length-2,1),[['remember-selection',null]],'current Clear selection explicitly retires remembered selection');}\n    assert.deepEqual(calls,[","    find(tree,'button','Multiplanar').props.onClick();\n    assert.deepEqual(calls,[");
 assert.equal(sha(toolbarOld),'650daf34edcc3cd8de98c91fbe045bdf1250945356ceb3947cf14e55d1f2a3b8','whole original compact-toolbar test');
 assert.notEqual(sha(toolbarOld+'\n// foreign assertion'),'650daf34edcc3cd8de98c91fbe045bdf1250945356ceb3947cf14e55d1f2a3b8');
});
