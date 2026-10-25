import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const website=process.env.VM_WEBSITE_ROOT??root;
const require=createRequire(resolve(website,'package.json'));
const React=require('react'),ts=require('typescript'),esbuild=require('esbuild');
const source=p=>resolve(existsSync(resolve(root,p))?root:website,p);
const names={content:'lecture-content',body:'lecture-body-reference',bodyLinks:'lecture-body-related-links',head:'lecture-anatomy-reference',collection:'lecture-anatomy-collection',matches:'lecture-anatomy-text-matches',mutation:'studio-mutation-context',navigation:'lecture-slide-navigation',image:'head-atlas-navigation',draft:'learning-draft-navigation'};
const build=await esbuild.build({stdin:{contents:Object.entries(names).map(([name,file])=>`export * as ${name} from ${JSON.stringify(source('lib/'+file+'.ts').replaceAll('\\','/'))};`).join('\n'),resolveDir:website},bundle:true,platform:'node',format:'cjs',write:false,alias:{'@':website},plugins:[{name:'isolated-source-fallback',setup(b){b.onResolve({filter:/^\.\.?\//},args=>{const target=resolve(args.resolveDir,args.path);if(target.startsWith(root)&&!existsSync(target)){const fallback=resolve(website,target.slice(root.length+1));if(existsSync(fallback))return {path:fallback};}return null;});}}]});
const apiModule={exports:{}};new Function('require','module','exports',build.outputFiles[0].text)(require,apiModule,apiModule.exports);
const api=apiModule.exports;
const {expectedStudioContext,installComparisonFetch}=await import(new URL('file:///'+resolve(website,'tests/lecture-context-fixture.mjs').replaceAll('\\','/')));
installComparisonFetch();
const bodyRows=JSON.parse(readFileSync(source('lib/lecture-body-catalog.json'),'utf8')).rows;
const achilles=api.body.lectureBodyOptions('left Achilles')[0];assert(achilles);
const pins=bodyRows.slice(0,6).map(row=>api.body.createLectureBodyReference(row[0]));assert(pins.every(Boolean));
const head=api.head.createLectureAnatomyReference('brainstem-pons');assert(head);
const slide={id:'one',title:'Structure teaching',body:'Inspect this anatomy.',referenceUrl:''};
const initial={id:'synthetic-body-lecture',courseId:'synthetic-course',courseTitle:'Synthetic course',title:'Body teaching',version:4,status:'draft',slides:[slide],reviews:[],published:null,canEdit:true,canReview:false,canPublish:false};
const tick=()=>new Promise(yes=>setImmediate(yes));
const nodes=n=>Array.isArray(n)?n.flatMap(nodes):React.isValidElement(n)?[n,...nodes(n.props.children)]:[];
const text=n=>Array.isArray(n)?n.map(text).join(''):React.isValidElement(n)?text(n.props.children):typeof n==='string'||typeof n==='number'?String(n):'';
function harness(view=initial,playerProps){
  const descriptors=new Map(['window','document'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  for(const name of descriptors.keys())Object.defineProperty(globalThis,name,{configurable:true,value:{confirm:()=>true,addEventListener(){},removeEventListener(){}}});
  const values=[],effects=new Map();let index=0,tree,changed=false,pending=[];
  const react={...React,useMemo:fn=>fn(),useRef:seed=>{const i=index++;return values[i]??(values[i]={current:seed});},useState:seed=>{const i=index++;if(!(i in values))values[i]=typeof seed==='function'?seed():seed;return[values[i],next=>{values[i]=typeof next==='function'?next(values[i]):next;changed=true;}];},useEffect:(fn,deps)=>{const i=index++,old=effects.get(i);if(!old||deps.length!==old.deps.length||deps.some((d,j)=>d!==old.deps[j]))pending.push(()=>{old?.cleanup?.();const cleanup=fn();effects.set(i,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});}};
  react.useLayoutEffect=react.useEffect;
  const component=playerProps?'LecturePlayer':'LectureEditor';
  const compiled=ts.transpileModule(readFileSync(source('components/'+component+'.tsx'),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const mod={exports:{}};
  const save={exports:{}};new Function('module','exports',ts.transpileModule(readFileSync(resolve(website,'components/lecture-save-presentation.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(save,save.exports);
  const lineage={WorkbookCorrectionLineage:()=>null,createWorkbookCorrectionLineageContext:()=>({begin:()=>Symbol('synthetic'),finish(){},invalidate(){}})};
  new Function('require','module','exports',compiled)(name=>{
    if(name==='react')return react;
    for(const[key,file]of Object.entries(names))if(name===`../lib/${file}.ts`)return api[key];
    if(name==='./LecturePlayer')return {LecturePlayer:()=>null};
    if(name==='./WorkbookCorrectionLineage')return lineage;
    if(name==='./WorkbookRetirement')return {WorkbookRetirement:()=>null};
    if(name==='./WorkbookCorrection')return {WorkbookCorrection:()=>null};
    if(name==='./lecture-save-presentation')return save.exports;
    if(name.endsWith('.css'))return {};
    return require(name);
  },mod,mod.exports);
  const props=playerProps??{initial:view,courseOutline:[{id:view.id,title:view.title}],expectedStudioContext};
  const flush=()=>{let count=0;do{assert(++count<15);index=0;changed=false;pending=[];tree=mod.exports[component](props);for(const fn of pending)fn();}while(changed);return tree;};
  const all=()=>nodes(tree),find=predicate=>{const found=all().find(predicate);assert(found,'Expected actual component node');return found;};
  const button=label=>find(n=>n.type==='button'&&text(n)===label);
  flush();return{flush,all,find,button,text:()=>text(tree),search(q){find(n=>n.type==='input'&&n.props['aria-label']==='Find a 3D structure').props.onChange({target:{value:q}});flush();},dispose(){for(const effect of effects.values())effect.cleanup?.();for(const[name,d]of descriptors){if(d)Object.defineProperty(globalThis,name,d);else delete globalThis[name];}}};
}

test('3D linking is deliberate, side-specific and saves alongside unchanged head pins and other slides',async()=>{
  const saved=globalThis.fetch,requests=[];
  globalThis.fetch=async(_url,req)=>{const payload=JSON.parse(req.body);requests.push(payload);return new Response(JSON.stringify({...initial,title:payload.title,slides:payload.slides,version:5}));};
  const view={...initial,slides:[{...slide,anatomyReference:head},{...slide,id:'two',title:'Other slide'}]};
  const h=harness(view);try{
    const disclosure=h.find(n=>n.type==='details'&&text(n).startsWith('Optional · 3D body structures'));assert.equal(disclosure.props.open,undefined);
    h.search('left Achilles');assert.equal(requests.length,0);assert.doesNotMatch(h.text(),/Unsaved changes/);
    assert(!h.all().some(n=>n.type==='button'&&/^Link Right calcaneal tendon/.test(text(n))));
    h.button('Link '+achilles.label).props.onClick();h.flush();assert.match(h.text(),/2\/6 total anatomy links/);
    h.button('Save').props.onClick();await tick();h.flush();
    assert.equal(requests.length,1);assert.deepEqual(requests[0].slides[0].bodyAnatomyReferences,[achilles.reference]);
    assert.deepEqual(requests[0].slides[0].anatomyReference,head);assert.deepEqual(requests[0].slides[1],view.slides[1]);
    assert.equal(requests[0].expectedVersion,4);assert.match(h.text(),/Saved version 5/);
  }finally{h.dispose();globalThis.fetch=saved;}
});

test('six-link ceiling is shared in both directions and retained callbacks cannot append a seventh',()=>{
  const h=harness({...initial,slides:[{...slide,bodyAnatomyReferences:pins}]});try{
    h.search('left Achilles');const add=h.button('Link '+achilles.label);assert.equal(add.props.disabled,true);add.props.onClick();h.flush();
    h.find(n=>n.type==='select'&&n.props['aria-label']==='Head Atlas structure').props.onChange({target:{value:head.conceptId}});h.flush();
    assert.match(h.text(),/6\/6 total anatomy links/);assert.equal(h.all().filter(n=>n.type==='button'&&String(n.props['aria-label']).startsWith('Remove 3D link:')).length,6);
    assert.equal(h.find(n=>n.type==='select'&&n.props['aria-label']==='Head Atlas structure').props.value,'');
  }finally{h.dispose();}
  const j=harness({...initial,slides:[{...slide,anatomyReference:head,bodyAnatomyReferences:pins.slice(0,5)}]});try{j.search('left Achilles');j.button('Link '+achilles.label).props.onClick();j.flush();assert.match(j.text(),/6\/6 total anatomy links/);}finally{j.dispose();}
});

test('last body removal omits the optional field and retains legacy head serialization',async()=>{
  const saved=globalThis.fetch;let payload;
  globalThis.fetch=async(_url,req)=>{payload=JSON.parse(req.body);return new Response(JSON.stringify({...initial,title:payload.title,slides:payload.slides,version:5}));};
  const h=harness({...initial,slides:[{...slide,anatomyReference:head,bodyAnatomyReferences:[achilles.reference]}]});try{
    h.find(n=>n.type==='button'&&n.props['aria-label']==='Remove 3D link: '+achilles.label).props.onClick();h.flush();h.button('Save').props.onClick();await tick();h.flush();
    assert.equal(Object.hasOwn(payload.slides[0],'bodyAnatomyReferences'),false);assert.deepEqual(payload.slides[0].anatomyReference,head);assert.equal(Object.hasOwn(payload.slides[0],'anatomyReferences'),false);
  }finally{h.dispose();globalThis.fetch=saved;}
});

test('published/read-only and stale retained body controls do not mutate a different selected slide',()=>{
  for(const flags of [{status:'published'},{canEdit:false}]){
    const h=harness({...initial,...flags,slides:[{...slide,bodyAnatomyReferences:[achilles.reference]}]});try{
      const remove=h.find(n=>n.type==='button'&&n.props['aria-label']==='Remove 3D link: '+achilles.label);assert.equal(remove.props.disabled,true);remove.props.onClick();h.flush();assert.doesNotMatch(h.text(),/Unsaved changes/);assert.match(h.text(),/1\/6 total anatomy links/);
    }finally{h.dispose();}
  }
  const h=harness({...initial,slides:[slide,{...slide,id:'two',title:'Other slide'}]});try{
    h.search('left Achilles');const retired=h.button('Link '+achilles.label).props.onClick;h.button('2Other slide').props.onClick();h.flush();retired();h.flush();assert.doesNotMatch(h.text(),/Unsaved changes/);
    const unmounted=h.button('Link '+achilles.label).props.onClick;h.dispose();unmounted();h.flush();assert.doesNotMatch(h.text(),/Unsaved changes/);
  }finally{h.dispose();}
});

test('outdated body source blocks review, stays readable and is removable without repinning',()=>{
  const stale={...achilles.reference,sourceSha256:'a'.repeat(64)};
  const h=harness({...initial,slides:[{...slide,bodyAnatomyReferences:[stale]}]});try{
    assert.match(h.text(),/No replacement has been substituted/);h.button('Review').props.onClick();h.flush();assert.equal(h.button('Request review').props.disabled,true);
    h.button('Content').props.onClick();h.flush();h.find(n=>n.type==='button'&&n.props['aria-label']==='Remove 3D link: '+stale.structureId).props.onClick();h.flush();assert.doesNotMatch(h.text(),/No replacement has been substituted/);assert.match(h.text(),/Unsaved changes/);
  }finally{h.dispose();}
});

test('player provides exact 3D and access-checked teaching actions only, not guessed image links',()=>{
  const h=harness(initial,{title:'Body teaching',slides:[{...slide,bodyAnatomyReferences:[achilles.reference]}],version:2});try{
    const links=h.all().filter(n=>n.type==='a');assert.equal(links.length,2);
    assert.equal(links.find(n=>text(n)==='3D Atlas').props.href,achilles.reference.atlasTarget);
    assert.equal(links.find(n=>text(n)==='Related teaching').props.href,api.bodyLinks.bodyRelatedLectureHref(achilles.reference));
    assert(links.every(n=>n.props.target==='_blank'&&n.props.rel==='noopener noreferrer'));
    assert(!links.some(n=>/ct-head|mri-head|ultrasound|x-ray/.test(n.props.href)));assert.match(h.text(),/paid lectures/);
  }finally{h.dispose();}
  for(const pins of [[{...achilles.reference,atlasRevision:'a'.repeat(40)}],'invalid']){
    const j=harness(initial,{title:'Body teaching',slides:[{...slide,bodyAnatomyReferences:pins}],version:2});try{assert.match(j.text(),/Inspect this anatomy/);assert.equal(j.all().filter(n=>n.type==='a').length,0);}finally{j.dispose();}
  }
});

test('body pending-save callback cannot change the submitted snapshot',async()=>{
  const saved=globalThis.fetch;let release,payload;
  globalThis.fetch=async(_url,req)=>{payload=JSON.parse(req.body);return new Promise(yes=>{release=yes;});};
  const h=harness();try{
    h.search('left Achilles');const add=h.button('Link '+achilles.label).props.onClick;
    h.find(n=>n.type==='input'&&n.props.value===initial.title).props.onChange({target:{value:'Changed lecture'}});h.flush();
    h.button('Save').props.onClick();add();h.flush();await tick();assert.deepEqual(payload.slides,[slide]);
    release(new Response(JSON.stringify({...initial,title:payload.title,version:5})));await tick();h.flush();assert.match(h.text(),/0\/6 total anatomy links/);
  }finally{h.dispose();globalThis.fetch=saved;}
});
