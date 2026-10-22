// Separate LF checkout of the same immutable commit. Never rewrites a verified checkout.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const receipt='F:/VisibleMedicine/recovery/checkpoints/20261022-renal-tour-source-verified/SOURCE.json';
assert.equal(sha(read(receipt)),'b594ff4d1008a6368c52f50054eb817b590e1b372db66f55625a49dc1d07e014');
const source=json(receipt),root='F:/VisibleMedicine/staging/20261022-renal-canonical-checkout',atlas=root+'/atlas';assert(!fs.existsSync(root));
const failed='F:/VisibleMedicine/staging/20261022-renal-tour-website-candidate/SOURCE_IMPORT_FAILED.json';
assert(read(failed).toString().includes('Coverage evidence unchanged: content/corpus-clinical.ts'));
assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.head);
assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
runGit(['-c','core.autocrlf=false','-c','core.eol=lf','clone','--shared','--config','core.autocrlf=false','--config','core.eol=lf',source.atlas,atlas]);
fs.symlinkSync('F:/VisibleMedicine/atlas/node_modules',atlas+'/node_modules','junction');
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),source.head);
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD^{tree}']).toString().trim(),source.tree);
assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
const names=new Set(source.sourceRows.map(r=>r.path));
const website='F:/VisibleMedicine/staging/20261022-current-consumer-assurance-successor/website';
for(const scope of ['root','nested','independent','reference'])for(const p of Object.keys(json(website+'/docs/anatomy-coverage/'+scope+'.json').evidence.sourceInputs))names.add(p);
for(const row of json('F:/VisibleMedicine/staging/20261022-renal-tour-runtime-candidate/export/public/atlas-runtime/head-neck/source-inputs.json'))names.add(row.path);
const selected=[...names].sort();assert(selected.length<3000);
const entries=runGit(['-C',atlas,'ls-tree','-r','-z',source.head]).toString().split('\0').filter(Boolean).map(line=>{const [header,p]=line.split('\t');return [p,header.split(' ')[2]];});
const blobs=new Map(entries),rows=[],precedingRepresentations=[];
for(let i=0;i<selected.length;i+=16){const batch=selected.slice(i,i+16),output=runGit(['-C',atlas,'cat-file','--batch'],Buffer.from(batch.map(p=>{assert(blobs.has(p));return blobs.get(p);}).join('\n')+'\n'));let cursor=0;
 for(const p of batch){const end=output.indexOf(10,cursor),[blob,type,length]=output.subarray(cursor,end).toString().split(' ');assert.equal(blob,blobs.get(p));assert.equal(type,'blob');cursor=end+1;
  const committed=output.subarray(cursor,cursor+Number(length));cursor+=Number(length);assert.equal(output[cursor++],10);const current=read(atlas+'/'+p);assert.deepEqual(current,committed,'Exact Git-byte working input: '+p);
  const old=read(source.atlas+'/'+p);if(!old.equals(committed)){
   const text=committed.toString('utf8');assert(!committed.includes(0));assert.deepEqual(Buffer.from(text),committed);assert(!text.includes('\r'));
   assert.deepEqual(old,Buffer.from(text.replaceAll('\n','\r\n')),'Only the preceding checkout has an exact CRLF expansion: '+p);
   precedingRepresentations.push({path:p,gitSha256:sha(committed),priorCheckoutSha256:sha(old)});
  }
  rows.push({path:p,bytes:current.length,sha256:sha(current)});
 }assert.equal(cursor,output.length);
}
const result={at:new Date().toISOString(),atlas,head:source.head,tree:source.tree,clean:true,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourceRows:rows,
 coverageAndRuntimeAndChangedSourceInputsExactGitBytes:true,precedingRepresentations,priorFailedImport:failed,workingTreeNormalizationPerformed:false,
 newCheckoutLocalConfig:{autocrlf:false,eol:'lf'},globalSettingsChanged:false,typesAndBuildPending:true,containedExportPending:true,
 canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/SOURCE.json',sha256:sha(read(root+'/SOURCE.json')),sourcePaths:rows.length,exactPrecedingCRLFRepresentations:precedingRepresentations.length,head:source.head,tree:source.tree,ownerPreviewChanged:false}));
