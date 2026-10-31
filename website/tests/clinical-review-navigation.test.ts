import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const immutableGitOptions={windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};

test('saved sequential-review delivery changed only its body review interface; current navigation remains intact',()=>{
 const before=JSON.parse(execFileSync('git',['show','ff3502a:atlas-review/manifest.json'],{...immutableGitOptions,encoding:'utf8'}));
 const after=JSON.parse(execFileSync('git',['show','0c608b3:atlas-review/manifest.json'],{...immutableGitOptions,encoding:'utf8'}));
 const changed=after.files.filter((f:any)=>before.files.find((p:any)=>p.path===f.path)?.sourceSha256!==f.sourceSha256).map((f:any)=>f.path).sort();
 assert.deepEqual(changed,['app/review/body/body-review.css','app/review/body/review-dashboard.tsx']);
 assert.equal(after.files.length,before.files.length);
 const current=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 for(const path of changed){
  const delivered=after.files.find((f:any)=>f.path===path);
  assert.equal(createHash('sha256').update(execFileSync('git',['show','0c608b3:atlas-review/'+path],immutableGitOptions)).digest('hex'),delivered.importedSha256,'Historical navigation delivery stays exact');
  const now=current.files.find((f:any)=>f.path===path);
  assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),now.importedSha256,'Current navigation source is independently bound');
 }
 const dashboard=execFileSync('git',['show','0c608b3:atlas-review/app/review/body/review-dashboard.tsx'],{...immutableGitOptions,encoding:'utf8'});
 assert.ok(dashboard.includes('Previous structure')&&dashboard.includes('Next structure'));
 assert.ok(dashboard.includes('if (id === selected) return;'));
 assert.ok(dashboard.includes('index < 0 || !canLeave()'));
 assert.ok(dashboard.includes('setPage(Math.floor(index / 20))'));
 assert.ok(dashboard.includes('clinicalReviewFetch(`/api/atlas-review/body-review?structure='));
 assert.ok(!dashboard.includes("method: 'POST'"));
});

test('saved review-navigation delivery left learner assets and model bytes unchanged',()=>{
 for(const module of ['head-neck','shoulder']){
  const path='public/atlas-runtime/'+module+'/manifest.json';
  const before=JSON.parse(execFileSync('git',['show','ff3502a:'+path],{...immutableGitOptions,encoding:'utf8'}));
  const after=JSON.parse(execFileSync('git',['show','0c608b3:'+path],{...immutableGitOptions,encoding:'utf8'}));
  assert.deepEqual(after.files,before.files,'Re-exported learner dependency graph and assets are byte-identical');
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(after[flag],false);
 }
});

test('current Review navigation preserves queue and fetch boundaries with an explicit nonblocking leave decision',()=>{
 const dashboard=readFileSync('atlas-review/app/review/body/review-dashboard.tsx','utf8');
 for(const value of ['Previous structure','Next structure','if (id === selected) return;',
  'if (index < 0) return;',"requestLeave({ kind: 'structure', id }, focusTarget);",
  'setPage(Math.floor(index / 20))','clinicalReviewFetch(`/api/atlas-review/body-review?structure=',
  '<AlertDialog','Keep editing','Discard edits and continue','sameLeaveContext',
  'event.ctrlKey','event.metaKey','event.shiftKey','event.altKey'])assert(dashboard.includes(value),value);
 assert(!dashboard.includes('window.confirm('));assert(!dashboard.includes("method: 'POST'"));
});

test('current structure selection preserves the triggering control and refuses unchanged or missing rows',async()=>{
 const ts=(await import('typescript')).default;
 const dashboard=readFileSync('atlas-review/app/review/body/review-dashboard.tsx','utf8');
 const source=ts.createSourceFile('review-dashboard.tsx',dashboard,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const functions:any[]=[];
 const visit=(node:any)=>{if(ts.isFunctionDeclaration(node)&&node.name?.text==='selectStructure')functions.push(node);ts.forEachChild(node,visit);};
 visit(source);assert.equal(functions.length,1);
 const code=ts.transpileModule(functions[0].getText(source),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const requests:any[]=[];
 const rows=[{id:'first'},{id:'second'}],before=structuredClone(rows),origin={id:'next-button'};
 const select=new Function('selected','matches','requestLeave',code+';return selectStructure;')('first',rows,(...args:any[])=>requests.push(args));
 select('first',origin);select('missing',origin);assert.deepEqual(requests,[]);
 select('second',origin);assert.deepEqual(requests,[[{kind:'structure',id:'second'},origin]]);assert.equal(requests[0][1],origin);
 select('second');assert.deepEqual(requests[1],[{kind:'structure',id:'second'},undefined]);assert.deepEqual(rows,before);
 for(const control of ['previousStructure','nextStructure'])assert(dashboard.includes(`selectStructure(${control}.id, event.currentTarget)`),control+' forwards the actual control');
});
