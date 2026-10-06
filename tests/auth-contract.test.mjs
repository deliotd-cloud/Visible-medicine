import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const separator=process.argv.indexOf('--');
if(separator>=0)assert.ok(process.argv[separator+1],'pass -- <site-root>');
const site=separator>=0?resolve(process.argv[separator+1]):resolve(here,'..');
const require=createRequire(resolve(site,'package.json'));const{build}=require('esbuild');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex').toUpperCase();
const pins={'lib/auth.ts':'E4820B60DBB3A030359635470F97143C3BC5A647DEC0F3A3FD9329C1F8396249','app/chatgpt-auth.ts':'EFDB9986E5542FC7C5A99246B6FCCEC5D5DF4EC51ECC0F6ED111FFF8CCC4580A'};
const sources=Object.fromEntries(Object.entries(pins).map(([path,pin])=>{const bytes=readFileSync(resolve(site,path));assert.equal(sha(bytes),pin,`current source drift: ${path}`);return[path,bytes.toString('utf8')];}));
console.log(JSON.stringify({baseline:'cfbdecf3413231ffd9beaf4f19d2b4ce7cda7c76',sourcePins:pins,syntheticSeams:['next/headers','next/navigation'],actual:['lib/auth.ts','app/chatgpt-auth.ts'],node:process.version}));
let requestHeaders=new Headers();let headerError;const redirects=[];
class RedirectSignal extends Error{constructor(path){super('Synthetic navigation redirect');this.path=path;}}
const seams={async headers(){if(headerError)throw headerError;return requestHeaders;},redirect(path){redirects.push(path);throw new RedirectSignal(path);}};
const exports={};
for(const[name,path]of Object.entries({auth:'lib/auth.ts',chatgpt:'app/chatgpt-auth.ts'})){
 const result=await build({entryPoints:[`./${path}`],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent',plugins:[{name:'next-only-server-seams',setup(b){
  b.onResolve({filter:/.*/},args=>{
   if(args.path==='test-next-seams'&&args.namespace==='next-seam')return{path:args.path,external:true};
   if(['next/headers','next/navigation'].includes(args.path))return{path:args.path,namespace:'next-seam'};
   const key=args.path.startsWith('@/')?args.path.slice(2):args.path.replace(/^\.\//,'');
   const actual=sources[key]?key:`${key}.ts`;if(sources[actual])return{path:actual,namespace:'actual'};
   throw Error(`Unexpected dependency ${args.path}`);
  });
  b.onLoad({filter:/.*/,namespace:'actual'},args=>({contents:sources[args.path],loader:'ts'}));
  b.onLoad({filter:/.*/,namespace:'next-seam'},args=>({contents:`import seams from 'test-next-seams';export const ${args.path==='next/headers'?'headers':'redirect'}=seams.${args.path==='next/headers'?'headers':'redirect'};`,loader:'js'}));
 }}]});
 const module={exports:{}};new Function('module','exports','require',result.outputFiles[0].text)(module,module.exports,id=>{assert.equal(id,'test-next-seams');return seams;});exports[name]=module.exports;
 console.log(JSON.stringify({bundle:name,sha256:sha(result.outputFiles[0].contents)}));
}
const{getChatGPTUser,requireChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath}=exports.chatgpt;
const{getAuthContext,hasRole}=exports.auth;
const identity={'oai-authenticated-user-id':'synthetic-user-17','oai-authenticated-user-email':'fixture@synthetic.invalid'};
function setHeaders(values={}){requestHeaders=new Headers(values);headerError=undefined;redirects.length=0;}
async function withEnvironment(value,fn){const previous=process.env.NODE_ENV;if(value===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=value;try{return await fn();}finally{if(previous===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=previous;}}
function returnTo(href,basePath){const url=new URL(href,'https://synthetic.invalid');assert.equal(url.origin,'https://synthetic.invalid');assert.equal(url.pathname,basePath);return url.searchParams.get('return_to');}
function paths(input,expected){assert.equal(returnTo(chatGPTSignInPath(input),'/signin-with-chatgpt'),expected);assert.equal(returnTo(chatGPTSignOutPath(input),'/signout-with-chatgpt'),expected);}

test('missing or empty required ID/email headers return null',async()=>{
 for(const values of [{},{'oai-authenticated-user-id':identity['oai-authenticated-user-id']},{'oai-authenticated-user-email':identity['oai-authenticated-user-email']},{...identity,'oai-authenticated-user-id':''},{...identity,'oai-authenticated-user-email':''}]){setHeaders(values);assert.equal(await getChatGPTUser(),null);}
});
test('accepted synthetic server headers map stable education identity without name',async()=>{
 setHeaders(identity);assert.deepEqual(await getChatGPTUser(),{userId:'synthetic-user-17',email:'fixture@synthetic.invalid',displayName:'fixture@synthetic.invalid',fullName:null});
 await withEnvironment('production',async()=>assert.deepEqual(await getAuthContext(),{userId:'edu:synthetic-user-17',externalSubject:'sites:synthetic-user-17',email:'fixture@synthetic.invalid',displayName:'fixture@synthetic.invalid'}));
});
test('percent-encoded UTF8 optional full name decodes only with exact marker',async()=>{
 const fullName='Synthetic Éva 😀';setHeaders({...identity,'oai-authenticated-user-full-name':encodeURIComponent(fullName),'oai-authenticated-user-full-name-encoding':'percent-encoded-utf-8'});
 assert.equal((await getChatGPTUser()).fullName,fullName);assert.equal((await getChatGPTUser()).displayName,fullName);
 for(const marker of [undefined,'PERCENT-ENCODED-UTF-8','utf-8']){const values={...identity,'oai-authenticated-user-full-name':encodeURIComponent(fullName)};if(marker!==undefined)values['oai-authenticated-user-full-name-encoding']=marker;setHeaders(values);assert.equal((await getChatGPTUser()).fullName,null);assert.equal((await getChatGPTUser()).displayName,identity['oai-authenticated-user-email']);}
});
test('malformed percent/UTF8 full name falls back to email',async()=>{
 for(const value of ['%','%GG','%E2%82','%FF','']){setHeaders({...identity,'oai-authenticated-user-full-name':value,'oai-authenticated-user-full-name-encoding':'percent-encoded-utf-8'});const user=await getChatGPTUser();assert.equal(user.fullName,null);assert.equal(user.displayName,identity['oai-authenticated-user-email']);}
});
test('alternative client-like identity headers never substitute for required server pair',async()=>{
 setHeaders({'x-user-id':'synthetic-forged','x-user-email':'forged@synthetic.invalid','authorization':'Synthetic fixture','cookie':'synthetic-user=forged'});assert.equal(await getChatGPTUser(),null);
});
test('production missing header identity never receives local demo',async()=>{
 await withEnvironment('production',async()=>{for(const values of [{},{'oai-authenticated-user-id':'synthetic-only-id'}]){setHeaders(values);assert.equal(await getAuthContext(),null);}});
});
test('nonproduction including unset environment retains explicit existing demo fallback',async()=>{
 for(const value of ['development','test','staging',undefined])await withEnvironment(value,async()=>{setHeaders();assert.deepEqual(await getAuthContext(),{userId:'edu:local-demo-user',externalSubject:'local:demo-user',email:'avery.morgan@example.edu',displayName:'Avery Morgan'});setHeaders(identity);assert.equal((await getAuthContext()).userId,'edu:synthetic-user-17');});
});
test('header seam failure propagates rather than fabricating identity',async()=>{
 for(const value of ['production','development'])await withEnvironment(value,async()=>{setHeaders();headerError=Error('Synthetic header service unavailable');await assert.rejects(getChatGPTUser,/Synthetic header service unavailable/);await assert.rejects(getAuthContext,/Synthetic header service unavailable/);});setHeaders();
});
test('requireChatGPTUser returns accepted identity without redirect',async()=>{
 setHeaders(identity);assert.equal((await requireChatGPTUser('/learner')).userId,'synthetic-user-17');assert.deepEqual(redirects,[]);
});
test('requireChatGPTUser redirects missing identity through sanitized sign-in URL',async()=>{
 setHeaders();await assert.rejects(()=>requireChatGPTUser('//foreign.invalid/path'),error=>error instanceof RedirectSignal&&error.path==='/signin-with-chatgpt?return_to=%2F');assert.deepEqual(redirects,['/signin-with-chatgpt?return_to=%2F']);
});
test('role helper is case-sensitive any-of, with empty requirements false',()=>{
 assert.equal(hasRole(['student','reviewer'],'reviewer','admin'),true);assert.equal(hasRole(['student'],'reviewer','admin'),false);assert.equal(hasRole(['Reviewer'],'reviewer'),false);assert.equal(hasRole(['admin']),false);assert.equal(hasRole([],'admin'),false);
});
test('sign-in/out preserve ordinary relative path/query/hash and default sign-out root',()=>{
 for(const value of ['/','/learner','/notes/123?tab=activity#section','/a%20b?next=%2Fnotes&x=1#part','/a/../learner'])paths(value,value==='/a/../learner'?'/learner':value);
 assert.equal(chatGPTSignOutPath(),'/signout-with-chatgpt?return_to=%2F');
});
test('absolute/external/leading-backslash paths fall back to root',()=>{
 for(const value of ['','relative','https://foreign.invalid/path','https://app.local/learner','//foreign.invalid/path','///foreign.invalid','\\foreign.invalid','/\\foreign.invalid/path','/\n/foreign.invalid'])paths(value,'/');
});
test('exact and normalized reserved auth paths fall back to root',()=>{
 for(const value of ['/signin-with-chatgpt','/signout-with-chatgpt?return_to=/learner','/callback#part','/learner/../callback','/learner\\..\\callback'])paths(value,'/');
});
test('observed relative backslash normalization and reserved aliases remain accepted',()=>{
 const cases=[['/learner\\notes','/learner/notes'],['/%63allback','/%63allback'],['/callback/','/callback/'],['/CALLBACK','/CALLBACK'],['/%2F%2Fforeign.invalid','/%2F%2Fforeign.invalid']];
 for(const[value,expected]of cases){paths(value,expected);console.log(JSON.stringify({returnPathObservation:JSON.stringify(value),acceptedReturnTo:expected}));}
});
