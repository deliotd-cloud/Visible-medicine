import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import test from 'node:test';

const site=fileURLToPath(new URL('../',import.meta.url));
const requireSite=createRequire(join(site,'package.json'));
const ts=requireSite('typescript');
const {buildSync}=requireSite('esbuild');
const {createNativeVolumeGeometry}=await import(pathToFileURL(join(site,'lib/head-atlas-geometry.mjs')).href);

// Bundle only the actual source helpers. Components themselves are transpiled and
// given a tiny hook runtime so their real event handlers can be composed.
const helpersSource=`export {loadHeadEntry} from './lib/head-atlas-import.ts';
export {canvasVoxel,maskContainsVoxel,firstPracticeOutcome,labelIsCorrect,normalizePracticeLabel,practiceChoices,practiceEntries,practiceReviewEntries,practiceRevisitEntries,practiceScore,shuffled,typedLabelIsCorrect} from './lib/head-atlas-practice.ts';
export {headSliceKey,headSliceNumber} from './lib/head-atlas-slice-controls.ts';
export {headSliceViewport,zoomHeadSliceViewport,fitHeadMaskViewport,nearestHeadMaskSlice} from './lib/head-slice-viewport.ts';
export {defaultHeadViewportFrame} from './lib/head-viewport-memory.ts';
export {headLabel} from './lib/head-atlas-display.ts';`;
const helperCode=buildSync({stdin:{contents:helpersSource,resolveDir:site,loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
const helpers={exports:{}};
new Function('require','module','exports',helperCode)(requireSite,helpers,helpers.exports);
const real=helpers.exports;

function transpileComponent(relative,load,expose){
  const source=readFileSync(join(site,relative),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',`${code}\nmodule.exports.${expose}=${expose};`)(load,module,module.exports);
  return module.exports[expose];
}

function hookRuntime(){
  const slots=[],effects=new Map();let index=0,dirty=true,pending=[],layouts=[];
  const same=(a,b)=>a?.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
  const hooks={
    useState(initial){const i=index++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],next=>{const value=typeof next==='function'?next(slots[i]):next;if(!Object.is(value,slots[i])){slots[i]=value;dirty=true;}}];},
    useRef(initial){const i=index++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useMemo(make,deps){const i=index++,prior=slots[i];if(!prior||!same(prior.deps,deps))slots[i]={deps,value:make()};return slots[i].value;},
    useEffect(make,deps){const i=index++,prior=effects.get(i);if(!same(prior?.deps,deps))pending.push(()=>{prior?.cleanup?.();const cleanup=make();effects.set(i,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
    useLayoutEffect(make,deps){const i=index++,prior=effects.get(i);if(!same(prior?.deps,deps))layouts.push(()=>{prior?.cleanup?.();const cleanup=make();effects.set(i,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
  };
  return {hooks,render(fn){let passes=0,value;do{assert(++passes<25,'hook effects settle');dirty=false;index=0;pending=[];layouts=[];value=fn();for(const effect of layouts)effect();for(const effect of pending)effect();}while(dirty);return value;},dispose(){for(const effect of effects.values())effect.cleanup?.();}};
}

const affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
const shape=[3,3,3],mask=new Uint8Array(27);mask[13]=1;
const sha=createHash('sha256').update(mask).digest('hex');
const entry={id:'synthetic.locate',label:'Synthetic saved voxel',family:'test',representation:'partial_mask',color:[1,0,0],opacity:{fill:.3,outline:.9},mask:{file:'mask.bin',sha256:sha,dtype:'uint8',shape_kji:shape,offset_kji:[0,0,0],native_shape_kji:shape,ijk_to_ras:affine}};
const image={file:'image.bin',sha256:'a'.repeat(64),dtype:'uint8',shape_kji:shape,ijk_to_ras:affine};
const study={definition:{image,entries:[entry]},data:new Uint8Array(27),geometry:createNativeVolumeGeometry(image),range:[0,1]};
const pkg={files:new Map([['mask.bin',new File([mask],'mask.bin')]])};

function makePractice(){
  const runtime=hookRuntime();
  const load=name=>name==='react'?runtime.hooks:
    name==='../lib/head-atlas-import'?{loadHeadEntry:real.loadHeadEntry}:
    name==='../lib/head-atlas-practice'?real:
    name==='../lib/head-atlas-display'?{headLabel:real.headLabel}:
    name==='../lib/head-atlas-focus'?{focusHeadLearningContent:()=>{}}:
    name==='../lib/head-atlas-links'?{HEAD_LINK_REVISION:'synthetic'}:
    name==='./HeadAtlasPracticeReview'?{HeadAtlasPracticeReview:()=>null,HeadAtlasPracticeFeedback:()=>null}:
    name==='./HeadPracticeSummaryDownload'?{HeadPracticeSummaryDownload:()=>null}:{};
  const usePractice=transpileComponent('components/HeadAtlasPractice.tsx',load,'useHeadAtlasPractice');
  let current;
  const flush=()=>current=runtime.render(()=>usePractice(pkg,study));
  return {flush,get current(){return current;},dispose:runtime.dispose};
}

function makeSlice(practice){
  const slots=[];let index=0,cursor=[1,1,1],tree,canvas;
  const hooks={
    useRef(initial){const i=index++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useState(initial){const i=index++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},
    useEffect(){},useLayoutEffect(){},useMemo(make){return make();},
  };
  const load=name=>name==='react'?hooks:
    name==='react/jsx-runtime'?requireSite(name):
    name==='../lib/head-atlas-practice'||name==='../lib/head-atlas-slice-controls'||name==='../lib/head-slice-viewport'||name==='../lib/head-viewport-memory'?real:
    name==='../lib/head-atlas-display'?{headLabel:real.headLabel,annotationInk:()=>''}:{};
  const NativeSlice=transpileComponent('components/HeadAtlasViewer.tsx',load,'NativeSlice');
  const walk=value=>{if(Array.isArray(value)){for(const part of value){const hit=walk(part);if(hit)return hit;}return null;}if(!value||typeof value!=='object'||!('props'in value))return null;return value.type==='canvas'&&value.props.role==='img'?value:walk(value.props.children);};
  function render(){index=0;tree=NativeSlice({plane:'axial',study,selected:practice.current.target,layers:[],groupLabels:false,opacity:1,layerOpacity:{},cursor,windowing:[0,1],overlay:false,regionalCourse:false,showCrosshair:false,showName:false,quizPick:practice.current.pick,onCursor:point=>{practice.current.clearPendingPick(point);cursor=point;},onAnswer:practice.current.acceptPick,expanded:false});canvas=walk(tree);assert(canvas);return canvas;}
  const press=key=>canvas.props.onKeyDown({key,altKey:false,ctrlKey:false,metaKey:false,shiftKey:false,repeat:false,nativeEvent:{isComposing:false},preventDefault(){}});
  const click=(x,y,rect={left:100,top:200,width:300,height:300})=>canvas.props.onClick({button:0,currentTarget:{getBoundingClientRect:()=>rect},clientX:x,clientY:y});
  return {render,press,click,get cursor(){return cursor;}};
}

test('actual slice events compose through the live locate hook to exact saved-mask scoring',async()=>{
  const p=makePractice();
  try{
    p.flush();assert.equal(p.current.startTarget(entry),true);p.flush();
    for(let i=0;i<8&&!p.current.target;i++){await Promise.resolve();p.flush();}
    assert.equal(p.current.target?.entry,entry,'actual mask-only load opened the exact target');
    const s=makeSlice(p),view=study.geometry.views.axial,rect={left:100,top:200,width:300,height:300};
    s.render();const pixel=view.pixelFromIJK([1,1,1]);
    s.click(rect.left+(pixel.x+.5)*rect.width/view.width,rect.top+(pixel.y+.5)*rect.height/view.height,rect);
    p.flush();assert.deepEqual(p.current.pick,[1,1,1]);
    p.current.submit();p.flush();
    assert.equal(p.current.outcome,'correct');assert.deepEqual(p.current.score,{correct:1,attempted:1,revealed:0,remaining:0,total:1});

    p.current.retry();p.flush();s.render();
    s.click(99,250,rect);p.flush();assert.equal(p.current.pick,null,'outside canvas cannot place a pick');
    p.current.submit();p.flush();assert.equal(p.current.outcome,null,'empty pick cannot score');
    s.render();s.click(250,350,rect);p.flush();assert.deepEqual(p.current.pick,[1,1,1]);
    s.render();s.press('ArrowRight');p.flush();assert.equal(p.current.pick,null,'cursor movement retires the earlier pick');
    s.render();s.press('Enter');p.flush();assert.deepEqual(p.current.pick,view.pixelToIJK(pixel.x+1,pixel.y,1),'keyboard answer follows native screen orientation');
    p.current.submit();p.flush();assert.equal(p.current.outcome,'incorrect','adjacent keyboard voxel is not a mask hit');
    assert.equal(p.current.score.correct,1,'retry cannot replace the original first-attempt score');
  }finally{p.dispose();}
});
