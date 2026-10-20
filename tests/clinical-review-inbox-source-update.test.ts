import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {clinicalReviewPrincipal} from '../lib/clinical-review-access.ts';
import type {InboxItem} from '../lib/clinical-review-inbox-contract.ts';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

// Historical continuation captured from the actual private inbox against an
// empty read-only DB before importing Atlas a70b6f64 (source ab8f5594,
// website Review integration a386c3e6, renderer ee4a8175). No account data.
const atlas=checkedAtlasSourceRepo(CURRENT_ATLAS_REVISION);
const previous='ab8f5594df9ff55132d3d8754e9d229a806dc325';
const completedEpoch='a70b6f640c5511330f250882f525b63a4a21117b';
const oldIntegration='a386c3e64a97a91fa86027be0782802556c863c0deace173039fd03b891c65f8';
const oldRenderer='ee4a81759a639c3dbfb549543870bdb8ef4c1b8200e40f1822edc99b877d6d06';
const oldCatalog='dd286b90c14389de2e3bbeaae9b440024fdf3bdc94220281def5994ac1904988';
const oldTeaching=new Map<string,string>([
 ['inferior-branch-of-left-oculomotor-nerve','a0c31eecd12dcae9cc92fb8117456122d16adf1a97bad3cc76818594dcecadd6'],
 ['inferior-branch-of-right-oculomotor-nerve','33c905bed520878156f3e5d32d8e9cac4a8621341242071c87770697a76e4352'],
 ['left-ciliary-ganglion','d5d524b32f5782245d8475865ae3e9cee53d5ac9b2ab9499021adbe46f4ead33'],
 ['left-frontal-nerve','cc1f76a78714f2de0d768564e5166782a25e76ba603a1468a2078b25436bfc1b'],
 ['left-lacrimal-nerve','6345aded48f7b13536b2845361f225b07651772d7978cdb66c5e4473adfa3f1e'],
 ['left-nasociliary-nerve','f101fad4e9d5281365934ec1c2448a6b979d7a5a6f51e92948ede487c6fdb3d8'],
 ['left-trochlear-nerve','ff5ae6b7f1b446d12cb85d40ee8e23b8d7ef4e5da7abb9cb1d6e8a0455155664'],
 ['right-ciliary-ganglion','a513fc97199c44fca29b8a2e0b5c07be1503b96092387e87dd35771e83d8afc1'],
 ['right-frontal-nerve','73243820d2eea52318261254242c85187dda3aaf1a17de51da3d6e82e6d1599e'],
 ['right-lacrimal-nerve','1e428bfcef641bfcb594865b9804dcb57599863624c603fe7f5ccf9a4537daa4'],
 ['right-nasociliary-nerve','b3dc44b3cedb789614495920842e84f93d670f3020294c27c4a19041a002f570'],
 ['right-trochlear-nerve','1c597e186f9d40b7c3b01b4e0fb61840e5a4a24d2365ec1ee7c636ec9d0569cc'],
 ['superior-branch-of-left-oculomotor-nerve','0dc611b36e9909ef75b4cdbc8f91f12e9502e6ac7fcba7665b04953c014e1970'],
 ['superior-branch-of-right-oculomotor-nerve','cb6affc5f158214e8ae131cedede5d112353d94d19ee9b98dc751992ab483e69'],
]);
const require=createRequire(import.meta.url);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const pins=json('atlas-review/content/orbital-nerve-mri-pins.json').entries as {identity:{id:string;category:string};group:string}[];
const targetIds=new Set(pins.map(pin=>pin.identity.id));
assert.equal(targetIds.size,14);
assert.equal(pins.filter(pin=>pin.group==='ciliary-ganglion').length,2);
assert.equal(oldTeaching.size,14);

const built=await build({stdin:{contents:"export * from './lib/clinical-review-inbox'; export {clinicalReviewEntries} from './atlas-review/lib/clinical-review-index'; export {bodyReviewContext} from './atlas-review/lib/body-review-context'; export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external'});
const mod={exports:{} as Record<string,any>};
new Function('require','module','exports',built.outputFiles[0].text)((name:string)=>name==='server-only'?{}:require(name),mod,mod.exports);
const {getClinicalReviewInbox,clinicalReviewEntries,bodyReviewContext,bodyReviewMaterial}=mod.exports;
const request=(query='')=>new Request('https://review.invalid/api/atlas-review/inbox'+query,{headers:{'oai-authenticated-user-id':'offline-inbox-test'}});
function database(result:unknown={success:true,results:[]}){
 const reads:{sql:string;args:unknown[]}[]=[];
 return {reads,prepare(sql:string){assert.match(sql,/^\s*SELECT\b/i);let args:unknown[]=[];const statement={bind(...values:unknown[]){args=values;return statement;},async all(){reads.push({sql,args});return result;},async run(){throw Error('Unexpected write');}};return statement;}};
}
async function rows(revision:string,db:ReturnType<typeof database>){
 const selected=clinicalReviewEntries.map((entry:any,index:number)=>({entry,index})).filter(({entry}:any)=>entry.scope==='body'&&targetIds.has(entry.id));
 assert.equal(selected.length,14);
 const pages=[...new Set(selected.map(({index}:any)=>Math.floor(index/12)+2))];
 const batches:InboxItem[]=[];
 for(const page of pages){const response=await getClinicalReviewInbox(request(`?page=${page}&revision=${revision}`),db);assert.equal(response.status,200);batches.push(...(await response.json()).items);}
 return new Map<string,InboxItem>(selected.map(({entry}:any):[string,InboxItem]=>{
  const key=JSON.stringify([entry.key,'teaching']);const matches=batches.filter(row=>row.key===key);
  assert.equal(matches.length,1,key);return [entry.id,matches[0]];
 }));
}

test('orbital CT source update rebinds the inbox to twelve exact worksheets without inherited decisions',async()=>{
 const liveDelivery=validateCurrentAtlasDelivery();assert.equal(liveDelivery.source,CURRENT_ATLAS_REVISION);
 const manifest=json('atlas-review/manifest.json');assert.equal(manifest.revision,CURRENT_ATLAS_REVISION);
 assert.notEqual(manifest.websiteIntegrationSha256,oldIntegration);
 const renderer=json('atlas-review/content/body-renderer-revision.json');assert.notEqual(renderer.sha256,oldRenderer);
 const sourceHead=execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,encoding:'utf8',windowsHide:true}).trim();assert.equal(sourceHead,CURRENT_ATLAS_REVISION);
 const history=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const before=await history.exactSourceHistoryApi(previous,'review-security');
 // Test the original twelve-worksheet change against its exact introduction,
 // not later teaching or continuous-playback revisions. Live inbox checks below
 // still bind every row to the current imported context.
 const after=await history.exactSourceHistoryApi(completedEpoch,'review-security');
 const db=database(),first=await getClinicalReviewInbox(request(),db);assert.equal(first.status,200);
 assert.equal(first.headers.get('Cache-Control'),'private, no-store');
 assert.match(first.headers.get('Vary')??'',/Cookie/);
 const catalog=(await first.json()).catalogRevision as string;assert.match(catalog,/^[a-f0-9]{64}$/);assert.notEqual(catalog,oldCatalog);
 db.reads.length=0;
 const stale=await getClinicalReviewInbox(request('?page=2&revision='+oldCatalog),db);
 assert.equal(stale.status,409);assert.equal(db.reads.length,0,'stale continuation must fail before saved-history reads');
 const currentRows=await rows(catalog,db);assert.equal(currentRows.size,14);
 let changed=0,unchangedGanglia=0;
 for(const pin of pins){
  const id=pin.identity.id,row=currentRows.get(id),prior=await before.bodyReviewContext(id),epoch=await after.bodyReviewContext(id),now=await bodyReviewContext(id);
  assert(row&&prior&&epoch&&now,id);
  assert.equal(prior.revisions.teaching,oldTeaching.get(id.split(':').at(-1)!),id+' historical revision');
  const material=await bodyReviewMaterial(id);assert(material,id);
  assert.equal(row.href,'/workspace/atlas-review/body?structure='+encodeURIComponent(id)+'&t=teaching',id);
  assert.equal(row.revision,now.revisions.teaching,id);
  assert.equal(row.status,'not-started',id);assert.equal(material.approval,false,id);
  assert.equal(material.status,'worksheet-not-submitted',id);
  assert.equal(now.sourceHash,prior.sourceHash,id);
  assert.equal(epoch.sourceHash,prior.sourceHash,id+' original source retained');
  if(pin.group==='ciliary-ganglion'){
   unchangedGanglia++;assert.equal(epoch.teachingHash,prior.teachingHash,id);
   assert.equal(epoch.revisions.teaching,prior.revisions.teaching,id);
  }else{
   changed++;assert.notEqual(epoch.teachingHash,prior.teachingHash,id);
   assert.notEqual(epoch.revisions.teaching,prior.revisions.teaching,id);
   assert(epoch.teachingTabs.includes('ct'),id);
  }
 }
 assert.equal(changed,12);assert.equal(unchangedGanglia,2);
 const unavailable=await getClinicalReviewInbox(request('?page=2&revision='+catalog),database({success:false,results:[]}));
 assert.equal(unavailable.status,200);
 assert((await unavailable.json()).items.every((row:any)=>row.status==='unavailable'));
});

test('review principal remains separated by account and institution',async()=>{
 const subjects=['alice','bob'];let subject='alice',institution='one';
 const db={withSession(mode:string){assert.equal(mode,'first-primary');return {prepare(sql:string){assert.match(sql,/FROM users u JOIN account_security_profiles/);return {bind(user:string,external:string){assert.equal(user,'edu:'+subject);assert.equal(external,'sites:'+subject);return {async first(){return {roles:'administrator',organization_id:institution,role:'owner'};}};}};}};}};
 const keys=[];
 for(const id of subjects){subject=id;const principal=await clinicalReviewPrincipal(db as any,id);keys.push(principal.storageKey);}
 subject='alice';institution='two';keys.push((await clinicalReviewPrincipal(db as any,'alice')).storageKey);
 assert.equal(new Set(keys).size,3);
 assert.deepEqual(keys.map(key=>JSON.parse(key)),[
  ['vm-website-personal-review-1','edu:alice','one'],
  ['vm-website-personal-review-1','edu:bob','one'],
  ['vm-website-personal-review-1','edu:alice','two'],
 ]);
});
