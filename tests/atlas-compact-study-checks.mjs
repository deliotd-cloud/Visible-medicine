import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import {build} from 'esbuild';

const revision='05a2e8a26325818675c4b98ab1d9b9c246028a5c';
const sourceDir='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const inputs=['app/study-surface.css','lib/didanix-atlas-adapter.ts','content/body-renderer-revision.json'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const source=path=>execFileSync('git',['show',`${revision}:${path}`],{cwd:sourceDir,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const sourceWorking=path=>{
 const bytes=readFileSync(`${sourceDir}/${path}`);
 assert.deepEqual(Buffer.from(bytes.toString().replaceAll('\r\n','\n')),source(path),`saved working source ${path}`);
 return bytes;
};
const postcss=createRequire(import.meta.url)('postcss');
const normalizeSelector=value=>value.replaceAll(/[\s'\"]+/g,'').replaceAll('calc(','').replaceAll(')','');

test('current Review and delivered learner graphs bind the three exact saved source changes',()=>{
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,revision);
 const entries=new Map(review.files.map(row=>[row.path,row]));
 for(const path of inputs){
  const row=entries.get(path);assert(row,`missing Review ${path}`);
  const expected=sha(source(path));
  assert.equal(row.sourceSha256,expected,`source pin ${path}`);
  assert.equal(row.importedSha256,sha(readFileSync(`atlas-review/${path}`)),`imported pin ${path}`);
  if(path==='content/body-renderer-revision.json'){
   // The importer recomputes the aggregate hash for its local renderer graph.
   const saved=JSON.parse(source(path)),imported=json(`atlas-review/${path}`);
   assert.deepEqual(imported.dependencies,saved.dependencies);
   assert.deepEqual(imported.entrypoints,saved.entrypoints);
   assert.equal(imported.schemaVersion,saved.schemaVersion);
   assert.equal(imported.scope,saved.scope);
  }else assert.equal(row.importedSha256,expected,`exact imported source ${path}`);
 }
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base=`public/atlas-runtime/${name}/`, manifest=json(base+'manifest.json');
  assert.equal(manifest.sourceCommit,revision,name);
  assert.equal(manifest.patientDataIncluded,false,name);
  assert.equal(manifest.clinicalApproved,false,name);
  const sourceInputs=json(base+'source-inputs.json');
  // Runtime input inventory records checkout bytes (CRLF on Windows); Review
  // source pins record Git's LF bytes. Both must identify the same saved text.
  for(const row of sourceInputs.filter(item=>inputs.includes(item.path)))assert.equal(row.sha256,sha(sourceWorking(row.path)),`${name}:${row.path}`);
  if(name==='head-neck')for(const path of inputs.slice(0,2))assert(sourceInputs.some(row=>row.path===path),`head-neck missing ${path}`);
 }
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.personalRecordsIncluded,false);
});

test('hashed emitted CSS keeps desktop canvas and independent rail; narrow flow stays one column',()=>{
 const base='public/atlas-runtime/head-neck/';const manifest=json(base+'manifest.json');
 const cssFiles=manifest.files.filter(row=>row.path.endsWith('.css'));
 const matches=[];
 for(const row of cssFiles){
  const bytes=readFileSync(base+row.path);assert.equal(sha(bytes),row.sha256,row.path);
  const ast=postcss.parse(bytes.toString());
  if(bytes.includes(Buffer.from('data-panel-short')))matches.push({path:row.path,ast});
 }
 assert.equal(matches.length,1,'one emitted study layout stylesheet');
 const ast=matches[0].ast;
 const short='.body-app[data-presentation=panel][data-panel-short=true]';
 const rule=(selector,media)=>{
  const wanted=normalizeSelector(selector),found=[];
  ast.walkRules(node=>{
   if(normalizeSelector(node.selector)!==wanted)return;
   const at=node.parent.type==='atrule'?node.parent.params.replaceAll(' ',''):null;
   if(at!==media)return;
   found.push(Object.fromEntries(node.nodes.filter(d=>d.type==='decl').map(d=>[d.prop,d.value])));
  });
  assert(found.length,`${selector} at ${media}`);return Object.assign({},...found);
 };
 const desktop='(width>=701px)',mobile='(width<=700px)';
 assert.equal(rule(`${short}:has(>.atlas-inline-study:not([hidden]))`,desktop)['overflow-y'],'hidden');
 const surface=rule(`${short}>[data-study-surface=inline].eye-layers-dialog`,desktop);
 assert.equal(surface.flex,'1 1 0');assert.match(surface['grid-template-rows'],/auto minmax\(max\(18rem,200px \+ 10rem\),1fr\)/);
 assert.equal(surface.overflow,'hidden auto','tiny short hosts retain vertical reachability');
 const workbench=rule(`${short} .atlas-inline-study .eye-layer-workbench`,desktop);
 assert.equal(workbench['grid-template-columns'],'minmax(0,1fr) 260px');
 assert.equal(workbench['grid-template-rows'],'minmax(0,1fr)');
 assert.equal(workbench['min-height'],'0');
 const rail=rule(`${short} .atlas-inline-study .eye-layer-controls`,desktop);
 assert.equal(rail['overflow-y'],'auto');assert.equal(rail['min-height'],'0');
 const narrow=rule('.atlas-inline-study .eye-layer-workbench',mobile);
 assert.equal(narrow['grid-template-columns'],'minmax(0,1fr)');
 assert.equal(narrow['grid-template-rows'],'auto auto');
 const narrowSurface=rule('.body-app>[data-study-surface=inline].eye-layers-dialog',mobile);
 assert.equal(narrowSurface.flex,'1 0 auto');assert.equal(narrowSurface.overflow,'visible');
 assert.equal(rule('.atlas-inline-study .eye-layer-controls',mobile).overflow,'visible');
});

async function importedAdapter(){
 const entry="export * from './atlas-review/lib/didanix-atlas-adapter'; export * from './atlas-review/lib/imaging-sync'; export * from './atlas-review/lib/learning-resources';";
 const result=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const hash='a'.repeat(64),id='vm:anatomy:test:right:bone';
const anatomy={scope:'shoulder-pilot',structureId:id,sources:[{file:'SYNTHETIC',sha256:hash}]};
const selection={id,name:'Synthetic structure',sources:anatomy.sources,reference:{frame:'synthetic',kind:'surface-bounds-centre',point:[0,0,0]}};
const anchors={ct:{type:'volume',id:'anchor',seriesId:'series',frameId:'frame',annotationId:'annotation',geometry:'point'},mri:{type:'volume',id:'anchor',seriesId:'series',frameId:'frame',annotationId:'annotation',geometry:'point'},xray:{type:'projection',id:'anchor',imageId:'image',annotationId:'annotation',projectionId:'projection'},ultrasound:{type:'ultrasound',id:'anchor',clipId:'clip',annotationId:'annotation',viewId:'view',frameIndex:3,timeMs:null}};

function fixture(api,kind){
 let incoming,context,access=true,study={resourceId:'vm:resource:synthetic',revision:1,materialSha256:hash};
 const guards=[],revealed=[],statuses=[];
 const resource={id:study.resourceId,revision:1,kind,title:'Synthetic fixture',ageGroup:'adult',laterality:'right',regionIds:['shoulder-arm'],material:{sha256:hash,origin:'synthetic'},anchors:[anchors[kind]]};
 const link={id:'vm:link:synthetic',revision:1,anatomy,resourceId:resource.id,resourceRevision:1,materialSha256:hash,anchorId:'anchor',relation:'exact'};
 const registry=api.createLearningRegistry({schemaVersion:1,resources:[resource],links:[link]},[anatomy],{canNavigate:()=>true,canAccessAnatomy:()=>true,canAccess:()=>access,resourceCleared:()=>true,correspondenceCleared:()=>true});
 const bridge=api.createImagingBridge();let selected=0;
 const detach=bridge.attachAtlas(request=>{selected++;return {messageId:request.messageId,status:'selected'};});
 let release;const viewer={getStudy:()=>study,canNavigate:()=>true,async reveal(match,guard){guards.push(guard);await new Promise(resolve=>{release=resolve;});if(guard.isCurrent())revealed.push(match);},subscribeSelection(fn){incoming=fn;return()=>{};},subscribeContext(fn){context=fn;return()=>{};}};
 const adapter=api.connectDidanixEducation({bridge,registry,viewer,scope:'shoulder-pilot',onStatus:value=>statuses.push(value)});
 const locator={version:1,linkId:link.id,linkRevision:1,resourceId:resource.id,resourceRevision:1,anchorId:'anchor'};
 return {bridge,adapter,locator,guards,revealed,statuses,detach,send:(messageId='event-1',value=locator)=>incoming({messageId,locator:value}),context:()=>context(),access:value=>{access=value;},study:value=>{study=value;},release:()=>release(),selected:()=>selected};
}

test('imported Didanix adapter preserves duplicate in-flight reveal and still cancels new, stale, revoked and detached work',async()=>{
 const api=await importedAdapter();
 for(const kind of Object.keys(anchors)){
  const f=fixture(api,kind);f.adapter.setEnabled(true);
  assert.equal(f.send('stable-event').status,'selected');
  f.bridge.publish(selection);assert.equal(f.guards.length,1);
  const priorStatuses=[...f.statuses],priorChoices=f.adapter.choices();
  assert.equal(f.send('stable-event').status,'duplicate');
  assert.equal(f.guards[0].signal.aborted,false,kind);
  assert.equal(f.guards[0].isCurrent(),true,kind);
  assert.deepEqual(f.statuses,priorStatuses,kind);assert.deepEqual(f.adapter.choices(),priorChoices,kind);
  f.release();await tick();assert.equal(f.revealed.length,1,kind);assert.equal(f.statuses.at(-1),'revealed',kind);
  f.adapter.dispose();f.detach();
  for(const action of ['new','stale','revoked','study','detach']){
   const g=fixture(api,kind);g.adapter.setEnabled(true);assert.equal(g.send('stable-event').status,'selected');
   g.bridge.publish(selection);assert.equal(g.guards.length,1,`${kind}:${action}`);
   if(action==='new')assert.equal(g.send('fresh-event').status,'selected');
   if(action==='stale')assert.equal(g.send('stable-event',{...g.locator,resourceRevision:2}).status,'paused');
   if(action==='revoked'){g.access(false);assert.equal(g.send('stable-event').status,'paused');}
   if(action==='study'){g.study({resourceId:'other',revision:1,materialSha256:hash});g.context();}
   if(action==='detach')g.detach();
   assert.equal(g.guards[0].signal.aborted,true,`${kind}:${action}`);
   assert.equal(g.guards[0].isCurrent(),false,`${kind}:${action}`);
   g.release();await tick();assert.equal(g.revealed.length,0,`${kind}:${action}`);
   g.adapter.dispose();if(action!=='detach')g.detach();
  }
 }
});
