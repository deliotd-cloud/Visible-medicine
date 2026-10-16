import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { contentContext, contentValidator } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { build } from './workspace-test-build.mjs';
import wristPins from '../content/connective-imaging-pins.json' with { type: 'json' };
import footPins from '../content/foot-surface-imaging-pins.json' with { type: 'json' };

assert.equal(process.argv.length, 2, 'No record, override or mutation mode');
const baseline = 'ac71406105da66f77115117bbab2c38428f7e5c3';
const git = args => execFileSync('git', args, { encoding:'utf8', maxBuffer:16e6,
  env:{...process.env, GIT_NO_REPLACE_OBJECTS:'1'}, windowsHide:true });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (a,b,label) => assert.deepEqual(a,b,label);
const source = (commit,path) => git(['show',`${commit}:${path}`]);
const admissions = git(['log','--diff-filter=A','--format=%H','--','lib/connective-projection-xray.ts'])
  .trim().split(/\s+/).filter(Boolean);
assert(admissions.length <= 1, 'Ambiguous admission history');
const epoch = admissions[0];
if (epoch) assert.equal(git(['rev-parse',epoch+'^']).trim(), baseline, 'Unexpected admission parent');
else assert.equal(git(['rev-parse','HEAD']).trim(), baseline, 'Candidate needs exact source parent');
const expectedGroups = {wrist:['FMA40120','FMA40121'], longPlantar:['FMA44249','FMA44250']};
const targets = [
  ...wristPins.entries.filter(e => e.group === 'wrist').map(e => ({group:e.group,identity:e.identity})),
  ...footPins.entries.filter(e => e.family === 'longPlantar').map(e => ({group:e.family,identity:e.identity})),
];
assert.equal(targets.length,4);
const byId = new Map(targets.map(e => [e.identity.id,e])); assert.equal(byId.size,4);
for (const path of ['content/connective-imaging-pins.json','content/foot-surface-imaging-pins.json',
  'public/models/bodyparts3d/full-body/catalog.json','package-lock.json']) {
  same(await readFile(path,'utf8'),source(baseline,path),path+' changed');
  if (epoch) same(source(epoch,path),source(baseline,path),path+' admission changed');
}
assert.equal(git(['diff','--name-only',baseline,epoch||'HEAD','--','public/models']).trim(),'');
assert.equal(git(['status','--porcelain','--','public/models']).trim(),'');
const oldNotice = source(baseline,'LICENSES/THIRD_PARTY_NOTICES.md');
const notice = epoch ? source(epoch,'LICENSES/THIRD_PARTY_NOTICES.md') :
  await readFile('LICENSES/THIRD_PARTY_NOTICES.md','utf8');
const header = '# Third-party notices\n\n';
assert(notice.startsWith(header+'## Wrist and long plantar X-ray orientation'));
assert(notice.endsWith(oldNotice.slice(header.length)), 'Previous licence notices changed');
assert.match(notice.slice(0,-oldNotice.slice(header.length).length), /no article prose/i);

const exports = `export * from './lib/connective-projection-xray';
export * from './content/connective-projection-xray';
export {parseBodyReviewResponse} from './lib/body-review-response';
export {bodyReviewContext} from './lib/body-review-context';
export {postBodyDecision} from './lib/body-review-api';
export {regionalTours} from './lib/regional-tours';
export {nestedConcepts,nestedTeachingReferences} from './content/nested-teaching';`;
const context = await contentContext();
const built = await build({stdin:{contents:exports,resolveDir:process.cwd(),loader:'ts'},
  bundle:true,write:false,platform:'node',format:'esm'});
const direct = await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const live = {...context.api,...direct,catalog:context.catalog};
const admitted = epoch ? await exactSourceHistoryApi(epoch,'connective-projection-xray-epoch') : live;
const before = await exactSourceHistoryApi(baseline,'review-security');
const display = admitted.bodyDisplayCatalog(context.catalog);
same(display,before.bodyDisplayCatalog(context.catalog),'Geometry/source identity changed');
same(admitted.structures,before.structures); same(admitted.dissectionProfiles,before.dissectionProfiles);
same(admitted.contentTabs,before.contentTabs); same(admitted.regionalTours,before.regionalTours);
const oldNested = await exactSourceHistoryApi(baseline,'nested-teaching');
same(admitted.nestedConcepts,oldNested.nestedConcepts); same(admitted.nestedTeachingReferences,oldNested.nestedTeachingReferences);
same(admitted.connectiveProjectionXrayGroups,expectedGroups);
const records = admitted.bodyContentRecords(display), oldRecords = before.bodyContentRecords(display);
const recordById = new Map(records.map(r => [r.id,r])), oldById = new Map(oldRecords.map(r => [r.id,r]));
const registry = new Map([...context.shoulder,...live.bodyContentRecords(display)].map(r => [r.representationScope+'|'+r.id,r]));
const validate = await contentValidator(registry);
let changed=0, unchanged=0, refused=0, worksheetRefusals=0, staleSaves=0, storageCalls=0;
for (const s of display.structures) {
  const record=recordById.get(s.id), old=oldById.get(s.id), expected=structuredClone(old);
  assert(record && old); if (!epoch) assert(validate(record));
  for (const tab of admitted.contentTabs) {
    const was=before.bodyLesson(s,tab), now=admitted.bodyLesson(s,tab);
    const resolved=admitted.connectiveProjectionXrayLesson(s,tab);
    if (!byId.has(s.id)||tab!=='xray') {
      same(now,was,s.id+'|'+tab+' unexpected change'); assert.equal(resolved,undefined); unchanged++; continue;
    }
    assert.equal(was.readiness,'pending'); assert.equal(now.readiness,'draft'); same(now,resolved);
    same(record.content.xray,now); const {readiness,...section}=now; same(admitted.bodyContent(s,tab),section);
    assert.match(now.note,/revision-bound radiologist review pending/);
    assert.match(now.note,/not validated ligament visibility/);
    assert.match(now.note,/Atlas, imaging-case and paid-lecture access remain independent/);
    assert.match(now.body,/inference/); assert(now.bullets.length>=3);
    for (const url of now.citations) assert.equal(new URL(url).protocol,'https:');
    expected.content.xray=now; changed++;
  }
  same(record,expected,s.id+' export changed elsewhere');
  assert.equal(record.validation.clinicalApproval,'not-included');
  assert.equal(record.validation.materialRevisions.imaging,null);
}
assert.equal(changed,4); assert.equal(unchanged,9932);
const paths = (v,p=[]) => v===null||typeof v!=='object' ? [] : Object.entries(v).flatMap(([k,x]) =>
  [[...p,k],...paths(x,[...p,k])]);
for (const {identity:s,group} of targets) {
  const id=s.id;
  same(display.structures.filter(v=>v.id===id),[s]);
  const old=await before.bodyReviewMaterial(id), now=await admitted.bodyReviewMaterial(id);
  assert(old && now); assert.equal(now.approval,false); assert.equal(now.status,'worksheet-not-submitted');
  const expected=structuredClone(old); expected.topics=now.topics;
  expected.fingerprints.teaching=now.fingerprints.teaching; expected.materialHash=now.materialHash;
  same(now,expected); assert.notEqual(now.materialHash,old.materialHash);
  same(await admitted.parseBodyReviewResponse(now,id),now);
  assert.equal(await admitted.parseBodyReviewResponse(old,id),null); worksheetRefusals++;
  for (const mutate of [
    p=>{p.topics.find(t=>t.tab==='xray').body+=' foreign';},
    p=>{p.source.structure.fmaId='FMA0';},
    p=>{p.topics.find(t=>t.tab==='xray').readiness='approved';},
    p=>{p.topics.find(t=>t.tab==='xray').citations=['https://foreign.example'];},
  ]) {const forged=structuredClone(now); mutate(forged);
    assert.equal(await admitted.parseBodyReviewResponse(forged,id),null); worksheetRefusals++;}
  const prior=await before.bodyReviewContext(id), current=await admitted.bodyReviewContext(id);
  assert(prior&&current); assert.equal(prior.sourceHash,current.sourceHash);
  assert.notEqual(prior.revisions.teaching,current.revisions.teaching); assert.equal(current.revisions.imaging,null);
  const packet=c=>({catalogScope:c.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
    materialHash:c.materialHash,revisionHash:c.revisions.teaching,checklistVersion:c.checklistVersion,draft:null});
  for (const p of [packet(prior),{...packet(current),revisionHash:'0'.repeat(64)},
    {...packet(current),materialHash:'0'.repeat(64)}]) {
    const response=await admitted.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json',
        'oai-authenticated-user-id':'SYNTHETIC_CONNECTIVE_XRAY'},body:JSON.stringify(p)}),
      {prepare(){storageCalls++;throw Error('Stale draft reached synthetic storage');}});
    assert.equal(response.status,409); staleSaves++;
  }
  const reject=bad=>{assert.equal(admitted.connectiveProjectionXrayLesson(bad,'xray'),undefined);refused++;};
  for (const path of paths(s)) {
    const bad=structuredClone(s); let owner=bad;
    for (const key of path.slice(0,-1)) owner=owner[key]; const key=path.at(-1), val=owner[key];
    if (val===null||typeof val!=='object') {owner[key]=typeof val==='number'?val+0.01:
      typeof val==='boolean'?!val:String(val)+'-foreign';reject(bad);}
    const removed=structuredClone(s); let holder=removed;
    for (const k of path.slice(0,-1)) holder=holder[k];
    if (Array.isArray(holder)) holder.splice(Number(key),1); else delete holder[key]; reject(removed);
  }
  reject({...s,foreign:true}); reject({...s,provenance:{...s.provenance,foreign:true}});
  const peer=targets.find(t=>t.group===group&&t.identity.id!==id); assert(peer);
  reject({...s,sources:peer.identity.sources});
  const lesson=admitted.connectiveProjectionXrayLesson(s,'xray'), pristine=structuredClone(lesson);
  lesson.bullets.push('foreign'); lesson.citations.length=0;
  same(admitted.connectiveProjectionXrayLesson(s,'xray'),pristine,'Returned arrays shared');
  // Later unrelated additions are permitted, but not silent changes to admitted slots.
  same(live.bodyLesson(s,'xray'),pristine,'Current admitted lesson changed');
  assert(validate(live.bodyContentRecords(display).find(r=>r.id===id)));
}
assert.equal(staleSaves,12); assert.equal(storageCalls,0);
console.log(JSON.stringify({baseline,epoch:epoch||'uncommitted-candidate',changed,unchanged,refused,
  worksheetRefusals,staleSaves,storageCalls,pinHashes:[sha(await readFile('content/connective-imaging-pins.json')),
    sha(await readFile('content/foot-surface-imaging-pins.json'))],clinicalApproval:false,patientRegistration:false}));
