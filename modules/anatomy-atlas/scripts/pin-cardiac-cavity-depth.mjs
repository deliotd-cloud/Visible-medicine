import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const baseline='c52c9c690d790e4e921bde7ed5a943ef30a95001';
const expected=['cardiac-right-atrium','cardiac-left-atrium','cardiac-right-ventricle','cardiac-left-ventricle'];
const api=await exactSourceHistoryApi(baseline,'nested-review-security');
const catalog=api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const targets=api.nestedStudyTargets(catalog).filter(t=>t.study==='cardiac');
assert.equal(targets.length,4);
const entries=expected.map(id=>{
 const matches=targets.filter(t=>api.nestedTeachingFor(catalog.structures.find(s=>s.id===t.parentId),t.study,t.structure)?.id===id);
 assert.equal(matches.length,1);const target=matches[0];
 const parent=catalog.structures.find(s=>s.id===target.parentId);
 const previous=api.nestedTeachingFor(parent,target.study,target.structure);
 const bundle=catalog.bundles.find(b=>b.id===parent.bundle);
 return {id,target,parent,parentBundle:bundle,previous};
});
const pins={schemaVersion:1,baseline,sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,entries};
const path='content/cardiac-cavity-depth-pins.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),pins);
else{
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);
 await writeFile(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({baseline,selections:entries.length,placements:8,pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));
