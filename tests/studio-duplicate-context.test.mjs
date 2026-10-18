import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

const require=createRequire(import.meta.url);
function load(file,mocks){
 const source=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 new Function('require','module','exports',code)(name=>Object.hasOwn(mocks,name)?mocks[name]:require(name),mod,mod.exports);
 return mod.exports;
}
const scope={actorId:'edu:synthetic-actor',organizationId:'synthetic-school'};
const stub=()=>null;
test('course editor binds duplicate course to the same trusted scope as its forms',()=>{
 let duplicate;
 const forms={CreateWorkbookForm:stub,EditCourseDetailsForm:stub,ReleaseDraftForm:stub,DuplicateCourseButton:props=>{duplicate=props;return null;}};
 const {StudioCourseEditor}=load('components/StudioCourseEditor.tsx',{'./StudioForms':forms,'next/link':stub,'next/navigation':{useSearchParams:()=>null}});
 const course={id:'course:exact',title:'Synthetic course',description:'Synthetic description',code:'SYN'};
 renderToStaticMarkup(React.createElement(StudioCourseEditor,{course,workbooks:[],releases:[],recoveryScope:scope}));
 assert.deepEqual(duplicate,{courseId:course.id,recoveryScope:scope});
});
test('workbook page passes hosting actor and snapshot organization to duplicate; lecture still redirects',async()=>{
 let mode='teaching';
 const workbook={id:'workbook:/? exact',courseTitle:'Course',moduleTitle:'Module',title:'Synthetic workbook',mode,status:'draft',version:1,caseCount:0};
 const user={userId:'synthetic-actor',email:'synthetic@example.invalid',displayName:'Synthetic'};
 const snapshot={organization:{id:scope.organizationId},workbooks:[workbook]};
 let duplicate;
 const {default:page}=load('app/studio/workbooks/[workbookId]/page.tsx',{
  'next/link':stub,
  'next/navigation':{notFound(){throw Error('NOT_FOUND');},redirect(path){throw Error('REDIRECT:'+path);}},
  '../../../chatgpt-auth':{requireChatGPTUser:async()=>user},
  '@/components/StudioShell':{StudioShell:({actions})=>actions},
  '@/components/StudioForms':{DuplicateWorkbookButton:props=>{duplicate=props;return null;}},
  '@/components/WorkbookRetirement':{WorkbookRetirement:stub},
  '@/components/WorkbookCorrection':{WorkbookCorrection:stub},
  '@/components/WorkbookCorrectionLineage':{WorkbookCorrectionLineage:stub},
  '@/lib/education-platform':{getStudioSnapshot:async()=>snapshot},
 });
 const params=Promise.resolve({workbookId:encodeURIComponent(workbook.id)});
 const tree=await page({params});
 renderToStaticMarkup(tree);
 assert.deepEqual(duplicate,{workbookId:workbook.id,recoveryScope:scope});
 workbook.mode='lecture';
 await assert.rejects(page({params}),new RegExp('REDIRECT:/studio/workbooks/'+encodeURIComponent(workbook.id)+'/builder'));
});
