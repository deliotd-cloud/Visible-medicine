import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  HEAD_CLIENT_TRACE_LIMIT,HEAD_CLIENT_TRACE_PREFIX,beginHeadStudyDiagnostics,
  createHeadClientDiagnostics,headClientDiagnosticsAllowed,headStudyLoadingMessage,
  notifyHeadProgress,type HeadClientTraceEvent
} from '../lib/head-load-progress.ts';

function collector(now?:()=>number){
  const lines:string[]=[];
  const begin=createHeadClientDiagnostics({enabled:true,write:line=>lines.push(line),now});
  const events=()=>lines.map(line=>{
    assert.ok(line.startsWith(HEAD_CLIENT_TRACE_PREFIX));
    return JSON.parse(line.slice(HEAD_CLIENT_TRACE_PREFIX.length)) as HeadClientTraceEvent;
  });
  return {begin,events,lines};
}

test('the build, exact loopback origin and single fragment opt-in all gate diagnostics',()=>{
  for(const origin of ['http://localhost','http://127.0.0.1:3000','http://[::1]:3000']){
    assert.equal(headClientDiagnosticsAllowed(true,origin,'#headDiagnostics=1'),true);
    assert.equal(headClientDiagnosticsAllowed(false,origin,'#headDiagnostics=1'),false);
    for(const fragment of ['', '?headDiagnostics=1','#headDiagnostics=0','#headDiagnostics=1&headDiagnostics=1','#headDiagnostics=1&headDiagnostics=0'])
      assert.equal(headClientDiagnosticsAllowed(true,origin,fragment),false);
  }
  for(const origin of ['https://localhost','http://example.com','http://localhost/path','http://localhost/',
    'http://user@localhost','http://LOCALHOST','http://127.0.0.2','file:///tmp','broken'])
    assert.equal(headClientDiagnosticsAllowed(true,origin,'#headDiagnostics=1'),false,origin);
});

test('disabled and invalid writers remain inert; absent compile-time constant is safe in Node',()=>{
  assert.equal(createHeadClientDiagnostics()(),null);
  assert.equal(createHeadClientDiagnostics({enabled:true})(),null);
  assert.equal(beginHeadStudyDiagnostics(),null);
  let touched=0;
  const disabled:{enabled:boolean;write:()=>void;now:()=>number}={enabled:false,get write(){touched++;return assert.fail('private writer');},get now(){touched++;return assert.fail('private clock');}};
  assert.equal(createHeadClientDiagnostics(disabled)(),null);
  assert.equal(touched,0);
});

test('only closed numeric fields are emitted, with no caller details',()=>{
  const {begin,events,lines}=collector(()=>100);
  const trace=begin();assert.ok(trace);
  trace('reading',{loadedBytes:27,totalBytes:100,path:'private.nrrd',hash:'secret'} as never);
  trace('verifying',{loadedBytes:100,totalBytes:100,label:'private'} as never);
  trace('study-data-ready',{loadedBytes:100,totalBytes:100});
  trace('failed');
  assert.deepEqual(events().map(e=>e.phase),['study-start','reading','verifying','study-data-ready']);
  assert.deepEqual(events()[1],{schema:1,attempt:1,phase:'reading',elapsedMs:0,loadedBytes:20,totalBytes:100});
  for(const e of events()){
    assert.deepEqual(Object.keys(e).sort(),Object.keys(e).filter(k=>['schema','attempt','phase','elapsedMs','loadedBytes','totalBytes'].includes(k)).sort());
    assert.equal(Number.isInteger(e.elapsedMs)&&e.elapsedMs>=0&&e.elapsedMs<=86400000,true);
  }
  assert.equal(lines.some(line=>/private|secret|hash|label|path/.test(line)),false);
});

test('invalid phases, invalid byte counts and arbitrary details are ignored',()=>{
  const {begin,events}=collector();const trace=begin();assert.ok(trace);
  trace('private-phase' as never,{loadedBytes:1,totalBytes:10});
  trace('reading');
  for(const progress of [{loadedBytes:-1,totalBytes:10},{loadedBytes:11,totalBytes:10},
    {loadedBytes:NaN,totalBytes:10},{loadedBytes:1.5,totalBytes:10},
    {loadedBytes:1,totalBytes:0},{loadedBytes:1,totalBytes:536870913}])trace('reading',progress);
  trace('reading',{loadedBytes:5,totalBytes:10});
  assert.deepEqual(events().map(e=>e.phase),['study-start','reading']);
});

test('progress getters and proxies cannot throw from a trace or leak details',()=>{
  const {begin,events,lines}=collector();const trace=begin();assert.ok(trace);
  let loadedReads=0,totalReads=0;
  const once={
    get loadedBytes(){if(++loadedReads>1)throw Error('private loaded');return 25;},
    get totalBytes(){if(++totalReads>1)throw Error('private total');return 100;},
    get path(){throw Error('private path');}
  };
  assert.doesNotThrow(()=>trace('reading',once));
  assert.equal(loadedReads,1);assert.equal(totalReads,1);
  assert.doesNotThrow(()=>trace('reading',null as never));
  const hostile=new Proxy({}, {get(){throw Error('private proxy');}});
  assert.doesNotThrow(()=>trace('reading',hostile as never));
  assert.deepEqual(events().map(e=>e.phase),['study-start','reading']);
  assert.equal(lines.some(line=>/private|path|proxy/.test(line)),false);
});

test('clock failures, backwards time and huge time remain finite, monotonic and bounded',()=>{
  const ticks=[100,110,105,Infinity,()=>{throw Error('private clock');},1000000000];
  const {begin,events}=collector(()=>{const tick=ticks.shift();return typeof tick==='function'?tick():tick as number;});
  const trace=begin();assert.ok(trace);
  trace('reading',{loadedBytes:0,totalBytes:100});
  trace('verifying');trace('verifying');trace('failed');
  assert.deepEqual(events().map(e=>e.elapsedMs),[10,10,10,10,86400000]);
});

test('reading is coarsened to ten percent buckets without duplicates or regression',()=>{
  const {begin,events}=collector();const trace=begin();assert.ok(trace);
  for(const loadedBytes of [0,1,9,10,25,20,99,100,100])trace('reading',{loadedBytes,totalBytes:100});
  assert.deepEqual(events().filter(e=>e.phase==='reading').map(e=>e.loadedBytes),[0,10,20,90,100]);
});

test('all terminal phases retire their trace even if the writer throws',()=>{
  for(const terminal of ['study-data-ready','failed','cancelled'] as const){
    const {begin,events}=collector();const trace=begin();assert.ok(trace);
    trace(terminal);trace('reading',{loadedBytes:10,totalBytes:100});trace('failed');
    assert.deepEqual(events().map(e=>e.phase),['study-start',terminal]);
  }
  let calls=0;
  const begin=createHeadClientDiagnostics({enabled:true,write:()=>{calls++;throw Error('private writer');}});
  const trace=begin();assert.ok(trace);trace('failed');trace('reading',{loadedBytes:1,totalBytes:10});
  assert.equal(calls,2);
});

test('the factory cap includes failed writes and rejects further attempts',()=>{
  let calls=0;
  const begin=createHeadClientDiagnostics({enabled:true,write:()=>{calls++;throw Error('private writer');}});
  for(let i=0;i<HEAD_CLIENT_TRACE_LIMIT;i++)assert.ok(begin());
  assert.equal(begin(),null);
  assert.equal(calls,HEAD_CLIENT_TRACE_LIMIT);
  const {begin:second,events}=collector();const trace=second();assert.ok(trace);
  for(let i=0;i<HEAD_CLIENT_TRACE_LIMIT+5;i++)trace('verifying');
  assert.equal(events().length,HEAD_CLIENT_TRACE_LIMIT);
});

test('existing display observer behavior remains unchanged',()=>{
  let seen=0;
  notifyHeadProgress(()=>{seen++;throw Error('private observer');},{loadedBytes:1,totalBytes:10});
  notifyHeadProgress(undefined,{loadedBytes:1,totalBytes:10});
  assert.equal(seen,1);
  assert.equal(headStudyLoadingMessage('CT',{phase:'reading',loadedBytes:25,totalBytes:100}),'Reading CT native image… 20%');
  assert.equal(headStudyLoadingMessage('MRI',{phase:'verifying',loadedBytes:100,totalBytes:100}),'Verifying MRI image checksum…');
});
