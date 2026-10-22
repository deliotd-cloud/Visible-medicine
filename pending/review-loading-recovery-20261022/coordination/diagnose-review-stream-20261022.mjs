// Read-only loopback response timing; never stores page bodies or private data.
import assert from 'node:assert/strict';
import {mkdirSync,existsSync,writeFileSync} from 'node:fs';
const root='F:/VisibleMedicine/staging/20261022-review-loading-diagnostic';
assert(!existsSync(root));mkdirSync(root);
const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000),start=Date.now();
const result={at:new Date().toISOString(),urlPath:'/workspace/atlas-review/body',ownerTabRefreshed:false,requestMethod:'GET',customAuthHeaders:false,privateBodyStored:false};
let response,text='';
try{
 response=await fetch('http://127.0.0.1:3000/workspace/atlas-review/body',{signal:controller.signal,redirect:'manual'});
 result.status=response.status;result.headersMs=Date.now()-start;
 for await(const bytes of response.body){text+=Buffer.from(bytes).toString('utf8');assert(text.length<32*1024*1024,'Bounded SSR diagnostic');}
 result.complete=true;
}catch(error){result.complete=false;result.errorKind=error?.name??'unknown';}
finally{clearTimeout(timer);}
Object.assign(result,{elapsedMs:Date.now()-start,responseBytes:Buffer.byteLength(text),loadingFallbackPresent:/Loading(?:…|\.\.\.)/.test(text),privateScopeNoticePresent:text.includes('Personal reviews within your authorized institution'),knownUnavailableMessage:text.includes('Clinical Review is temporarily unavailable.'),signinMessage:text.includes('Sign in to open Clinical Review.'),dashboardSourceMentioned:text.includes('review-dashboard'),hasApplicationErrorOverlay:text.includes('UNHANDLED SCRIPT ERROR')});
writeFileSync(root+'/STREAM_RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
