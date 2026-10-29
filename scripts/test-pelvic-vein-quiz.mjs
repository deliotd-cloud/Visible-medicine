import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const proposalRoot=fileURLToPath(new URL('../',import.meta.url));
const atlasRoot=resolve(process.env.VM_ATLAS_SOURCE_ROOT ?? proposalRoot);
const requireFromAtlas=createRequire(join(atlasRoot,'package.json'));
const ts=requireFromAtlas('typescript');
const beforePath=join(proposalRoot,'scripts/fixtures/pelvic-veins.before.ts.txt');
const afterPath=join(proposalRoot,'lib/pelvic-veins.ts');
const baselineHash='c7bfabbe5d9f05f61c1dd729c3378bdf32b3055452342da33b2a54d9b480fa33';
const catalog=JSON.parse(readFileSync(join(atlasRoot,'public/models/bodyparts3d/pelvic-veins/catalog.json'),'utf8'));
const compile=path=>ts.transpileModule(readFileSync(path,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
const evaluate=(path,dependency)=>{
  const module={exports:{}};
  runInNewContext(compile(path),{module,exports:module.exports,require:dependency});
  return module.exports;
};
const canonical=evaluate(join(atlasRoot,'lib/body-source-additions.ts'),name=>{
  if(name==='./body-presentation-parts.ts')return {validBodyPresentationParts:()=>true};
  throw Error(`Unexpected canonical dependency: ${name}`);
});
const study=evaluate(join(atlasRoot,'content/pelvic-vein-study.ts'),()=>{
  throw Error('Unexpected study dependency');
});
const teaching=evaluate(join(atlasRoot,'content/pelvic-vein-teaching.ts'),()=>{
  throw Error('Unexpected teaching dependency');
});
const dependency=name=>{
  if(name.endsWith('/pelvic-veins/catalog.json'))return {default:catalog};
  if(name==='./body-source-additions')return canonical;
  if(name==='../content/pelvic-vein-study')return study;
  if(name==='../content/pelvic-vein-teaching')return teaching;
  throw Error(`Unexpected pelvic-vein dependency: ${name}`);
};
const before=evaluate(beforePath,dependency);
const after=evaluate(afterPath,dependency);
const tabs=evaluate(join(atlasRoot,'lib/content-types.ts'),()=>{
  throw Error('Unexpected tab dependency');
}).contentTabs;
const expected={
  iliolumbar:{answer:'Separate or shared trunks may reach different iliac receiving veins.',ref:'lumbar',positions:[0,3]},
  inferiorGluteal:{answer:'Toward the internal iliac venous system.',ref:'pelvicBleeding',positions:[1,2]},
  superiorGluteal:{answer:'Toward the internal iliac venous system.',ref:'pelvicBleeding',positions:[3,0]},
  obturator:{answer:'An obturator-to-external-iliac-system communication.',ref:'corona',positions:[2,1]},
  pudendal:{answer:'The internal iliac venous system.',ref:'perineum',positions:[3]},
  lateralSacral:{answer:'As part of a communicating sacral venous plexus.',ref:'presacral',positions:[0]},
};
const groupFor=s=>Object.entries(teaching.pelvicVeinTeachingGroups)
  .find(([,ids])=>ids.includes(s.fmaId))?.[0];

test('fixture pins the exact saved baseline and all ten admitted selections',()=>{
  assert.equal(createHash('sha256').update(readFileSync(beforePath)).digest('hex'),baselineHash);
  assert.equal(catalog.structures.length,10);
  assert.equal(new Set(catalog.structures.map(s=>s.fmaId)).size,10);
  assert.equal(catalog.structures.filter(s=>s.sourceName.includes('internal pudendal')).length,1);
  assert.equal(catalog.structures.filter(s=>s.sourceName.includes('lateral sacral')).length,1);
  assert(catalog.structures.some(s=>s.name==='Right internal pudendal vein'));
  assert(catalog.structures.some(s=>s.name==='Right lateral sacral vein'));
});

test('every selection has a source-bound graded draft with four exclusive choices',()=>{
  for(const s of catalog.structures){
    const group=groupFor(s);
    assert(group,`missing group: ${s.fmaId}`);
    const spec=expected[group];
    const index=teaching.pelvicVeinTeachingGroups[group].indexOf(s.fmaId);
    const lesson=after.pelvicVeinLesson(s,'quiz');
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.title,before.pelvicVeinLesson(s,'quiz').title);
    assert.equal(lesson.bullets.length,4);
    assert.equal(new Set(lesson.bullets).size,4);
    assert(lesson.bullets.every(choice=>typeof choice==='string'&&choice.trim()));
    assert.equal(lesson.correctAnswer,spec.answer);
    assert.equal(lesson.bullets.filter(choice=>choice===lesson.correctAnswer).length,1);
    assert.equal(lesson.bullets.indexOf(lesson.correctAnswer),spec.positions[index]);
    assert(!lesson.body.toLowerCase().includes(lesson.correctAnswer.toLowerCase()));
    assert(!lesson.note.toLowerCase().includes(lesson.correctAnswer.toLowerCase()));
    assert(lesson.explanation.toLowerCase().includes(lesson.correctAnswer.replace(/\.$/,'').toLowerCase()));
    assert.deepEqual(structuredClone(lesson.citations),[teaching.pelvicVeinTeachingReferences[spec.ref]]);
    assert.match(lesson.note,/radiologist review/);
  }
});

test('all 80 non-quiz lessons and the source-bound readiness gate match the baseline',()=>{
  for(const s of catalog.structures)for(const tab of tabs.filter(tab=>tab!=='quiz')){
    assert.deepEqual(structuredClone(after.pelvicVeinLesson(s,tab)),
      structuredClone(before.pelvicVeinLesson(s,tab)),`${s.fmaId} / ${tab}`);
  }
  for(const region of study.pelvicVeinStudy.regions){
    assert.equal(after.pelvicVeinStudyReady(catalog,region,study.pelvicVeinStudy.id),
      before.pelvicVeinStudyReady(catalog,region,study.pelvicVeinStudy.id));
  }
});

test('changed source identity, name, side or hash and invented left counterparts are refused',()=>{
  for(const s of catalog.structures){
    const mutations=[
      {...s,fmaId:'FMA0'},
      {...s,name:`${s.name} changed`},
      {...s,laterality:s.laterality==='left'?'right':'left'},
      {...s,sources:s.sources.map((source,index)=>index?source:{...source,sha256:'0'.repeat(64)})},
    ];
    for(const mutation of mutations){
      assert.notEqual(canonical.sourceCanonical(mutation),canonical.sourceCanonical(s));
      for(const tab of tabs)assert.equal(after.pelvicVeinLesson(mutation,tab),undefined);
    }
  }
  for(const name of ['Left internal pudendal vein','Left lateral sacral vein']){
    const right=catalog.structures.find(s=>s.name===name.replace('Left','Right'));
    const invented={...right,id:right.id.replace('right','left'),name,
      sourceName:right.sourceName.replace('right','left'),laterality:'left'};
    for(const tab of tabs)assert.equal(after.pelvicVeinLesson(invented,tab),undefined);
  }
});
