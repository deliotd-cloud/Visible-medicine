import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {transformSync}=createRequire(resolve(root,'package.json'))('esbuild');
const canonical=readFileSync(resolve(root,'lib/institution-operations.ts'),'utf8').replaceAll('\r\n','\n');
const source=canonical.match(/export async function enforceRateLimit\([\s\S]*?\n\}\n\nexport async function submitPilotApplication/)?.[0]?.replace(/\n\nexport async function submitPilotApplication$/,'');
const errorClass=canonical.match(/export class InstitutionOperationsError extends Error \{[\s\S]*?\n\}/)?.[0];
const ddl=readFileSync(resolve(root,'drizzle/0005_volatile_black_tarantula.sql'));
assert.equal(createHash('sha256').update(ddl).digest('hex'),'311818bf0c67e0e67ca1337fb8faa1da1f9c803009b89f18a716a92251340e15');
const table=ddl.toString().match(/CREATE TABLE `api_rate_limits` \([\s\S]*?\);/)?.[0];
assert.ok(source && errorClass && table);
// Compile the current actual function/error class, not a proposed SQL copy.
// Schema initialization is an explicit no-op seam, not bootstrap acceptance.
const code=transformSync(`${errorClass}\n${source}`,{loader:'ts',format:'cjs'}).code;
function compile(DB,ensurePlatformSchema=async()=>{},ensureDatabase=async()=>{}) {
  const module={exports:{}};
  new Function('module','exports','env','ensurePlatformSchema','ensureDatabase',code)(module,module.exports,{DB},ensurePlatformSchema,ensureDatabase);
  return module.exports.enforceRateLimit;
}
const base=Date.parse('2026-10-06T12:00:00.000Z');
const iso=time=>new Date(time).toISOString();
async function at(time,fn) {
  const RealDate=globalThis.Date;
  globalThis.Date=class extends RealDate {static now(){return time;}};
  try{return await fn();}finally{globalThis.Date=RealDate;}
}
function store() {
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(table);
  // A read barrier reproduces the preceding SELECT/update races if that
  // implementation is restored. The atomic function never needs a read.
  let waiting=[];
  const DB={prepare(sql){return{bind(...args){return{
    async first(){
      const value=sqlite.prepare(sql).get(...args)??null;
      return await new Promise(release=>{
        waiting.push({value,release});
        if(waiting.length===2){const group=waiting;waiting=[];for(const item of group)item.release(item.value);}
      });
    },
    async run(){const info=sqlite.prepare(sql).run(...args);return{success:true,meta:{changes:Number(info.changes)}};},
    async all(){return{success:true,results:sqlite.prepare(sql).all(...args)};},
  };}};}};
  const seed=(key,time,count)=>sqlite.prepare('INSERT INTO api_rate_limits VALUES (?,?,?,?)').run(key,time,count,time);
  const row=key=>sqlite.prepare('SELECT window_start,count FROM api_rate_limits WHERE bucket_key=?').get(key);
  return{sqlite,DB,seed,row};
}
const permitted=outcomes=>outcomes.filter(r=>r.status==='fulfilled').length;
const refused=(fn,status=429)=>assert.rejects(fn,error=>error.status===status);

test('concurrent first and last slots admit only remaining capacity',async()=>{
  const {sqlite,DB,seed,row}=store();const rate=compile(DB);
  try {
    const first=await at(base,()=>Promise.allSettled([rate('first','s',1,60),rate('first','s',1,60)]));
    assert.equal(permitted(first),1);assert.equal(row('s:first').count,1);
    seed('s:last',iso(base),1);
    const last=await at(base,()=>Promise.allSettled([rate('last','s',2,60),rate('last','s',2,60)]));
    assert.equal(permitted(last),1);assert.equal(row('s:last').count,2);
    for(const outcome of [...first,...last])if(outcome.status==='rejected')assert.equal(outcome.reason.status,429);
  }finally{sqlite.close();}
});
test('expired zero and historical over-limit counts recover, live over-limit refuses',async()=>{
  const {sqlite,DB,seed,row}=store();const rate=compile(DB);
  try {
    seed('s:zero',iso(base-60_000),0);seed('s:over',iso(base-60_000),3);seed('s:live',iso(base),3);
    await at(base,async()=>{await rate('zero','s',2,60);await rate('over','s',2,60);await refused(()=>rate('live','s',2,60));});
    for(const key of ['s:zero','s:over'])assert.deepEqual({...row(key)},{window_start:iso(base),count:1});
    assert.equal(row('s:live').count,3);
  }finally{sqlite.close();}
});
test('last millisecond refuses; exact cutoff resets only once',async()=>{
  const {sqlite,DB,seed,row}=store();const rate=compile(DB);
  try {
    seed('s:edge',iso(base-60_000),2);
    await at(base-1,()=>refused(()=>rate('edge','s',2,60)));assert.equal(row('s:edge').count,2);
    await at(base,async()=>{await rate('edge','s',2,60);assert.equal(row('s:edge').count,1);await rate('edge','s',2,60);await refused(()=>rate('edge','s',2,60));});
    assert.deepEqual({...row('s:edge')},{window_start:iso(base),count:2});
  }finally{sqlite.close();}
});
test('concurrent rollover admits exactly the new capacity',async()=>{
  const {sqlite,DB,seed,row}=store();const rate=compile(DB);
  try {
    seed('s:roll',iso(base-60_000),8);
    const outcomes=await at(base,()=>Promise.allSettled(Array.from({length:12},()=>rate('roll','s',3,60))));
    assert.equal(permitted(outcomes),3);assert.deepEqual({...row('s:roll')},{window_start:iso(base),count:3});
    for(const r of outcomes)if(r.status==='rejected')assert.equal(r.reason.status,429);
  }finally{sqlite.close();}
});
test('lowered limits refuse live counter and recover after expiry',async()=>{
  const {sqlite,DB,seed,row}=store();const rate=compile(DB);
  try {
    seed('s:lower',iso(base),3);
    await at(base+59_999,()=>refused(()=>rate('lower','s',2,60)));assert.equal(row('s:lower').count,3);
    await at(base+60_000,()=>rate('lower','s',2,60));
    assert.deepEqual({...row('s:lower')},{window_start:iso(base+60_000),count:1});
  }finally{sqlite.close();}
});
test('malformed timestamps and negative/text/fraction/unsafe counts refuse without repair',async()=>{
  for(const [actor,start,count]of [
    ['negative',iso(base-60_000),-1],['text',iso(base-60_000),'bad'],['fraction',iso(base-60_000),1.5],
    ['unsafe',iso(base-60_000),9007199254740992],['malformed','0',1],['future',iso(base+1),1],['zero-live',iso(base),0],
  ]) {
    const {sqlite,DB,seed,row}=store();const rate=compile(DB);
    try {
      seed(`s:${actor}`,start,count);await at(base,()=>refused(()=>rate(actor,'s',2,60)));
      if(actor==='unsafe')assert.deepEqual({...sqlite.prepare('SELECT window_start,CAST(count AS TEXT) AS count FROM api_rate_limits WHERE bucket_key=?').get(`s:${actor}`)},{window_start:start,count:String(count)});
      else assert.deepEqual({...row(`s:${actor}`)},{window_start:start,count});
    }finally{sqlite.close();}
  }
});
test('short actor/scope buckets are independent and expired safe maximum resets',async()=>{
  const {sqlite,DB,seed,row}=store();const rate=compile(DB);
  try {
    await at(base,async()=>{
      await rate('a','one',1,60);await rate('b','one',1,60);await rate('a','two',1,60);
      await refused(()=>rate('a','one',1,60));
      seed('s:maximum',iso(base-60_000),Number.MAX_SAFE_INTEGER);await rate('maximum','s',2,60);
    });
    assert.equal(sqlite.prepare('SELECT count(*) AS n FROM api_rate_limits').get().n,4);
    assert.deepEqual({...row('s:maximum')},{window_start:iso(base),count:1});
  }finally{sqlite.close();}
});
test('invalid configuration, bootstrap/database failure and malformed result never permit',async()=>{
  const unexpected={prepare(){throw Error('synthetic database refusal');}};
  const rate=compile(unexpected,async()=>{throw Error('bootstrap should not run for invalid configuration');});
  for(const [limit,window]of [[0,60],[-1,60],[1.5,60],[NaN,60],[Infinity,60],[1,0],[1,-1],[1,1.5],[1,Number.MAX_SAFE_INTEGER]])
    await refused(()=>rate('a','s',limit,window),500);
  await assert.rejects(()=>compile(unexpected)('a','s'),/synthetic database refusal/);
  await assert.rejects(()=>compile(unexpected,async()=>{throw Error('synthetic bootstrap refusal');})('a','s'),/synthetic bootstrap refusal/);
  for(const result of [{success:false,results:[]},{success:true},{success:true,results:null},{success:true,results:[{count:0}]},{success:true,results:[{count:3}]},{success:true,results:[{count:1.5}]},{success:true,results:[{count:1},{count:1}]}]) {
    const DB={prepare(){return{bind(){return{async all(){return result;}};}};}};
    await refused(()=>compile(DB)('a','s',2,60),500);
  }
});
