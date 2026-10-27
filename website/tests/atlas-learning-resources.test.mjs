import {optionalLearningRead} from '../lib/optional-learning-read.ts';
import {portfolioPagination} from './learner-portfolio-pagination-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildSync} from 'esbuild';

const site=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(resolve(site,'package.json'));
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');

function load(code, imports) {
  const module={exports:{}};
  new Function('module','exports','require',code)(module,module.exports,id=>imports[id]??require(id));
  return module.exports;
}
function transpile(path) {
  return ts.transpileModule(readFileSync(resolve(site,path),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
}
// Bundle the production helper with its real catalog and navigation metadata.
const helperBuild=buildSync({entryPoints:[resolve(site,'lib/atlas-learning-resources.ts')],bundle:true,platform:'node',format:'cjs',write:false});
const {atlasLearningResources}=load(helperBuild.outputFiles[0].text,{});
const {LearnerPortfolio}=load(transpile('components/LearnerPortfolio.tsx'),{
  'react':React,'react/jsx-runtime':require('react/jsx-runtime'),
  '../lib/learner-portfolio-pagination':portfolioPagination,
  '../lib/learning-draft-navigation.ts':{registerLearningDraftGuard:()=>()=>{}},
});

const Link=({href,children,...props})=>React.createElement('a',{href,...props},children);
let saved=[],enrolled=[];
const emptyPortfolio={notes:[],reviews:[],completions:[]};
const imports={
  '../../lib/optional-learning-read':{optionalLearningRead},
  './learning-availability.css':{},
  'react/jsx-runtime':require('react/jsx-runtime'),
  'next/link':{__esModule:true,default:Link},
  '../chatgpt-auth':{requireChatGPTUser:async()=>({userId:'synthetic',displayName:'Synthetic Learner'}),chatGPTSignOutPath:()=>'/sign-out'},
  '../../db/progress':{listProgress:async()=>saved},
  '../../lib/catalog':{findAtlasModule:slug=>slug==='ct-head'?{title:'CT head'}:null,findCourse:()=>null},
  '../../lib/atlas-learning-resources':{atlasLearningResources},
  '../../components/learner-portfolio-navigation.css':{},
  '../../lib/platform-governance':{getLearnerPortfolio:async()=>emptyPortfolio},
  '../../components/LearnerPortfolio':{LearnerPortfolio},
  '../../lib/education-platform':{getLearnerEnrolments:async()=>enrolled,getLearnerProfile:async()=>({onboardingStatus:'complete',trainingStage:'synthetic',discipline:'education'})},
  '@/lib/saved-learning-navigation':{courseDetailsHref:slug=>`/courses/${slug}`,courseWorkbookHref:()=>null,savedLearningHref:()=>'/saved'},
};
const MyLearningPage=load(transpile('app/my-learning/page.tsx'),imports).default;
function choicesFrom(html) {
  const selects=[...html.matchAll(/<select name="resource"[^>]*>(.*?)<\/select>/g)].map(match=>[...match[1].matchAll(/<option value="([^"]+)"[^>]*>([^<]+)<\/option>/g)].map(option=>[option[1],option[2]]));
  assert.equal(selects.length,2,'both note and revision forms render');
  assert.deepEqual(selects[0],selects[1]);
  return selects[0];
}

test('fresh learner sees available Atlas destinations in both portfolio forms without fabricated records',async()=>{
  saved=[]; enrolled=[];
  const html=renderToStaticMarkup(await MyLearningPage());
  const choices=choicesFrom(html);
  const ids=choices.map(([value])=>value);
  assert.equal(ids[0],'atlas::ct-head');
  for(const id of ['ct-head','mri-head','lower-limb-3d','female-pelvis-3d','shoulder-3d','head-neck-3d','spine-3d','thorax-3d','abdomen-3d','pelvis-3d','3d','3d:shoulder-arm','3d:forearm','3d:hand','3d:thigh','3d:leg','3d:foot']) assert.ok(ids.includes('atlas::'+id),id);
  assert.equal(ids.length,17);
  for(const id of ['atlas::mr-knee','atlas::ct-chest','atlas::ct-abdomen']) assert.ok(!ids.includes(id),`preview ${id}`);
  assert.equal(new Set(ids).size,ids.length,'catalog and canonical region rows deduplicate');
  assert.match(html,/Saved modules<\/span><b>0<\/b>/);
  assert.match(html,/Reviews<\/span><b>0<\/b>/);
  assert.match(html,/Completions<\/span><b>0<\/b>/);
  assert.match(html,/No saved modules yet/);
  assert.match(html,/No private notes yet/);
  assert.match(html,/No review items scheduled/);
});

test('planned and noncanonical future regions are not advertised as study destinations',()=>{
  const {atlasLearningResources:choices}=load(transpile('lib/atlas-learning-resources.ts'),{
    './saved-learning-navigation':load(transpile('lib/saved-learning-navigation.ts'),{}),
    './catalog':{atlasModules:[],findAtlasModule:()=>null,findCourse:()=>null},
    './atlas-navigation':{atlasBodyRegions:[
      {id:'planned',label:'Planned',href:'/atlas/planned',planned:true},
      {id:'external',label:'External',href:'https://external.invalid/atlas/3d'},
      {id:'wrong',label:'Wrong region',href:'/atlas/3d?region=foot'},
      {id:'foot',label:'Duplicate region',href:'/atlas/3d?region=foot&region=foot'},
      {id:'whole-body',label:'Whole body',href:'/atlas/3d'},
      {id:'foot',label:'Foot',href:'/atlas/3d?region=foot'},
    ]},
  });
  assert.deepEqual(choices([],[]).map(r=>r.resourceId),['ct-head','3d','3d:foot','mri-head']);
});

test('saved progress and enrolments stay selectable with no duplicate available Atlas choice',async()=>{
  saved=[{resourceType:'atlas',resourceSlug:'ct-head',progress:25},{resourceType:'atlas',resourceSlug:'legacy-atlas',progress:10},{resourceType:'course',resourceSlug:'legacy-course',progress:50}];
  enrolled=[{id:'course-one',slug:'legacy-course',title:'Enrolled course',summary:'Education only',level:'Foundation',availableWorkbookCount:0,availableProgress:0,firstWorkbookId:null,resumeWorkbookId:null,liveWorkbookId:null}];
  const choices=choicesFrom(renderToStaticMarkup(await MyLearningPage()));
  const ids=choices.map(([value])=>value);
  assert.equal(ids.filter(id=>id==='atlas::ct-head').length,1);
  assert.ok(ids.includes('atlas::legacy-atlas'));
  assert.equal(ids.filter(id=>id==='course::legacy-course').length,1);
  assert.ok(choices.some(([id,label])=>id==='course::legacy-course'&&label==='Course · Enrolled course'));
});
