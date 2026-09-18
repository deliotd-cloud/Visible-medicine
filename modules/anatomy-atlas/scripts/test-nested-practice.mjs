import assert from 'node:assert/strict';
import { build } from './workspace-test-build.mjs';

const compiled = await build({ stdin: { contents: `
  export * from './lib/nested-practice';
  export * from './lib/anatomy-practice';
  export {cardiacCatalog} from './lib/cardiac';
  export {ventricleCatalog} from './lib/ventricles';
  export {nestedStudyTargets} from './lib/nested-anatomy';
  export {bodyDisplayCatalog} from './lib/body-display-catalog';
  export {default as raw} from './public/models/bodyparts3d/full-body/catalog.json';
`, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false });
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
let checks = 0;
const same = (a,b,message) => { checks++; assert.deepEqual(a,b,message); };
const allowed = { cardiac: ['FMA11359','FMA9465','FMA9291','FMA9466'], ventricles: ['FMA78450','FMA78449','FMA78454','FMA78469'] };
for (const [study, catalog] of [['cardiac',api.cardiacCatalog],['ventricles',api.ventricleCatalog]]) {
  const parent = catalog.parent, candidates = catalog.structures, loaded = catalog.bundles.map(b=>b.id);
  const before = JSON.stringify({parent,candidates,loaded});
  const pool = api.nestedPracticePool(parent, study, candidates, loaded, []);
  same(pool.map(s=>s.fmaId).sort(),allowed[study].slice().sort(),study+' exact named spaces only');
  same(api.nestedPracticePool(parent, study, candidates, [], []),[],'No unloaded targets');
  same(api.nestedPracticePool(parent, study, candidates, loaded, pool.map(s=>s.id)),[],'No hidden targets');
  for (const removed of pool) {
    const visible = api.nestedPracticePool(parent,study,candidates,loaded,[removed.id]);
    same(visible.length,3,'One hidden space excluded');
    same(visible.some(s=>s.id===removed.id),false);
  }
  for (const mutate of [p=>p.name+=' changed',p=>p.id+='changed',p=>p.bundle+='changed',p=>p.sources[0].sha256='0'.repeat(64),p=>p.bounds.min[0]+=1]) {
    const changed = structuredClone(parent); mutate(changed);
    same(api.nestedPracticePool(changed,study,candidates,loaded,[]),[],'Changed parent rejected');
  }
  for (const row of pool) {
    for (const mutate of [s=>s.name+=' changed',s=>s.id+='changed',s=>s.fmaId='FMA000',s=>s.nodeName+='changed',s=>s.sources[0].sha256='0'.repeat(64),s=>s.bounds.max[0]+=1,s=>s.laterality='unspecified']) {
      const changed=structuredClone(row); mutate(changed);
      if(JSON.stringify(changed)===JSON.stringify(row))continue;
      same(api.nestedPracticePool(parent,study,[changed],loaded,[]),[],'Changed child rejected');
    }
  }
  same(api.nestedPracticePool(parent,study,[...candidates,...candidates],loaded,[]).length,4,'Duplicate candidates do not duplicate questions');
  for(const mode of ['find','name']) {
    let session=api.createPracticeSession(pool,loaded,{id:1,mode,count:5,sampling:'all'},()=>0.31);
    same(session.questions.length,4,'Only available questions');
    for(let index=0;index<4;index++) {
      const question=session.questions[index];
      same(api.practiceRenderIds(session),mode==='name'?[question.target]:session.renderedIds);
      same(api.practiceReducer(session,{type:'answer',sessionId:999,index,chosen:question.target}),session,'Stale session denied');
      same(api.practiceReducer(session,{type:'answer',sessionId:1,index,chosen:'context-wall'}),session,'Context pick denied');
      const answered=api.practiceReducer(session,{type:'answer',sessionId:1,index,chosen:index===0?null:question.target});
      same(api.practiceReducer(answered,{type:'answer',sessionId:1,index,chosen:question.target}),answered,'Answer once');
      session=api.practiceReducer(answered,{type:'next',sessionId:1,index});
    }
    same(session.status,'complete'); same(api.practiceScore(session),3,'Skip never scores');
  }
  pool[0].name='consumer mutation';
  same(JSON.stringify({parent,candidates,loaded}),before,'Detached source records');
}
const targets=api.nestedStudyTargets(api.bodyDisplayCatalog(api.raw));
for(const target of targets.filter(t=>!Object.hasOwn(allowed,t.study))) {
  const parent=api.bodyDisplayCatalog(api.raw).structures.find(s=>s.id===target.parentId);
  same(api.nestedPracticePool(parent,target.study,[target.structure],[target.structure.bundle],[]),[],'Other studies not silently admitted');
}
for(const health of ['starting','lost','restoring','failed','ready']) {
  same(api.nestedPracticeReady(health,['a'],['a'],[]),health==='ready');
  same(api.nestedPracticeReady(health,['a'],[],[]),false);
  same(api.nestedPracticeReady(health,['a'],['a'],['a']),false);
  same(api.nestedPracticeReady(health,[],[],[]),false);
}
same(api.nestedPracticeReady('ready',['a','b'],['a'],[]),false);
same(api.nestedPracticeReady('ready',['a'],['a'],['irrelevant']),true);
console.log(JSON.stringify({passed:true,checks,scopes:2,namedSpaces:8,geometryChanged:false,clinicalApproval:false}));
