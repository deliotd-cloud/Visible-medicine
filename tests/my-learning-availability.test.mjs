import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';import {optionalLearningRead} from '../lib/optional-learning-read.ts';
import {courseDetailsHref,courseWorkbookHref,savedLearningHref} from '../lib/saved-learning-navigation.ts';
const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const compile=(text,imports)=>{const m={exports:{}};new Function('require','module','exports',ts.transpileModule(text,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(id=>{assert(Object.hasOwn(imports,id),id);return imports[id];},m,m.exports);return m.exports;};
const Link=({href,children,...props})=>React.createElement('a',{href,...props},children);
const values={progress:[{resourceType:'atlas',resourceSlug:'ct-head',progress:20},{resourceType:'course',resourceSlug:'course-one',progress:50}],portfolio:{notes:[],reviews:[],completions:[]},profile:{onboardingStatus:'complete',trainingStage:'Training',discipline:'Radiology'},enrolments:[{id:'one',slug:'course-one',title:'Available Course',summary:'Study material',level:'Intro',availableWorkbookCount:1,availableProgress:50,resumeWorkbookId:'workbook-one',firstWorkbookId:'workbook-one',liveWorkbookId:null}]};
const failure=()=>new Error('D1_ERROR: Network connection lost.');
function harness(failures={},overrides={}){
 const calls=[],passed=[],resourceInputs=[];
 const read=name=>async()=>{calls.push(name);if(Object.hasOwn(failures,name))throw failures[name];return Object.hasOwn(overrides,name)?overrides[name]:values[name];};
 function Portfolio(props){passed.push(props);return React.createElement('section',{'data-portfolio':'loaded'},'Portfolio loaded');}
 const imports={'react/jsx-runtime':require('react/jsx-runtime'),'next/link':{__esModule:true,default:Link},'../chatgpt-auth':{requireChatGPTUser:async()=>{calls.push('auth');if(failures.auth)throw failures.auth;return{userId:'synthetic',displayName:'Learner'};},chatGPTSignOutPath:()=>'/sign-out'},'../../db/progress':{listProgress:read('progress')},'../../lib/platform-governance':{getLearnerPortfolio:read('portfolio')},'../../lib/education-platform':{getLearnerProfile:read('profile'),getLearnerEnrolments:read('enrolments')},'../../lib/catalog':{findAtlasModule:slug=>slug==='ct-head'?{title:'CT head'}:undefined,findCourse:slug=>slug==='course-one'?{title:'Course one'}:undefined},'../../components/BrowserAtlasResume':{BrowserAtlasResume:()=>React.createElement('section',{id:'browser-atlas-resume','data-browser-atlas-resume':'read-only'},'Browser Atlas resume')},'../../components/LearnerPortfolio':{LearnerPortfolio:Portfolio},'@/lib/saved-learning-navigation':{courseDetailsHref,courseWorkbookHref,savedLearningHref},'../../lib/optional-learning-read':{optionalLearningRead},'../../lib/atlas-learning-resources':{atlasLearningResources:(progress,enrolments)=>{resourceInputs.push({progress,enrolments});return[{resourceType:'atlas',resourceId:'ct-head',label:'CT head'}];}},'../../components/learner-portfolio-navigation.css':{},'./learning-availability.css':{}};
 const page=compile(fs.readFileSync(new URL('../app/my-learning/page.tsx',import.meta.url),'utf8'),imports).default;
 return{calls,passed,resourceInputs,render:async()=>renderToStaticMarkup(await page())};
}
test('successful sources preserve learning, profile, exact course launch and portfolio; each loads once',async()=>{
 const h=harness(),html=await h.render();assert.match(html,/Available Course/);assert.match(html,/href="\/learn\/course-one\/workbook-one"/);assert.match(html,/Edit profile/);assert.match(html,/data-portfolio="loaded"/);assert.doesNotMatch(html,/Unavailable|could not load|Reload learning/);
 assert.deepEqual(h.calls,['auth','progress','portfolio','profile','enrolments']);assert.equal(h.passed[0].initialPortfolio,values.portfolio);assert.equal(h.resourceInputs[0].progress,values.progress);assert.equal(h.resourceInputs[0].enrolments,values.enrolments);
});
test('progress outage keeps courses and portfolio without false saved-empty/count claims',async()=>{
 const h=harness({progress:failure()}),html=await h.render();assert.match(html,/Saved modules<\/span><b>Unavailable/);assert.match(html,/Saved learning unavailable/);assert.match(html,/Available Course/);assert.match(html,/data-portfolio="loaded"/);assert.match(html,/Some saved or enrolled resource choices are unavailable/);assert.doesNotMatch(html,/No saved modules yet/);assert.deepEqual(h.resourceInputs[0].progress,[]);
});
test('enrolment outage keeps saved learning but never infers a workbook resume from legacy progress',async()=>{
 const h=harness({enrolments:failure()}),html=await h.render();assert.match(html,/Courses<\/span><b>Unavailable/);assert.match(html,/Courses unavailable/);assert.match(html,/href="\/courses\/course-one"/);assert.match(html,/href="\/atlas\/ct-head"/);assert.doesNotMatch(html,/No course enrolments yet|href="\/learn\//);assert.deepEqual(h.resourceInputs[0].enrolments,[]);assert.equal(h.passed[0].initialPortfolio,values.portfolio);
});
test('portfolio outage leaves other sections usable and no empty records, forms or fake zero metrics',async()=>{
 const h=harness({portfolio:failure()}),html=await h.render();assert.match(html,/Reviews<\/span><b>Unavailable/);assert.match(html,/Completions<\/span><b>Unavailable/);assert.match(html,/id="portfolio-unavailable"/);assert.match(html,/Notes, revision and completions unavailable/);assert.match(html,/Available Course/);assert.match(html,/CT head/);assert.equal(h.passed.length,0);assert.doesNotMatch(html,/No private notes|No review items|href="#notes"|href="#revision"|href="#completions"/);
});
test('profile outage does not pretend onboarding is incomplete or hide account actions',async()=>{
 const h=harness({profile:failure()}),html=await h.render();assert.match(html,/Profile unavailable/);assert.match(html,/href="\/onboarding">Profile/);assert.match(html,/Account &amp; data/);assert.match(html,/Sign out/);assert.match(html,/Available Course/);assert.doesNotMatch(html,/Setup required|Complete your learner profile|Complete profile/);
});
test('combined transient outages have truthful independent placeholders and one deliberate native reload',async()=>{
 const h=harness(Object.fromEntries(Object.keys(values).map(k=>[k,failure()]))),html=await h.render();assert.equal((html.match(/Reload learning page/g)||[]).length,1);assert.match(html,/<a href="\/my-learning">Reload learning page<\/a>/);assert.match(html,/Save open notes or revision drafts first/);assert.match(html,/href="\/atlas"/);assert.match(html,/href="\/courses"/);assert.doesNotMatch(html,/D1_ERROR|Network connection|No course enrolments yet|No saved modules yet/);assert.equal(h.calls.length,5);
});
test('real empty results keep established empty states rather than unavailable messages',async()=>{
 const h=harness({}, {progress:[],enrolments:[]}),html=await h.render();assert.match(html,/No course enrolments yet/);assert.match(html,/No saved modules yet/);assert.match(html,/Saved modules<\/span><b>0/);assert.doesNotMatch(html,/could not load|Reload learning page/);
});
test('authentication rejection runs no service; unknown integrity, explicit denial and framework errors propagate unchanged',async()=>{
 const auth=Object.assign(new Error('Redirect'),{digest:'NEXT_REDIRECT;replace;/signin;307;'}),h=harness({auth});await assert.rejects(h.render(),e=>e===auth);assert.deepEqual(h.calls,['auth']);
 for(const error of [new Error('Moderation integrity mismatch'),Object.assign(failure(),{status:403}),Object.assign(failure(),{digest:'NEXT_NOT_FOUND'})]){const h=harness({portfolio:error});await assert.rejects(h.render(),e=>e===error);assert.equal(h.passed.length,0);}
});

test('browser Atlas resume appears once independently of server learning availability',async()=>{
 for(const failures of [{},Object.fromEntries(Object.keys(values).map(k=>[k,failure()]))]){
  const h=harness(failures),html=await h.render();
  assert.equal((html.match(/id="browser-atlas-resume"/g)||[]).length,1);
  assert.match(html,/<a href="#browser-atlas-resume">Atlas<\/a>/);
  assert(html.indexOf('id="browser-atlas-resume"')<html.indexOf('id="courses"'));
  assert.deepEqual(h.calls,['auth','progress','portfolio','profile','enrolments'],'no new server reads or progress writes');
 }
});


function savedCards(html){
 return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
  .filter(match=>/class="progress-card"/.test(match[1]))
  .map(match=>({href:/href="([^"]+)"/.exec(match[1])?.[1],body:match[2]}));
}

test('saved cards name the actual Atlas and workbook actions without extra service reads',async()=>{
 const h=harness(),cards=savedCards(await h.render());
 assert.equal(cards.length,2);
 assert.equal(cards[0].href,'/atlas/ct-head');assert.match(cards[0].body,/<p>Open Atlas<\/p>/);
 assert.equal(cards[1].href,'/learn/course-one/workbook-one');assert.match(cards[1].body,/<p>Continue course<\/p>/);
 assert.deepEqual(h.calls,['auth','progress','portfolio','profile','enrolments']);
});

test('enrolment outages explain each saved course fallback and leave Atlas actions usable',async()=>{
 const h=harness({enrolments:failure()},{progress:[...values.progress,{resourceType:'course',resourceSlug:'missing-course',progress:25}]});
 const cards=savedCards(await h.render());assert.equal(cards.length,3);
 assert.equal(cards[0].href,'/atlas/ct-head');assert.match(cards[0].body,/<p>Open Atlas<\/p>/);
 assert.equal(cards[1].href,'/courses/course-one');assert.match(cards[1].body,/<p>Course resume unavailable\. View course details\.<\/p>/);
 assert.equal(cards[2].href,'/courses');assert.match(cards[2].body,/<p>Course resume unavailable\. Browse courses\.<\/p>/);
 for(const card of cards.filter(card=>card.href!='/atlas/ct-head'))assert.doesNotMatch(card.body,/Continue course|D1_ERROR|Network connection/);
 assert(!cards.some(card=>card.href.startsWith('/learn/')));
});

test('zero available workbooks and missing catalogue entries have truthful saved-card destinations',async()=>{
 const enrolments=[{...values.enrolments[0],availableWorkbookCount:0,resumeWorkbookId:null,firstWorkbookId:null}];
 const cards=savedCards(await harness({}, {enrolments,progress:[...values.progress,{resourceType:'atlas',resourceSlug:'missing-atlas',progress:10},{resourceType:'course',resourceSlug:'missing-course',progress:30}]}).render());
 assert.equal(cards[1].href,'/courses/course-one');assert.match(cards[1].body,/<p>No workbooks available now\. View course details\.<\/p>/);
 assert.equal(cards[2].href,'/atlas');assert.match(cards[2].body,/<p>Browse Atlas<\/p>/);
 assert.equal(cards[3].href,'/courses');assert.match(cards[3].body,/<p>Browse courses<\/p>/);
 assert(cards.every(card=>!card.body.includes('resume unavailable')),'A valid empty result is not an outage');
});
