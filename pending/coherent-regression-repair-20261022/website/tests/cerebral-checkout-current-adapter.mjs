// Compose exact later source transitions before the unchanged historical theorem.
// No website modules, validators, transpilers or test runners are loaded here.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const priorSha='15e7fe631d748d679dc8f7329916d051235abab6b22d3ce4da7f95412838b078';
const schemaSha='eae0849920889e68d540f0aa1c1df482c3a02b062704ce0fe0e80943e7ef6e94';
const currentSha='93fcf9f89188d0a7a7fa028896b3504e339a177f33fe168e6a19e75446d6a9f2';
const text=bytes=>{assert(Buffer.isBuffer(bytes));const value=bytes.toString('utf8');assert(Buffer.from(value).equals(bytes),'Lossless UTF-8 source');return value;};
function exchange(source,before,after){assert.equal(source.split(before).length,2,'Exactly one declared source seam');return source.replace(before,after);}

// These three transitions are separately witnessed by atlas-cerebral-schema-
// preservation.test.mjs. Full authenticated preimages, not arbitrary substrings,
// supply their old/new blocks; complete forward and inverse equality is required.
const bounds=[
 ["import {verifyMetadataTextCheckout} from './atlas-metadata-text-checkout.mjs';\r\n",'\r\ntest('],
 ["  const closedRead=(path:string)=>readFileSync(new URL('./fixtures/closed59-documents/'+path,import.meta.url));\r\n", "  assert.equal(sha(closedRead('public/atlas-runtime/head-neck/source-inputs.json'))"],
 ["  assert(!liveReview.files.some((entry:any)=>entry.path===licenseMetadataPath),'License evidence is metadata, not a rewritten Review import');\r\n", "  assert.deepEqual(json('lib/atlas-model-inventory.json').models,"],
];
function region(source,[start,end]){
 assert.equal(source.split(start).length,2,'Unique schema start anchor');
 const from=source.indexOf(start)+start.length,to=source.indexOf(end,from);
 assert(to>=from,'Schema end follows start');return {from,to};
}
export function restoreCerebralCheckoutCandidate(currentBytes,schemaBytes,priorBytes){
 assert.equal(sha(currentBytes),currentSha,'Exact current typed cerebral test');
 assert.equal(sha(schemaBytes),schemaSha,'Exact previous schema-admitted source');
 assert.equal(sha(priorBytes),priorSha,'Exact original checkout-admitted source');
 const current=text(currentBytes),schema=text(schemaBytes),prior=text(priorBytes);
 const untyped=exchange(current,'closedPin,(path:string)=>','closedPin,path=>');
 assert.equal(untyped,schema,'One type-only seam recovers the whole previous source');
 let inverse=schema,forward=prior;
 for(const seam of bounds){
  const old=region(prior,seam),next=region(schema,seam);
  const oldPart=prior.slice(old.from,old.to),newPart=schema.slice(next.from,next.to);
  const i=region(inverse,seam),f=region(forward,seam);
  inverse=inverse.slice(0,i.from)+oldPart+inverse.slice(i.to);
  forward=forward.slice(0,f.from)+newPart+forward.slice(f.to);
 }
 assert.equal(inverse,prior,'Only three authenticated schema seams recover the whole checkout candidate');
 assert.equal(forward,schema,'Three authenticated seams reproduce the complete schema source');
 return Buffer.from(inverse);
}

export function verifyCurrentCommittedBinding(row,committed,working){
 assert(Buffer.isBuffer(committed)&&Buffer.isBuffer(working));
 assert.equal(row.sha256,sha(committed),'Current learner manifest binds committed source bytes');
 if(working.equals(committed))return true;
 assert.equal(row.path,'LICENSES/bodyparts3d-license-evidence.html','Only the documented licence checkout may differ');
 assert.equal(committed.length,14682,'Exact committed licence evidence length');
 assert.equal(working.length,14694,'Exact licence checkout length');
 assert.equal(sha(committed),'7a873d9c6ed62578a7ee5603d68d6a8fbf6e3ccc0b52db6a3ad8b952f8cf7271');
 assert.equal(sha(working),'90dea95329aea5015ce339e430d9f342090617c82ee48613e15dd2240f08b746');
 const value=text(working);
 assert.equal((value.match(/\r\n/g)||[]).length,12,'Exactly twelve licence CRLF pairs');
 assert(!value.includes('\0')&&!value.replaceAll('\r\n','').includes('\r'),'No NUL or bare CR');
 assert(Buffer.from(value.replaceAll('\r\n','\n')).equals(committed),'Exact licence inverse to committed Git bytes');
 return true;
}
