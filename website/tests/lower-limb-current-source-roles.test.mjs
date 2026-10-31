import {restoreAdjacentSharedRole} from './adjacent-current-role-inverse.mjs';
// Test-only current/historical role separation; not an approval or pin author.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {restoreLowerLimbCurrentRole} from './lower-limb-current-role-inverse.mjs';
import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {restoreRelease18LowerComposition} from './release18-lower-composition-inverse.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=file=>readFileSync(new URL(file,import.meta.url));
const parentFile='F:/VisibleMedicine/staging/20261024-cervical-vascular-website/SOURCE_BOUND.json';
const parentBytes=readFileSync(parentFile);
assert.equal(sha(parentBytes),'d2c288a5be7b54dda220a0f539e72c15988f63543124323c5b08c60533950df2');
const parent=JSON.parse(parentBytes),pre='fixtures/lower-limb-b79-preimage/';
const consumer=read('./clinical-review-lower-limb-connective-xray.test.ts');

test('complete lower-limb consumer and all four old source witnesses remain exact',()=>{
 const previous=restoreLowerLimbCurrentRole(consumer);
 assert.equal(sha(previous),'dea27b090f230482979e97ec1ff54b5343f8c830885a0e49d09a69e7e5cc2fa6');
 assert.deepEqual(previous,read(pre+'clinical-review-lower-limb-connective-xray.test.ts.raw'));
 for(const file of ['lower-limb-display-pin-history.mjs','lower-limb-display-pin-history.test.mjs',
  'clinical-review-lower-limb-connective-xray.test.ts','release-epoch-composition-preservation.test.mjs'])
  assert.equal(sha(read(pre+file+'.raw')),parent.sourceRows.find(r=>r.path==='tests/'+file)?.sha256,file);
 for(const changed of [Buffer.concat([consumer,Buffer.from('/* foreign */')]),
  Buffer.from(consumer.toString().replace('assert.equal(changed,4);','assert.equal(changed,3);')),
  Buffer.from(consumer.toString().replace("assert.equal(currentPin.runtimeSources.shoulder,revision,", "assert.equal(currentPin.runtimeSources.shoulder,priorRevision,"))])
  assert.throws(()=>restoreLowerLimbCurrentRole(changed));
 const flipped=Buffer.from(consumer);flipped[0]^=1;assert.throws(()=>restoreLowerLimbCurrentRole(flipped));
});

function restoreRelease(bytes){
 bytes=restoreRelease18LowerComposition(bytes);
 bytes=restoreAdjacentSharedRole('release-to-lower',bytes);
 assert.equal(sha(bytes),'bb89e3cc046c21483093e8029ed9a2eca31e9029dd107d29a50af79fd4ab1e24');
 let source=bytes.toString();
 for(const [after,before]of [
  ["import {restorePlaybackSourceRole} from './tour-playback-role-inverse.mjs';\nimport {restoreLowerLimbCurrentRole} from './lower-limb-current-role-inverse.mjs';", "import {restorePlaybackSourceRole} from './tour-playback-role-inverse.mjs';"],
  ["if(row.path==='tests/clinical-review-lower-limb-connective-xray.test.ts')bytes=restoreLowerLimbCurrentRole(bytes);assert.equal(sha(bytes),row.after,'Exact reviewed composed source');", "assert.equal(sha(bytes),row.after,'Exact reviewed composed source');"],
 ]){assert.equal(source.split(after).length,2);source=source.replace(after,before);}
 const previous=Buffer.from(source);
 assert.equal(sha(previous),'b7ae9527cab549c1af47985b08dc03e22b730660ec08ef0db69cbf4c3bd37efd');
 return previous;
}
test('whole twelve-repair preservation theorem keeps its original negatives after the narrow hook',()=>{
 const bytes=read('./release-epoch-composition-preservation.test.mjs');
 assert.deepEqual(restoreRelease(bytes),read(pre+'release-epoch-composition-preservation.test.mjs.raw'));
 for(const bad of [Buffer.concat([bytes,Buffer.from('/* foreign */')]),
  Buffer.from(bytes.toString().replace('assert.throws(()=>inverse(row,forged));','')),
  Buffer.from(bytes.toString().replace('bytes=restoreLowerLimbCurrentRole(bytes);',''))])
  assert.throws(()=>restoreRelease(bad));
});

test('historical b79 and exact current c32 pin successions retain every source change',()=>{
 const root=currentAtlasDeliveryRoot(),file='content/body-review-display-pins.json';
 const historical='b79e110d2d28f18993263926ba35aa7a3f478b20';
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true,
  maxBuffer:4e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
 assert.equal(git('merge-base',historical,CURRENT_ATLAS_REVISION),historical,
  'Original b79 pin history is an ancestor of current source');
 const helper=read('./lower-limb-display-pin-history.mjs').toString();
 const table=helper.slice(helper.indexOf('const laterPinEpochs=['),helper.indexOf('const colic=['));
 const rows=[...table.matchAll(/\['([a-f0-9]{40})','([a-f0-9]{64})',(\d+),'([a-f0-9]{64})'\]/g)];
 const actual=git('log','--reverse','--format=%H','4f20ae0b62b9e0dab5936b430575a983dcdd934e..'+historical,'--',file).split('\n');
 assert.deepEqual(rows.map(row=>row[1]),actual,'No historical pin-changing commit omitted or inserted');
 assert.equal(rows.length,11);
 for(const row of rows)assert.equal(git('rev-parse',row[1]+'^{commit}'),row[1],'Full immutable source identity');
 const successionBytes=read('./fixtures/release18-lower/display-pin-c32-succession.json');
 assert.equal(sha(successionBytes),'d11bf0d9f1daf4b0cc784181f871195730ba65be257fc8e3dcf0ae86c13c2c39');
 const succession=JSON.parse(successionBytes);
 assert.equal(succession.from,historical);
 assert.equal(succession.to,CURRENT_ATLAS_REVISION);
 assert.equal(succession.fromSha256,rows.at(-1)[2]);
 const later=git('log','--reverse','--format=%H',historical+'..'+CURRENT_ATLAS_REVISION,'--',file).split('\n');
 assert.deepEqual(succession.rows.map(row=>row.commit),later,'No current pin-changing commit omitted or inserted');
 const readGit=(revision)=>execFileSync('git',['show',revision+':'+file],{cwd:root,windowsHide:true,
  maxBuffer:4e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.equal(sha(readGit(historical)),succession.fromSha256,'Exact complete b79 pin document');
 assert.equal(sha(readGit(CURRENT_ATLAS_REVISION)),succession.toSha256,'Exact complete c32 pin document');
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 const imported=read('../atlas-review/'+file);
 assert.deepEqual(imported,readGit(CURRENT_ATLAS_REVISION),'Complete current imported pin document');
 const review=JSON.parse(read('../atlas-review/manifest.json'));
 const record=review.files.find(row=>row.path===file);assert(record);
 assert.equal(record.sourceSha256,succession.toSha256);
 assert.equal(record.importedSha256,sha(imported));
});
