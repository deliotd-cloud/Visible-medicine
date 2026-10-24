// Mechanical application of reviewed source-role seams, never product edits.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-adjacent-regression-current',site=stage+'/website',proposal='F:/VisibleMedicine/staging/20261024-adjacent-native-execution/website';
const receipt=json('F:/VisibleMedicine/staging/20261024-adjacent-native-execution/RECEIPT.json'),records=[],copied=[];
const sha=b=>createHash('sha256').update(b).digest('hex');
function savePreimage(name,bytes){const p='tests/fixtures/adjacent-reviewed5e75/'+path.basename(name)+'.'+sha(bytes).slice(0,12)+'.raw';fs.mkdirSync(path.dirname(site+'/'+p),{recursive:true});if(!fs.existsSync(site+'/'+p))fs.writeFileSync(site+'/'+p,bytes,{flag:'wx'});else assert.equal(hash(site+'/'+p),sha(bytes),'Immutable preimage identity');return p;}
function copyReviewed(name){const from=proposal+'/'+name,r=receipt.files.find(r=>r.path===name);assert(r,name);assert.equal(hash(from),r.currentSha256,name);fs.mkdirSync(path.dirname(site+'/'+name),{recursive:true});const before=fs.existsSync(site+'/'+name)?hash(site+'/'+name):null;fs.copyFileSync(from,site+'/'+name);copied.push({path:name,before,reviewedSha256:r.currentSha256});}
function change(name,seams,label){const bytes=fs.readFileSync(site+'/'+name);let text=bytes.toString();const eol=text.includes('\r\n')?'\r\n':'\n';const actual=seams.map(([a,b])=>[a.replaceAll('\n',eol),b.replaceAll('\n',eol)]);for(const[a,b]of actual){assert.equal(text.split(a).length,2,name+': '+a.slice(0,80));text=text.replace(a,b);}const out=Buffer.from(text);fs.writeFileSync(site+'/'+name,out);records.push({name,label,beforeSha256:sha(bytes),afterSha256:sha(out),seams:actual,preimage:savePreimage(name,bytes)});}
for(const name of ['tests/arterial-history-preservation.test.mjs','tests/arterial-current-role-inverse.mjs','tests/tour-playback-role-inverse.mjs','tests/clinical-review-continuous-guided-playback.test.ts','tests/renal-tour-epoch-admission.test.mjs','tests/release-epoch-composition-preservation.test.mjs','tests/fixtures/renal-epoch-preimage/renal-tour-epoch-admission.mjs.raw'])copyReviewed(name);

// Admit the reviewed helper expansions by exact inverse seams, not by replacing
// a historical witness with a newly invented snapshot.
let text=fs.readFileSync(proposal+'/tests/tour-playback-source-role.mjs','utf8');
const historicalBlock=text.slice(text.indexOf('function historicalRenalHelperSource'),text.indexOf('export function assertCurrentTourAdditions'));
const latestBlock=text.slice(text.indexOf('export function assertLatestTourDelivery'),text.indexOf('export function assertCurrentGuidedReviewAdditions'));
change('tests/tour-playback-source-role.mjs',[
 ["const currentTree='0730550af7e5f8cc1d763d7326ca0a0c05458ca7';", "const currentTree='0730550af7e5f8cc1d763d7326ca0a0c05458ca7';\nconst latestSource='5e75b9ce7e46fed291748108edd7565c97dee101';\nconst latestTree='005b7656f517efbd86e32a282e3d7880fc052bfe';"],
 [" const source=readFileSync(helperSource,'utf8').replaceAll('\\r\\n','\\n');",' const source=historicalRenalHelperSource(helperSource);'],
 ['export function assertCurrentTourAdditions',historicalBlock+'export function assertCurrentTourAdditions'],
 ['export function assertCurrentGuidedReviewAdditions',latestBlock+'export function assertCurrentGuidedReviewAdditions'],
],'original-helper-to-reviewed5e75');
assert.equal(hash(site+'/tests/tour-playback-source-role.mjs'),'6811145340655e9cd80c066dc65a8fc8c116906979d978a3c70d5c7017b03546');

text=fs.readFileSync(proposal+'/tests/renal-tour-epoch-admission.mjs','utf8');
const constants=text.slice(text.indexOf("const latest='"),text.indexOf("const oldRevision='"));
const latestBinding=text.slice(text.indexOf('function assertLatestRenalSourceBinding'),text.indexOf('export function assertCurrentRenalSourceBinding'));
const additions=['assertCurrentRenalSourceBinding()','assertRenalTourEpoch(historical,currentTours)','assertRenalPortalPrefixEpoch(portal,currentTours)'].map(name=>{const marker='export function '+name+'{\n';const start=text.indexOf(marker)+marker.length;assert(start>=marker.length);let end;if(name==='assertCurrentRenalSourceBinding()')end=text.indexOf(' const pin=validateCurrentAtlasDelivery();',start);else end=text.indexOf(' assertCurrentRenalSourceBinding();',start);return[marker,marker+text.slice(start,end)];});
change('tests/renal-tour-epoch-admission.mjs',[
 ["import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';", "import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\nimport {assertHistoricalRenalTourEpoch,assertHistoricalRenalPortalPrefixEpoch,\n assertLatestTourDelivery} from './tour-playback-source-role.mjs';"],
 ["const current='2381efe43b75f8a7fb768a069eecd7268c508dac';", "const current='2381efe43b75f8a7fb768a069eecd7268c508dac';\n"+constants.trimEnd()],
 ['export function assertCurrentRenalSourceBinding',latestBinding+'export function assertCurrentRenalSourceBinding'],...additions,
],'original-renal-helper-to-reviewed5e75');
assert.equal(hash(site+'/tests/renal-tour-epoch-admission.mjs'),'38ae31b79ab7d0d307da83c92994d9937e63f175f00c8728b49d8f6f1bbb4188');

change('tests/arterial-history-preservation.test.mjs',[
 ['independent of current 5e75 delivery.','independent of current b79 delivery.'],
 [" assert.equal(CURRENT_ATLAS_REVISION,'5e75b9ce7e46fed291748108edd7565c97dee101','Explicit current source remains separately bound');", " assert.equal(CURRENT_ATLAS_REVISION,'b79e110d2d28f18993263926ba35aa7a3f478b20','Explicit current source remains separately bound');"],
],'arterial-current-b79');
change('tests/clinical-review-continuous-guided-playback.test.ts',[
 ["import {emittedTeaching} from './atlas-emitted-teaching.ts';", "import {emittedTeaching} from './atlas-emitted-teaching.ts';\nimport {assertCurrentTourDelivery,assertCompleteGuidedReview} from './adjacent-current-tour-source-role.mjs';"],
 ["const reviewedCurrentCommit='5e75b9ce7e46fed291748108edd7565c97dee101';", "const reviewedCurrentCommit='b79e110d2d28f18993263926ba35aa7a3f478b20';"],
 ["  assertLatestTourDelivery(renal.regionalTours,imported.regionalTours,{atlasRoot:atlas,sourceCommit:liveCommit});", "  assertCurrentTourDelivery(renal.regionalTours,imported.regionalTours,{atlasRoot:atlas,sourceCommit:liveCommit});"],
 ["  assertLatestTourDelivery(renal.regionalTours,current.regionalTours,{atlasRoot:atlas,sourceCommit:liveCommit});", "  assertCurrentTourDelivery(renal.regionalTours,current.regionalTours,{atlasRoot:atlas,sourceCommit:liveCommit});"],
 ["  const reasoningRevision='aa13c067197cad87bd0a9b2da5549bc4b33bfdf7';", "  const reasoningRevision='b79e110d2d28f18993263926ba35aa7a3f478b20';\n  assert.deepEqual(committed('5e75b9ce7e46fed291748108edd7565c97dee101','lib/reasoning-questions.ts'),\n    committed('aa13c067197cad87bd0a9b2da5549bc4b33bfdf7','lib/reasoning-questions.ts'),\n    'The original lower-limb reasoning theorem stays at its genuine5e75/aa13 source');"],
 ["    'Current reasoning equals the exact reviewed lower-limb arterial source');", "    'Current reasoning equals the separately authenticated b79 source');"],
 ["    assert.deepEqual(atPlayback.guidedTours,atEpoch.guidedTours, /* playback epoch only */", "    assert.deepEqual(atRenal.guidedTours,atEpoch.guidedTours, /* historical renal membership */"],
 ["    assertCurrentGuidedReviewAdditions(atRenal.guidedTours,after.guidedTours,current.regionalTours);", "    assertCurrentGuidedReviewAdditions(atRenal.guidedTours,after.guidedTours,current.regionalTours);\n    assertCompleteGuidedReview(structure.id,atRenal.guidedTours,after.guidedTours,current.regionalTours);"],
],'playback-current-b79-and-complete-membership');
change('tests/renal-tour-epoch-admission.mjs',[
 ["import {fileURLToPath} from 'node:url';", "import {fileURLToPath} from 'node:url';\nimport {assertCurrentTourSource,assertCurrentTourDelivery} from './adjacent-current-tour-source-role.mjs';"],
 ['export function assertCurrentRenalSourceBinding(){',"export function assertCurrentRenalSourceBinding(){\n if(CURRENT_ATLAS_REVISION==='b79e110d2d28f18993263926ba35aa7a3f478b20')return assertCurrentTourSource();"],
 ['export function assertRenalTourEpoch(historical,currentTours){',"export function assertRenalTourEpoch(historical,currentTours){\n if(CURRENT_ATLAS_REVISION==='b79e110d2d28f18993263926ba35aa7a3f478b20'){\n  const root=currentAtlasDeliveryRoot(),renalEra=currentTours.slice(0,51);\n  assertCurrentTourSource({atlasRoot:root});\n  assertHistoricalRenalTourEpoch(historical,renalEra,{atlasRoot:root,helperSource:new URL('./renal-tour-epoch-admission.mjs',import.meta.url)});\n  assertCurrentTourDelivery(renalEra,currentTours,{atlasRoot:root,sourceCommit:CURRENT_ATLAS_REVISION});return;\n }"],
 ['export function assertRenalPortalPrefixEpoch(portal,currentTours){',"export function assertRenalPortalPrefixEpoch(portal,currentTours){\n if(CURRENT_ATLAS_REVISION==='b79e110d2d28f18993263926ba35aa7a3f478b20'){\n  const root=currentAtlasDeliveryRoot(),renalEra=currentTours.slice(0,51);\n  assertCurrentTourSource({atlasRoot:root});\n  assertHistoricalRenalPortalPrefixEpoch(portal,renalEra,{atlasRoot:root,helperSource:new URL('./renal-tour-epoch-admission.mjs',import.meta.url)});\n  assertCurrentTourDelivery(renalEra,currentTours,{atlasRoot:root,sourceCommit:CURRENT_ATLAS_REVISION});return;\n }"],
],'renal-b79-separate-branch');
change('tests/renal-tour-epoch-admission.test.mjs',[
 ["import {restorePlaybackSourceRole} from './tour-playback-role-inverse.mjs';", "import {restorePlaybackSourceRole} from './tour-playback-role-inverse.mjs';\nimport {assertCurrentTourDelivery} from './adjacent-current-tour-source-role.mjs';"],
 ["  sourceCommit:'5e75b9ce7e46fed291748108edd7565c97dee101'});", "  sourceCommit:'5e75b9ce7e46fed291748108edd7565c97dee101'});\n assertCurrentTourDelivery(renalEra.regionalTours,review.regionalTours,{atlasRoot:atlas,sourceCommit:'b79e110d2d28f18993263926ba35aa7a3f478b20'});"],
 ["assert.equal(admitPreservedClinicalReview({revision:old,sourceHashes,learnerModules:['head-neck']}),'5e75b9ce7e46fed291748108edd7565c97dee101');", "assert.equal(admitPreservedClinicalReview({revision:old,sourceHashes,learnerModules:['head-neck']}),'b79e110d2d28f18993263926ba35aa7a3f478b20');"],
 ["assert.equal(admitPreservedClinicalReview({revision:old,sourceHashes:sharedHashes,learnerModules:['head-neck','shoulder']}),'5e75b9ce7e46fed291748108edd7565c97dee101');", "assert.equal(admitPreservedClinicalReview({revision:old,sourceHashes:sharedHashes,learnerModules:['head-neck','shoulder']}),'b79e110d2d28f18993263926ba35aa7a3f478b20');"],
],'renal-consumer-b79-with-real-history-retained');

// The original preservation theorem remains the exact reviewed0bc body. The
// earlier lower-limb test has a separate exact inverse back to its bb89 hook.
const release=fs.readFileSync(site+'/tests/release-epoch-composition-preservation.test.mjs');
let lower=release.toString();const releaseSeams=[];
for(const line of ["import {restoreArterialCurrentRole} from './arterial-current-role-inverse.mjs';\n","import {restoreHandCurrentRole} from './hand-current-role-inverse.mjs';\n","import {restoreShoulderCurrentRole} from './shoulder-current-role-inverse.mjs';\n","import {restoreClinicalStructureCurrentRole} from './clinical-structure-current-role-inverse.mjs';\n",
 "if(row.path==='tests/arterial-history-preservation.test.mjs')bytes=restoreArterialCurrentRole(bytes);","if(row.path==='tests/clinical-review-hand-arterial-xray.test.ts')bytes=restoreHandCurrentRole(bytes);","if(['tests/clinical-review-elbow-us-followup.test.ts','tests/clinical-review-forearm-vascular-xray.test.ts'].includes(row.path))bytes=restoreShoulderCurrentRole(row.path.slice(6),bytes);","if(['tests/clinical-review-axillary-branch-xray.test.ts','tests/clinical-review-girdle-muscle-xray.test.ts'].includes(row.path))bytes=restoreClinicalStructureCurrentRole(row.path.slice(6),bytes);"]){assert.equal(lower.split(line).length,2);lower=lower.replace(line,'');releaseSeams.push(['',line]);}
assert.equal(sha(lower),'bb89e3cc046c21483093e8029ed9a2eca31e9029dd107d29a50af79fd4ab1e24');
// Use exact unique removal records; empty before strings are never replayed.
records.push({name:'release-to-lower',label:'reviewed-preservation-to-lower-parent',beforeSha256:sha(lower),afterSha256:sha(release),removals:releaseSeams.map(r=>r[1])});

const inverseFile=site+'/tests/adjacent-current-role-inverse.mjs';
const moduleSource="// Generated exact inverse data for declared test-only seams.\nimport assert from 'node:assert/strict';import {createHash} from 'node:crypto';\nconst sha=b=>createHash('sha256').update(b).digest('hex');\nexport const adjacentRoleRecords="+JSON.stringify(records,null,2)+";\nexport function restoreAdjacentSharedRole(name,bytes){const rows=adjacentRoleRecords.filter(r=>r.name===name);assert(rows.length,'Declared adjacent role only');for(const r of rows.toReversed()){assert.equal(sha(bytes),r.afterSha256,'Exact complete adjacent current source: '+r.label);let text=bytes.toString();if(r.removals){for(const value of r.removals){assert.equal(text.split(value).length,2);text=text.replace(value,'');}}else for(const [before,after]of r.seams.toReversed()){assert.equal(text.split(after).length,2,'One declared inverse seam');text=text.replace(after,before);}bytes=Buffer.from(text);assert.equal(sha(bytes),r.beforeSha256,'Whole prior adjacent source: '+r.label);}return bytes;}\n";
fs.writeFileSync(inverseFile,moduleSource,{flag:'wx'});
// Wrappers authenticate the new b79 endpoint, then execute the complete original
// audited inverse, not a regex replacement that forgets its old assertions.
for(const [name,fn,subject]of [['tests/arterial-current-role-inverse.mjs','restoreArterialCurrentRole','tests/arterial-history-preservation.test.mjs'],['tests/tour-playback-role-inverse.mjs','restorePlaybackSourceRole','tests/clinical-review-continuous-guided-playback.test.ts']]){
 let source=fs.readFileSync(site+'/'+name,'utf8');const before=sha(source);savePreimage(name,Buffer.from(source));source="import {restoreAdjacentSharedRole} from './adjacent-current-role-inverse.mjs';\n"+source;const start='export function '+fn+'(bytes){';assert.equal(source.split(start).length,2);source=source.replace(start,start+"\n bytes=restoreAdjacentSharedRole('"+subject+"',bytes);");fs.writeFileSync(site+'/'+name,source);copied.push({path:name,beforeWrappedSha256:before,wrappedSha256:sha(source),wrapper:{fn,subject}});
}
const lowerTest='tests/lower-limb-current-source-roles.test.mjs';
let source=fs.readFileSync(site+'/'+lowerTest,'utf8');const lowerBefore=sha(source);savePreimage(lowerTest,Buffer.from(source));
source="import {restoreAdjacentSharedRole} from './adjacent-current-role-inverse.mjs';\n"+source;source=source.replace('function restoreRelease(bytes){',"function restoreRelease(bytes){\n bytes=restoreAdjacentSharedRole('release-to-lower',bytes);");fs.writeFileSync(site+'/'+lowerTest,source);copied.push({path:lowerTest,beforeWrappedSha256:lowerBefore,wrappedSha256:sha(source),lowerWrapper:true});
fs.writeFileSync(stage+'/MAIN_TRANSITION.json',JSON.stringify({at:new Date().toISOString(),records,copied,generatedInverseSha256:hash(inverseFile),testOnly:true,previewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({records:records.length,copied:copied.length,inverseSha256:hash(inverseFile),previewChanged:false}));
