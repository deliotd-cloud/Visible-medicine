import assert from 'node:assert/strict';
import {build} from './workspace-test-build.mjs';

const built=await build({stdin:{contents:"export * from './lib/body-focus-command';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {BODY_FOCUS_PROTOCOL,parseBodyFocusCommand,validBodySelection}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const revision='a'.repeat(40),session='body-session-12345678',source='b'.repeat(64);
const target=(part,side)=>({kind:'root',id:`vm:anatomy:body:${part}:${side}:bone:${side}-femur`,source,laterality:side});
for(const region of ['leg','thigh']){
  const envelope=(selection=target(region,'left'))=>({type:BODY_FOCUS_PROTOCOL,version:1,revision,region,session,command:1,target:selection});
  const parse=(value,after=0)=>parseBodyFocusCommand(value,revision,region,session,after);
  for(const part of ['leg','thigh'])for(const side of ['left','right','midline','unpaired']){
    const selected=target(part,side);
    assert(validBodySelection(selected));
    assert.deepEqual(parse(envelope(selected)),{command:1,target:selected},'Catalog region may differ from renderer region');
  }
  for(const key of Object.keys(envelope())){
    const malformed={...envelope()};delete malformed[key];assert.equal(parse(malformed),null,`missing ${key}`);
  }
  for(const key of Object.keys(target(region,'left'))){
    const malformed={...target(region,'left')};delete malformed[key];assert.equal(parse(envelope(malformed)),null,`missing target ${key}`);
  }
  for(const bad of [null,[],{}, {...envelope(),extra:'private'}, {...envelope(),type:'vm-head-semantic-focus'},
    {...envelope(),version:2},{...envelope(),revision:'f'.repeat(40)},
    {...envelope(),region:region==='leg'?'thigh':'leg'},
    {...envelope(),session:'other-session-12345678'},
    ...[0,-1,1.5,Number.MAX_SAFE_INTEGER+1,'1'].map(command=>({...envelope(),command})),
    {...envelope(),target:null},{...envelope(),target:[]},
    {...envelope(),target:{...target(region,'left'),patient:'private'}}])assert.equal(parse(bad),null,JSON.stringify(bad));
  for(const bad of [
    {...target(region,'left'),kind:'nested',parentId:'private'},
    {...target(region,'left'),kind:'specimen'},
    {...target(region,'left'),id:'vm:anatomy:body:head-neck:left:bone:left-femur'},
    {...target(region,'left'),id:'vm:anatomy:body:pelvis:left:bone:left-femur'},
    {...target(region,'left'),id:target(region,'left').id+'?patient=1'},
    {...target(region,'left'),id:'vm:anatomy:body:leg:left:bone:'+'x'.repeat(240)},
    {...target(region,'left'),id:'vm:anatomy:body:leg:left:bone:'},
    {...target(region,'left'),source:'z'.repeat(64)},
    {...target(region,'left'),laterality:'right'},
    {...target(region,'left'),coordinates:[1,2,3]},
    {...target(region,'left'),url:'https://example.invalid'},
    {...target(region,'left'),approval:true},
    {...target(region,'left'),access:'private'},
  ]){assert(!validBodySelection(bad));assert.equal(parse(envelope(bad)),null,JSON.stringify(bad));}
  assert.equal(parse(envelope(),1),null,'replay');
  assert.deepEqual(parse({...envelope(),command:2},1),{command:2,target:target(region,'left')});
  for(const invalid of ['', 'g'.repeat(40)])assert.equal(parseBodyFocusCommand(envelope(),invalid,region,session,0),null);
  for(const invalid of ['', 'short','x'.repeat(81)])assert.equal(parseBodyFocusCommand(envelope(),revision,region,invalid,0),null);
  for(const invalid of [-1,1.5,Number.MAX_SAFE_INTEGER+1])assert.equal(parseBodyFocusCommand(envelope(),revision,region,session,invalid),null);
  assert.equal(parseBodyFocusCommand(envelope(),revision,'head-neck',session,0),null);
}
console.log(JSON.stringify({passed:true,regions:['leg','thigh'],rootOnly:true,strictEnvelope:true,revisionRegionSessionReplay:true,semanticOnly:true}));
