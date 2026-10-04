import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';
import test from 'node:test';

const revision='8c4bcccaf9d0bb5ed3da8d974df7e4d6035430c5';
const atlasSource='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const inputs=['lib/paused-tour-imaging.ts','app/paused-tour-imaging-link.tsx','app/body-education-link.ts','app/regional-guided-learning.tsx','app/whole-body-guided-learning.tsx'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceAt=path=>execFileSync('git',['show',`${revision}:${path}`],{cwd:atlasSource,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const require=createRequire(import.meta.url);

test('four delivered runtimes and protected Review bind the exact saved Atlas source',()=>{
  const review=JSON.parse(readFileSync('atlas-review/manifest.json'));
  assert.equal(review.revision,revision);
  const reviewFiles=new Map(review.files.map(file=>[file.path,file]));
  for(const path of inputs){
    const imported=reviewFiles.get(path);
    assert(imported,`Review missing ${path}`);
    assert.equal(imported.sourceSha256,sha(sourceAt(path)),`saved source ${path}`);
    assert.equal(imported.importedSha256,sha(readFileSync(`atlas-review/${path}`)),`imported ${path}`);
  }
  for(const name of ['head-neck','shoulder','female-pelvis','lower-limb','review']){
    const base=name==='review'?'public/atlas-review-viewer/':`public/atlas-runtime/${name}/`;
    const manifest=JSON.parse(readFileSync(base+'manifest.json'));
    assert.equal(manifest.sourceCommit,revision,`${name} source`);
    if(name==='review'){
      assert.equal(manifest.mode,'production');
      assert.equal(manifest.personalRecordsIncluded,false);
      assert.equal(manifest.websiteIntegrationSha256,review.websiteIntegrationSha256);
    }else{
      assert.equal(manifest.patientDataIncluded,false);
      assert.equal(manifest.clinicalApproved,false);
      assert.equal(manifest.standaloneReviewConnection,false);
      const sourceInputs=JSON.parse(readFileSync(base+'source-inputs.json'));
      for(const input of sourceInputs.filter(row=>inputs.includes(row.path))){
        assert.equal(input.sha256,sha(sourceAt(input.path)),`${name}:${input.path}`);
      }
      if(name==='head-neck')for(const path of inputs)
        assert(sourceInputs.some(row=>row.path===path),`head-neck missing ${path}`);
    }
    for(const file of manifest.files){
      const bytes=readFileSync(base+file.path);
      if(file.bytes!==undefined)assert.equal(bytes.length,file.bytes,`${name}:${file.path} bytes`);
      assert.equal(sha(bytes),file.sha256,`${name}:${file.path} hash`);
    }
  }
  assert.equal(reviewFiles.has('content/learning-resources.v1.json'),false,'no case data imported');
});

async function productionApi(){
  const entry="export {useBodyEducationLink} from './atlas-review/app/body-education-link'; export {createPausedTourImaging} from './atlas-review/lib/paused-tour-imaging'; export {imagingBridge,createAtlasReceiver} from './atlas-review/lib/imaging-sync';";
  const built=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false,external:['react']});
  const listeners=new Map();
  const page={addEventListener(name,fn){const set=listeners.get(name)??new Set();set.add(fn);listeners.set(name,set);},removeEventListener(name,fn){listeners.get(name)?.delete(fn);},fire(name){for(const fn of [...(listeners.get(name)??[])])fn();}};
  let slots=[],cursor=0,effects=[],pending=[];
  const react={useRef(value){const i=cursor++;return slots[i]??={current:value};},useLayoutEffect(fn,deps){pending.push({kind:'layout',fn,deps});},useEffect(fn,deps){pending.push({kind:'effect',fn,deps});}};
  const module={exports:{}};
  runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,window:page,structuredClone,crypto,AbortController,TextEncoder,URLSearchParams,require:id=>id==='react'?react:require(id)});
  const render=props=>{
    cursor=0;pending=[];module.exports.useBodyEducationLink(props);
    for(const kind of ['layout','effect'])pending.forEach((item,i)=>{
      if(item.kind!==kind)return;
      const old=effects[i];
      if(old&&old.deps.length===item.deps.length&&old.deps.every((v,j)=>Object.is(v,item.deps[j])))return;
      old?.cleanup?.();effects[i]={deps:item.deps,cleanup:item.fn()};
    });
  };
  const cleanup=()=>{for(const effect of effects)effect?.cleanup?.();effects=[];slots=[];};
  return {api:module.exports,page,render,cleanup};
}

const digest='a'.repeat(64),stale='b'.repeat(64);
const id='vm:anatomy:body:shoulder-arm:right:muscle:synthetic';
const sources=[{file:'SYNTHETIC',sha256:digest}];
const entry={id,name:'Synthetic muscle',sources,reference:{frame:'synthetic',kind:'surface-bounds-centre',point:[0,0,0]}};
const stop={tourId:'synthetic-tour',revision:'rev-1',stepId:'step-1',structureId:id,sources};
const anatomy={scope:'body',structureId:id,sources};
const anchors={ct:{type:'volume',id:'anchor',seriesId:'series',frameId:'frame',annotationId:'annotation',geometry:'point'},mri:{type:'volume',id:'anchor',seriesId:'series',frameId:'frame',annotationId:'annotation',geometry:'point'},xray:{type:'projection',id:'anchor',imageId:'image',annotationId:'annotation',projectionId:'projection'},ultrasound:{type:'ultrasound',id:'anchor',clipId:'clip',annotationId:'annotation',viewId:'view',frameIndex:1,timeMs:null}};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

test('root hook requires a ready paused exact stop and fresh consent; every imaging kind cancels stale work',async()=>{
  const {api,page,render,cleanup}=await productionApi();
  for(const kind of Object.keys(anchors)){
    const gate=api.createPausedTourImaging({entries:[entry],allowedIds:[id]});
    const props={entries:[entry],allowedIds:[id],disabled:true,contextKey:'shoulder-arm/right',enabled:true,pausedTour:gate,allowPausedTour:true};
    let selected=0,incoming,resolveFlight,viewerAllowed=true;
    const guards=[],media=[];
    const detach=api.imagingBridge.attachAtlas(api.createAtlasReceiver(()=>({enabled:false,disabled:true,entries:[entry],allowedIds:[id],onSelect:()=>selected++}),()=>{}));
    render(props);
    const facade=page.visibleMedicineBodyEducation;assert(facade);
    const resource={id:'vm:resource:synthetic',revision:1,kind,title:'Synthetic fixture',ageGroup:'adult',laterality:'right',regionIds:['shoulder-arm'],material:{sha256:digest,origin:'synthetic'},anchors:[anchors[kind]]};
    const link={id:'vm:link:synthetic',revision:1,anatomy,resourceId:resource.id,resourceRevision:1,materialSha256:digest,anchorId:'anchor',relation:'exact'};
    const document={schemaVersion:1,resources:[resource],links:[link]};
    const permissions={navigate:true,anatomy:true,resource:true,resourceCleared:true,correspondenceCleared:true};
    const policy={canNavigate:()=>permissions.navigate,canAccessAnatomy:()=>permissions.anatomy,canAccess:()=>permissions.resource,resourceCleared:()=>permissions.resourceCleared,correspondenceCleared:()=>permissions.correspondenceCleared};
    const viewer={getStudy:()=>({resourceId:resource.id,revision:1,materialSha256:digest}),canNavigate:()=>viewerAllowed,async reveal(match,guard){guards.push(guard);await new Promise(resolve=>{resolveFlight=resolve;});if(guard.isCurrent())media.push(match);},subscribeSelection(fn){incoming=fn;return()=>{incoming=null;};},subscribeContext(){return()=>{};}};
    const connection=facade.connect({document,policy,viewer});connection.setEnabled(true);
    const locator={version:1,linkId:link.id,linkRevision:1,resourceId:resource.id,resourceRevision:1,anchorId:'anchor'};
    assert.equal(gate.send(),false,'no active stop');
    gate.setStop(stop,false);assert.equal(gate.snapshot().eligible,false);
    gate.setStop({...stop,sources:[{file:'SYNTHETIC',sha256:stale}]},true);assert.equal(gate.snapshot().eligible,false);
    gate.setStop(stop,true);assert.equal(gate.snapshot().eligible,true);assert.equal(gate.canNavigate(),false);
    assert.equal(incoming({messageId:'manual-before-consent',locator}).status,'paused');assert.equal(selected,0);
    gate.setEnabled(true);assert.equal(gate.canNavigate(),true);
    assert.equal(gate.canAccessAnatomy(anatomy),true);
    for(const bad of [{...anatomy,scope:'nested'},{...anatomy,structureId:id+'-other'},{...anatomy,sources:[{file:'SYNTHETIC',sha256:stale}]}])assert.equal(gate.canAccessAnatomy(bad),false);
    for(const key of Object.keys(permissions)){
      permissions[key]=false;assert.equal(gate.send(),true);assert.equal(guards.length,0,`${kind}:${key}`);permissions[key]=true;
    }
    viewerAllowed=false;assert.equal(gate.send(),true);assert.equal(guards.length,0);viewerAllowed=true;
    assert.equal(gate.send(),true);assert.equal(guards.length,1);
    assert.equal(incoming({messageId:'manual-locked',locator}).status,'paused');assert.equal(selected,0);
    gate.setStop({...stop,stepId:'step-2'},true);assert.equal(guards[0].signal.aborted,true);assert.equal(guards[0].isCurrent(),false);
    assert.equal(gate.canNavigate(),false);resolveFlight();await tick();assert.equal(media.length,0);
    for(const changed of [{...stop,revision:'rev-2'},{...stop,tourId:'other-tour'},{...stop,sources:[{file:'SYNTHETIC',sha256:stale}]},stop]){
      gate.setStop(changed,true);assert.equal(gate.canNavigate(),false,'new stop needs consent');
    }
    gate.setEnabled(true);
    if(kind==='ct'){
      assert.equal(gate.send(),true);assert.equal(guards.length,2);
      render({...props,contextKey:'shoulder-arm/left'});
      assert.equal(guards[1].signal.aborted,true,'region change cancels pending viewer work');
      resolveFlight();await tick();assert.equal(media.length,0);
      assert.equal(gate.send(),true);assert.equal(guards.length,3);
      render({...props,contextKey:'assessment',allowPausedTour:false});
      assert.equal(guards[2].signal.aborted,true,'leaving root tour cancels pending viewer work');
      assert.equal(gate.send(),false);assert.equal(guards.length,3,'leaving the tour pauses the outgoing gate');
      render(props);
      connection.setEnabled(true);
      gate.setStop(stop,true);gate.setEnabled(true);
      assert.equal(gate.send(),true);assert.equal(guards.length,4);
      page.fire('pagehide');assert.equal(guards[3].signal.aborted,true);assert.equal(page.visibleMedicineBodyEducation,undefined);
      assert.equal(gate.send(),false);
      page.fire('pageshow');assert(page.visibleMedicineBodyEducation);
    }
    gate.suspend();assert.equal(gate.send(),false);
    connection.dispose();gate.dispose();detach();cleanup();
  }
});
