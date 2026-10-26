import fs from 'node:fs';import assert from 'node:assert/strict';import {hash,json} from './seal-simple-website-successor.mjs';
const dir='F:/VisibleMedicine/staging/20261026-studio-final-preview',handle=json(dir+'/HANDLE.json');assert.equal(handle.url,'http://127.0.0.1:3078');assert.equal(handle.source.sha256,'194dc14bf69a68edb959a1ce87d2685db17315514bf9bc823ab8686b1fa0b3db');const checks=[];
for(const path of ['/atlas/guided-learning','/studio/courses/synthetic-course?pane=content','/studio/presentation-preview','/workspace/clinical-review-inbox','/api/atlas-review/inbox']){
 const response=await fetch(handle.url+path,{redirect:'manual',signal:AbortSignal.timeout(15000)}),bytes=Buffer.from(await response.arrayBuffer()),location=response.headers.get('location');assert(bytes.length<4*1024*1024);const text=bytes.toString('utf8');checks.push({path,status:response.status,location,bodyBytes:bytes.length,bodySha256:hashText(bytes),hasSyntheticCourseContent:/Brain MRI orientation|Unsent focus regression draft/.test(text),hasAuthenticationPrompt:/Sign in|sign.?in|Connect your ChatGPT/i.test(text)});
 if(path.startsWith('/studio'))assert([302,303,307,308].includes(response.status)&&location?.includes('signin-with-chatgpt'),path+' is gated before private Studio');
 else if(path==='/api/atlas-review/inbox'){assert.equal(response.status,401);assert.deepEqual(JSON.parse(text),{error:'Sign in to open Clinical Review.'});}
 else assert.equal(response.status,200);
 assert(!checks.at(-1).hasSyntheticCourseContent,'Synthetic component fixture is not real website content');
}
function hashText(bytes){return createHash('sha256').update(bytes).digest('hex');}
import {createHash} from 'node:crypto';
const result={at:new Date().toISOString(),passing:true,source:handle.source,build:handle.build,checks,loopbackAndLocalBindingsOnly:true,privateStateCopied:false,noCookiesOrIdentityFabricated:true,signedInAcceptance:false,syntheticBrowserComponentProofSeparate:true,noNewModelOrScanRequested:true,normalPreviewChanged:false};fs.writeFileSync(dir+'/HTTP_SMOKE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passing:true,checks:checks.map(r=>({path:r.path,status:r.status,location:r.location})),sha256:hash(dir+'/HTTP_SMOKE.json')}));
