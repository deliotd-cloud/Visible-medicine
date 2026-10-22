import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import test from 'node:test';

// Copy this test into tests/ of the website checkout, or set VM_WEBSITE_ROOT.
const root=resolve(process.env.VM_WEBSITE_ROOT ?? fileURLToPath(new URL('..',import.meta.url)));
const sourceRepo=process.env.VM_ATLAS_SOURCE_REPO ?? 'F:/VisibleMedicine/staging/20261022-neck-landmark-xray-candidate/atlas';
const source='389bd0ca846a42c7f21055f55904bcf5df81a09f';
const tree='25acdee40ee57e0253cdcca924aa64b4b38586c8';
const before='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const expected=new Map([
  ['vm:anatomy:body:head-neck:midline:bone:hyoid-bone','FMA52749'],
  ['vm:anatomy:body:head-neck:unpaired:organ:epiglottis','FMA55130'],
  ['vm:anatomy:body:head-neck:midline:cartilage:cricoid-cartilage','FMA9615'],
]);
const read=path=>readFileSync(resolve(root,path));
const json=path=>JSON.parse(read(path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',['-C',sourceRepo,...args],{
  windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},maxBuffer:32e6,
});
const committed=path=>git('show',`${source}:${path}`);
const same=(a,b,label)=>assert.deepEqual(structuredClone(a),structuredClone(b),label);

function emittedTeaching(base,files){
  const byPath=new Map(files.map(row=>[row.path,row]));
  const seen=new Set();
  function visit(path){
    if(seen.has(path))return;
    const row=byPath.get(path);assert(row,`runtime output ${path} is manifested`);
    const bytes=read(base+path);assert.equal(sha(bytes),row.sha256,`runtime output ${path}`);
    seen.add(path);
    for(const match of bytes.toString().matchAll(/(?:assets\/|\.\/)([A-Za-z0-9_-]+\.js)/g))visit('assets/'+match[1]);
  }
  visit('index.html');
  const teaching=files.filter(row=>/^assets\/body-content-[^/]+\.js$/.test(row.path));
  assert.equal(teaching.length,1,'one emitted body-content module');
  assert(seen.has(teaching[0].path),'emitted entry reaches the teaching module');
  return [...seen].filter(path=>path.endsWith('.js')).map(path=>read(base+path).toString()).join('\n');
}

async function importedApi(){
  const require=createRequire(resolve(root,'package.json'));
  const {build}=require('esbuild');
  const entry=[
    "export {neckLandmarkXrayLesson} from './atlas-review/lib/neck-landmark-xray';",
    "export {neckLandmarkXrayTopics} from './atlas-review/content/neck-landmark-xray';",
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  ].join('');
  const built=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},
    bundle:true,write:false,platform:'node',format:'cjs',packages:'external'});
  const module={exports:{}};
  runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,require,
    crypto,Request,Response,URL,URLSearchParams,TextEncoder,TextDecoder,structuredClone});
  return module.exports;
}

test('exact neck X-ray source reaches learner, emitted runtime and protected Review',async()=>{
  assert.equal(git('rev-parse',`${source}^{tree}`).toString().trim(),tree);
  const review=json('atlas-review/manifest.json');
  const integration=json('atlas-review/integration-inputs.json');
  const runtime=json('public/atlas-runtime/head-neck/manifest.json');
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  assert.equal(review.revision,source);
  assert.equal(integration.sourceCommit,source);
  assert.equal(runtime.sourceCommit,source);
  // The Review import contains all seven source records. Its integration hash
  // excludes the two revision documents; the learner input graph has its own
  // reachability and does not include Review-only renderer/pin metadata.
  const graph=new Map([
    ['app/body-content.ts',{integration:true,runtime:true}],
    ['lib/neck-landmark-xray.ts',{integration:true,runtime:true}],
    ['content/neck-landmark-xray.ts',{integration:true,runtime:true}],
    ['content/body-renderer-revision.json',{integration:false,runtime:false}],
    ['content/regional-teaching/head-neck.json',{integration:true,runtime:true}],
    ['content/body-review-display-pins.json',{integration:true,runtime:false}],
    ['content/review-revisions.json',{integration:false,runtime:true}],
  ]);
  for(const [path,owner] of graph){
    const rows=review.files.filter(row=>row.path===path);
    assert.equal(rows.length,1,`Review imports ${path}`);
    assert.equal(rows[0].sourceSha256,sha(committed(path)),`exact committed ${path}`);
    assert.equal(rows[0].importedSha256,sha(read('atlas-review/'+path)),`imported ${path}`);
    same(integration.inputs.filter(row=>row.path==='atlas-review/'+path),
      owner.integration?[{path:'atlas-review/'+path,sha256:rows[0].importedSha256}]:[],
      `protected Review integration ${path}`);
    same(inputs.filter(row=>row.path===path),
      owner.runtime?[{path,sha256:rows[0].sourceSha256}]:[],
      `head-neck learner source input ${path}`);
  }
  for(const path of ['public/models/bodyparts3d/full-body/catalog.json',
    'public/models/bodyparts3d/manifest.json']){
    assert(committed(path).equals(git('show',`${before}:${path}`)),
      `${path} is unchanged by the Atlas lesson`);
    assert(read('atlas-review/'+path).equals(committed(path)),
      `${path} imported model bytes remain the exact source`);
  }
  assert.equal(runtime.patientDataIncluded,false);
  assert.equal(runtime.clinicalApproved,false);
  assert.equal(runtime.standaloneReviewConnection,false);
  assert.equal(runtime.imagingConnection,false);
  const api=await importedApi();
  const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  assert.equal(catalog.structures.length,1104);
  same(Object.keys(api.neckLandmarkXrayTopics).sort(),[...expected.values()].sort(),'three FMA topics');
  const emitted=emittedTeaching('public/atlas-runtime/head-neck/',runtime.files);
  let changed=0,storageCalls=0;
  for(const [id,fma] of expected){
    const s=catalog.structures.find(item=>item.id===id);
    assert(s,`catalog structure ${id}`);assert.equal(s.fmaId,fma);
    const lesson=api.bodyLesson(s,'xray');
    same(lesson,api.neckLandmarkXrayLesson(s,'xray'),`${fma} real resolver`);
    assert.equal(lesson.readiness,'draft');
    assert.match(lesson.note,/revision-bound radiologist review pending/);
    assert.match(lesson.note,/not patient registration/i);
    assert.match(lesson.note,/access remain independent/);
    const {readiness,...shown}=lesson;same(api.bodyContent(s,'xray'),shown,`${fma} display content`);
    same({body:lesson.body,bullets:lesson.bullets,citations:lesson.citations},
      (({body,bullets,citations})=>({body,bullets,citations}))(api.neckLandmarkXrayTopics[fma]),
      `${fma} source topic content`);
    assert(lesson.title.includes(api.neckLandmarkXrayTopics[fma].title),`${fma} source topic title`);
    for(const text of [id,lesson.body,...lesson.bullets,...lesson.citations])
      assert(emitted.includes(text)||emitted.includes(JSON.stringify(text).slice(1,-1)),
        `${fma} reaches the actual emitted module graph`);
    for(const tab of ['anatomy','ct','mri','ultrasound','quiz'])
      assert.equal(api.neckLandmarkXrayLesson(s,tab),undefined,`${fma}/${tab} refusal`);
    for(const edit of [v=>{v.sources=[];},v=>{v.bounds.min[0]+=.01;},
      v=>{v.provenance.license='foreign';},v=>{v.regions.push('foreign');},
      v=>{v.laterality='left';}]){
      const foreign=structuredClone(s);edit(foreign);
      assert.equal(api.neckLandmarkXrayLesson(foreign,'xray'),undefined,`${fma} altered source refusal`);
    }
    const material=await api.bodyReviewMaterial(id);
    assert(material);assert.equal(material.approval,false);
    same(material.topics.find(topic=>topic.tab==='xray'),{tab:'xray',...lesson},`${fma} Review topic`);
    assert(await api.parseBodyReviewResponse(material,id));
    for(const edit of [m=>{m.approval=true;},m=>{m.topics.find(t=>t.tab==='xray').body+=' foreign';}]){
      const forged=structuredClone(material);edit(forged);
      assert.equal(await api.parseBodyReviewResponse(forged,id),null,`${fma} forged Review refusal`);
    }
    const context=await api.bodyReviewContext(id);
    for(const stale of [{materialHash:'0'.repeat(64)},{revisionHash:'0'.repeat(64)}]){
      const request=new Request('https://atlas.test/api/body-review/decisions',{method:'POST',headers:{
        origin:'https://atlas.test','content-type':'application/json',
        'oai-authenticated-user-id':'SYNTHETIC_NECK_XRAY_REVIEWER'},body:JSON.stringify({
          catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
          materialHash:context.materialHash,revisionHash:context.revisions.teaching,
          checklistVersion:context.checklistVersion,...stale})});
      const response=await api.postBodyDecision(request,{prepare(){storageCalls++;throw Error('stale evidence reached storage');}});
      assert.equal(response.status,409,`${fma} stale revision refusal`);
    }
    changed++;
  }
  assert.equal(changed,3);assert.equal(storageCalls,0);
  for(const s of catalog.structures.filter(item=>!expected.has(item.id)))
    assert.equal(api.neckLandmarkXrayLesson(s,'xray'),undefined,`${s.id} other-root refusal`);
  const inventory=json('lib/atlas-model-inventory.json');
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap(model=>model.paths).length,144);
  console.log(JSON.stringify({source,landmarks:changed,otherRootsRefused:1101,storageCalls,
    clinicalApproval:false,patientRegistration:false}));
});
