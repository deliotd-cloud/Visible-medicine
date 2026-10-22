import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {json,read,sha} from './source-only-backup-20261019.mjs';

// Mechanical byte evidence only. The reviewer still executes each source theorem.
export function fullSourceInverse(priorBytes,currentBytes){
 const before=priorBytes.toString('utf8'),after=currentBytes.toString('utf8');
 assert(Buffer.from(before).equals(priorBytes)&&Buffer.from(after).equals(currentBytes));
 const oldLines=before.split('\n'),newLines=after.split('\n');
 assert(oldLines.length<65535&&newLines.length<65535);
 assert(oldLines.length*newLines.length<=4_000_000,'Bound this mechanical source comparison');
 const lengths=Array.from({length:oldLines.length+1},()=>new Uint16Array(newLines.length+1));
 for(let i=oldLines.length-1;i>=0;i--)for(let j=newLines.length-1;j>=0;j--)
  lengths[i][j]=oldLines[i]===newLines[j]?lengths[i+1][j+1]+1:Math.max(lengths[i+1][j],lengths[i][j+1]);
 let i=0,j=0,open=null;const edits=[];
 const finish=()=>{if(open){edits.push(open);open=null;}};
 while(i<oldLines.length||j<newLines.length){
  if(i<oldLines.length&&j<newLines.length&&oldLines[i]===newLines[j]){finish();i++;j++;continue;}
  if(!open)open={at:j,removed:[],added:[]};
  if(i<oldLines.length&&(j===newLines.length||lengths[i+1][j]>=lengths[i][j+1]))open.removed.push(oldLines[i++]);
  else open.added.push(newLines[j++]);
 }
 finish();const restored=[...newLines];
 for(const edit of edits.toReversed()){
  assert.deepEqual(restored.slice(edit.at,edit.at+edit.added.length),edit.added);
  restored.splice(edit.at,edit.added.length,...edit.removed);
 }
 assert.deepEqual(Buffer.from(restored.join('\n')),priorBytes,'Full byte source inverse, including every old assertion');
 return edits.map(edit=>({at:edit.at,removedLines:edit.removed.length,addedLines:edit.added.length,
  removedSha256:sha(edit.removed.join('\n')),addedSha256:sha(edit.added.join('\n'))}));
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [stage,...names]=process.argv.slice(2);
 assert(stage?.startsWith('F:/VisibleMedicine/staging/'));assert(names.length>0&&new Set(names).size===names.length);
 const receipt='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/PRODUCT_SOURCE_V5.json';
 assert.equal(sha(read(receipt)),'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f');
 const source=json(receipt),rows=new Map(source.sourceRows.map(row=>[row.path,row]));
 const files=names.map(name=>{
  assert(/^[a-z0-9.-]+\.(?:mjs|ts)$/.test(name));
  const relative='tests/'+name,rawPath=stage+'/RAW/'+relative,codePath=stage+'/CODE/'+relative;
  const prior=read(rawPath),current=read(codePath),row=rows.get(relative);
  assert(row);assert.equal(sha(prior),row.sha256);assert.deepEqual(read(source.website+'/'+relative),prior);
  return {path:relative,rawPath,codePath,beforeSha256:sha(prior),codeSha256:sha(current),hunks:fullSourceInverse(prior,current)};
 });
 const result={at:new Date().toISOString(),sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),files,
  textualInverseOnlyNotAssertionAcceptance:true,nativeExecuted:false,candidateChanged:false,ownerPreviewChanged:false};
 const output=stage+'/MAIN_BYTE_INVERSE.json';assert(!fs.existsSync(output));
 fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({receipt:output,sha256:sha(read(output)),files:files.length,fullByteInverses:true,nativeExecuted:false}));
}
