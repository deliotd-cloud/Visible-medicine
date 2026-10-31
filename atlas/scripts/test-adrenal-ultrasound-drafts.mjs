import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {runInNewContext} from 'node:vm';import {fileURLToPath} from 'node:url';import {test} from 'node:test';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),base=process.env.VM_ADRENAL_BASELINE;
assert(base,'Exact previous Atlas required');const require=createRequire(path.join(base,'package.json')),ts=require('typescript'),plain=v=>JSON.parse(JSON.stringify(v));
function load(site){const code=fs.readFileSync(path.join(site,'content/renal-teaching.ts'),'utf8');const result=ts.transpileModule(code,{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});assert.equal(result.diagnostics?.length??0,0);const module={exports:{}};runInNewContext(result.outputText,{module,exports:module.exports});return plain(module.exports);}
const before=load(base),after=load(root),ids=['renal-inferior-suprarenal-artery','renal-suprarenal-veins'];
test('only two absent ultrasound concepts become drafts; all earlier teaching and identity remains exact',()=>{
 const restored=plain(after.renalConcepts);for(const id of ids){const old=before.renalConcepts.find(c=>c.id===id),now=restored.find(c=>c.id===id);assert(!Object.hasOwn(old.imaging,'ultrasound'));assert.equal(now.imaging.ultrasound.readiness,'draft');assert.deepEqual(Object.keys(now.imaging.ultrasound).sort(),['body','readiness','references']);delete now.imaging.ultrasound;}
 assert.deepEqual(restored,before.renalConcepts);
});
test('new reference titles are scoped to their concepts and retain all older bibliography entries',()=>{
 const restored=plain(after.renalTeachingReferences);
 for(const [key,url,id]of [['renalFetalAdrenalDoppler','https://doi.org/10.1186/s12884-020-03480-z',ids[0]],['renalAdrenalVeinLaparoscopicUltrasound','https://pubmed.ncbi.nlm.nih.gov/10670859/',ids[1]]]){assert(!Object.hasOwn(before.renalTeachingReferences,key));assert.equal(restored[key].url,url);assert.equal(restored[key].scopedToConcept,true);assert.deepEqual(after.renalConcepts.find(c=>c.id===id).imaging.ultrasound.references,id===ids[0]?[key,'renalReuseLicense']:[key]);delete restored[key];}
 assert.deepEqual(restored,before.renalTeachingReferences);assert.equal(after.renalTeachingReferences.renalReuseLicense.url,'https://creativecommons.org/licenses/by/4.0/');assert(!JSON.stringify(after).includes('10.1111/aogs.15011'));
});
test('fetal arterial evidence is kept separate from adult visibility, measurements and the withheld left surface',()=>{
 const c=after.renalConcepts.find(c=>c.id===ids[0]),b=c.imaging.ultrasound.body;
 assert.deepEqual(c.fmaIds,['FMA69265']);assert.match(b,/^Fetal Doppler example:/);assert.match(b,/low-risk pregnancy study/);assert.match(b,/colour Doppler/);assert.match(b,/recorded flow-velocity waveforms/);assert.match(b,/does not establish routine adult visibility or adult reference ranges/);assert.match(b,/Summary adapted from Xu et al[.] \(2020\), CC BY 4[.]0/);assert.match(b,/defective left arterial surface remains withheld/);assert.equal(c.modelLimit,before.renalConcepts.find(c=>c.id===ids[0]).modelLimit);
});
test('intraoperative vein findings do not become routine or side-specific detection claims',()=>{
 const c=after.renalConcepts.find(c=>c.id===ids[1]),b=c.imaging.ultrasound.body;
 assert.deepEqual(c.fmaIds,['FMA14343','FMA14349']);assert.match(b,/^Intraoperative ultrasound example:/);assert.match(b,/six of 28 operations/);assert.match(b,/not a routine abdominal-ultrasound detection rate or a side-specific normal standard/);assert.match(b,/neither an ultrasound view nor a validated venous junction/);
});
test('the two concepts map to three existing supplied selections without introducing the held artery',()=>{
 const raw=JSON.parse(fs.readFileSync(path.join(base,'public/models/bodyparts3d/renal/catalog.json'),'utf8'));
 const rows=raw.structures.filter(s=>ids.some(id=>after.renalConcepts.find(c=>c.id===id).fmaIds.includes(s.fmaId)));
 assert.equal(rows.length,3);assert.equal(rows.filter(s=>s.fmaId==='FMA69265'&&s.laterality==='right').length,1);
 assert.deepEqual(rows.filter(s=>s.fmaId!=='FMA69265').map(s=>s.laterality).sort(),['left','right']);
});
test('all added notes are brief drafts with resolvable citations and no new approval or scan fields',()=>{
 for(const id of ids){const c=after.renalConcepts.find(c=>c.id===id),old=before.renalConcepts.find(c=>c.id===id);assert(c.imaging.ultrasound.body.split(/\s+/).length<=90);assert.deepEqual(Object.keys(c).sort(),Object.keys(old).sort());for(const key of c.imaging.ultrasound.references)assert(after.renalTeachingReferences[key]);}
});
