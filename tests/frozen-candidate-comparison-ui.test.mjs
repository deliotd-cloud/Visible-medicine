/* oxlint-disable react-hooks/rules-of-hooks -- controlled actual-component harness */
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import {build} from 'esbuild';

const require=createRequire(import.meta.url),React=require('react');
const ids=['vm:anatomy:body:left','vm:anatomy:body:right'];
const oldId='a'.repeat(64),newId='b'.repeat(64);
const bytesFor=(id)=>new TextEncoder().encode(`synthetic worksheet ${id}`);
const fileFor=(id)=>({path:'worksheet.json',sha256:createHash('sha256').update(bytesFor(id)).digest('hex'),bytes:bytesFor(id).length});
const candidate=(id,mode)=>({id,decisionMode:mode,supersedes:mode==='personal-review'?oldId:undefined,
  selections:ids.map((structureId,i)=>({structureId,structureName:`Structure ${i+1}`,region:'synthetic',materialHash:'c'.repeat(64),sourceHash:'d'.repeat(64),teachingHash:'e'.repeat(64),
    ...(mode==='personal-review'?{review:{checklistVersion:'v2',checklists:{},blockers:{},teachingTabs:[]}}:{})})),
  files:[fileFor(id),{path:'models/synthetic.glb',sha256:'f'.repeat(64),bytes:123}],atlasRevision:'1'.repeat(40),reviewRevision:'2'.repeat(64),rendererRevision:'3'.repeat(64)});
const previous=candidate(oldId,'inspection-only'),current=candidate(newId,'personal-review');
const material=(id,tag)=>({structureId:id,source:{structure:{name:`Structure ${ids.indexOf(id)+1}`,fmaId:'FMA 1',region:'synthetic',laterality:'left',coverageNote:'Coverage note',sources:[{file:`${tag}.glb`,part:'Complete part'}]},bundle:{id:'synthetic',sha256:'f'.repeat(64),bytes:123},credit:`${tag} credit`,licence:'Synthetic licence',sourceVersion:`${tag} version`},
  topics:[{tab:'anatomy',readiness:'draft',title:`${tag} topic`,body:`${tag} complete teaching body`,bullets:[`${tag} bullet`],correctAnswer:`${tag} answer`,explanation:`${tag} explanation`,note:`${tag} note`,citations:['https://example.org/study'],additionalChecks:[{key:'extra',body:`${tag} check body`,bullets:[`${tag} check bullet`],correctAnswer:'yes',explanation:'because',note:'check note',citations:['https://example.org/check']}]}],
  guidedTours:[{limitations:`${tag} tour limit`,tour:{id:'tour',title:`${tag} tour`,description:`${tag} tour description`,steps:[{id:'step',title:'Step',caption:`${tag} caption`,view:'anterior',durationMs:1200,references:['https://example.org/tour']}],frames:[{label:`${tag} frame`}]}}],
  reasoning:{prompt:`${tag} prompt`,choices:[{id:'yes',name:'Yes',laterality:'left'}],answerId:'yes',explanation:`${tag} reasoning`,scope:'synthetic only',references:[{title:`${tag} reasoning source`,url:'https://example.org/reason'}]},
  limits:[`${tag} limit`],checklist:{geometry:['Geometry'],teaching:['Teaching'],imaging:['No images']}});
let slots=[],cursor=0,view,calls=[],abortSeen=[];
const shim={...React,useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}]},
  useEffect(fn,deps){const i=cursor++,prior=slots[i];if(!prior||!deps||deps.some((value,j)=>!Object.is(value,prior.deps?.[j]))){prior?.dispose?.();slots[i]={deps,dispose:fn()};}}};
const built=await build({entryPoints:['components/FrozenCandidateComparison.tsx'],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',loader:{'.css':'empty'},plugins:[{name:'synthetic-contracts',setup(api){
  api.onResolve({filter:/^\.\.\/lib\/(frozen-candidate-comparison|frozen-candidate-worksheet)$/},args=>({path:args.path,namespace:'synthetic'}));
  api.onLoad({filter:/.*/,namespace:'synthetic'},args=>({contents:args.path.endsWith('comparison')?
    `export const validateFrozenComparisonPair=async(current,previous)=>{if(current.supersedes!==previous.id)throw Error('pair');return{current,previous}};`:
    `export const decodeFrozenWorksheet=async(candidate,bytes)=>globalThis.__decode(candidate,bytes);`,loader:'js'}));
}}]});
const scope={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,require:name=>name==='react'?shim:require(name),
  AbortController,crypto:webcrypto,TextEncoder,URL,fetch:(url,options)=>new Promise((resolve,reject)=>{const call={url,options,resolve,reject};calls.push(call);options.signal.addEventListener('abort',()=>abortSeen.push(call));}),
  __decode:(descriptor,bytes)=>{assert.equal(Buffer.from(bytes).toString(),Buffer.from(bytesFor(descriptor.id)).toString());return{selections:ids.map(id=>({material:material(id,descriptor.id===oldId?'Earlier':'Current'),modelQuery:`kind=body&study=1&structure=${encodeURIComponent(id)}`}))};}
});
const {FrozenCandidateComparison}=scope.exports;
const expand=node=>React.isValidElement(node)&&typeof node.type==='function'?expand(node.type(node.props)):Array.isArray(node)?node.map(expand):React.isValidElement(node)?React.cloneElement(node,node.props,React.Children.map(node.props.children,expand)):node;
const walk=(node,predicate,out=[])=>{if(React.isValidElement(node)){if(predicate(node))out.push(node);React.Children.forEach(node.props.children,child=>walk(child,predicate,out));}return out;};
const words=node=>typeof node==='string'||typeof node==='number'?String(node):!node?'':Array.isArray(node)?node.map(words).join(''):words(node.props?.children);
const render=(now=current,old=previous)=>{cursor=0;view=expand(FrozenCandidateComparison({current:now,previous:old}));return view;};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const button=label=>walk(view,n=>n.type==='button'&&words(n).startsWith(label))[0];
const select=()=>walk(view,n=>n.type==='select')[0];
const reply=(call,{status=200,body,contentLength,stream=true}={})=>{const bytes=body??bytesFor(call.url.includes(oldId)?oldId:newId);call.resolve({ok:status>=200&&status<300,status,headers:new Headers(contentLength===undefined?{}:{'content-length':String(contentLength)}),body:stream?new ReadableStream({start(controller){controller.enqueue(bytes);controller.close();}}):null});};
const reset=()=>{slots=[];calls=[];abortSeen=[];render();};
const open=()=>{button('Compare changes').props.onClick();render();};
const finish=async()=>{assert.equal(calls.length,2);calls.forEach(call=>reply(call));await tick();await tick();render();};

test('collapsed by default; private exact requests, full saved text, correct model links, no decision controls',async()=>{
  reset();assert.equal(calls.length,0);open();await tick();assert.equal(calls.length,2);
  for(const call of calls){assert.equal(call.options.credentials,'same-origin');assert.equal(call.options.cache,'no-store');assert.equal(call.options.method,undefined);assert.match(call.url,/\/assets\/worksheet\.json$/);}
  await finish();assert(words(view).includes('Earlier complete teaching body'),words(view));assert(words(view).includes('Current complete teaching body'));
  assert(words(view).includes('Earlier tour description'));assert(words(view).includes('Earlier reasoning source'));
  assert(walk(view,n=>n.type==='summary').some(n=>words(n).includes('anatomy · draft · Earlier topic · Changed')));
  assert(words(view).includes('Interactive reasoning · Changed'));
  const details=walk(view,n=>n.type==='details');assert(details.length>=8);
  const links=walk(view,n=>n.type==='a').map(a=>a.props.href);
  assert(links.some(url=>url.includes(oldId)&&url.includes('/viewer/index.html?kind=body')));
  assert(links.some(url=>url.includes(newId)&&url.includes('/viewer/index.html?kind=body')));
  assert(words(view).includes('independent of the editable review'));
  assert(!words(view).includes('Save private review'));assert(!words(view).includes('prior approval'));
});

test('each denied, missing, corrupt, oversized or late response suppresses both columns',async()=>{
  for(const failure of ['401','403','404','409','503','missing','corrupt','oversize','stream-overflow','late']){
    reset();open();await tick();const [a,b]=calls;
    if(failure==='late'){button('Close comparison').props.onClick();render();a.resolve({ok:false,status:401});b.resolve({ok:false,status:401});await tick();render();assert(!words(view).includes('Earlier complete teaching body'));assert(abortSeen.length>=2);continue;}
    if(['401','403','404','409','503'].includes(failure)){reply(a,{status:Number(failure)});reply(b);}else if(failure==='missing'){reply(a,{stream:false});reply(b);}else if(failure==='corrupt'){reply(a,{body:new TextEncoder().encode('tampered')});reply(b);}else if(failure==='stream-overflow'){reply(a,{body:new Uint8Array(limit+1)});reply(b);}else{reply(a,{contentLength:limit+1});reply(b);}
    await tick();await tick();render();assert(words(view).includes('Saved comparison unavailable'),failure);assert(!words(view).includes('Current complete teaching body'),failure);
  }
});

test('pair prop changes abort loading and remove a previously successful pair immediately',async()=>{
  reset();open();await tick();const pending=[...calls];
  const nextCurrent=structuredClone(current),nextPrevious=structuredClone(previous);
  render(nextCurrent,nextPrevious);assert(!words(view).includes('Earlier complete teaching body'));
  render(nextCurrent,nextPrevious);assert.equal(abortSeen.filter(call=>pending.includes(call)).length,2);
  pending.forEach(call=>reply(call));await tick();render(nextCurrent,nextPrevious);assert(!words(view).includes('Earlier complete teaching body'));
  reset();open();await tick();await finish();assert(words(view).includes('Earlier complete teaching body'));
  render(nextCurrent,nextPrevious);assert(!words(view).includes('Earlier complete teaching body'));
});

const limit=2*1024*1024;
test('switching structure discards prior pair before the next pair resolves',async()=>{
  reset();open();await tick();await finish();assert(words(view).includes('Earlier complete teaching body'));
  select().props.onChange({target:{value:ids[1]}});render();assert(!words(view).includes('Earlier complete teaching body'));
  await tick();assert.equal(calls.length,4);calls.slice(2).forEach(call=>reply(call));await tick();await tick();render();assert.equal(select().props.value,ids[1]);
  const models=walk(view,n=>n.type==='a'&&words(n).includes('saved model')).map(a=>a.props.href);assert(models.every(url=>url.includes(encodeURIComponent(ids[1]))));
});

const canonical=value=>value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?`[${value.map(canonical).join(',')}]`:`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
const digest=value=>createHash('sha256').update(canonical(value)).digest('hex');
const shaBytes=bytes=>createHash('sha256').update(bytes).digest('hex');
const realId='vm:anatomy:body:foot:right:vessel:ui-synthetic',hash='a'.repeat(64);
const realReview={checklistVersion:'body-review-1',checklists:{geometry:[{id:'g',label:'Geometry'}],teaching:[{id:'t',label:'Teaching'}],imaging:[{id:'i',label:'Imaging'}]},blockers:{geometry:[],teaching:[],imaging:['No registered image.']},teachingTabs:['anatomy']};
const structure={id:realId,fmaId:'FMA1',name:'Synthetic artery',sourceName:'Synthetic artery',system:'vessels',category:'artery',laterality:'right',region:'foot',regions:['foot'],bundle:'foot-bundle',nodeName:'Synthetic',bounds:{min:[0,0,0],max:[1,1,1]},center:[.5,.5,.5],anchor:[.5,.5,.5],sourceTree:'isa',sources:[{file:'FJ1',sha256:hash}],coverageNote:'Partial surface'};
const bundle={id:'foot-bundle',url:'/atlas-runtime/foot/model.glb',bytes:100,sha256:hash,structures:1};
async function realFixture(copy,mode,supersedes=null){
  const scope={schema:'vm-body-review-worksheet-3',kind:'body-display-catalog',structureId:realId};
  const source={structure,bundle,coordinateSystem:{up:'z'},sourceVersion:'1',licence:'CC BY',credit:'Synthetic source'};
  const tabs=['anatomy','function','ct','mri','xray','ultrasound','pathology','clinical','quiz'];
  const topics=tabs.map(tab=>({tab,readiness:tab==='anatomy'?'draft':'pending',title:`${tab} topic`,body:tab==='anatomy'?copy:'Pending.',citations:['https://example.org/reference']}));
  const guidedTours=[{tour:{id:'synthetic-tour',title:'Synthetic tour',description:copy,region:'foot',revision:'tour-v1',status:'draft',contextIds:[],steps:[{id:'one',title:'First stop',caption:copy,selectedId:realId,view:'anterior',durationMs:24000,fadeOthers:true,references:['https://example.org/reference']}]},structures:[structure],bundles:[bundle],coordinateSystem:{up:'z'},sourceVersion:'1',frame:{min:[0,0,0],max:[1,1,1]},transitionMs:1800,transition:'quintic-orbit',separation:0,continuousPlayback:{version:1},limitations:'Draft only'}];
  const checklist={geometry:['Inspect source.'],teaching:['Inspect teaching.'],imaging:['No images.']};
  const fingerprints={source:digest({scope:{...scope,schema:'vm-body-review-worksheet-1'},source}),teaching:digest({scope:{...scope,schema:'vm-body-review-worksheet-2'},topics,reasoning:null,guidedTours}),checklist:digest({scope:{...scope,schema:'vm-body-review-worksheet-2'},checks:checklist})};
  const material={...scope,status:'worksheet-not-submitted',approval:false,source,topics,reasoning:null,guidedTours,fingerprints,materialHash:digest({scope,fingerprints}),atlasLink:`/regions/foot?study=1&structure=${encodeURIComponent(realId)}&side=both&source=${hash}`,checklist,reviewerNotes:{reviewer:'',qualification:'',date:'',evidence:[],corrections:[]},limits:['Inspection only.']};
  const context={catalogScope:'body-display-catalog',structureId:realId,structureName:structure.name,materialHash:material.materialHash,sourceHash:fingerprints.source,teachingHash:fingerprints.teaching,rendererHash:hash,...realReview,revisions:{geometry:hash,teaching:hash,imaging:null}};
  const modelQuery=new URLSearchParams({kind:'body',region:'foot',study:'1',structure:realId,side:'both',source:hash}).toString();
  const packet={schema:`visible-medicine.frozen-body-inspection/${mode==='personal-review'?2:1}`,decisionMode:mode,selections:[{material,context,modelQuery}]};
  const sign=(wire)=>{const bytes=new TextEncoder().encode(JSON.stringify(wire));const descriptorMaterial={schema:`visible-medicine.clinical-review-candidate/${mode==='personal-review'?2:1}`,kind:mode==='personal-review'?'root-body-review':'root-body-inspection',label:'Synthetic',createdAt:'2026-10-18T00:00:00.000Z',atlasRevision:'b'.repeat(40),reviewRevision:hash,rendererRevision:hash,decisionMode:mode,...(mode==='personal-review'?{supersedes}:{}),selections:[{structureId:realId,structureName:structure.name,region:'foot',materialHash:material.materialHash,sourceHash:fingerprints.source,teachingHash:fingerprints.teaching,...(mode==='personal-review'?{review:realReview}:{})}],files:[{path:'index.html',sha256:hash,bytes:1,contentType:'text/html',storage:'candidate'},{path:'viewer/index.html',sha256:hash,bytes:1,contentType:'text/html',storage:'candidate'},{path:'worksheet.json',sha256:shaBytes(bytes),bytes:bytes.length,contentType:'application/json',storage:'candidate'}]};return{candidate:{...descriptorMaterial,id:digest(descriptorMaterial)},bytes};};
  return{...sign(packet),packet,sign};
}

test('actual component accepts real historical decoder bytes and rejects correctly signed mixed packet identity',async()=>{
  const realBuild=await build({entryPoints:['components/FrozenCandidateComparison.tsx'],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',loader:{'.css':'empty'}});
  const realScope={exports:{}},realCalls=[];
  const realGlobals={module:realScope,exports:realScope.exports,require:name=>name==='react'?shim:require(name),
    AbortController,crypto:webcrypto,TextEncoder,TextDecoder,URL,URLSearchParams,
    fetch:(url,options)=>new Promise((resolve,reject)=>realCalls.push({url,options,resolve,reject}))};
  runInNewContext('globalThis.__realmify = value => JSON.parse(JSON.stringify(value)); globalThis.structuredClone = globalThis.__realmify;\n'+realBuild.outputFiles[0].text,realGlobals);
  const old=await realFixture('Historical lesson and tour.','inspection-only');
  const now=await realFixture('Corrected lesson and tour.','personal-review',old.candidate.id);
  const realCache=new WeakMap(),toReal=value=>{if(!realCache.has(value))realCache.set(value,realGlobals.__realmify(value));return realCache.get(value);};
  const realRender=(later=now.candidate,earlier=old.candidate)=>{cursor=0;view=expand(realScope.exports.FrozenCandidateComparison({current:toReal(later),previous:toReal(earlier)}));};
  slots=[];realRender();button('Compare changes').props.onClick();realRender();for(let i=0;i<20&&realCalls.length<2;i++)await tick();
  assert.equal(realCalls.length,2,words(view));
  for(const call of realCalls)reply(call,{body:call.url.includes(old.candidate.id)?old.bytes:now.bytes});
  for(let i=0;i<30;i++){await tick();realRender();if(!words(view).includes('Verifying both saved worksheets'))break;}
  assert(words(view).includes('Historical lesson and tour.'),words(view));assert(words(view).includes('Corrected lesson and tour.'));
  assert(walk(view,n=>n.type==='summary').some(n=>words(n).includes('anatomy topic · Changed')));
  assert(walk(view,n=>n.type==='a').some(n=>n.props.href.includes(now.candidate.id)&&n.props.href.includes('side=both')));
  // Re-sign the worksheet bytes and descriptor after inserting a contradictory context identity.
  const mixedPacket=structuredClone(now.packet);mixedPacket.selections[0].context.structureName='Foreign artery';
  const mixed=now.sign(mixedPacket);const mixedCurrent={...mixed.candidate,supersedes:old.candidate.id};
  mixedCurrent.id=digest(Object.fromEntries(Object.entries(mixedCurrent).filter(([key])=>key!=='id')));
  realRender(mixedCurrent,old.candidate);realRender(mixedCurrent,old.candidate);
  button('Compare changes').props.onClick();realRender(mixedCurrent,old.candidate);await tick();
  const laterCalls=realCalls.slice(2);assert.equal(laterCalls.length,2);
  for(const call of laterCalls)reply(call,{body:call.url.includes(old.candidate.id)?old.bytes:mixed.bytes});
  for(let i=0;i<30;i++){await tick();realRender(mixedCurrent,old.candidate);if(!words(view).includes('Verifying both saved worksheets'))break;}
  assert(words(view).includes('Saved comparison unavailable'));
  assert(!words(view).includes('Historical lesson and tour.'));
});
