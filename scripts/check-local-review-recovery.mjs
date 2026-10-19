// Anonymous, synthetic local regression probe. Never send credentials or data.
import assert from 'node:assert/strict';
const base=new URL(process.argv[2]??'http://127.0.0.1:3000');
assert(base.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(base.hostname), 'Loopback HTTP only');
assert(!base.username&&!base.password&&!base.search&&!base.hash&&base.pathname==='/', 'Origin only');
const receipts=[];
for(let cycle=0;cycle<3;cycle++){
 for(const method of ['GET','POST','GET']){
  const path=method==='POST'?'/api/atlas-review/body-review/decisions':'/atlas/3d';
  const response=await fetch(new URL(path,base),{method,redirect:'error',signal:AbortSignal.timeout(10000),
   ...(method==='POST'?{body:'{}',headers:{origin:base.origin,'content-type':'application/json'}}:{})});
  const body=await response.text();
  assert.equal(response.status,method==='POST'?401:200,`${method} ${path} cycle ${cycle+1}`);
  if(method==='POST'){
   assert.equal(JSON.parse(body).error,'Sign in to open Clinical Review.');
   assert.match(response.headers.get('cache-control')??'',/no-store/);
  }
  receipts.push({cycle:cycle+1,method,path,status:response.status});
 }
}
console.log(JSON.stringify({origin:base.origin,checks:receipts.length,receipts,synthetic:true,signedInAcceptance:false}));
