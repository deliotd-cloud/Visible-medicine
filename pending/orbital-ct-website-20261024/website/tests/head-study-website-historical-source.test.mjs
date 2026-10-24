import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {headStudyReceiptPath,readHeadStudySource,validateHeadStudySourceBytes} from './head-study-website-historical-source.mjs';

const site=fileURLToPath(new URL('../',import.meta.url));
const preimages='F:/VisibleMedicine/staging/20261024-orbital-ct-head-history-proposal/preimages';
const sha=b=>createHash('sha256').update(b).digest('hex');
const undo=(text,next,old)=>{
 assert.equal(text.split(next).length,2,'One exact history seam');
 return text.replace(next,old);
};

test('both complete original test files reconstruct byte for byte',()=>{
 const rows=[
  {
   name:'head-study-set-display-epoch.test.mjs',
   original:'7affdcc8b4d3c29ef942df8145fa5d756412391fd870cd4f50a4684c546599d4',
   seams:[
    ["import {headStudyWebsiteRoot,readHeadStudySource} from './head-study-website-historical-source.mjs';\n",''],
    ["const root=headStudyWebsiteRoot,stage='F:/VisibleMedicine/staging/20261024-head-study-set-website',read=p=>readHeadStudySource(p),sha=b=>createHash('sha256').update(b).digest('hex');",
     "const root=fileURLToPath(new URL('../',import.meta.url)),stage='F:/VisibleMedicine/staging/20261024-head-study-set-website',read=p=>readFileSync(root+'/'+p),sha=b=>createHash('sha256').update(b).digest('hex');"],
   ],
  },
  {
   name:'head-study-set-website-composition.test.mjs',
   original:'49a7b31cf1aa3721b3e0e1947d96ee9239e2c3232fb2f0365c175df82d9bb7dc',
   seams:[
    ["import {headStudyWebsiteRoot,readHeadStudySource} from './head-study-website-historical-source.mjs';\n",''],
    ['const site=headStudyWebsiteRoot;',"const site=fileURLToPath(new URL('../',import.meta.url));"],
    ['const bytes=(root,path)=>root===site?readHeadStudySource(path):readFileSync(resolve(root,path));',
     'const bytes=(root,path)=>readFileSync(resolve(root,path));'],
   ],
  },
 ];
 for(const row of rows){
  const preimage=readFileSync(preimages+'/'+row.name+'.raw');
  assert.equal(sha(preimage),row.original,row.name+': sealed original test');
  let text=readFileSync(site+'/tests/'+row.name,'utf8');
  for(const[next,old]of row.seams)text=undo(text,next,old);
  assert.deepEqual(Buffer.from(text),preimage,row.name+': complete original test bytes and assertions');
 }
});

test('fixed historical source refuses foreign and tampered reads',()=>{
 const receipt=readFileSync(headStudyReceiptPath);
 const path='tests/head-study-set-current-display.mjs';
 const genuine=readHeadStudySource(path);
 assert.deepEqual(validateHeadStudySourceBytes(path,genuine,receipt),genuine);
 assert.throws(()=>readHeadStudySource('tests/not-a-registered-head-study-source.mjs'),/unregistered/);
 assert.throws(()=>validateHeadStudySourceBytes('tests/not-a-registered-head-study-source.mjs',genuine,receipt),/unregistered/);
 assert.throws(()=>validateHeadStudySourceBytes(path,Buffer.concat([genuine,Buffer.from('foreign')]),receipt));
 const stale=Buffer.from(genuine);stale[0]^=1;
 assert.throws(()=>validateHeadStudySourceBytes(path,stale,receipt),/historical source drift/);
 const forgedReceipt=Buffer.from(receipt);forgedReceipt[0]^=1;
 assert.throws(()=>validateHeadStudySourceBytes(path,genuine,forgedReceipt),/head-study receipt changed/);
});
