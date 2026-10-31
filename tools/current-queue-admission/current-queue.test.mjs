import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {inspectCurrentRelease} from './current-queue.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function setup(terminal=true){
 const source=Buffer.from('source'),plan=Buffer.from('plan');
 const q={runPath:'G:/VisibleMedicine-temp/staging/current/STATE.json',source:{path:'source.json',sha256:sha(source)},plan:{path:'plan.json',sha256:sha(plan)}};
 const state={schema:'vm-sequential-verification/1',fingerprint:q.plan.sha256,terminal,coordinatorPid:42,status:terminal?'deferred':'running'};
 const files=new Map([['source.json',source],['plan.json',plan],[q.runPath,Buffer.from(JSON.stringify(state))],['G:/VisibleMedicine-temp/staging/old/STATE.json',Buffer.from(JSON.stringify({...state,terminal:true}))]]);
 const reads=[],index={activeWork:{current:{currentReleaseQueue:q}}};
 const io={read:p=>{reads.push(p);assert(files.has(p));return files.get(p)},probe:()=>true};
 return {q,state,files,reads,index,io,update:()=>files.set(q.runPath,Buffer.from(JSON.stringify(state)))};
}
test('current active queue blocks even when an earlier queue is terminal',()=>{const f=setup(false);assert.equal(inspectCurrentRelease(f.index,f.io).available,false);assert(f.reads.includes(f.q.runPath));assert(!f.reads.some(p=>p.includes('/old/')));});
test('terminal current queue admits without inferring process liveness from an old PID',()=>{const f=setup();f.io.probe=()=>{throw Error('Must not probe an explicitly terminal queue')};assert.equal(inspectCurrentRelease(f.index,f.io).available,true);});
test('a missing active handle requires an audit, not a false live wait',()=>{const f=setup(false);f.io.probe=()=>false;const v=inspectCurrentRelease(f.index,f.io);assert.equal(v.available,false);assert.equal(v.handleLive,false);assert.match(v.reason,/has stopped/);});
test('changed plan or source receipts cannot admit a job',()=>{for(const key of ['plan','source']){const f=setup();f.files.set(f.q[key].path,Buffer.from('changed'));assert.throws(()=>inspectCurrentRelease(f.index,f.io),/receipt changed/);}});
test('state from a different plan is rejected',()=>{const f=setup();f.state.fingerprint='f'.repeat(64);f.update();assert.throws(()=>inspectCurrentRelease(f.index,f.io),/does not match/);});
test('missing current queue or malformed terminal state fails closed',()=>{assert.throws(()=>inspectCurrentRelease({},setup().io),/queue is required/);const f=setup();delete f.state.terminal;f.update();assert.throws(()=>inspectCurrentRelease(f.index,f.io),/terminal state/);});
test('invalid or inaccessible process observation is not treated as idle',()=>{const f=setup(false);f.state.coordinatorPid=0;f.update();assert.throws(()=>inspectCurrentRelease(f.index,f.io),/coordinator handle/);const g=setup(false);g.io.probe=()=>{throw Error('unavailable')};assert.throws(()=>inspectCurrentRelease(g.index,g.io),/unavailable/);});
test('state paths outside staging or containing traversal are rejected',()=>{for(const p of ['https://example.com/STATE.json','G:/VisibleMedicine-temp/staging/../state.json','F:/VisibleMedicine/website/STATE.json']){const f=setup();f.q.runPath=p;assert.throws(()=>inspectCurrentRelease(f.index,f.io),/staging state/);}});
test('a new coordination pointer is followed on a subsequent admission check',()=>{const f=setup();assert(inspectCurrentRelease(f.index,f.io).available);const next='G:/VisibleMedicine-temp/staging/successor/STATE.json';f.q.runPath=next;f.state.terminal=false;f.update();const result=inspectCurrentRelease(f.index,f.io);assert.equal(result.available,false);assert.equal(result.statePath,next);});
