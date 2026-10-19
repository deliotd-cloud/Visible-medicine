import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const site=fileURLToPath(new URL('../',import.meta.url));
const stage=site;
const require=createRequire(resolve(site,'package.json'));
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const source=readFileSync(resolve(stage,'app/my-learning/page.tsx'),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
let course;
const Link=({href,children,...props})=>React.createElement('a',{href,...props},children);
const imports={
  'react/jsx-runtime':require('react/jsx-runtime'),
  'next/link':{__esModule:true,default:Link},
  '../chatgpt-auth':{requireChatGPTUser:async()=>({userId:'synthetic',displayName:'Synthetic Learner'}),chatGPTSignOutPath:()=>'/sign-out'},
  '../../db/progress':{listProgress:async()=>[]},
  '../../lib/catalog':{findAtlasModule:()=>null,findCourse:()=>null},
  '../../lib/platform-governance':{getLearnerPortfolio:async()=>({reviews:[],completions:[]})},
  '../../components/LearnerPortfolio':{LearnerPortfolio:()=>null},
  '../../lib/education-platform':{getLearnerEnrolments:async()=>[course],getLearnerProfile:async()=>({onboardingStatus:'complete',trainingStage:'synthetic',discipline:'education'})},
  '@/lib/saved-learning-navigation':{courseDetailsHref:slug=>`/courses/${slug}`,courseWorkbookHref:(slug,id)=>id?`/courses/${slug}/workbooks/${id}`:null,savedLearningHref:()=>'/saved'},
};
const module={exports:{}};
new Function('module','exports','require',code)(module,module.exports,id=>imports[id]??{});
const MyLearningPage=module.exports.default;
function card(html){return html.match(/<article class="enrolled-course-card[^]*?<\/article>/)?.[0];}
async function render(values){
  course={id:'release:one',slug:'synthetic-course',title:'Synthetic course',summary:'Education only',level:'intro',workbookCount:0,progress:0,firstWorkbookId:'workbook:one',resumeWorkbookId:'workbook:one',liveWorkbookId:null,liveStartedAt:null,availableWorkbookCount:1,availableProgress:75,...values};
  return card(renderToStaticMarkup(await MyLearningPage()));
}

test('cohort-only course renders precise available count and progress, preserving launch link',async()=>{
  const html=await render({});
  assert.match(html,/1 workbook available now/);
  assert.match(html,/Progress on available workbooks · <b>75%<\/b>/);
  assert.match(html,/width:75%/);
  assert.match(html,/href="\/courses\/synthetic-course\/workbooks\/workbook:one"/);
  assert.match(html,/Resume latest workbook/);
  assert.doesNotMatch(html,/75% complete|0 workbooks available now/);
});

test('no currently available workbook hides bar and explains empty state despite legacy progress',async()=>{
  const html=await render({workbookCount:1,progress:75,availableWorkbookCount:0,availableProgress:0,firstWorkbookId:null,resumeWorkbookId:null});
  assert.match(html,/0 workbooks available now/);
  assert.match(html,/No workbooks available now/);
  assert.doesNotMatch(html,/enrolled-progress|Progress on available workbooks|primary-button|workbooks\/workbook:one/);
});

test('available average drives displayed bar rather than legacy recorded progress',async()=>{
  const html=await render({workbookCount:1,progress:75,availableWorkbookCount:2,availableProgress:38});
  assert.match(html,/2 workbooks available now/);
  assert.match(html,/Progress on available workbooks · <b>38%<\/b>/);
  assert.match(html,/width:38%/);
  assert.doesNotMatch(html,/width:75%/);
});
