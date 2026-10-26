import fs from 'node:fs';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createRequire} from 'node:module';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261026-studio-outline-find-v2',sourceFile=stage+'/SOURCE_CANDIDATE_V2.json',source=json(sourceFile),site=source.website;
assert.equal(hash(sourceFile),'194dc14bf69a68edb959a1ce87d2685db17315514bf9bc823ab8686b1fa0b3db');
assert(json(stage+'/checks/tests-attempt-2/RESULT.json').passing);
assert.deepEqual(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions,[]);
for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const dir=stage+'/browser-qa';assert(!fs.existsSync(dir));fs.mkdirSync(dir);
const require=createRequire(site+'/package.json'),esbuild=require('esbuild');
const entry=`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {StudioCourseEditor} from './components/StudioCourseEditor.tsx';
const course={id:'synthetic-course',title:'Synthetic course',code:'QA',description:'Test content only'};
const scope={actorId:'synthetic-author',organizationId:'synthetic-school'};
const workbooks=Array.from({length:24},(_,i)=>({id:'synthetic-'+i,courseId:course.id,title:(i===0?'Brain MRI orientation':i===7?'Brain assessment':i===12?'Brain anatomy lecture':'Teaching item '+(i+1)),mode:i%3===0?'lecture':i%3===1?'teaching':'assessment',status:'draft',caseCount:3}));
workbooks[0].mode='teaching';workbooks[7].mode='assessment';workbooks[12].mode='lecture';
const releases=[{id:'synthetic-release',courseId:course.id,status:'draft',version:1,title:'Synthetic draft',workbookIds:[workbooks[0].id,'missing-slot',workbooks[12].id,workbooks[7].id]}];
createRoot(document.getElementById('root')).render(<main className='inner-page studio-app'><p className='qa-notice'>Synthetic Studio layout check — test data only. This is not a signed-in course acceptance.</p><div className='studio-app-layout'><aside className='studio-app-nav'><h2>Studio</h2><p>Courses</p></aside><div className='studio-app-main'><header className='studio-app-heading'><h1>Course editor</h1></header><StudioCourseEditor course={course} workbooks={workbooks} releases={releases} recoveryScope={scope}/></div></div></main>);`;
const mocks={
 link:`import React from 'react';export default function Link(p){return React.createElement('a',p,p.children)}`,
 navigation:`export function useSearchParams(){return new URLSearchParams(window.location.search)}`,
 forms:`import React from 'react';const form=(name)=>function SyntheticForm(){return <form data-synthetic-form={name} onSubmit={e=>e.preventDefault()}><label>{name} test draft<input aria-label={name+' test draft'} defaultValue='' /></label></form>};export const CreateWorkbookForm=form('Add content'),EditCourseDetailsForm=form('Course details'),ReleaseDraftForm=form('Release');export function DuplicateCourseButton(){return <button type='button'>Duplicate course</button>}`,
};
await esbuild.build({stdin:{contents:entry,resolveDir:site,sourcefile:'studio-outline-browser-qa.tsx',loader:'tsx'},bundle:true,platform:'browser',format:'iife',outfile:dir+'/qa.js',minify:false,define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'synthetic-boundaries',setup(build){build.onResolve({filter:/^next\/(link|navigation)$/},args=>({path:args.path.split('/')[1],namespace:'qa'}));build.onResolve({filter:/^\.\/StudioForms$/},()=>({path:'forms',namespace:'qa'}));build.onLoad({filter:/.*/,namespace:'qa'},args=>({contents:mocks[args.path],loader:'tsx',resolveDir:site}));}}]});
const html='<!doctype html><html><head><meta charset="utf-8"><title>Synthetic Studio outline QA</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/globals.css"><link rel="stylesheet" href="/studio.css"><style>body{margin:0}.qa-notice{padding:12px;margin:0;background:#eef6f3;color:#174044;font:14px system-ui}.studio-app{padding:0!important}.studio-app-layout{display:grid}.studio-app-nav{padding:16px}.studio-app-main{min-width:0}.course-editor{padding:24px}</style></head><body><div id="root"></div><script src="/qa.js"></script></body></html>';
const assets=new Map([['/atlas/studio/courses/synthetic-course',()=>['text/html',html]],['/qa.js',()=>['text/javascript',fs.readFileSync(dir+'/qa.js')]],['/globals.css',()=>['text/css',fs.readFileSync(site+'/app/globals.css')]],['/studio.css',()=>['text/css',fs.readFileSync(site+'/components/studio-workspace.css')]]]);
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://127.0.0.1').pathname;const item=assets.get(name);if(req.method!=='GET'||!item){res.writeHead(404,{'Cache-Control':'no-store'}).end('Not found');return;}const[type,body]=item();res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(body);});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const port=server.address().port,url='http://127.0.0.1:'+port+'/atlas/studio/courses/synthetic-course';
fs.writeFileSync(dir+'/HANDLE.json',JSON.stringify({at:new Date().toISOString(),pid:process.pid,port,url,source:{path:sourceFile,sha256:hash(sourceFile)},actualComponent:true,syntheticFixturesAndForms:true,noAuthenticationAcceptance:true,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({pid:process.pid,port,url,syntheticOnly:true}));
process.stdin.setEncoding('utf8');process.stdin.on('data',text=>{if(text.trim()==='stop'){server.close(()=>{fs.writeFileSync(dir+'/TERMINAL.json',JSON.stringify({at:new Date().toISOString(),pid:process.pid,cooperativeShutdown:true})+'\n',{flag:'wx'});process.exit(0);});server.closeIdleConnections();}});process.stdin.resume();
