import fs from 'node:fs';import {createRequire} from 'node:module';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import * as queues from '../lib/studio-queues.ts';import * as reviewQueue from '../lib/studio-review-queue.ts';
const require=createRequire(import.meta.url),ts=require('typescript');
const Link=({children,...props})=>React.createElement('a',props,children);
export function fixtureSnapshot(){
 const release=(id,title,status='in-review',changes={})=>({id,title,status,createdBy:'edu:author-b',organizationId:'school-a',version:2,materialRevision:'a'.repeat(64),approvalCurrent:false,courseId:'course-a',summary:'Synthetic course only',publisherKind:'institution',visibility:'private',accessModel:'institution',workbookCount:1,enrolmentOpen:false,...changes});
 return {organization:{id:'school-a',name:'Synthetic institution',role:'staff'},educationRoles:['instructor'],
 courses:[{id:'course-a',title:'Synthetic anatomy course',code:'SYN',workbookCount:1,releaseCount:6}],
 workbooks:[{id:'workbook-a',title:'Synthetic workbook',status:'draft',mode:'teaching',courseTitle:'Synthetic anatomy course',version:2}],
 releases:[release('own','Your release','in-review',{createdBy:'edu:reviewer-a'}),release('other','Another author'),release('stale','Needs re-review','approved'),release('unknown','Binding unavailable','in-review',{materialRevision:null}),release('current','Current approval','approved',{approvalCurrent:true}),release('changes','Corrections requested','changes-requested')],releaseHistory:[]};
}
export async function renderStudioFixture(page='workspace',params={},snapshot=fixtureSnapshot()){
 const file='app/studio/'+page+'/page.tsx',source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const returnPaths=[],mutationCalls=[];
 const imports={'next/link':Link,'../../chatgpt-auth':{requireChatGPTUser:async path=>{returnPaths.push(path);return {userId:'reviewer-a',email:'synthetic@example.invalid',displayName:'Synthetic reviewer'};}},'@/components/StudioShell':{StudioShell:({children,title,description,actions})=>React.createElement('main',{className:'inner-page studio-page'},React.createElement('h1',null,title),React.createElement('p',null,description),actions,children)},'@/lib/education-platform':{getStudioSnapshot:async()=>snapshot},'@/lib/studio-review-queue':reviewQueue,'@/lib/studio-queues':queues,'@/lib/pilot-readiness':{releaseReadiness:()=>({complete:0,checks:[]})},'@/components/StudioForms':{ReleaseWorkflowActions:({release})=>React.createElement('div',{'data-release-action':release.id},'Workflow for '+release.title)},'@/components/CourseInvitationPanel':{CourseInvitationPanel:()=>null}};
 const module={exports:{}};new Function('require','module','exports',code)(name=>Object.hasOwn(imports,name)?imports[name]:require(name),module,module.exports);
 const tree=await module.exports.default({searchParams:Promise.resolve(params)});return{tree,html:renderToStaticMarkup(tree),returnPaths,mutationCalls,snapshot};
}
