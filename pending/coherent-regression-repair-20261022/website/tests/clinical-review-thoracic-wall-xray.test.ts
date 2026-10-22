import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {pathToFileURL} from 'node:url';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const authoredRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const revision=CURRENT_ATLAS_REVISION;
const atlas=checkedAtlasSourceRepo(revision);
const paths=['content/thoracic-branch-imaging-pins.json',
  'content/thoracic-wall-arterial-xray.ts','lib/thoracic-wall-arterial-xray.ts'];
const fmas=['FMA3969','FMA4068','FMA10692','FMA4077','FMA3988','FMA4083'];
const sha=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const normalize=(b:Uint8Array)=>Buffer.from(b).toString('utf8').replaceAll('\r\n','\n');
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

test('six exact thoracic wall angiography drafts reach learner and protected Review',async()=>{
  const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const authored=await exactSourceHistoryApi(authoredRevision,'review-security'),bound=await boundLiveAtlasHistory(revision);
  const review=json('atlas-review/manifest.json');
  const base='public/atlas-runtime/head-neck/',learner=json(base+'manifest.json');
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(review.revision,revision);
  assert.equal(learner.sourceCommit,validateCurrentAtlasDelivery().runtimeSources['head-neck']);
  assert.equal(viewer.sourceCommit,revision);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(learner.patientDataIncluded,false);
  assert.equal(learner.clinicalApproved,false);
  assert.equal(viewer.personalRecordsIncluded,false);
  const inputs=json(base+'source-inputs.json');
  for(const path of paths){
    const source=execFileSync('git',['show',`${revision}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:32e6});
    assert.deepEqual(source,execFileSync('git',['show',`${authoredRevision}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}),'Exact authored source remains unchanged: '+path);
    const record=review.files.find((f:{path:string})=>f.path===path);assert(record,path);
    assert.equal(record.sourceSha256,sha(source));
    const imported=readFileSync('atlas-review/'+path);
    assert.equal(record.importedSha256,sha(imported));
    assert.equal(normalize(imported),normalize(source));
    assert.equal(normalize(readFileSync(atlas+'/'+path)),normalize(source));
    assert.equal(inputs.find((f:{path:string})=>f.path===path)?.sha256,sha(readFileSync(atlas+'/'+path)));
    if(path!==paths[0])for(const prefix of [base,viewerBase,'public/atlas-review/'])
      assert.equal(existsSync(prefix+path),false,'No raw teaching source published');
  }
  const compiled=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {thoracicWallArterialXrayLesson} from './atlas-review/lib/thoracic-wall-arterial-xray';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const entries=json('atlas-review/'+paths[0]).entries.filter((e:{identity:{fmaId:string}})=>fmas.includes(e.identity.fmaId));
  assert.equal(entries.length,6);
  assert.deepEqual(entries.map((e:{identity:{fmaId:string}})=>e.identity.fmaId).sort(),fmas.slice().sort());
  const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const emitted=[emittedTeaching(base,learner.files,true),emittedTeaching(viewerBase,viewer.files,true)];
  const scope=learner.regionalScopes.find((s:{region:string})=>s.region==='thorax');assert(scope);
  for(const {identity} of entries){
    const s=catalog.structures.find((s:{id:string})=>s.id===identity.id);assert.deepEqual(s,identity);
    assert(scope.regionalIds.includes(s.id));
    assert.equal(s.validation.anatomicalReview,false);
    const lesson=api.thoracicWallArterialXrayLesson(s,'xray');
    assert.deepEqual(api.bodyLesson(s,'xray'),lesson);
    assert.equal(lesson.readiness,'draft');
    assert.match(lesson.note,/revision-bound radiologist review pending/);
    assert.match(lesson.note,/No[^.]*clinical approval[^.]*patient-space registration/);
    assert.match(lesson.note,/Atlas, Education case and paid-lecture access remain independent/);
    assert(lesson.bullets.some((b:string)=>b.startsWith('Plain chest radiography')));
    const sideBullet=`The selected atlas segment is ${s.laterality}-sided. Confirm the patient side and projection from the acquired study, not its screen position or the rotated model.`;
    assert(lesson.bullets.includes(sideBullet));
    for(const code of emitted){
      for(const text of [lesson.body,...lesson.bullets.filter((b:string)=>b!==sideBullet),...lesson.citations,lesson.note])
        assert(visible(code,text),s.id+': emitted text missing');
      // The generated module retains this dynamic side template, not six folded strings.
      assert(code.includes('The selected atlas segment is '));
      assert(code.includes('-sided. Confirm the patient side and projection'));
    }
    for(const bad of [{...s,laterality:s.laterality==='left'?'right':'left'},
      {...s,sources:[{file:'FJ0',sha256:'0'.repeat(64)}]}])
      assert.equal(api.thoracicWallArterialXrayLesson(bad,'xray'),undefined);
    const packet=JSON.parse(JSON.stringify(await api.bodyReviewMaterial(s.id)));
    assert.equal(packet.approval,false);
    assert.deepEqual(packet.topics.find((t:{tab:string})=>t.tab==='xray'),{tab:'xray',...lesson});
    const authoredPacket=await authored.bodyReviewMaterial(s.id);assert(authoredPacket);assert.equal(authoredPacket.approval,false);
    assert.deepEqual(authoredPacket.topics.find((t:{tab:string})=>t.tab==='xray'),{tab:'xray',...lesson},'Exact authored X-ray topic');
    assert.deepEqual(packet,await bound.bodyReviewMaterial(s.id),'Whole current packet equals independent renderer-bound Atlas replay');
    assert.deepEqual(await api.parseBodyReviewResponse(packet,s.id),packet);
    packet.topics.find((t:{tab:string})=>t.tab==='xray').body+=' forged';
    assert.equal(await api.parseBodyReviewResponse(packet,s.id),null);
  }
});
