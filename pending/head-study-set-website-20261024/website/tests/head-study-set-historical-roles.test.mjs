import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 historicalReceiptPath,historicalWebsiteRoot,readHistoricalSource,
 validateHistoricalReceiptBytes,validateHistoricalSourceBytes,
} from './head-study-set-historical-source.mjs';

const proposalReceiptPath='F:/VisibleMedicine/staging/20261024-head-study-set-commit/PROPOSAL_BOUND.json';
const proposalReceiptSha256='45e11123d1ab36e11a3cf42466a840907842391a31f794e532a9e0368bcbe433';
const component='components/HeadAtlasViewer.tsx';
const sha=raw=>createHash('sha256').update(raw).digest('hex');

test('genuine historical component is recovered byte for byte from the two later publication seams',()=>{
 const receiptBytes=readFileSync(proposalReceiptPath);
 assert.equal(sha(receiptBytes),proposalReceiptSha256);
 const proposal=JSON.parse(receiptBytes);
 assert.equal(proposal.website,'F:/VisibleMedicine/staging/20261024-head-study-set-commit/website');
 const row=proposal.sourceRows.find(item=>item.path===component);
 assert(row);
 const raw=readFileSync(proposal.website+'/'+component);
 assert.equal(raw.length,row.bytes);
 assert.equal(sha(raw),row.sha256);
 let reconstructed=raw.toString('utf8');
 const inverse=[
  [
   '  const studySetRef=useRef(studySet);\n  useLayoutEffect(()=>{\n    studySetRef.current=studySet;\n    return()=>{if(studySetRef.current===studySet)studySetRef.current=null;};\n  },[studySet]);',
   '  const studySetRef=useRef(studySet);studySetRef.current=studySet;',
  ],
  [
   '  const reviewContextRef=useRef<typeof reviewContext|null>(null);\n  useLayoutEffect(()=>{\n    reviewContextRef.current=reviewContext;\n    return()=>{if(reviewContextRef.current===reviewContext)reviewContextRef.current=null;};\n  },[reviewContext]);',
   '  const reviewContextRef=useRef(reviewContext);reviewContextRef.current=reviewContext;',
  ],
 ];
 for(const [later,earlier] of inverse){
  assert.equal(reconstructed.split(later).length,2,'one exact later seam');
  reconstructed=reconstructed.replace(later,earlier);
 }
 const genuine=readHistoricalSource(component);
 assert.equal(historicalWebsiteRoot,'F:/VisibleMedicine/staging/20261024-native-slice-website/website');
 assert.deepEqual(Buffer.from(reconstructed),genuine,'entire original native-slice component recovered');
 assert.notEqual(sha(raw),sha(genuine),'later study-set publication cannot be the historical operand');
});

test('historical source helper refuses forged receipt, drift and unregistered paths',()=>{
 const receiptBytes=readFileSync(historicalReceiptPath);
 const source=readHistoricalSource(component);
 const forged=Buffer.from(receiptBytes);
 forged[forged.length-2]^=1;
 assert.throws(()=>validateHistoricalReceiptBytes(forged),/historical receipt changed/);
 assert.throws(()=>validateHistoricalSourceBytes(component,source,forged),/historical receipt changed/);
 const drift=Buffer.from(source);
 drift[drift.length-2]^=1;
 assert.throws(()=>validateHistoricalSourceBytes(component,drift,receiptBytes),/historical source drift/);
 assert.throws(()=>validateHistoricalSourceBytes('components/never-registered.tsx',source,receiptBytes),/unregistered historical source/);
});
