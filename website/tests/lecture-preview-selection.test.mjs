import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const proposal=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const website=process.env.VM_WEBSITE_ROOT??proposal;
const require=createRequire(resolve(website,'package.json'));
const React=require('react'),ts=require('typescript'),esbuild=require('esbuild');
const source=p=>resolve(existsSync(resolve(proposal,p))?proposal:website,p);
const names={content:'lecture-content',body:'lecture-body-reference',bodyLinks:'lecture-body-related-links',head:'lecture-anatomy-reference',collection:'lecture-anatomy-collection',matches:'lecture-anatomy-text-matches',mutation:'studio-mutation-context',navigation:'lecture-slide-navigation',image:'head-atlas-navigation',draft:'learning-draft-navigation'};
const build=await esbuild.build({stdin:{contents:Object.entries(names).map(([name,file])=>`export * as ${name} from ${JSON.stringify(source('lib/'+file+'.ts').replaceAll('\\','/'))};`).join('\n'),resolveDir:website},bundle:true,platform:'node',format:'cjs',write:false,alias:{'@':website}});
const bundled={exports:{}};new Function('require','module','exports',build.outputFiles[0].text)(require,bundled,bundled.exports);
const api=bundled.exports;
assert(api.mutation.parseStudioMutationContext({actorId:'edu:author',organizationId:'org'}), 'Synthetic editor starts with a valid Studio context');
const slides=['one','two','three'].map((id,i)=>({id,title:`Slide ${i+1}`,body:`Body ${i+1}`,referenceUrl:''}));
const view={id:'synthetic-lecture',courseId:'synthetic-course',courseTitle:'Course',title:'Teaching lecture',version:4,status:'draft',slides,reviews:[],published:null,canEdit:true,canReview:false,canPublish:false};
const nodes=n=>Array.isArray(n)?n.flatMap(nodes):React.isValidElement(n)?[n,...nodes(n.props.children)]:[];
const words=n=>Array.isArray(n)?n.map(words).join(''):React.isValidElement(n)?words(n.props.children):typeof n==='string'||typeof n==='number'?String(n):'';

function mount(component,props){
 props={...props}; // Simulate replacement props without mutating React-frozen element props.
 const descriptors=new Map(['window','document'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 for(const name of descriptors.keys())Object.defineProperty(globalThis,name,{configurable:true,value:{confirm:()=>true,addEventListener(){},removeEventListener(){}}});
 const values=[],effects=new Map();let cursor=0,tree,pending=[],changed=false,active=true;
 const hooks={...React,useMemo:(fn,deps)=>{const i=cursor++,old=values[i];if(!old||deps.some((value,j)=>old.deps[j]!==value))values[i]={deps,value:fn()};return values[i].value;},useRef:seed=>{const i=cursor++;return values[i]??(values[i]={current:seed});},useState:seed=>{const i=cursor++;if(!(i in values))values[i]=typeof seed==='function'?seed():seed;return[values[i],next=>{values[i]=typeof next==='function'?next(values[i]):next;changed=true;}];},useEffect:(fn,deps)=>{const i=cursor++,old=effects.get(i);if(!old||deps.some((value,j)=>old.deps[j]!==value))pending.push(()=>{old?.cleanup?.();effects.set(i,{deps,cleanup:fn()});});}};
 hooks.useLayoutEffect=hooks.useEffect;
 const compiled=ts.transpileModule(readFileSync(source(`components/${component}.tsx`),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const save={exports:{}};new Function('module','exports',ts.transpileModule(readFileSync(source('components/lecture-save-presentation.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(save,save.exports);
 const mod={exports:{}};
 new Function('require','module','exports',compiled)(name=>{
  if(name==='react')return hooks;
  for(const[key,file]of Object.entries(names))if(name===`../lib/${file}.ts`)return api[key];
  if(name==='./LecturePlayer')return {LecturePlayer:()=>null};
  if(name==='./WorkbookCorrectionLineage')return {WorkbookCorrectionLineage:()=>null,createWorkbookCorrectionLineageContext:()=>({begin:()=>Symbol(),finish(){},invalidate(){}})};
  if(name==='./WorkbookRetirement')return {WorkbookRetirement:()=>null};
  if(name==='./WorkbookCorrection')return {WorkbookCorrection:()=>null};
  if(name==='./lecture-save-presentation')return save.exports;
  if(name.endsWith('.css'))return {};
  return require(name);
 },mod,mod.exports);
 function flush(){assert(active);let passes=0;do{assert(++passes<18);cursor=0;changed=false;pending=[];tree=mod.exports[component](props);for(const effect of pending)effect();}while(changed);return tree;}
 const all=()=>nodes(tree),find=predicate=>{const found=all().find(predicate);assert(found,'Expected actual '+component+' node');return found;};
 const button=label=>find(n=>n.type==='button'&&words(n)===label);
 function dispose(){if(active){for(const effect of effects.values())effect.cleanup?.();active=false;}for(const[name,descriptor]of descriptors){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
 flush();return{props,flush,all,find,button,dispose,text:()=>words(tree)};
}
function editor(){return mount('LectureEditor',{initial:view,courseOutline:[],authorityKey:'author',expectedStudioContext:{actorId:'edu:author',organizationId:'org'}});}
const preview=h=>h.find(n=>typeof n.type==='function'&&n.type.name==='LecturePlayer').props;

test('late slide enters preview; both outlines and player controls preserve selection and clean draft',()=>{
 const savedFetch=globalThis.fetch;let requests=0;globalThis.fetch=()=>{requests++;throw Error('selection requested network');};
 const e=editor();try{
  e.button('3Slide 3').props.onClick();e.flush();e.button('Preview').props.onClick();e.flush();
  assert.equal(preview(e).draftPreview.selectedSlideId,'three');
  const p=mount('LecturePlayer',preview(e));try{
   assert.match(p.text(),/Slide 3 of 3/);
   p.button('Previous').props.onClick();e.flush();p.props.draftPreview=preview(e).draftPreview;p.flush();
   assert.equal(preview(e).draftPreview.selectedSlideId,'two');assert.match(p.text(),/Slide 2 of 3/);
   p.button('Slide 1').props.onClick();e.flush();p.props.draftPreview=preview(e).draftPreview;p.flush();
   assert.equal(preview(e).draftPreview.selectedSlideId,'one');
   e.button('3Slide 3').props.onClick();e.flush();assert.equal(preview(e).draftPreview.selectedSlideId,'three');
   e.button('Content').props.onClick();e.flush();assert.match(e.text(),/Slide 3/);
   e.button('Preview').props.onClick();e.flush();assert.equal(preview(e).draftPreview.selectedSlideId,'three');
   assert.doesNotMatch(e.text(),/Unsaved changes/);assert.equal(e.button('Save').props.disabled,true);assert.equal(requests,0);
  }finally{p.dispose();}
 }finally{e.dispose();globalThis.fetch=savedFetch;}
});

test('controlled slide IDs survive reorder, removal and empty drafts; retired handlers cannot redirect selection',()=>{
 let selected='three';const onSelect=id=>{selected=id;};const p=mount('LecturePlayer',{title:'Draft',slides,draftPreview:{selectedSlideId:selected,onSelectSlide:onSelect}});
 try{
  const retiredNext=p.button('Previous').props.onClick;
  p.props.slides=[slides[2],slides[0],slides[1]];p.flush();assert.match(p.text(),/Slide 1 of 3/);
  retiredNext();assert.equal(selected,'three');
  p.props.slides=[slides[0],slides[1]];p.flush();assert.match(p.text(),/Slide 1 of 2/);
  p.props.slides=[];p.flush();assert.match(p.text(),/No slides to preview yet/);
 }finally{p.dispose();}
});

test('old editor preview and outline callbacks stop after selection change, context swap and unmount',()=>{
 const e=editor();try{
  e.button('Preview').props.onClick();e.flush();const stale=preview(e).draftPreview.onSelectSlide,oldOutline=e.button('2Slide 2').props.onClick;
  e.button('3Slide 3').props.onClick();e.flush();stale('two');oldOutline();e.flush();assert.equal(preview(e).draftPreview.selectedSlideId,'three');
  const current=preview(e).draftPreview.onSelectSlide;
  e.props.expectedStudioContext={actorId:'edu:other',organizationId:'org'};e.flush();current('one');e.flush();assert.equal(preview(e).draftPreview.selectedSlideId,'three');
  e.dispose();current('one');
 }finally{e.dispose();}
});

test('retained Preview and editor outline handlers cannot change a later Content or Review panel',()=>{
 const e=editor();try{
  e.button('Preview').props.onClick();e.flush();
  const oldPlayerSelect=preview(e).draftPreview.onSelectSlide;
  const oldOutlineSelect=e.button('2Slide 2').props.onClick;
  e.button('Content').props.onClick();e.flush();
  oldPlayerSelect('three');oldOutlineSelect();e.flush();
  assert.equal(e.find(n=>n.type==='section'&&n.props['aria-label']==='Lecture editor').props['data-editor-panel'],'content');
  assert.equal(e.button('1Slide 1').props['aria-current'],'step');
  e.button('Review').props.onClick();e.flush();
  oldPlayerSelect('three');oldOutlineSelect();e.flush();
  assert.equal(e.find(n=>n.type==='section'&&n.props['aria-label']==='Lecture editor').props['data-editor-panel'],'review');
  assert.equal(e.button('1Slide 1').props['aria-current'],'step');
  e.button('Preview').props.onClick();e.flush();
  preview(e).draftPreview.onSelectSlide('two');e.flush();
  assert.equal(preview(e).draftPreview.selectedSlideId,'two');
 }finally{e.dispose();}
});

test('published navigation takes precedence over supplied draft preview',()=>{
 let calls=0;const navigation={workbookId:'synthetic-lecture',courseSlug:'course',revision:'a'.repeat(64),request:{kind:'requested',slideId:'two',revision:'a'.repeat(64)}};
 const p=mount('LecturePlayer',{title:'Published',slides,navigation,draftPreview:{selectedSlideId:'three',onSelectSlide:()=>calls++}});
 try{assert.match(p.text(),/Body 2/);assert.doesNotMatch(p.text(),/Body 3/);assert.equal(calls,0);}finally{p.dispose();}
});
