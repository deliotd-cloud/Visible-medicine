import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/proposals/20261031-cerebral-detail-ultrasound';
const atlas='G:/VisibleMedicine-temp/staging/20261031-posterior-lobar-us/atlas';
const read=p=>fs.readFileSync(p,'utf8'),ref=p=>({path:p,sha256:hash(p)});
const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();
assert.equal(git(atlas,'rev-parse','HEAD'),'d9bdfa1ceb1d86cabe059e963dcd6284f9527be1');
assert.equal(git(atlas,'status','--porcelain'),'');
assert.equal(git('F:/VisibleMedicine/atlas','rev-parse','HEAD'),'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');
const result=json(root+'/RESULT.json');
for(const [path,expected] of Object.entries(result.proposalSha256))assert.equal(hash(root+'/files/'+path),expected.toLowerCase(),path);
function reverse(text,from,to){assert.equal(text.split(from).length,2,'Exactly one addition anchor: '+from);return text.replace(from,to);}
let nested=read(root+'/files/content/nested-teaching.ts');
const addedImport="import { cerebralDetailUltrasound } from './cerebral-detail-ultrasound.ts';\n";
nested=reverse(nested,addedImport,'');
nested=reverse(nested,'imaging: { ...cerebralTeaching.insula.imaging, ultrasound: cerebralDetailUltrasound.insula },','imaging: cerebralTeaching.insula.imaging,');
nested=reverse(nested,'...cerebralTeaching.anteriorSuperiorTemporal.imaging, ultrasound: cerebralDetailUltrasound.superiorTemporalAnterior, mri:','...cerebralTeaching.anteriorSuperiorTemporal.imaging, mri:');
nested=reverse(nested,"ct: nestedCTOrientation['cerebral-superior-temporal-posterior'], ultrasound: cerebralDetailUltrasound.superiorTemporalPosterior","ct: nestedCTOrientation['cerebral-superior-temporal-posterior']");
assert.equal(nested,read(atlas+'/content/nested-teaching.ts'),'Only the three declared ultrasound bindings and import changed');
let hippocampus=read(root+'/files/content/hippocampal-teaching.ts');
hippocampus=reverse(hippocampus,addedImport,'');
hippocampus=reverse(hippocampus,'    ultrasound: cerebralDetailUltrasound.hippocampus,\n','');
hippocampus=reverse(hippocampus,'X-ray remains pending; ultrasound orientation is draft.','X-ray and ultrasound lessons remain pending.');
assert.equal(hippocampus,read(atlas+'/content/hippocampal-teaching.ts'),'Only the declared ultrasound binding, import and adjacent scope sentence changed');
const targets={
 'cerebral-insula':['FMA72978','FMA72977'],
 'cerebral-hippocampus':['FMA72714','FMA72713'],
 'cerebral-superior-temporal-anterior':['FMA72801','FMA72800'],
 'cerebral-superior-temporal-posterior':['FMA72805','FMA72804'],
};
const bindings=json(atlas+'/content/nested-teaching-bindings.v1.json').bindings;
const matched=[];
for(const [concept,ids] of Object.entries(targets)){
 const rows=bindings.filter(row=>row.conceptId===concept);assert.equal(rows.length,2,concept);
 assert.deepEqual(rows.map(row=>row.structure.fmaId).sort(),[...ids].sort());
 assert.deepEqual(rows.map(row=>row.structure.laterality).sort(),['left','right']);
 for(const row of rows){assert.equal(row.study,'cerebral');assert.match(row.sourceHash,/^[a-f0-9]{64}$/);matched.push({concept,id:row.structure.id,fmaId:row.structure.fmaId,sourceHash:row.sourceHash,parentHash:row.parentHash});}
}
const module=read(root+'/files/content/cerebral-detail-ultrasound.ts');
assert(module.includes("references: ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow']"));
assert(module.includes("readiness: 'draft'"));
const bodies=[...module.matchAll(/^    '([^']+)',$/gm)].map(m=>m[1]);assert.equal(bodies.length,4);
const words=bodies.join(' ').trim().split(/\s+/).length;assert.equal(words,176);assert(words<=190);
const existingReferences=read(atlas+'/content/cerebral-lobar-imaging.ts');
for(const key of ['cerebralNeonatalUS','cerebralNeonatalUSWindow'])assert(existingReferences.includes(key+': {'));
const evidence={at:new Date().toISOString(),method:'Static source syntax/identity/differential inspection; no module execution or runtime tests',parent:{head:git(atlas,'rev-parse','HEAD'),tree:git(atlas,'rev-parse','HEAD^{tree}')},sourceFiles:Object.keys(result.proposalSha256).map(p=>({path:p,sha256:hash(root+'/files/'+p),bytes:fs.statSync(root+'/files/'+p).size})),baselineFiles:['content/nested-teaching.ts','content/hippocampal-teaching.ts','content/nested-teaching-bindings.v1.json','content/cerebral-lobar-imaging.ts'].map(p=>ref(atlas+'/'+p)),bindings:matched,draftBodies:4,words,syntaxChecks:3,existingContentReconstructedExactly:true,adjacentScopeSentenceChanged:true,runtimeValidated:false,generated:false,installed:false,clinicalApproved:false,reviewImpact:'Pending runtime revision comparison; hippocampal scope note affects both side selections, and global renderer policy may affect other review revisions.'};
fs.writeFileSync(root+'/SOURCE_INSPECTION.json',JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceInspection:ref(root+'/SOURCE_INSPECTION.json'),draftBodies:4,placements:matched.length,words,runtimeValidated:false}));
