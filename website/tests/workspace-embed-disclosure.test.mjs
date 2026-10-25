import {loadNativeDisclosure,restoreNativeDisclosureConsumer} from './native-disclosure-source.mjs';
import {restoreWorkspaceAccessSource} from './workspace-access-source-role.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const ts=require('typescript');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const source=restoreWorkspaceAccessSource('app/workspace/page.tsx',readFileSync(new URL('../app/workspace/page.tsx',import.meta.url),'utf8')).toString('utf8');
const fixture=JSON.parse(readFileSync(new URL('./fixtures/workspace-page-original.json',import.meta.url)));
const originalSha='3a742c5e0ef484852da0b42a24d21b0c61f796b6ffcf474accf46ccd6f22e4ba';
const currentSha='5db80991307ffd7f8d3164e516bb68a08544b2d9a8e040fa5f6df747550d26e5';
const manager='<EmbedOriginManager initialOrigins={snapshot.embedOrigins} enabled={snapshot.entitlement.embedsAccess && snapshot.educationRoles.includes("administrator")} />';
const oldTail=`          <Link href="/workspace/control">Institution setup</Link>\n        </div></details>}\n`;
const oldStandalone=`      {administrator && ${manager}}\n`;
const replace=(text,before,after)=>{assert.equal(text.split(before).length,2,before);return text.replace(before,after);};

function verify(candidate){
  candidate=restoreNativeDisclosureConsumer('app/workspace/page.tsx',candidate).toString();
  assert.equal(fixture.schema,'visible-medicine.original-source-text/1');
  assert.equal(fixture.path,'app/workspace/page.tsx');
  assert.equal(fixture.sha256,originalSha);assert.equal(sha(fixture.text),originalSha);
  assert.equal(sha(candidate),currentSha);
  const inside=oldTail.replace('</div></details>','</div>'+manager+'</details>');
  const expected=replace(replace(fixture.text,oldTail,inside),oldStandalone,'');
  assert.equal(candidate,expected,'Only the existing administrator manager may move into Administration');
}

test('administrator disclosure is an exact move of the original call and props',()=>verify(source));

test('exact move refuses a changed gate, prop, scope or unrelated workspace text',()=>{
  for(const [historicalBefore,historicalAfter] of [
    ['{administrator && <details>','{true && <details>'],
    ['enabled={snapshot.entitlement.embedsAccess && snapshot.educationRoles.includes("administrator")}','enabled={true}'],
    ['initialOrigins={snapshot.embedOrigins}','initialOrigins={[]}'],
    ['</div>'+manager+'</details>','</div></details>'+manager],
    ['Clinical Review</strong>','Review hidden</strong>'],
  ]){
    const adapt=text=>text.replaceAll('<details','<NativeDisclosure').replaceAll('</details>','</NativeDisclosure>');
    const before=adapt(historicalBefore),after=adapt(historicalAfter);
    assert(source.includes(before),before);
    assert.throws(()=>verify(source.replace(before,after)),before);
  }
});

let roles=['administrator'],reviewAllowed=true,reviewCalls=0,snapshotCalls=0;
const managerCalls=[];
const origins=[{id:'origin-1',origin:'https://education.example.test'}];
const snapshot={
  organization:{name:'Education Trust',role:'educator'},
  entitlement:{status:'active',plan:'Education',storageBytes:1073741824,learnerLimit:20,educatorLimit:5,
    atlasAccess:true,studioAccess:true,reportingAccess:true,embedsAccess:false},
  usage:{learners:3,courses:2,workbooks:4,governedMedia:0},
  publications:[],embedOrigins:origins,educationRoles:['administrator'],
};
const Link=({children,...props})=>React.createElement('a',props,children);
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,
  target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const module={exports:{}};
const imports={
  'next/link':Link,
  'next/navigation':{redirect:href=>{throw Error('redirect:'+href);}},
  '../chatgpt-auth':{requireChatGPTUser:async()=>({userId:'one',email:'one@example.test',displayName:'Educator'})},
  '../../components/NativeDisclosure':{NativeDisclosure:loadNativeDisclosure()},
  '../../db/platform':{getPlatformSnapshot:async()=>{snapshotCalls++;return snapshot;}},
  '../../components/EmbedOriginManager':{EmbedOriginManager:props=>{managerCalls.push(props);return React.createElement('div',{'data-testid':'embed-manager'},'Embedding origins');}},
  '@/db/bootstrap':{ensureEducationUser:async()=>({roles})},
  '@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{reviewCalls++;if(!reviewAllowed)throw Error('review unavailable');}},
};
new Function('require','module','exports',code)(name=>Object.hasOwn(imports,name)?imports[name]:require(name),module,module.exports);
const WorkspacePage=module.exports.default;
async function render(){managerCalls.length=0;reviewCalls=0;snapshotCalls=0;return renderToStaticMarkup(await WorkspacePage());}

test('administrator manager mounts once inside initially closed Administration after its links',async()=>{
  roles=['administrator'];reviewAllowed=true;
  const html=await render();
  assert.equal(reviewCalls,1);assert.equal(managerCalls.length,1);
  assert.equal(managerCalls[0].initialOrigins,origins);assert.equal(managerCalls[0].enabled,false);
  const start=html.indexOf('<details><summary>Administration');assert(start>=0);
  const end=html.indexOf('</details>',start);assert(end>start);
  const administration=html.slice(start,end);
  assert.doesNotMatch(html.slice(start,start+40),/\bopen(?:=|>)/);
  assert(administration.indexOf('href="/workspace/control"')<administration.indexOf('data-testid="embed-manager"'));
  assert.match(administration,/data-testid="embed-manager"/);
  assert.equal((html.match(/data-testid="embed-manager"/g)||[]).length,1);
  assert.doesNotMatch(html.slice(end+10),/data-testid="embed-manager"/);
  assert.match(html,/href="\/my-learning"/);assert.match(html,/href="\/studio\/workspace"/);
  assert.match(html,/href="\/workspace\/clinical-review-inbox"/);
});

test('manager retains exact entitlement and education-role gating without unmounting for administrators',async()=>{
  roles=['administrator'];reviewAllowed=false;
  for(const [access,educationAdmin,enabled] of [[false,true,false],[true,true,true],[true,false,false]]){
    snapshot.entitlement.embedsAccess=access;
    snapshot.educationRoles=educationAdmin?['administrator']:['instructor'];
    const html=await render();
    assert.equal(reviewCalls,1);assert.equal(managerCalls.length,1);
    assert.equal(managerCalls[0].enabled,enabled);
    assert.equal(managerCalls[0].initialOrigins,origins);
    assert.match(html,/<details><summary>Administration/);
    assert.doesNotMatch(html,/href="\/workspace\/clinical-review-inbox"/);
    assert.equal((html.match(/data-testid="embed-manager"/g)||[]).length,1);
  }
});

test('nonadministrators never mount manager or administration; unauthorized role redirects before snapshot',async()=>{
  snapshot.entitlement.embedsAccess=true;snapshot.educationRoles=['administrator'];reviewAllowed=true;
  for(const role of ['instructor','examiner']){
    roles=[role];const html=await render();
    assert.equal(reviewCalls,0);assert.equal(managerCalls.length,0);
    assert.doesNotMatch(html,/data-testid="embed-manager"|<summary>Administration/);
    assert.doesNotMatch(html,/href="\/workspace\/clinical-review-inbox"/);
  }
  roles=['learner'];managerCalls.length=0;reviewCalls=0;snapshotCalls=0;
  await assert.rejects(WorkspacePage(),/redirect:\/my-learning/);
  assert.equal(managerCalls.length,0);assert.equal(reviewCalls,0);assert.equal(snapshotCalls,0);
});
