import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,mkdirSync,mkdtempSync,writeFileSync,copyFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve,sep} from 'node:path';
const website='F:/VisibleMedicine/website';
const require=createRequire(website+'/package.json');
const {buildSync}=require('esbuild'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const entry=fileURLToPath(new URL('../app/workspace/atlas-review/loading.tsx',import.meta.url));
const output=buildSync({entryPoints:[entry],absWorkingDir:website,nodePaths:[website+'/node_modules'],platform:'node',format:'cjs',jsx:'automatic',bundle:true,external:['react','react/jsx-runtime'],write:false,logLevel:'silent'});
const module={exports:{}};new Function('require','module','exports',output.outputFiles[0].text)(require,module,module.exports);
const Loading=module.exports.default;
const html=renderToStaticMarkup(React.createElement(Loading));
const source=readFileSync(entry,'utf8');

test('loading screen gives an honest accessible state without claiming loaded data',()=>{
 assert.match(html,/<main class="inner-page">/);
 assert.match(html,/role="status" aria-live="polite" aria-busy="true"/);
 assert.match(html,/<h1>Opening Clinical Review…<\/h1>/);
 assert.match(html,/The protected workspace is still opening\./);
 assert.doesNotMatch(html,/approved|signed off|saved successfully|\b100%\b|progressbar/i);
});

test('manual recovery opens only the protected inbox in another tab',()=>{
 assert.match(html,/<a href="\/workspace\/clinical-review-inbox" target="_blank" rel="noopener noreferrer">/);
 assert.equal((html.match(/<a /g)??[]).length,1);
 assert.match(html,/Keep the original tab open if it may contain unsaved notes/);
 assert.match(html,/does not reload or discard an existing review/);
 assert.doesNotMatch(html,/<(?:button|form|input|textarea|iframe)\b/);
});

test('fallback is static and never authenticates, reloads, saves, or clears drafts',()=>{
 assert.doesNotMatch(source,/\b(?:fetch|localStorage|sessionStorage|setTimeout|setInterval|useEffect|useLayoutEffect|redirect|location|window|document)\b/);
 assert.doesNotMatch(source,/\bon(?:Click|Submit|Change|Load)=/);
 const layout=readFileSync(website+'/app/workspace/atlas-review/layout.tsx','utf8');
 assert.match(layout,/await authorizeClinicalReview\(\)/);
 assert.match(layout,/Clinical Review is temporarily unavailable/);
 assert.match(layout,/known && error\.status === 401/);
});

test('the installed framework discovers this fallback only for the protected Review branch',async()=>{
 const {appRouter}=await import(pathToFileURL(website+'/node_modules/vinext/dist/routing/app-router.js').href);
 const stage=resolve(dirname(entry),'../../..'),local=resolve(stage,'.local');mkdirSync(local,{recursive:true});
 const fixture=mkdtempSync(resolve(local,'route-discovery-'));
 assert(fixture.startsWith(local+sep));
 for(const part of ['workspace/atlas-review/body','workspace/atlas-review/shoulder','courses'])mkdirSync(resolve(fixture,'app',part),{recursive:true});
 for(const part of ['workspace/atlas-review/body','workspace/atlas-review/shoulder','courses'])writeFileSync(resolve(fixture,'app',part,'page.tsx'),'export default function Page(){return null;}\n',{flag:'wx'});
 const loading=resolve(fixture,'app/workspace/atlas-review/loading.tsx');copyFileSync(entry,loading);
 const authorization=resolve(fixture,'app/workspace/atlas-review/layout.tsx');copyFileSync(website+'/app/workspace/atlas-review/layout.tsx',authorization);
 const routes=await appRouter(resolve(fixture,'app'));
 for(const path of ['/workspace/atlas-review/body','/workspace/atlas-review/shoulder']){
  const route=routes.find(row=>row.pattern===path);assert(route,path);
  assert.deepEqual(route.loadingPaths.map(path=>resolve(path)),[loading],'Real parent loading convention, not a leaf-only loadingPath');
  assert(route.layouts.map(path=>resolve(path)).includes(authorization),'Existing authorization layout remains in the branch');
 }
 const course=routes.find(row=>row.pattern==='/courses');assert(course);
 assert.equal(course.loadingPath,null,'Unrelated learner courses do not inherit Review loading UI');
 assert.deepEqual(course.loadingPaths,[],'No inherited Review boundary for learner courses');
});
