import {headSearchComparisonPredecessor} from './head-search-comparison-predecessor.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import * as guidedComparison from '../lib/head-guided-comparison.ts';

const websiteRequire=createRequire(import.meta.url);
const {transformSync}=websiteRequire('esbuild');
const React=websiteRequire('react');
const {renderToStaticMarkup}=websiteRequire('react-dom/server');
const source=readFileSync(new URL('../components/HeadAtlasLearningLibrary.tsx',import.meta.url),'utf8');
const originalSource=readFileSync(new URL('./fixtures/HeadAtlasLearningLibrary.precompact.tsx.raw',import.meta.url),'utf8');
const originalSha256='82d4c02c0253035c442ec758d1afdf9c82cb426ca886881bf05fcc25f0aa2cf7';
const currentSha256='fd7c12c85a54736f53bb4023418921243ef695827c501bd2a59eeb335ff547c8';
const preComparisonSha256='17fc443258f693d0d86f281a5dc9acf06344cc94c3efe3e7c3764db6d6a1c53f';
const comparisonInsertions=[
  "import {headGuidedComparisonForStep} from '../lib/head-guided-comparison.ts';\n",
  '          const comparison=headGuidedComparisonForStep(sequence.id,id);\n',
  '            {concept&&stepLinks&&hasSelectedView(stepLinks,modality)&&comparison&&<a href={comparison.activityHref} aria-label={`Compare views for ${label} at step ${index+1}`}>Compare views</a>}\n',
];
function beforeComparisonSource(){
  const source=headSearchComparisonPredecessor(readFileSync(new URL('../components/HeadAtlasLearningLibrary.tsx',import.meta.url),'utf8'));
  assert.equal(createHash('sha256').update(source).digest('hex'),currentSha256);
  let inverse=source;
  for(const insertion of comparisonInsertions){
    assert.equal(inverse.split(insertion).length,2,'exactly one guided comparison insertion');
    inverse=inverse.replace(insertion,'');
  }
  assert.equal(createHash('sha256').update(inverse).digest('hex'),preComparisonSha256);
  return inverse;
}
const compiled=transformSync(source,{loader:'tsx',format:'cjs',jsx:'automatic'}).code;
const groups=[5,2,1,1,2,1,1].map((size,group)=>Array.from({length:size},(_,index)=>({
  id:`tour-${groupsBefore(group)+index+1}`,label:`Tour ${groupsBefore(group)+index+1}`,
  concepts:[`concept-${groupsBefore(group)+index+1}`],
})));
function groupsBefore(group){return [0,5,7,8,9,11,12][group];}
const all=groups.flat();
const groupPaths=['../lib/head-atlas-learning','../lib/head-mri-learning','../lib/head-insula-learning','../lib/head-orbital-learning','../lib/head-ct-bone-learning','../lib/head-cerebellar-learning.ts','../lib/head-ct-facial-learning.ts'];
const groupKeys=['headLearningSequences','headMriLearningSequences','headInsulaLearningSequences','headOrbitalLearningSequences','headCtBoneLearningSequences','headCerebellarLearningSequences','headCtFacialLearningSequences'];
const revisionKeys=['HEAD_LEARNING_REVISION','HEAD_MRI_LEARNING_REVISION','HEAD_INSULA_LEARNING_REVISION','HEAD_ORBITAL_LEARNING_REVISION','HEAD_CT_BONE_LEARNING_REVISION','HEAD_CEREBELLAR_LEARNING_REVISION','HEAD_CT_FACIAL_LEARNING_REVISION'];
const exactLinks=id=>{const number=Number(id.split('-')[1]);return {
  atlasHref:number===12?undefined:`/atlas/head-neck-3d?headTour=${id}&headStep=0&source=exact-${id}`,
  ctHref:number===6||number===7?undefined:`/atlas/ct-head?headTour=${id}&headStep=0&source=exact-${id}`,
  mriHref:number===10||number===11||number===13?undefined:`/atlas/mri-head?headTour=${id}&headStep=0&source=exact-${id}`,
};};

function harness({compact=true,current=true,missing}={}){
  const state=[],refs=[];let hook=0,focuses=0,lastFocusedRange='';
  let linksCurrent=current;
  const documentMock={body:{},activeElement:null};globalThis.document=documentMock;
  const reactMock={...React,useState(initial){const slot=hook++;if(!(slot in state))state[slot]=initial;return [state[slot],value=>{state[slot]=value;}];},
    useRef(initial){const slot=hook++;if(!refs[slot])refs[slot]={current:initial};return refs[slot];}};
  const modules={react:reactMock,'react/jsx-runtime':websiteRequire('react/jsx-runtime'),
    './HeadLearningBookmark':{HeadLearningBookmark:()=>null},
    '../lib/head-image-only-links.ts':{headImageConceptById:id=>({label:`Structure ${id.split('-')[1]}`})},
    '../lib/head-link-availability.ts':{headLinksCurrent:()=>linksCurrent,HEAD_LINK_REVISION_NOTICE:'Mapping unavailable'},
    '../lib/head-guided-comparison.ts':guidedComparison,
  };
  for(let i=0;i<groups.length;i++)modules[groupPaths[i]]={[groupKeys[i]]:groups[i],[revisionKeys[i]]:`revision-${i}`};
  modules['../lib/head-atlas-learning'].headLearningLinks=({sequenceId})=>missing===sequenceId?null:exactLinks(sequenceId);
  const mod={exports:{}};
  new Function('require','module','exports',compiled)((id)=>{
    if(!(id in modules))throw new Error(`Unexpected dependency ${id}`);
    return modules[id];
  },mod,mod.exports);
  function render(){hook=0;const tree=mod.exports.HeadAtlasLearningLibrary({compact});return {tree,html:renderToStaticMarkup(tree)};}
  function find(tree,type,predicate=()=>true){
    function walk(node){if(Array.isArray(node)){for(const child of node){const found=walk(child);if(found)return found;}return null;}
      if(!React.isValidElement(node))return null;
      if(node.type===type&&predicate(node.props))return node;
      return walk(node.props.children);}
    const found=walk(tree);assert(found,`Missing ${type}`);return found;
  }
  function click(direction){const {tree}=render();const button=find(tree,'button',props=>props['aria-label']?.startsWith(`${direction} linked tours`));assert.equal(button.props.disabled,false);
    const origin={disabled:false};documentMock.activeElement=origin;button.props.onClick({currentTarget:origin});return origin;}
  function clickNext(){return click('Next');}
  function clickPrevious(){return click('Previous');}
  function commit(tree=render().tree){const status=find(tree,'p',props=>props.role==='status');const element={textContent:status.props.children,focus(options){assert.deepEqual(options,{preventScroll:true});focuses++;lastFocusedRange=this.textContent;documentMock.activeElement=this;}};
    status.props.ref(element);return element;}
  function active(element){documentMock.activeElement=element;}
  function search(value){const {tree}=render();find(tree,'input',props=>props.type==='search').props.onChange({target:{value}});}
  function select(value){const {tree}=render();find(tree,'select').props.onChange({target:{value}});}
  return {render,find,clickNext,clickPrevious,commit,active,search,select,setCurrent:value=>{linksCurrent=value;},body:documentMock.body,get focuses(){return focuses;},get lastFocusedRange(){return lastFocusedRange;}};
}
function rows(html){const starts=[...html.matchAll(/<nav aria-label="Start (Tour \d+)">([\s\S]*?)<\/nav>/g)];
  return starts.map(([,label,nav])=>({label,href:[...nav.matchAll(/<a href="([^"]+)"/g)].map(match=>match[1].replaceAll('&amp;','&'))}));}

test('default embedding retains all thirteen tours, URLs and original status',()=>{
  const html=harness({compact:false}).render().html;
  assert.match(html,/13 linked tours available/);
  assert.equal(rows(html).length,13);
  assert.doesNotMatch(html,/Linked head tour pages/);
  assert.doesNotMatch(html,/>Compare views<\/a>/,'synthetic concepts have no canonical activity target');
  for(const [index,row] of rows(html).entries())assert.deepEqual(row.href,Object.values(exactLinks(all[index].id)).filter(Boolean));
});

test('all URL generation and per-step link rendering remain byte-exact to the canonical preimage',()=>{
  assert.equal(createHash('sha256').update(originalSource).digest('hex'),originalSha256);
  const marker='export function HeadAtlasLearningLibrary';
  const inverse=beforeComparisonSource();
  assert.equal(inverse.slice(0,inverse.indexOf(marker)),originalSource.slice(0,originalSource.indexOf(marker)));
});

test('compact pages cover 6, 6, 1 tours in original order with exact destinations and scope',()=>{
  const view=harness();const seen=[];
  for(const [page,size] of [6,6,1].entries()){
    const {html,tree}=view.render(),visible=rows(html);assert.equal(visible.length,size);
    assert.match(html,new RegExp(`Showing linked tours ${page*6+1}–${page*6+size} of 13`));
    for(const row of visible){const sequence=all.find(item=>item.label===row.label);assert(sequence);assert.deepEqual(row.href,Object.values(exactLinks(sequence.id)).filter(Boolean));seen.push(row.label);}
    if(page===0)assert.match(html,/MRI-only comparisons · Draft/);
    if(page===1)assert.match(html,/CT-only bone coverage · Draft/);
    if(page===2)assert.match(html,/Facial sequence scope and review revision/);
    assert.match(html,new RegExp(`Page ${page+1} of 3`));
    if(page<2){view.clickNext();assert.equal(view.focuses,page);view.commit();}else assert.equal(view.find(tree,'button',props=>props['aria-label']?.startsWith('Next linked tours')).props.disabled,true);
  }
  assert.deepEqual(seen,all.map(item=>item.label));assert.equal(new Set(seen).size,13);assert.equal(view.focuses,2);
  view.clickPrevious();assert.match(view.render().html,/Showing linked tours 7–12 of 13/);view.commit();assert.equal(view.focuses,3);
});

test('search and view changes reset paging; invalid view is refused; empty results keep filters',()=>{
  const view=harness();view.clickNext();view.search('Structure 13');
  assert.match(view.render().html,/Showing linked tours 1–1 of 1/);assert.deepEqual(rows(view.render().html).map(row=>row.label),['Tour 13']);
  view.search('');view.clickNext();view.select('CT');assert.match(view.render().html,/Showing linked tours 1–6 of 11/);
  view.clickNext();view.select('invalid');assert.match(view.render().html,/Showing linked tours 7–11 of 11/);
  view.search('never-found');const empty=view.render();assert.match(empty.html,/No linked tours match/);assert.equal(rows(empty.html).length,0);
  assert.doesNotMatch(empty.html,/Linked head tour pages/);assert.equal(view.find(empty.tree,'input',props=>props.type==='search').props.value,'never-found');
});

test('available views have their real filtered page sizes and keep only mapped destinations',()=>{
  for(const [modality,total,last] of [['CT',11,5],['MRI',10,4],['3D',12,6]]){
    const view=harness();view.select(modality);
    assert.equal(rows(view.render().html).length,6);view.clickNext();
    const html=view.render().html;assert.equal(rows(html).length,last);
    assert.match(html,new RegExp(`of ${total}`));
    for(const row of rows(html)){
      const number=Number(row.label.split(' ')[1]);
      const key=modality==='CT'?'ctHref':modality==='MRI'?'mriHref':'atlasHref';
      assert.deepEqual(row.href,[exactLinks(`tour-${number}`)[key]]);
    }
  }
});

test('focus waits for committed range and is consumed once',()=>{
  const view=harness();view.clickNext();
  const {tree,html}=view.render();assert.match(html,/Showing linked tours 7–12 of 13/);
  assert.equal(view.focuses,0);view.commit(tree);assert.equal(view.focuses,1);
  assert.equal(view.lastFocusedRange,'Showing linked tours 7–12 of 13');
  view.commit(tree);assert.equal(view.focuses,1);
});

test('a newer search or unavailable mapping cancels pending focus',()=>{
  const changed=harness();changed.clickNext();changed.search('Structure 13');
  changed.commit();assert.equal(changed.focuses,0);
  const unavailable=harness();unavailable.clickNext();unavailable.setCurrent(false);
  assert.match(unavailable.render().html,/Mapping unavailable/);
  unavailable.setCurrent(true);unavailable.commit();assert.equal(unavailable.focuses,0);
});

test('a user moving focus to another control is not hijacked; disabled origin can return focus',()=>{
  const moved=harness();moved.clickNext();moved.active({});moved.commit();assert.equal(moved.focuses,0);
  const disabled=harness();disabled.clickNext();const origin=disabled.clickNext();origin.disabled=true;
  disabled.active(disabled.body);disabled.commit();assert.equal(disabled.focuses,1);
  assert.equal(disabled.lastFocusedRange,'Showing linked tours 13–13 of 13');
});

test('missing first-step map and stale revision fail closed without links',()=>{
  const missing=harness({missing:'tour-1'}).render().html;
  assert.equal(rows(missing).length,6);assert.doesNotMatch(missing,/Start Tour 1/);
  assert.match(missing,/Showing linked tours 1–6 of 12/);
  const stale=harness({current:false}).render().html;
  assert.match(stale,/Mapping unavailable/);assert.doesNotMatch(stale,/<a href=/);
});
