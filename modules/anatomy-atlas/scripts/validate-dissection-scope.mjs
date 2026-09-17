import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';
const compiled = await build({stdin:{contents:`export * from './lib/dissection-scope';
export * from './app/dissection-data'; export * from './lib/body-display-catalog';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {dissectionScopeAction,dissectionProfiles,initialDissection,dissectionReducer,resolveDissection,bodyDisplayCatalog,matchesRule,stageStructures} = await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const original=JSON.stringify(catalog);let scopes=0,recipes=0;
for(const [region,profile] of Object.entries(dissectionProfiles))for(const side of ['both','left','right']){
 const action=dissectionScopeAction(catalog,profile,region,side);
 const scope=catalog.structures.filter(s=>(region==='whole-body'||s.regions.includes(region))&&(side==='both'||s.laterality===side||['midline','unpaired','unspecified'].includes(s.laterality)));
 for(const focus of profile.focuses){
  const state=dissectionReducer(initialDissection,{type:'focus',id:focus.id});
  const before=JSON.stringify(state),result=dissectionReducer(state,action);
  const available=stageStructures(scope,profile,'free',focus.id).some(s=>matchesRule(s,focus.rule));
  assert.equal(result.focusId,available?focus.id:null,region+'/'+side+'/'+focus.id);
  if(available)assert.equal(result,state,'Compatible focus/history is unchanged');
  else {assert.equal(result.stageId,'assembled');assert.equal(resolveDissection(scope,profile,result).visible.length,scope.length);}
  assert.equal(JSON.stringify(state),before,'No caller mutation');recipes++;
 }
 const unavailable=profile.focuses.find(f=>!action.availableFocusIds.includes(f.id));
 if(unavailable){
  const incompatible=dissectionReducer(initialDissection,{type:'focus',id:unavailable.id});
  const left=dissectionReducer(incompatible,{type:'free'});
  const mixed={...left,history:[...left.history],future:[...left.history]};
  const fixed=dissectionReducer(mixed,action);
  for(const stack of ['history','future'])assert(fixed[stack].every(s=>s.focusId===null||action.availableFocusIds.includes(s.focusId)));
  for(const direction of ['undo','redo']){
   let cursor=fixed;
   for(let i=0;i<45;i++){cursor=dissectionReducer(cursor,{type:direction});assert(cursor.focusId===null||action.availableFocusIds.includes(cursor.focusId));}
  }
  assert.equal(dissectionReducer(fixed,action),fixed,'Repeated reconciliation is a no-op');
 }
 scopes++;
}
for(const region of ['head-neck','spine','whole-body']){
 const profile=dissectionProfiles[region],state=dissectionReducer(initialDissection,{type:'focus',id:'longus-colli-left'});
 assert.equal(dissectionReducer(state,dissectionScopeAction(catalog,profile,region,'left')),state);
 assert.equal(dissectionReducer(state,dissectionScopeAction(catalog,profile,region,'both')),state);
 const right=dissectionReducer(state,dissectionScopeAction(catalog,profile,region,'right'));
 assert.equal(right.focusId,null);assert.equal(right.stageId,'assembled');
}
assert.equal(JSON.stringify(catalog),original);
console.log(JSON.stringify({passed:true,scopes,recipes,sourceGeometryChanged:false,clinicalValidation:false}));
