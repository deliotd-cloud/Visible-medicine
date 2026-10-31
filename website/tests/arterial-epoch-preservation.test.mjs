import test from 'node:test';
import assert from 'node:assert/strict';
import {runNineHistory} from './nine-history-dispatch.mjs';
import {verifyContext,verifyAdaptations} from './arterial-epoch-context-seam.mjs';

test('exact original arterial-epoch-preservation root executes in its authenticated epoch',(t)=>{
  const seam=new URL('./arterial-epoch-context-seam.mjs',import.meta.url).href;
  verifyContext();verifyAdaptations();
  const priorOptions=process.env.NODE_OPTIONS,priorSeam=process.env.VM_ARTERIAL_CONTEXT_SEAM;
  let result;
  try{
    process.env.NODE_OPTIONS='--import='+seam;
    process.env.VM_ARTERIAL_CONTEXT_SEAM=seam;
    result=runNineHistory('arterial-epoch-preservation');
  }finally{
    if(priorOptions===undefined)delete process.env.NODE_OPTIONS;else process.env.NODE_OPTIONS=priorOptions;
    if(priorSeam===undefined)delete process.env.VM_ARTERIAL_CONTEXT_SEAM;else process.env.VM_ARTERIAL_CONTEXT_SEAM=priorSeam;
    verifyContext();verifyAdaptations();
  }
  assert.equal(result.originalCases,1,'Complete original nine-root wrapper case');
  t.diagnostic(JSON.stringify(result));
});
