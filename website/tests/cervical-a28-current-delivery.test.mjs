import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,statSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';
import test from 'node:test';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

// Current a28 source-role counterpart. The complete a01 behavioral root remains
// authenticated historical evidence; this test does not change its baselines.
const website=fileURLToPath(new URL('../',import.meta.url));
const revision='a28d03acf07da97a927073d4794abf3b5ce907f7';
const tree='180330c12bb9b5abf1b7171adca83eeadaad476d';
const regions=['head-neck','shoulder','lower-limb','female-pelvis'];
const sourcePaths=['app/body-content.ts','lib/cervical-projection-xray.ts',
  'content/cervical-projection-xray.ts','content/cervical-projection-xray-pins.json',
  'lib/body-review-material.ts','lib/body-review-response.ts',
  'lib/regional-teaching-snapshot.ts','public/models/bodyparts3d/full-body/catalog.json'];
const families={FMA46309:'longusCapitis',FMA46310:'longusCapitis',
  FMA46313:'rectusAnterior',FMA46314:'rectusAnterior',
  FMA46317:'rectusLateralis',FMA46318:'rectusLateralis'};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(resolve(website,path));
const json=path=>JSON.parse(read(path));
const same=(actual,expected,label)=>assert.deepEqual(structuredClone(actual),structuredClone(expected),label);
function git(repo,path,commit=CURRENT_ATLAS_REVISION){return execFileSync('git',['-C',repo,'show',`${commit}:${path}`],
  {windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})}
async function api(base){
  const imported=base===website;
  const prefix=imported?'./atlas-review/':'./';
  const entry=[
    `export {bodyLesson,bodyContent} from '${prefix}app/body-content';`,
    `export {bodyDisplayCatalog} from '${prefix}lib/body-display-catalog';`,
    `export {contentTabs} from '${prefix}lib/content-types';`,
    `export {decodeRegionalTeachingSnapshot} from '${prefix}lib/regional-teaching-snapshot';`,
    `export {cervicalProjectionXrayLesson} from '${prefix}lib/cervical-projection-xray';`,
    `export * from '${prefix}content/cervical-projection-xray';`,
    `export {bodyReviewMaterial} from '${prefix}lib/body-review-material';`,
    `export {bodyReviewContext} from '${prefix}lib/body-review-context';`,
    `export {parseBodyReviewResponse} from '${prefix}lib/body-review-response';`,
  ].join('');
  const built=await build({stdin:{contents:entry,resolveDir:base,loader:'ts'},
    bundle:true,write:false,format:'cjs',platform:'node',packages:'external'});
  const module={exports:{}};
  runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,
    require:createRequire(resolve(base,'package.json')),crypto,TextEncoder,TextDecoder,
    Request,Response,URL,URLSearchParams,structuredClone});
  return module.exports;
}

test('a28 cervical X-ray drafts bind six authentic sources across learner, regional and Review delivery',async()=>{
  const pin=validateCurrentAtlasDelivery();
  assert.equal(CURRENT_ATLAS_REVISION,pin.source);
  assert.equal(pin.sourceTree,'e07b52eec6b4eeff4caaa039ab1cdb54828a716d');
  assert.equal(pin.runtimeSources['head-neck'],pin.source);
  for(const region of regions)assert.equal(pin.runtimeSources[region],json(`public/atlas-runtime/${region}/manifest.json`).sourceCommit);
  // Preserve the a28 milestone as an exact historical source, independent of current delivery.
  assert.equal(execFileSync('git',['-C',currentAtlasDeliveryRoot(),'rev-parse',revision+'^{tree}'],{encoding:'utf8'}).trim(),tree);
  const repo=currentAtlasDeliveryRoot(); // Also checks clean native HEAD and tree.
  const review=json('atlas-review/manifest.json');
  assert.equal(review.revision,pin.source);
  const historicalPins=JSON.parse(git(repo,'content/cervical-projection-xray-pins.json',revision));
  assert.equal(historicalPins.baseline,'408759d57644b05402e98a937e7cf6338b5509cf');
  for(const path of sourcePaths.filter(path=>path!=='app/body-content.ts'))
    assert.equal(sha(git(repo,path)),sha(git(repo,path,revision)),`Historical a28 source changed: ${path}`);
  const reviewFiles=new Map(review.files.map(row=>[row.path,row]));
  assert.equal(reviewFiles.size,review.files.length);
  for(const path of sourcePaths){
    const row=reviewFiles.get(path);assert(row,`Review imports ${path}`);
    const committed=git(repo,path),imported=read(`atlas-review/${path}`);
    assert.equal(sha(committed),row.sourceSha256,`Native committed ${path}`);
    assert.equal(sha(imported),row.importedSha256,`Review imported ${path}`);
    assert.ok(imported.equals(committed),`Review preserves current native ${path}`);
  }
  const pins=json('atlas-review/content/cervical-projection-xray-pins.json');
  assert.equal(pins.baseline,'408759d57644b05402e98a937e7cf6338b5509cf');
  assert.equal(pins.entries.length,6);
  same(Object.fromEntries(pins.entries.map(row=>[row.identity.fmaId,row.family])),families,
    'Exact three bilateral source families');
  assert.equal(new Set(pins.entries.map(row=>row.identity.id)).size,6);
  const imported=await api(website),source=await api(repo);
  const catalog=imported.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  assert.equal(catalog.structures.length,1104);
  assert.equal(imported.contentTabs.length,9);
  let currentCompared=0;
  for(const structure of catalog.structures)for(const tab of imported.contentTabs){
    same(imported.bodyLesson(structure,tab),source.bodyLesson(structure,tab),
      `${structure.id}/${tab} current imported versus native lesson`);
    currentCompared++;
  }
  assert.equal(currentCompared,9936,'Every current root/tab lesson retains native behavior');
  same(catalog,source.bodyDisplayCatalog(JSON.parse(git(repo,
    'public/models/bodyparts3d/full-body/catalog.json'))),'Exact current native catalogue');
  const spine=json('atlas-review/content/regional-teaching/spine.json');
  const regional=imported.decodeRegionalTeachingSnapshot(spine,'spine');
  const base='public/atlas-runtime/head-neck/';
  const emitted=emittedTeaching(base,json(base+'manifest.json').files,true);
  for(const row of pins.entries){
    const structure=catalog.structures.find(item=>item.id===row.identity.id);
    same(structure,row.identity,`${row.identity.fmaId} complete source identity`);
    assert.equal(structure.sources.length,1);
    assert.equal(structure.bundle,'spine-muscles');
    const expected=source.cervicalProjectionXrayLesson(structure,'xray');
    assert(expected,`${row.identity.fmaId} native resolver`);
    assert.equal(expected.readiness,'draft');
    same(imported.cervicalProjectionXrayLesson(structure,'xray'),expected,'Imported exact resolver');
    same(imported.bodyLesson(structure,'xray'),expected,'Full-body lesson selection');
    const {readiness,...section}=expected;
    same(imported.bodyContent(structure,'xray'),section,'Full-body content selection');
    assert(regional.accepts(structure),'Regional reader accepts exact source');
    same(regional.bodyLesson(structure,'xray'),expected,'Regional lesson selection');
    same(regional.bodyContent(structure,'xray'),section,'Regional content selection');
    const fact=source.cervicalProjectionXrayFacts[row.family];
    same([expected.body,...expected.bullets],[fact.body,fact.distinction,fact.projection,
      ...source.cervicalProjectionXrayLimitations],'Source teaching and limitations');
    same(expected.citations,source.cervicalProjectionXrayReferences,'Source citations');
    assert.match(expected.note,/revision-bound radiologist review pending/i);
    assert.match(expected.note,/No acquired image, clinical approval, diagnosis/i);
    assert.match(expected.note,/patient-space registration/i);
    assert.match(expected.note,/Atlas, imaging-case and lecture access remain independent/i);
    const worksheet=await imported.bodyReviewMaterial(structure.id);
    assert(worksheet);assert.equal(worksheet.approval,false);
    assert.equal(worksheet.status,'worksheet-not-submitted');
    same(worksheet.source.structure,structure,'Worksheet exact source identity');
    same(worksheet.topics.find(topic=>topic.tab==='xray'),{tab:'xray',...expected},
      'Worksheet current draft');
    assert(await imported.parseBodyReviewResponse(worksheet,structure.id),
      'Untampered current worksheet parses');
    const context=await imported.bodyReviewContext(structure.id);
    assert(context);assert.equal(context.sourceHash,worksheet.fingerprints.source);
    assert.equal(context.teachingHash,worksheet.fingerprints.teaching);
    assert.equal(context.materialHash,worksheet.materialHash);
    assert.equal(context.revisions.imaging,null,'No acquired-image approval');
    assert(emitted.includes(structure.id),`Emitted learner contains ${row.identity.fmaId}`);
  }
  for(const fact of Object.values(source.cervicalProjectionXrayFacts))
    for(const line of Object.values(fact))
      assert(emitted.includes(line)||emitted.includes(JSON.stringify(line).slice(1,-1)),
        `Emitted source teaching: ${line.slice(0,40)}`);
  for(const line of source.cervicalProjectionXrayLimitations)
    assert(emitted.includes(line)||emitted.includes(JSON.stringify(line).slice(1,-1)),
      'Emitted limitation');
  assert(emitted.includes('revision-bound radiologist review pending'));
  assert(emitted.includes('patient-space registration'));
  const sourceBundle=pins.bundles[0];
  assert.equal(sourceBundle.id,'spine-muscles');
  const modelPath=`public/models/bodyparts3d/full-body/${sourceBundle.id}.glb`;
  const committedModel=git(repo,modelPath);
  assert.equal(committedModel.length,sourceBundle.bytes);
  assert.equal(sha(committedModel),sourceBundle.sha256);
  let modelCopies=0;
  for(const region of regions){
    const manifest=json(`public/atlas-runtime/${region}/manifest.json`);
    const base=`public/atlas-runtime/${region}/`;
    const model=manifest.files.find(file=>file.path===`models/bodyparts3d/full-body/${sourceBundle.id}.glb`);
    if(model){
      assert.equal(statSync(resolve(website,base,model.path)).size,sourceBundle.bytes);
      assert.equal(model.sha256,sourceBundle.sha256,`${region} exact source model`);
      modelCopies++;
    }
    assert.equal(manifest.sourceCommit,pin.runtimeSources[region]);
    assert.equal(manifest.patientDataIncluded,false);
    for(const flag of ['clinicalApproved','standaloneReviewConnection','imagingConnection'])
      assert(manifest[flag]===false||manifest[flag]===undefined,`${region} ${flag}`);
  }
  assert(modelCopies>=1,'Regional learner ships the exact source muscle bundle');
});

test('a28 cervical admission refuses forged source, family, Review and runtime identity before storage',async()=>{
  const pin=validateCurrentAtlasDelivery();
  for(const mutation of [
    p=>{p.source='0'.repeat(40)},
    p=>{p.runtimeSources.shoulder='190a63238eadcf906abe89dcbb6a67c88afe70b9'},
    p=>{p.reviewIntegration='0'.repeat(64)},
  ]){const forged=structuredClone(pin);mutation(forged);
    assert.throws(()=>validateCurrentAtlasDelivery({pin:forged}));}
  const imported=await api(website);
  const catalog=imported.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const rows=json('atlas-review/content/cervical-projection-xray-pins.json').entries;
  const selected=catalog.structures.find(item=>item.id===rows[0].identity.id);
  const other=catalog.structures.find(item=>item.id===rows[4].identity.id);
  assert(selected&&other);
  for(const forged of [
    {...selected,sources:[{...selected.sources[0],sha256:'0'.repeat(64)}]},
    {...selected,fmaId:other.fmaId,nodeName:other.nodeName},
    {...selected,id:other.id}, // A different family cannot borrow this identity.
  ]){
    assert.equal(imported.cervicalProjectionXrayLesson(forged,'xray'),undefined);
    assert.equal(imported.decodeRegionalTeachingSnapshot(
      json('atlas-review/content/regional-teaching/spine.json'),'spine').accepts(forged),false);
  }
  assert.equal(imported.cervicalProjectionXrayLesson(selected,'ct'),undefined);
  const worksheet=await imported.bodyReviewMaterial(selected.id);
  assert(worksheet);
  for(const mutate of [
    w=>{w.source.structure.sources[0].sha256='0'.repeat(64)},
    w=>{w.source.structure.fmaId=other.fmaId},
    w=>{w.structureId=other.id},
    w=>{w.fingerprints.teaching='0'.repeat(64)},
  ]){
    const forged=structuredClone(worksheet);mutate(forged);
    assert.equal(await imported.parseBodyReviewResponse(forged,selected.id),null,
      'Tampered worksheet is refused at the parser, before any persistence');
  }
  const base='public/atlas-runtime/head-neck/';
  const files=json(base+'manifest.json').files;
  assert.throws(()=>emittedTeaching(base,files,true,path=>
    path===base+'index.html'?Buffer.concat([read(path),Buffer.from('forged')]):read(path)),
    'Changed learner entry is refused by manifest before admission');
});


