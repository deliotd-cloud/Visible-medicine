import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
export function overlayRuntimeTestRepairs({priorReceipt,outputReceipt,packets,priorTerminal}){
 const prior=json(priorReceipt),terminal=json(priorTerminal),rows=new Map(prior.sourceRows.map(row=>[row.path,row]));
 assert.equal(terminal.terminal,true);assert.deepEqual(terminal.sourceDrift,[]);assert(!fs.existsSync(outputReceipt));
 for(const row of rows.values())assert.equal(sha(read(prior.website+'/'+row.path)),row.sha256,'Closed prior candidate: '+row.path);
 const edits=[];
 for(const packet of packets)for(const relative of packet.paths){
  assert(relative.startsWith('tests/'));const destination=containedTarget(prior.website,relative),from=containedTarget(packet.stage+'/CODE',relative);
  const existing=rows.get(relative),raw=packet.stage+'/RAW/'+relative;
  if(existing){assert(fs.existsSync(raw));assert.equal(sha(read(raw)),existing.sha256,'Exact selected predecessor: '+relative);}
  else assert(!fs.existsSync(destination));
  const bytes=read(from);assert(!bytes.includes(0));assert(Buffer.from(bytes.toString('utf8')).equals(bytes));
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(from,destination);
  const row={path:relative,bytes:bytes.length,sha256:sha(bytes)};rows.set(relative,row);edits.push({...row,from,beforeSha256:existing?.sha256??null});
 }
 const sourceRows=[...rows.values()].sort((a,b)=>a.path.localeCompare(b.path));
 for(const row of sourceRows)assert.equal(sha(read(prior.website+'/'+row.path)),row.sha256);
 const result={...prior,at:new Date().toISOString(),priorReceipt,priorReceiptSha256:sha(read(priorReceipt)),priorTerminal,
  subsequentTestOverlays:[...(prior.subsequentTestOverlays??[]),...edits],sourceRows,phase:'exact-test-correction-native-rerun-pending'};
 fs.writeFileSync(outputReceipt,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({receipt:outputReceipt,sha256:sha(read(outputReceipt)),changed:edits.length,sourcePaths:sourceRows.length,ownerPreviewChanged:false}));
 return result;
}
if(process.argv[2]==='--v2'){
 const root='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
 overlayRuntimeTestRepairs({priorReceipt:root+'/PRODUCT_SOURCE.json',outputReceipt:root+'/PRODUCT_SOURCE_V2.json',priorTerminal:root+'/native-mri-runtime/TERMINAL.json',packets:[
  {stage:'F:/VisibleMedicine/staging/20261022-regional-mri-runtime-linking-v2',paths:['tests/regional-mri-body-focus.test.ts','tests/regional-mri-body-runtime.test.ts']},
  {stage:'F:/VisibleMedicine/staging/20261022-regional-runtime-draft-ui-preservation',paths:['tests/review-navigation-six-harness-preservation.test.mjs','tests/regional-reference-draft-ui-source-inverse.mjs','tests/fixtures/regional-reference-draft-ui-prior/regional-reference-draft-ui.test.ts.raw']},
 ]});
}
if(process.argv[2]==='--v3'){
 const root='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
 overlayRuntimeTestRepairs({priorReceipt:root+'/PRODUCT_SOURCE_V2.json',outputReceipt:root+'/PRODUCT_SOURCE_V3.json',priorTerminal:root+'/quality-review-v2/TERMINAL.json',packets:[
  {stage:'F:/VisibleMedicine/staging/20261022-regional-runtime-index-history',paths:['tests/regional-reference-review-index.test.ts','tests/regional-link-role-preservation-20261021.test.mjs','tests/regional-reference-index-source-inverse.mjs','tests/fixtures/regional-reference-index-prior/regional-reference-review-index.test.ts.raw']},
  {stage:'F:/VisibleMedicine/staging/20261022-thoracic-eus-binding-name',paths:['tests/clinical-review-thoracic-eus.test.ts']},
 ]});
}
