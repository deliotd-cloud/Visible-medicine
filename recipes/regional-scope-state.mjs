import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='F:/VisibleMedicine/staging/20261028-regional-scope-recipes';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function saveIndex(index){
 const file='CURRENT_CHECKPOINT.json',old=fs.readFileSync(file),out=Buffer.from(JSON.stringify(index)+'\n');
 fs.writeFileSync(root+'/INDEX_LATEST.json',out);
 if(out.length>old.length)throw Error('Current index growth requires free C space; latest durable index is on F.');
 // Reuse the already allocated file; trailing JSON whitespace reserves space
 // for transient process handles even while C has no unallocated capacity.
 const padded=Buffer.concat([out,Buffer.alloc(old.length-out.length,32)]);
 const fd=fs.openSync(file,'r+');try{assert.equal(fs.writeSync(fd,padded),padded.length);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 assert.deepEqual(JSON.parse(fs.readFileSync(file)),JSON.parse(out));
}
if(process.argv[2]==='compact'){
 const i=JSON.parse(fs.readFileSync('CURRENT_CHECKPOINT.json')),ref=i.activeWork.current.coordinationDiskRecovery;
 const archived=JSON.parse(fs.readFileSync(ref.path));assert.equal(sha(fs.readFileSync(ref.path)),ref.sha256);
 for(const key of ['savedHistoricalFieldIndex','pendingKeyboardGuide','pendingQuickCheckFocus','pendingCatalogueLayout','pendingTourStepEntry']){
  assert.deepEqual(i.activeWork.current[key],archived.activeWork.current[key]);
  i.activeWork.current[key]={historicalRecord:{path:ref.path,sha256:ref.sha256,jsonPath:'activeWork.current.'+key}};
 }
 saveIndex(i);console.log('Historical details preserved on F; process-handle space reserved in current index.');
}
if(process.argv[2]==='init'){
 const bytes=fs.readFileSync('CURRENT_CHECKPOINT.json'),backup=root+'/CURRENT_INDEX_BEFORE.json';
 fs.writeFileSync(backup,bytes,{flag:'wx'});assert.equal(sha(fs.readFileSync(backup)),sha(bytes));
 const i=JSON.parse(bytes);i.activeWork.current.coordinationDiskRecovery={path:backup,sha256:sha(bytes),reason:'C drive full; recipes, temporary files and evidence use F. Existing index compacted without changing its data.'};
 saveIndex(i);console.log(JSON.stringify({saved:backup,indexBytes:fs.statSync('CURRENT_CHECKPOINT.json').size}));
}
