import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const readJson=bytes=>JSON.parse(bytes.toString());
export function probeProcess(pid) {
  try { process.kill(pid,0); return true; }
  catch(error) { if(error.code==='ESRCH')return false; throw error; }
}
/** Read the current coordination pointer each time; old queue files are not a lane lock. */
export function inspectCurrentRelease(index,{read=fs.readFileSync,hash=digest,probe=probeProcess}={}) {
  const queue=index?.activeWork?.current?.currentReleaseQueue;
  assert(queue&&typeof queue==='object','Current release queue is required');
  const validatePath=p=>assert(typeof p==='string'&&/^(?:G:\/VisibleMedicine-temp|F:\/VisibleMedicine)\/staging\//.test(p.replaceAll('\\','/'))&&!p.split(/[\\/]/).includes('..'),'Expected an explicit local staging state path');
  validatePath(queue.runPath);
  for(const key of ['source','plan']) {
    const ref=queue[key];assert(ref&&typeof ref.path==='string'&&/^[a-f0-9]{64}$/.test(ref.sha256),'Bound '+key+' receipt required');
    assert.equal(hash(read(ref.path)),ref.sha256,key+' receipt changed');
  }
  const state=readJson(read(queue.runPath));
  assert.equal(state.schema,'vm-sequential-verification/1');
  assert.equal(state.fingerprint,queue.plan.sha256,'Current queue plan does not match running state');
  assert.equal(typeof state.terminal,'boolean','Explicit terminal state required');
  if(state.terminal)return {available:true,statePath:queue.runPath,plan:queue.plan.sha256,status:state.status??null};
  assert(Number.isSafeInteger(state.coordinatorPid)&&state.coordinatorPid>0,'Active queue requires its coordinator handle');
  const live=probe(state.coordinatorPid);
  assert.equal(typeof live,'boolean','Ambiguous process observation must stop admission');
  return {available:false,statePath:queue.runPath,plan:queue.plan.sha256,coordinatorPid:state.coordinatorPid,handleLive:live,
    reason:live?'Current website verification is active.':'Recorded website verification has stopped; audit its terminal state before starting another job.'};
}
