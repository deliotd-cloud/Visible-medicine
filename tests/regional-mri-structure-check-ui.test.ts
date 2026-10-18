import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {build} from 'esbuild';
import {createHash} from 'node:crypto';
type Node={type:any;props:Record<string,any>};
const nodes=(v:any):Node[]=>Array.isArray(v)?v.flatMap(nodes):v?.props?[v,...nodes(v.props.children)]:[];
const text=(v:any):string=>Array.isArray(v)?v.map(text).join(''):v?.props?text(v.props.children):v==null?'':String(v);
const source=readFileSync(new URL('../components/RegionalMriStructureCheck.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function harness(real?:{api:any;context:any}){
 let cursor=0,slots:any[]=[],pending=new Map<number,{kind:string;fn:()=>any}>(),effects=new Map<number,()=>void>(),tree:Node;
 const calls:string[]=[],owners=new WeakMap<object,any>();let closes=0,focuses=0,shownAnswers=0,nexts=0,headingFocuses=0;
 const hooks={useRef(value:any){const i=cursor++;return slots[i]??=( {current:value});},useState(value:any){const i=cursor++;if(!(i in slots))slots[i]=value;return[slots[i],(v:any)=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useLayoutEffect(fn:()=>any){pending.set(cursor++,{kind:'layout',fn});},useEffect(fn:()=>any){pending.set(cursor++,{kind:'passive',fn});}};
 const runtime={jsx:(type:any,props:any)=>({type,props}),jsxs:(type:any,props:any)=>({type,props})};
 const valid=(c:any,p:any,s:any,o:any)=>{const a=owners.get(c);return a&&a.pkg===p&&a.study===s&&a.overlay===o;};
 const api={gradeRegionalMriStructureCheck(c:any,p:any,s:any,o:any,id:string){calls.push('grade');return real?real.api.gradeRegionalMriStructureCheck(c,p,s,o,id):!valid(c,p,s,o)||!c.options.some((x:any)=>x.id===id)?'unavailable':id==='right'?'correct':'incorrect';},
  revealRegionalMriStructureCheck(c:any,p:any,s:any,o:any){calls.push('reveal');return real?real.api.revealRegionalMriStructureCheck(c,p,s,o):valid(c,p,s,o)?c.options.find((x:any)=>x.id==='right'):null;},
  gradeRegionalMriLocationCheck(c:any,p:any,s:any,o:any,f:any,plane:string,slice:number,x:number,y:number){calls.push('location-grade');return real?real.api.gradeRegionalMriLocationCheck(c,p,s,o,f,plane,slice,x,y):!valid(c,p,s,o)||owners.get(c).frame!==f||plane!=='axial'||slice!==0?'unavailable':x===1&&y===1?'correct':'incorrect';},
  revealRegionalMriLocationCheck(c:any,p:any,s:any,o:any){calls.push('location-reveal');return real?real.api.revealRegionalMriLocationCheck(c,p,s,o):valid(c,p,s,o)?c.targetLabel:null;}};
 const module={exports:{} as any};new Function('require','module','exports',code)((id:string)=>({'react':hooks,'react/jsx-runtime':runtime,'../lib/regional-mri-structure-check':api}[id]??assert.fail(id)),module,module.exports);
 function context(){const value={pkg:{},study:{},overlay:{},check:Object.freeze({key:Math.random().toString(),revision:'synthetic-question-v1',prompt:'Which saved annotation?',options:Object.freeze([{id:'wrong',label:'Distractor'},{id:'right',label:'Target structure'},{id:'other',label:'Another structure'}])})};owners.set(value.check,value);return value;}
 function locationContext(){const value:any={...context(),location:Object.freeze({key:'synthetic-location',revision:'synthetic-location-v1',prompt:'Locate saved target extent.',targetLabel:'Target structure'}),mode:'locate',frame:{width:3,height:3},plane:'axial',slice:0};owners.set(value.location,value);return value;}
 let props:any={...(real?.context??context()),retired:false,imageReady:true,annotationVisible:true,onClose:()=>closes++,onFocus:()=>focuses++,onShowAnswer:()=>shownAnswers++,onModeChange:(mode:string)=>{props={...props,mode,pick:null};}};
 function commit(kind?:string){for(const current of kind?[kind]:['layout','passive'])for(const[i,effect]of pending)if(effect.kind===current){effects.get(i)?.();effects.set(i,effect.fn());}}
 function render(next?:any,doCommit=true,passive=true){if(next)props={...props,...next};cursor=0;pending=new Map();const value=module.exports.RegionalMriStructureCheck(props);if(doCommit){tree=value;const heading=nodes(value).find(n=>n.type==='h3');if(heading)heading.props.ref.current={focus:(options:any)=>{assert.deepEqual(options,{preventScroll:true});headingFocuses++;}};commit('layout');if(passive)commit('passive');}return value;}
 function button(label:string,value=tree){const n=nodes(value).find(n=>n.type==='button'&&text(n)===label);assert(n,label);return n;}
 function unmount(){for(const fn of effects.values())fn?.();effects.clear();}
 return{render,button,unmount,context,locationContext,calls,text:()=>text(tree),props:()=>props,closes:()=>closes,focuses:()=>focuses,shownAnswers:()=>shownAnswers,nexts:()=>nexts,headingFocuses:()=>headingFocuses,addNext:()=>()=>nexts++,flushPassive:()=>commit('passive'),replay:()=>{unmount();commit();}};
}
test('next structure is optional navigation, including an undrawn or off-annotation view',()=>{
 const h=harness();h.render();assert.doesNotMatch(h.text(),/Next structure/);
 h.render({onNext:h.addNext()});assert.equal(h.button('Next structure').props.disabled,true);h.button('Next structure').props.onClick();assert.equal(h.nexts(),0);
 h.render({nextAvailable:true,imageReady:false});assert.equal(h.button('Next structure').props.disabled,false);h.button('Next structure').props.onClick();assert.equal(h.nexts(),1);assert.equal(h.calls.length,0);
 h.render({imageReady:true,annotationVisible:false});h.button('Next structure').props.onClick();assert.equal(h.nexts(),2);assert.equal(h.calls.length,0);
 h.render({annotationVisible:true});h.button('Next structure').props.onClick();assert.equal(h.nexts(),3);h.unmount();
});
test('next structure refuses retired, stale, speculative and unmounted callbacks',()=>{
 const h=harness();h.render({onNext:h.addNext(),nextAvailable:true});const old=h.button('Next structure').props.onClick;
 const speculative=h.render({...h.context()},false);h.button('Next structure',speculative).props.onClick();assert.equal(h.nexts(),0);
 h.render({...h.context()});old();assert.equal(h.nexts(),0);
 const retired=h.button('Next structure').props.onClick;h.render({retired:true});assert.equal(h.button('Next structure').props.disabled,true);retired();h.button('Next structure').props.onClick();assert.equal(h.nexts(),0);
 h.render({retired:false,nextAvailable:false});h.button('Next structure').props.onClick();assert.equal(h.nexts(),0);
 h.render({nextAvailable:true});const current=h.button('Next structure').props.onClick;h.unmount();current();assert.equal(h.nexts(),0);
});
test('heading focuses once when a new question or mode is ready, never from speculative or retired context',()=>{
 const h=harness();h.render({imageReady:false});assert.equal(h.headingFocuses(),0);
 h.render({imageReady:true});assert.equal(h.headingFocuses(),1);h.render();assert.equal(h.headingFocuses(),1);
 h.render({...h.context(),imageReady:false});assert.equal(h.headingFocuses(),1);
 h.render({imageReady:true},false);assert.equal(h.headingFocuses(),1);
 h.render({imageReady:true});assert.equal(h.headingFocuses(),2);
 h.render({retired:true,mode:'locate'});assert.equal(h.headingFocuses(),2);
 h.render({retired:false});assert.equal(h.headingFocuses(),3);h.render();assert.equal(h.headingFocuses(),3);h.unmount();
});
test('incorrect then correct feedback never tells a correct answer to try again',()=>{
 const h=harness();h.render();h.button('Distractor').props.onClick();h.render();assert.match(h.text(),/Try another answer/);
 h.button('Target structure').props.onClick();h.render();assert.match(h.text(),/Correct — this is the saved Target structure annotation/);
 assert.doesNotMatch(h.text(),/Try another answer|Not this saved annotation/);assert.equal(h.button('Distractor').props.disabled,true);
 const count=h.calls.length;h.button('Another structure').props.onClick();h.render();assert.equal(h.calls.length,count);
 assert.match(h.text(),/No answers are sent to a server or saved/);h.unmount();
});
test('a correct naming answer owns feedback immediately before React commits',()=>{
 const h=harness();h.render();
 const correct=h.button('Target structure').props.onClick,wrong=h.button('Distractor').props.onClick,reveal=h.button('Reveal answer').props.onClick;
 correct();wrong();reveal();correct();
 assert.deepEqual(h.calls,['grade']);h.render();assert.match(h.text(),/Correct — this is the saved Target structure annotation/);
 assert.doesNotMatch(h.text(),/Try another answer|revealed answer/);h.unmount();
});
test('a revealed naming answer cannot turn into a correct score before commit',()=>{
 const h=harness();h.render();const answer=h.button('Target structure').props.onClick,reveal=h.button('Reveal answer').props.onClick;
 reveal();answer();reveal();assert.deepEqual(h.calls,['reveal']);h.render();
 assert.match(h.text(),/revealed answer, not a correct attempt/);assert.doesNotMatch(h.text(),/Correct —/);h.unmount();
});
test('incorrect naming attempts may retry before commit but cannot replace later success',()=>{
 const h=harness();h.render();const wrong=h.button('Distractor').props.onClick,correct=h.button('Target structure').props.onClick;
 wrong();correct();wrong();assert.deepEqual(h.calls,['grade','grade']);h.render();assert.match(h.text(),/Correct —/);h.unmount();
});
test('abandoned replacement renders do not release a completed naming attempt',()=>{
 const h=harness();h.render();const correct=h.button('Target structure').props.onClick,wrong=h.button('Distractor').props.onClick;
 correct();const speculative=h.render({...h.context()},false);h.button('Target structure',speculative).props.onClick();wrong();
 assert.deepEqual(h.calls,['grade']);h.render();assert.match(h.text(),/Choose an answer/);
 h.button('Target structure').props.onClick();h.render();assert.deepEqual(h.calls,['grade','grade']);assert.match(h.text(),/Correct —/);h.unmount();
});
test('revealed answer is distinguished from a correct attempt and remains keyboard-button accessible',()=>{
 const h=harness();h.render();h.button('Return to saved annotation focus').props.onClick();assert.equal(h.focuses(),1);
 h.button('Reveal answer').props.onClick();h.render();assert.match(h.text(),/revealed answer, not a correct attempt/);assert.doesNotMatch(h.text(),/Correct —/);
 assert.equal(h.button('Target structure').props.type,'button');assert.equal(h.button('Target structure').props.disabled,true);
 h.button('Return to inspection').props.onClick();assert.equal(h.closes(),1);h.unmount();
});
test('source, annotation, check identity and retirement hide old feedback and refuse old callbacks',()=>{
 const h=harness();h.render();const old=h.button('Target structure').props.onClick;old();h.render();assert.match(h.text(),/Correct —/);
 h.render({overlay:{}});assert.doesNotMatch(h.text(),/Correct —/);h.button('Target structure').props.onClick();h.render();assert.match(h.text(),/no longer available/);
 const count=h.calls.length;old();h.render();assert.equal(h.calls.length,count);
 h.render({...h.context(),retired:true});assert.doesNotMatch(h.text(),/Correct —|Which saved annotation/);assert.match(h.text(),/Question paused/);
 assert.equal(h.button('Return to inspection').props.disabled,true);old();assert.equal(h.calls.length,count);
 h.render({...h.context(),retired:false});assert.match(h.text(),/Choose an answer/);h.unmount();
});
test('drawing gate, speculative callbacks, StrictMode replay and unmount preserve committed ownership',()=>{
 const h=harness();h.render();const previous=h.button('Target structure').props.onClick;
 const speculative=h.render({...h.context()},false);h.button('Target structure',speculative).props.onClick();assert.equal(h.calls.length,0);
 h.render({...h.context(),imageReady:false});previous();assert.equal(h.calls.length,0);assert.match(h.text(),/Waiting for the current annotation image/);
 h.button('Return to inspection').props.onClick();assert.equal(h.closes(),1,'failed canvas must not trap navigation');
 h.render({imageReady:true});h.replay();h.button('Target structure').props.onClick();h.render();assert.match(h.text(),/Correct —/);
 const close=h.button('Return to inspection').props.onClick,answer=h.button('Distractor').props.onClick;h.unmount();close();answer();assert.equal(h.closes(),1);assert.equal(h.calls.length,1);
});
test('actual synthetic loader and owned grading drive the rendered correct feedback without a stubbed answer',async()=>{
 const result=await build({stdin:{contents:"export * from './lib/regional-mri-package';export * from './lib/regional-mri-structure-check';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64'));
 const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex'),image=new Uint8Array([17]),imageHash=sha(image);
 const annotations=['Quadriceps tendon','Patella','Patellar tendon'].map((label,i)=>({id:'synthetic-'+i,anatomyId:'synthetic:concept:'+i,label,seriesId:'synthetic-sequence',sourceImageSha256:imageHash,laterality:'left',coverage:'partial',review:{status:'accepted-scoped',revision:'a'.repeat(64),scope:'Synthetic extent only'},geometry:{kind:'points',points_ras_mm:[[0,0,0]]}}));
 const manifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'left',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[{id:'synthetic-sequence',label:'Synthetic MRI',image:{file:'image.raw',sha256:imageHash,dtype:'uint8',shape_kji:[1,1,1],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]},annotations}]};
 const bytes=new TextEncoder().encode(JSON.stringify(manifest)),asset=(data:Uint8Array)=>({size:data.byteLength,async arrayBuffer(){return data.slice().buffer;}});
 const pkg=await api.openRegionalMriPackage(bytes.buffer,new Map([['manifest.json',asset(bytes)],['image.raw',asset(image)]]),sha(bytes)),study=await api.loadRegionalMriSeries(pkg,'synthetic-sequence');
 const overlay=await api.loadRegionalMriAnnotation(pkg,study,study.series.annotations[0]),check=api.createRegionalMriStructureCheck(pkg,study,overlay);assert(check);
 const h=harness({api,context:{pkg,study,overlay,check}});h.render();h.button('Patella').props.onClick();h.render();assert.match(h.text(),/Try another answer/);
 h.button('Quadriceps tendon').props.onClick();h.button('Patella').props.onClick();h.button('Reveal answer').props.onClick();h.render();assert.match(h.text(),/Correct — this is the saved Quadriceps tendon annotation/);assert.doesNotMatch(h.text(),/Try another answer|revealed answer/);assert.deepEqual(h.calls,['grade','grade']);
 const stale=h.button('Patellar tendon').props.onClick;h.render({check:{...check}});assert.doesNotMatch(h.text(),/Correct —/);h.button('Quadriceps tendon').props.onClick();h.render();assert.match(h.text(),/no longer available/);stale();assert.equal(h.calls.length,3);h.unmount();
});
test('off-annotation slices pause grade and reveal while focus and return remain available',()=>{
 const h=harness();h.render();const answer=h.button('Target structure').props.onClick,reveal=h.button('Reveal answer').props.onClick;
 h.render({annotationVisible:false});assert.match(h.text(),/No saved annotation is visible/);answer();reveal();assert.equal(h.calls.length,0);
 assert.doesNotMatch(h.text(),/Which saved annotation|Correct —/);h.button('Return to saved annotation focus').props.onClick();assert.equal(h.focuses(),1);
 h.render({annotationVisible:true});h.button('Target structure').props.onClick();h.render();assert.match(h.text(),/Correct —/);
 h.render({annotationVisible:false});assert.doesNotMatch(h.text(),/Correct —/);h.button('Return to inspection').props.onClick();assert.equal(h.closes(),1);h.unmount();
});

const locationPick=(props:any,x:number,y:number,nonce=1)=>({check:props.location,frame:props.frame,plane:props.plane,slice:props.slice,x,y,nonce});
test('location attempts grade after layout commit, distinguish outside/correct and reveal only after valid feedback',()=>{
 const h=harness(),c=h.locationContext();h.render(c);h.render({pick:locationPick(c,0,0)},true,false);assert.equal(h.calls.length,0);
 h.flushPassive();h.render();assert.match(h.text(),/outside the saved mask extent/);assert.equal(h.shownAnswers(),0);
 h.render({pick:locationPick(c,1,1,2)});h.render();assert.match(h.text(),/Correct — your point is inside/);assert.doesNotMatch(h.text(),/Try another point/);assert.equal(h.shownAnswers(),1);
 const before=h.calls.length;h.replay();h.render();assert.equal(h.calls.length,before,'one committed pick only');
 h.render({slice:1,pick:null});assert.doesNotMatch(h.text(),/your point is inside/);assert.match(h.text(),/check is complete/);
 h.button('Name annotation').props.onClick();h.render();assert.match(h.text(),/Choose an answer/);h.button('Distractor').props.onClick();h.render();assert.match(h.text(),/Try another answer/);h.unmount();
});
test('location reveal is not a correct attempt; a completed question cannot accept later clicks',()=>{
 const h=harness(),c=h.locationContext();h.render(c);h.button('Reveal answer').props.onClick();h.render();assert.match(h.text(),/Answer overlay revealed/);assert.doesNotMatch(h.text(),/Correct —/);assert.equal(h.shownAnswers(),1);
 const before=h.calls.length;h.render({pick:locationPick(c,1,1)});h.render();assert.equal(h.calls.length,before);
 assert.equal(h.button('Reveal answer').props.disabled,true);h.unmount();
});
test('rapid location reveal calls expose the answer exactly once before commit',()=>{
 const h=harness(),c=h.locationContext();h.render(c);const reveal=h.button('Reveal answer').props.onClick;
 reveal();reveal();assert.deepEqual(h.calls,['location-reveal']);assert.equal(h.shownAnswers(),1);h.render();
 assert.match(h.text(),/Answer overlay revealed/);h.unmount();
});
test('location success is terminal before a reentrant answer-overlay callback',()=>{
 const h=harness(),c=h.locationContext();
 h.render({...c,onShowAnswer:()=>h.button('Reveal answer').props.onClick()});
 h.render({pick:locationPick(c,1,1)});h.render();assert.deepEqual(h.calls,['location-grade']);
 assert.match(h.text(),/Correct — your point is inside/);assert.doesNotMatch(h.text(),/Answer overlay revealed/);h.unmount();
});
test('a new committed question or activity releases only its own terminal latch',()=>{
 const h=harness();h.render();h.button('Target structure').props.onClick();h.render();
 const c=h.locationContext();h.render(c);h.button('Reveal answer').props.onClick();h.render();assert.match(h.text(),/Answer overlay revealed/);
 h.button('Name annotation').props.onClick();h.render();h.button('Target structure').props.onClick();h.render();
 assert.match(h.text(),/Correct — this is the saved Target structure annotation/);assert.deepEqual(h.calls,['grade','location-reveal','grade']);h.unmount();
});
test('stale frame/proof/view and undrawn/off-target/retired contexts cannot grade or reveal a location',()=>{
 const h=harness(),c=h.locationContext();h.render({...c,pick:locationPick(c,1,1),imageReady:false});assert.equal(h.calls.length,0);
 h.render({imageReady:true,annotationVisible:false});assert.equal(h.calls.length,0);assert.match(h.text(),/does not intersect this slice/);
 h.render({annotationVisible:true,pick:{...locationPick(c,1,1),frame:{...c.frame}}});assert.equal(h.calls.length,0);
 h.render({pick:{...locationPick(c,1,1),check:{...c.location}}});assert.equal(h.calls.length,0);
 h.render({pick:{...locationPick(c,1,1),plane:'sagittal'}});assert.equal(h.calls.length,0);
 const reveal=h.button('Reveal answer').props.onClick;h.render({retired:true,pick:locationPick(c,1,1)});reveal();assert.equal(h.calls.length,0);h.unmount();
});
test('location activity remains available without naming distractors and retires source-bound feedback',()=>{
 const h=harness(),c=h.locationContext();h.render({...c,check:null});assert.equal(h.button('Name annotation').props.disabled,true);
 assert.match(h.text(),/Find Target structure/);h.render({pick:locationPick(c,0,0)});h.render();assert.match(h.text(),/outside the saved mask extent/);
 h.render({overlay:{},pick:null});assert.doesNotMatch(h.text(),/outside the saved mask extent/);h.button('Reveal answer').props.onClick();h.render();assert.match(h.text(),/no longer available/);h.unmount();
});
test('actual loader, hidden native mask frame and owned location API drive correct rendered feedback',async()=>{
 const built=await build({stdin:{contents:"export * from './lib/regional-mri-package';export * from './lib/regional-mri-structure-check';export * from './lib/regional-mri-render';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].contents).toString('base64')),sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
 const image=Uint8Array.from({length:27},(_,i)=>i),mask=new Uint8Array(27);mask[13]=1;const grid={shape_kji:[3,3,3],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
 const annotation={id:'synthetic-mask',anatomyId:'synthetic:target',label:'Saved target',seriesId:'native',sourceImageSha256:sha(image),laterality:'left',coverage:'partial',review:{status:'accepted-scoped',revision:'a'.repeat(64),scope:'Synthetic extent only'},geometry:{kind:'mask',file:'mask.raw',sha256:sha(mask),shape_kji:[3,3,3],offset_kji:[0,0,0],grid,gridKind:'source-native',mappingRevision:'b'.repeat(64)}};
 const manifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'left',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[{id:'native',label:'Synthetic MRI',image:{...grid,file:'image.raw',sha256:sha(image),dtype:'uint8'},annotations:[annotation]}]};
 const bytes=new TextEncoder().encode(JSON.stringify(manifest)),asset=(b:Uint8Array)=>({size:b.byteLength,async arrayBuffer(){return b.slice().buffer;}});
 const pkg=await api.openRegionalMriPackage(bytes.buffer,new Map([['manifest.json',asset(bytes)],['image.raw',asset(image)],['mask.raw',asset(mask)]]),sha(bytes)),study=await api.loadRegionalMriSeries(pkg,'native'),overlay=await api.loadRegionalMriAnnotation(pkg,study,study.series.annotations[0]);
 const location=api.createRegionalMriLocationCheck(pkg,study,overlay),frame=api.regionalMriFrame(study,overlay,'axial',1,{center:13,width:26,opacity:0});assert(location);assert.equal(api.createRegionalMriStructureCheck(pkg,study,overlay),null);
 assert.equal(frame.pixels[16],frame.pixels[17],'answer mask is hidden in grey frame');
 const c={pkg,study,overlay,check:null,location,frame,mode:'locate',plane:'axial',slice:1},h=harness({api,context:c});h.render();h.render({pick:locationPick(c,0,0)});h.render();assert.match(h.text(),/outside the saved mask extent/);
 h.render({pick:locationPick(c,1,1,2)});h.render();assert.match(h.text(),/Correct — your point is inside/);assert.equal(h.shownAnswers(),1);
 const colored=api.regionalMriFrame(study,overlay,'axial',1,{center:13,width:26,opacity:.55});assert.notEqual(colored.pixels[16],colored.pixels[17]);h.render({frame:colored,pick:null});assert.match(h.text(),/Correct —/);h.unmount();
});

test('answer learning is absent before a valid naming answer and follows exact current visible feedback',()=>{
 const h=harness(),followup={type:'aside',props:{children:'Exact answer learning'}};h.render({followup});assert.doesNotMatch(h.text(),/Exact answer learning/);
 h.button('Distractor').props.onClick();h.render();assert.doesNotMatch(h.text(),/Exact answer learning/);
 h.button('Target structure').props.onClick();h.render();assert.match(h.text(),/Correct —/);assert.match(h.text(),/Exact answer learning/);
 h.render({imageReady:false});assert.doesNotMatch(h.text(),/Exact answer learning/);h.render({imageReady:true,annotationVisible:false});assert.doesNotMatch(h.text(),/Exact answer learning/);
 h.render({annotationVisible:true});assert.match(h.text(),/Exact answer learning/);h.render({overlay:{}});assert.doesNotMatch(h.text(),/Exact answer learning/);
 h.button('Reveal answer').props.onClick();h.render();assert.match(h.text(),/no longer available/);assert.doesNotMatch(h.text(),/Exact answer learning/);h.unmount();
});

test('revealed and correct location answers allow learning only on the matching displayed view; activity and source changes hide it',()=>{
 const followup={type:'aside',props:{children:'Exact answer learning'}};
 for(const reveal of [false,true]){
  const h=harness(),c=h.locationContext();h.render({...c,followup});assert.doesNotMatch(h.text(),/Exact answer learning/);
  if(reveal)h.button('Reveal answer').props.onClick();else{h.render({pick:locationPick(c,1,1)});h.render();}
  h.render();assert.match(h.text(),/Exact answer learning/);assert.match(h.text(),reveal?/Answer overlay revealed/:/Correct —/);
  h.render({slice:1,pick:null});assert.doesNotMatch(h.text(),/Exact answer learning/);h.render({slice:0});assert.match(h.text(),/Exact answer learning/);
  h.render({retired:true});assert.doesNotMatch(h.text(),/Exact answer learning/);h.render({retired:false});
  h.button('Name annotation').props.onClick();h.render();assert.doesNotMatch(h.text(),/Exact answer learning/);
  h.render({...h.context()});h.button('Reveal answer').props.onClick();h.render();assert.match(h.text(),/Exact answer learning/);assert.match(h.text(),/revealed answer, not a correct attempt/);
  h.render({check:{...h.props().check}});assert.doesNotMatch(h.text(),/Exact answer learning/);h.unmount();
 }
});
