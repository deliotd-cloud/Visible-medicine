import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-source190-loaded-qa-v2';
const origin='http://127.0.0.1:3002';
const asset='/atlas-runtime/head-neck/models/bodyparts3d/full-body/thorax-skeleton.glb';
const denied=await fetch(origin+asset,{method:'HEAD',redirect:'manual'});
assert.equal(denied.status,401);
// Exercise the existing local sign-in flow; never serialize cookies, invent
// identity headers, provision accounts or change existing access decisions.
const signin=await fetch(origin+'/signin-with-chatgpt?return_to=%2Fatlas%2F3d',{redirect:'manual'});
assert([302,303,307].includes(signin.status));
const cookies=signin.headers.getSetCookie();assert.equal(cookies.length,1);
const response=await fetch(origin+asset,{headers:{Cookie:cookies[0].split(';')[0],Range:'bytes=0-11'},redirect:'manual'});
const bytes=Buffer.from(await response.arrayBuffer());
assert.equal(response.status,206);assert.equal(bytes.length,12);
assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(4),2);
assert.equal(response.headers.get('x-atlas-delivery'),'registered-storage-v1');
assert.match(response.headers.get('cache-control'),/private/);
const result={at:new Date().toISOString(),anonymousStatus:401,nativeSignInStatus:signin.status,
 authenticatedRangeStatus:206,headerBytes:12,glbVersion:2,headerSha256:sha(bytes),
 delivery:'registered-storage-v1',cacheControl:response.headers.get('cache-control'),
 cookiesSaved:false,identityHeadersSupplied:false,permissionsChanged:false,publicDeployment:false};
fs.writeFileSync(stage+'/MODEL_ROUTE_PASS.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
// Human-observed browser QA, not an automated frame-rate or clinical assessment.
const observed={at:new Date().toISOString(),site:json(stage+'/STARTED.json').site,
 viewport:{width:1280,height:720},tab:87,source:'190a63238eadcf906abe89dcbb6a67c88afe70b9',
 review:'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f',
 observed:['Whole-body skeleton renders with compact controls','Zoom in responds',
 'Right lower limb: hip to heel opens as a loaded anatomical tour',
 'Play full tour shows step 1 and its caption without a second Start click',
 'Speed selector accepts 3x; playback advances automatically from step 1 to step 5',
 'Pause changes the control to Play and retains step 5 and its caption'],
 localScreenshot:{path:stage+'/tour-paused-local.jpg',sha256:sha(read(stage+'/tour-paused-local.jpg')),uploadAllowed:false},
 unresolved:[{message:"MutationObserver.observe: parameter 1 is not of type Node",count:1,source:'Unclassified; console supplied no source URL or stack'}],
 limits:['No frame-rate/smoothness benchmark','Not all tours or regions tested','Not clinical, spatial registration, hosted-release or full-suite acceptance'],
 ownerTabsTouched:false,reviewDecisionSaved:false,canonicalInstalled:false};
fs.writeFileSync(stage+'/BROWSER_OBSERVATION.json',JSON.stringify(observed,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
