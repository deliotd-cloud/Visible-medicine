import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
const root=fileURLToPath(new URL('../',import.meta.url));
const atlas=resolve(process.env.VM_ATLAS_SOURCE_ROOT??root);
const baseline=join(root,'scripts/fixtures/genicular-arteries.before.ts');
assert.equal(createHash('sha256').update(fs.readFileSync(baseline)).digest('hex'),'c9c38677221dc5076d3aa0f55f4ec08b53e307234cc78426b765c93cf4c39322');
const ts=createRequire(join(atlas,'package.json'))('typescript');
function evaluate(file,require){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;runInNewContext(code,{module,exports:module.exports,require});return module.exports;}
const source=JSON.parse(fs.readFileSync(join(atlas,'public/models/bodyparts3d/genicular-arteries/catalog.json'),'utf8'));
const canonical=evaluate(join(atlas,'lib/body-source-additions.ts'),name=>{if(name==='./body-presentation-parts.ts')return {validBodyPresentationParts:()=>true};throw Error('Unexpected dependency '+name);});
const requireLesson=name=>{if(name.endsWith('/genicular-arteries/catalog.json'))return {default:source};if(name==='./body-source-additions.ts')return canonical;throw Error('Unexpected lesson dependency '+name);};
const before=evaluate(baseline,requireLesson),after=evaluate(join(root,'lib/genicular-arteries.ts'),requireLesson);
const tabs=evaluate(join(atlas,'lib/content-types.ts'),()=>{throw Error('Unexpected tab dependency');}).contentTabs;

test('all ten exact selections have a unique graded key, feedback and preserved citations',()=>{
 assert.equal(source.structures.length,10);
 for(const structure of source.structures){
  const previous=before.genicularArteryLesson(structure,'quiz'),lesson=after.genicularArteryLesson(structure,'quiz');
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.note,previous.note);assert.equal(lesson.title,previous.title);
  assert.deepEqual(structuredClone(lesson.citations),structuredClone(previous.citations));
  assert.equal(lesson.correctAnswer,'Popliteal artery');assert.equal(lesson.bullets.length,4);
  assert.equal(new Set(lesson.bullets.map(s=>s.toLowerCase().trim())).size,4);
  assert.equal(lesson.bullets.filter(s=>s===lesson.correctAnswer).length,1);
  assert.match(lesson.body,/directly/);assert.match(lesson.explanation,/descending genicular/);
  assert.match(lesson.explanation,/femoral artery/);assert.match(lesson.explanation,/variants/);
 }
});
test('all non-quiz outputs remain identical across all ten structures',()=>{
 for(const structure of source.structures)for(const tab of tabs.filter(t=>t!=='quiz'))assert.deepEqual(structuredClone(after.genicularArteryLesson(structure,tab)),structuredClone(before.genicularArteryLesson(structure,tab)),`${structure.id} / ${tab}`);
});
test('source, identity, laterality and extra-field mutations cannot inherit the graded lesson',()=>{
 for(const structure of source.structures){
  for(const change of [{name:structure.name+' changed'},{id:structure.id+'-different'},{fmaId:'FMA00000'},{side:structure.side==='left'?'right':'left'},{extraUnreviewed:true}]){
   const changed={...structure,...change};assert.notEqual(canonical.sourceCanonical(changed),canonical.sourceCanonical(structure));
   for(const tab of tabs)assert.equal(after.genicularArteryLesson(changed,tab),undefined);
  }
 }
});
