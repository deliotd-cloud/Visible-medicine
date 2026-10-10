import assert from 'node:assert/strict';
import {build} from './workspace-test-build.mjs';

const built=await build({stdin:{contents:"export * from './lib/head-focus-command';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {HEAD_FOCUS_PROTOCOL,parseHeadFocusCommand}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const revision='a'.repeat(40),session='head-session-12345678',source='b'.repeat(64);
const root={kind:'root',id:'vm:anatomy:body:head-neck:midline:organ:pons',source,laterality:'midline'};
const nested={kind:'nested',id:'vm:anatomy:body:head-neck:left:space:left-lateral-ventricle',source,
  laterality:'left',parentId:'vm:anatomy:body:head-neck:midline:organ:brain',parentSource:'c'.repeat(64),study:'ventricles'};
const command=(target=root)=>({type:HEAD_FOCUS_PROTOCOL,version:1,revision,session,command:1,target});
const parse=(value,after=0)=>parseHeadFocusCommand(value,revision,session,after);
assert.deepEqual(parse(command()),{command:1,target:root});
assert.deepEqual(parse(command(nested)),{command:1,target:nested});
for(const study of ['brainstem','ventricles','cerebral'])assert(parse(command({...nested,study})));
for(const key of Object.keys(command()))assert.equal(parse(Object.fromEntries(Object.entries(command()).filter(([name])=>name!==key))),null,key);
for(const bad of [null,[],{}, {...command(),extra:'private'}, {...command(),type:'other'},
  {...command(),version:2}, {...command(),revision:'f'.repeat(40)}, {...command(),session:'other-session-12345678'},
  ...[0,-1,1.5,Number.MAX_SAFE_INTEGER+1,'1'].map(number=>({...command(),command:number})),
  {...command(),target:null}, {...command(),target:[]}, {...command(),target:{...root,extra:'private'}}])
  assert.equal(parse(bad),null,JSON.stringify(bad));
for(const key of Object.keys(root))assert.equal(parse(command(Object.fromEntries(Object.entries(root).filter(([name])=>name!==key)))),null,key);
for(const key of Object.keys(nested))assert.equal(parse(command(Object.fromEntries(Object.entries(nested).filter(([name])=>name!==key)))),null,key);
for(const bad of [
  {...root,kind:'other'}, {...root,id:'vm:anatomy:body:thorax:midline:organ:pons'},
  {...root,id:'vm:anatomy:body:head-neck:left:organ:pons'}, {...root,id:root.id+'?patient=1'},
  {...root,source:'z'.repeat(64)}, {...root,laterality:'left'},
  {...nested,parentId:'vm:anatomy:body:thorax:midline:organ:brain'},
  {...nested,parentSource:'z'.repeat(64)}, {...nested,study:'orbit'},
  {...nested,coordinates:[1,2,3]}, {...nested,url:'https://example.invalid'},
  {...nested,approval:true},
])assert.equal(parse(command(bad)),null,JSON.stringify(bad));
assert.equal(parse(command(),1),null,'replay');
assert.equal(parse({...command(),command:2},2),null,'replay at newer number');
assert.deepEqual(parse({...command(),command:2},1),{command:2,target:root});
for(const invalid of ['', 'g'.repeat(40)])assert.equal(parseHeadFocusCommand(command(),invalid,session,0),null);
for(const invalid of ['', 'short', 'x'.repeat(81)])assert.equal(parseHeadFocusCommand(command(),revision,invalid,0),null);
for(const invalid of [-1,1.5,Number.MAX_SAFE_INTEGER+1])assert.equal(parseHeadFocusCommand(command(),revision,session,invalid),null);
console.log(JSON.stringify({passed:true,rootNested:true,strictEnvelope:true,revisionSessionReplay:true,semanticOnly:true}));
