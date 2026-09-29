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
  export {Vector3,Box3} from 'three';
  export {arrangeBodyStructures,arrangementAxes,bodyPresentationOffset} from './lib/body-arrangement';
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
const extended = {
  cerebral:['FMA72970','FMA72969','FMA72974','FMA72973','FMA72972','FMA72971','FMA72976','FMA72975','FMA72978','FMA72977','FMA72801','FMA72800','FMA72805','FMA72804','FMA72714','FMA72713'],
  brainstem:['FMA61993','FMA67943','FMA62004','FMA67944','FMA73464','FMA73463'],
  pulmonary:['FMA7333','FMA7383','FMA7337','FMA7370','FMA7371'],
  hepatic:['FMA14778','FMA14779','FMA15414','FMA15415','FMA71857','FMA71858','FMA15800'],
  renal:['FMA70492','FMA69265','FMA14335','FMA14343','FMA70493','FMA14336','FMA14349'],
  'visual-pathway':['FMA62045','FMA62382','FMA67936'],
  cricothyroid:['FMA46611','FMA46612','FMA46613','FMA46614'],
  'coronary-venous':['FMA4706','FMA4714'],
};
let admitted=0;
for(const target of targets.filter(t=>!Object.hasOwn(allowed,t.study))) {
  const parent=api.bodyDisplayCatalog(api.raw).structures.find(s=>s.id===target.parentId);
  const row=target.structure,loaded=[row.bundle];
  if(!Object.hasOwn(extended,target.study)) {
    same(api.nestedPracticeKind(target.study),null);
    same(api.nestedPracticePool(parent,target.study,[row],loaded,[]),[],'Other studies not silently admitted');
    continue;
  }
  same(api.nestedPracticeKind(target.study),'structure');
  same(extended[target.study].includes(row.fmaId),true);
  same(api.nestedPracticePool(parent,target.study,[row],loaded,[]),[row]);admitted++;
  same(api.nestedPracticePool(parent,target.study,[row],[],[]),[]);
  same(api.nestedPracticePool(parent,target.study,[row],loaded,[row.id]),[]);
  same(api.nestedPracticePool(parent,target.study,[row,row],loaded,[]).length,1);
  for(const mutate of [s=>s.name+=' stale',s=>s.fmaId='FMA000',s=>s.sources[0].sha256='0'.repeat(64),s=>s.bounds.max[0]+=1,s=>s.bundle+='stale',s=>s.laterality='unspecified']) {
    const stale=structuredClone(row);mutate(stale);
    if(JSON.stringify(stale)!==JSON.stringify(row))same(api.nestedPracticePool(parent,target.study,[stale],loaded,[]),[],'Stale extended child denied');
  }
  const staleParent=structuredClone(parent);staleParent.name+=' stale';
  same(api.nestedPracticePool(staleParent,target.study,[row],loaded,[]),[],'Stale extended parent denied');
  const detached=api.nestedPracticePool(parent,target.study,[row],loaded,[]);detached[0].sources[0].sha256='0'.repeat(64);
  same(api.nestedPracticePool(parent,target.study,[row],loaded,[]),[row],'Detached source records');
}
same(admitted,50,'Exactly fifty additional named source selections');
for(const [study,ids] of Object.entries(extended))same(targets.filter(t=>t.study===study).map(t=>t.structure.fmaId).sort(),ids.slice().sort());
// The opt-in practice tray must expose all exact entries, including deep targets.
for(const key of new Set(targets.filter(t=>Object.hasOwn(extended,t.study)).map(t=>t.parentId+'|'+t.study))) {
  const rows=targets.filter(t=>t.parentId+'|'+t.study===key).map(t=>t.structure);
  const before=JSON.stringify(rows);
  for(const view of ['anterior','posterior','left','right','superior','inferior']) {
    const origin=new api.Vector3(),axes=api.arrangementAxes(view);
    const tray=api.arrangeBodyStructures(rows,origin,view).offsets;
    const rects=rows.map(row=>{
      const offset=api.bodyPresentationOffset(row,origin,100,'tray',false,tray);
      const xs=[],ys=[];
      for(const x of [row.bounds.min[0],row.bounds.max[0]])for(const y of [row.bounds.min[1],row.bounds.max[1]])for(const z of [row.bounds.min[2],row.bounds.max[2]]) {
        const point=new api.Vector3(x,y,z).add(offset);xs.push(point.dot(axes.right));ys.push(point.dot(axes.up));
      }
      return {minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
    });
    for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++) {
      const a=rects[i],b=rects[j];
      same(a.maxX<b.minX||b.maxX<a.minX||a.maxY<b.minY||b.maxY<a.minY,true,key+' '+view+' tray entries do not overlap');
    }
  }
  same(JSON.stringify(rows),before,'Practice arrangement preserves source geometry');
}
for(const health of ['starting','lost','restoring','failed','ready']) {
  same(api.nestedPracticeReady(health,['a'],['a'],[]),health==='ready');
  same(api.nestedPracticeReady(health,['a'],[],[]),false);
  same(api.nestedPracticeReady(health,['a'],['a'],['a']),false);
  same(api.nestedPracticeReady(health,[],[],[]),false);
}
same(api.nestedPracticeReady('ready',['a','b'],['a'],[]),false);
same(api.nestedPracticeReady('ready',['a'],['a'],['irrelevant']),true);
console.log(JSON.stringify({passed:true,checks,studies:10,namedSpaces:8,additionalNamedStructures:admitted,geometryChanged:false,clinicalApproval:false}));
