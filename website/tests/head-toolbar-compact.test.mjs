import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import {restoreHeadToolsEpochViewer} from './head-layout-history-adapter.mjs';

// In the isolated stage, point this at the source website package.json. Once
// admitted to that website, the default resolves its own installed packages.
const require=createRequire(process.env.HEAD_TOOLBAR_TEST_PACKAGE??new URL('../package.json',import.meta.url));
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const ts=require('typescript');
const jsx=require('react/jsx-runtime');
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const source=read('../components/HeadAtlasViewer.tsx');
const original=read('./fixtures/head-toolbar-before-compaction-20261022.tsx.raw');
const sha=value=>createHash('sha256').update(value).digest('hex');

function toolbarFrom(body){
  const start=body.indexOf('  const toolbar=study?<>');
  const finish=body.indexOf('  </>:undefined;',start);
  assert(start>=0&&finish>start,'actual HeadAtlasViewer toolbar expression');
  const expression=body.slice(start,finish+'  </>:undefined;'.length);
  const wrapper=`function render(c){const {study,rightPanel,quizActive,playbackStep,comparisonOpen,concept,linkedCount,planes,expanded,modality,overlay,showCrosshair,selected,regionalCourse,windowing,activeId,learningPosition,comparisonButtonRef,headDisclosureKeyDown,setOverlay,setShowCrosshair,setRegionalCourse,setWindowing,initialWindow,setActiveId,setSelected,setLearningPosition,writeNavigation,rememberCurrentSelection,changeImageLayout,toggleInlineComparison,findLinkedStructures}=c;${expression}return toolbar;} exports.render=render;`;
  const js=ts.transpileModule(wrapper,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};
  new Function('require','exports',js)(name=>{assert.equal(name,'react/jsx-runtime');return jsx;},exports);
  return exports.render;
}
const render=toolbarFrom(source),renderOriginal=toolbarFrom(original);

test('complete baseline component is recovered by precisely reversing the two toolbar moves',()=>{
  assert.equal(sha(original),'a14d1d851fff12960b35ffe71e282a0f2ec00e9a9077c74e72d3ed456ad25daa');
  // The separate pane-label proposal can be combined by main. Only its two
  // exact, approved attributes may be removed before the full-source inverse.
  const paneLabels=[
    [
      '<button type="button" onClick={onExpand} aria-pressed={expanded} aria-label={`${expanded?\'Restore\':\'Enlarge\'} ${plane} image`}>',
      '<button type="button" onClick={onExpand} aria-pressed={expanded}>',
    ],
    [
      '<button type="button" aria-pressed={expanded===\'3d\'} aria-label={`${expanded===\'3d\'?\'Restore\':\'Enlarge\'} selected anatomy 3D scan view`} onClick={()=>setExpanded(expanded===\'3d\'?null:\'3d\')}>',
      '<button type="button" aria-pressed={expanded===\'3d\'} onClick={()=>setExpanded(expanded===\'3d\'?null:\'3d\')}>',
    ],
  ];
  let normalized=restoreHeadToolsEpochViewer(Buffer.from(source)).toString();
  const paneCounts=paneLabels.map(([approved])=>normalized.split(approved).length-1);
  assert(paneCounts.every(count=>count===0)||paneCounts.every(count=>count===1),'pane labels must be absent or the complete approved pair');
  for(const [approved,baseline] of paneLabels){
    assert.equal(original.split(baseline).length-1,1,'one historical pane action');
    normalized=normalized.replace(approved,baseline);
  }
  const oldControls=original.match(/^    <div className="head-window-controls">.*<\/div>$/m)?.[0];
  assert(oldControls,'one complete historical toolbar controls line');
  assert.equal(original.split(oldControls).length-1,1);
  const cross='<label><input type="checkbox" checked={showCrosshair} onChange={event=>setShowCrosshair(event.target.checked)}/> Crosshair localizer</label>';
  const regional='{!quizActive&&!!selected?.entry.supplementary_geometries?.length&&<label><input type="checkbox" checked={regionalCourse} onChange={event=>setRegionalCourse(event.target.checked)}/> Regional centreline</label>}';
  for(const snippet of [cross,regional])assert.equal(oldControls.split(snippet).length-1,1,'one unchanged original locator control');
  const newControls=oldControls.replace(cross,'').replace(regional,'').replace('<div><label>Level','<div>'+cross+regional+'<label>Level');
  assert.notEqual(newControls,oldControls);
  assert.equal(normalized.split(newControls).length-1,1,'one precise compact toolbar expression');
  assert.equal(normalized.replace(newControls,oldControls),original,'every other component byte and callback survives');
});

function fixture(modality='CT',{quiz=false,geometry=false}={}){
  const calls=[];
  const context={
    study:{range:[0,100]},rightPanel:'info',quizActive:quiz,playbackStep:null,comparisonOpen:false,
    concept:null,linkedCount:0,planes:['axial','coronal','sagittal'],expanded:null,modality,comparisonButtonRef:null,
    overlay:true,showCrosshair:false,selected:geometry?{entry:{supplementary_geometries:[{part_id:'synthetic'}]}}:{entry:{}},
    regionalCourse:false,windowing:[40,80],activeId:'synthetic',learningPosition:{conceptId:'synthetic'},
    headDisclosureKeyDown:()=>calls.push(['escape']),
    setOverlay:value=>calls.push(['overlay',value]),setShowCrosshair:value=>calls.push(['crosshair',value]),
    setRegionalCourse:value=>calls.push(['regional',value]),setWindowing:value=>calls.push(['window',value]),
    initialWindow:(kind,range)=>{calls.push(['initial',kind,range]);return [12,34];},
    setActiveId:value=>calls.push(['active',value]),setSelected:value=>calls.push(['selected',value]),
    setLearningPosition:updater=>calls.push(['learning',updater({conceptId:'synthetic'})]),
    writeNavigation:(a,b)=>calls.push(['navigation',a,b]),
    rememberCurrentSelection:entry=>calls.push(['remember-selection',entry]),
    changeImageLayout:value=>calls.push(['layout',value]),
    toggleInlineComparison:()=>calls.push(['comparison']),findLinkedStructures:()=>calls.push(['find-linked']),
  };
  return {context,calls};
}
function descendants(node){
  if(Array.isArray(node))return node.flatMap(descendants);
  if(!React.isValidElement(node))return [];
  return [node,...descendants(node.props.children)];
}
const find=(root,type,content)=>descendants(root).find(node=>node.type===type&&renderToStaticMarkup(node).includes(content));
const direct=node=>React.Children.toArray(node.props.children).flatMap(child=>React.isValidElement(child)&&child.type===React.Fragment?direct(child):React.isValidElement(child)?[child]:[]);
const markup=node=>renderToStaticMarkup(node);

for(const modality of ['CT','MRI'])for(const quiz of [false,true])for(const geometry of [false,true]){
  test(`${modality} ${quiz?'quiz':'normal'} ${geometry?'with':'without'} supplementary geometry keeps one compact toolbar`,()=>{
    const {context}=fixture(modality,{quiz,geometry});
    const tree=render(context),nodes=descendants(tree);
    const layout=find(tree,'div','Image layout');
    assert.equal(layout.props['aria-label'],'Image layout');
    assert.deepEqual(direct(layout).map(button=>markup(button).replace(/<[^>]*>/g,'').trim()),['Axial','Coronal','Sagittal','Multiplanar','3D scan view']);
    assert.deepEqual(direct(layout).map(button=>Boolean(button.props.disabled)),[false,false,false,quiz,quiz]);
    const controls=nodes.find(node=>node.type==='div'&&node.props.className==='head-window-controls');
    const settings=nodes.filter(node=>node.type==='details'&&node.props.className==='head-display-settings');
    assert.equal(settings.length,1);
    assert.equal(settings[0].props.onKeyDown,context.headDisclosureKeyDown);
    assert.equal(direct(settings[0]).filter(node=>node.type==='summary').length,1);
    assert.match(markup(settings[0]),/<summary>Display settings<\/summary>/);
    assert.match(markup(settings[0]),/Crosshair localizer/);
    assert.equal(markup(settings[0]).includes('Regional centreline'),!quiz&&geometry);
    assert.match(markup(settings[0]),/Level/);
    assert.match(markup(settings[0]),/Width/);
    assert.match(markup(settings[0]),/Reset window/);
    assert.equal(direct(controls).some(node=>node.type==='label'&&markup(node).includes('Crosshair localizer')),false);
    assert.equal(direct(controls).some(node=>node.type==='label'&&markup(node).includes('Regional centreline')),false);
    assert.equal(direct(controls).some(node=>node.type==='label'&&markup(node).includes('Labels &amp; overlay')),!quiz);
    assert.equal(direct(controls).some(node=>node.type==='button'&&markup(node).includes('Clear selection')),!quiz);
    assert.equal(direct(controls).some(node=>node.type==='button'&&markup(node).includes('Brain window')),modality==='CT');
    assert.equal(direct(controls).some(node=>node.type==='button'&&markup(node).includes('Bone window')),modality==='CT');
  });
}

test('moved controls and original presets, reset, layout and clear retain callback behavior',()=>{
  for(const renderer of [renderOriginal,render]){
    const {context,calls}=fixture('CT',{geometry:true});
    const tree=renderer(context);
    const check=label=>find(tree,'label',label).props.children[0];
    check('Crosshair localizer').props.onChange({target:{checked:true}});
    check('Regional centreline').props.onChange({target:{checked:true}});
    check('Labels &amp; overlay').props.onChange({target:{checked:false}});
    find(tree,'button','Brain window').props.onClick();
    find(tree,'button','Bone window').props.onClick();
    find(tree,'button','Reset window').props.onClick();
    find(tree,'button','Clear selection').props.onClick();
    find(tree,'button','Multiplanar').props.onClick();
    if(renderer===render){assert.deepEqual(calls.splice(calls.length-2,1),[['remember-selection',null]],'current Clear selection explicitly retires remembered selection');}
    assert.deepEqual(calls,[
      ['crosshair',true],['regional',true],['overlay',false],['window',[40,80]],['window',[500,2500]],
      ['initial','CT',[0,100]],['window',[12,34]],['active',''],['selected',null],
      ['learning',{conceptId:null}],['navigation',null,null],['layout','multiplanar'],
    ]);
  }
});

test('numeric controls preserve CT and MRI level, width and reset behavior',()=>{
  for(const modality of ['CT','MRI'])for(const renderer of [renderOriginal,render]){
    const {context,calls}=fixture(modality);
    const tree=renderer(context);
    const inputs=descendants(tree).filter(node=>node.type==='input'&&node.props.type==='number');
    assert.deepEqual(inputs.map(input=>input.props['aria-label']),modality==='CT'?['CT native window level','CT native window width']:['MRI display level (not HU)','MRI display width (not HU)']);
    inputs[0].props.onChange({target:{valueAsNumber:55}});
    inputs[1].props.onChange({target:{valueAsNumber:0}});
    find(tree,'button','Reset window').props.onClick();
    assert.deepEqual(calls,[['window',[55,80]],['window',[40,1]],['initial',modality,[0,100]],['window',[12,34]]]);
  }
});
