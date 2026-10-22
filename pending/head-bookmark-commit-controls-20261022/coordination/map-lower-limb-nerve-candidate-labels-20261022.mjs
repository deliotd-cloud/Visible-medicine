// Local research only: no source geometry, licences or clinical approval admitted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const planFile='F:/VisibleMedicine/staging/20261022-lower-limb-nerve-inventory/target-plan.mjs';
assert.equal(sha(read(planFile)),'64318525c66efc50a038e443d259632e00f69e0f7b212d5088a3413f6ab71ffd');
const {plan}=await import(pathToFileURL(planFile).href);
const annotationFile='F:/VisibleMedicine/recovery/atlas/source-candidates/sparc-307-v8/nervesWithVagus_annotations.json';
const annotationBytes=read(annotationFile);
assert.equal(annotationBytes.length,132758);assert.equal(sha(annotationBytes),'577cde996b4ec050192870340262b441c13b68cd5fed82fc9531c7282783c7b5');
const atlas='F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas';
const auditFile=atlas+'/docs/sparc-nerve-candidate-audit.json',audit=json(auditFile);
const annotations=JSON.parse(annotationBytes).metadata.annotations;
assert.equal(annotations.length,964);assert.equal(audit.admitted,false);
assert.equal(audit.files.find(f=>f.name==='nervesWithVagus_annotations.json').sha256,sha(annotationBytes));
assert.equal(audit.files.find(f=>f.name==='nervesWithVagus.exf').sha256,'248b2da5638bbd684894d6ba8a175b1ee6454fc3dfc7b921bc5af2721e5b5b19');
const lower=name=>name.toLowerCase();
const branchPatterns={
  'anterior-femoral-cutaneous': side=>new RegExp(`^${side} anterior femoral cutaneous branch [a-z]$`),
  'obturator-anterior': side=>new RegExp(`^anterior branch of ${side} obturator nerve$`),
  'obturator-posterior': side=>new RegExp(`^posterior branch of ${side} obturator nerve$`),
  'saphenous-infrapatellar': side=>new RegExp(`^infrapatellar branch of ${side} saphenous nerve$`),
  'fibular-communicating': side=>new RegExp(`^(?:${side} fibular communicating branch|fibular communicating branch of ${side} lateral sural cutaneous nerve)$`),
  'medial-calcaneal': side=>new RegExp(`^medial calcaneal branch [a-z] of ${side} tibial nerve$`),
  'common-plantar-digital': side=>new RegExp(`^${side} common plantar digital nerve [a-z]$`),
  'proper-plantar-digital': side=>new RegExp(`^${side} proper plantar digital nerve [a-z]$`),
};
function matches(target,name,side){
  const key=target.key.slice('lln-target:'.length),pattern=branchPatterns[key];
  return pattern?pattern(side).test(lower(name)):[target.name,...target.aliases].some(term=>lower(name)===`${side} ${lower(term)}`);
}
// Reject tempting parent/division/branch-to and foreign-side substring matches.
const target=key=>plan.targets.find(t=>t.key===`lln-target:${key}`);
for(const name of ['Left L2 spinal nerve branch to left femoral nerve','Left posterior femoral cutaneous nerve','Left femoral nerve posterior division'])assert.equal(matches(target('femoral'),name,'left'),false);
assert.equal(matches(target('common-fibular'),'Left common fibular part of sciatic nerve','left'),false);
assert.equal(matches(target('femoral'),'Right femoral nerve','left'),false);
assert.equal(matches(target('common-plantar-digital'),'Left proper plantar digital nerve B','left'),false);
assert.equal(matches(target('sciatic'),'Left sciatic nerve','left'),true);
const zero=audit.nervePaths.zeroLengthElements;
const rows=plan.targets.map(t=>{
  const matched=['left','right'].flatMap(side=>annotations.map((a,index)=>({a,index})).filter(({a})=>matches(t,a.name,side)).map(({a,index})=>({
    sourceLocalKey:`sparc307v8:annotation:${index}`,annotationIndex:index,sourceLabel:a.name,sourceOntologyId:a.id,side,
    zeroLengthElementsInRetainedAudit:zero.filter(e=>e.groups.includes(a.name)).map(e=>e.id),
  })));
  return{targetKey:t.key,targetName:t.name,batch:t.batch,targetKind:t.kind,status:matched.length?'label-candidate-held':'no-exact-label-match',matchedAnnotations:matched,anatomyId:null,rightsCleared:false,spatialAdmission:false,clinicalApproval:false};
});
const all=rows.flatMap(r=>r.matchedAnnotations);
assert.equal(new Set(all.map(a=>a.sourceLocalKey)).size,all.length,'One annotation cannot be silently counted for multiple targets');
assert.equal(rows.filter(r=>r.batch===1).length,13);assert(rows.filter(r=>r.batch===1).every(r=>r.matchedAnnotations.length===2));
assert.equal(rows.find(r=>r.targetKey==='lln-target:fibular-communicating').matchedAnnotations.length,0);
const result={schema:'visible-medicine.lower-limb-held-candidate-label-map/1',at:new Date().toISOString(),planSha256:sha(read(planFile)),annotationInput:{path:annotationFile,sha256:sha(annotationBytes),bytes:annotationBytes.length,annotations:964},retainedAudit:{path:auditFile,sha256:sha(read(auditFile)),nerveCoordinateFileSha256Expected:audit.files.find(f=>f.name==='nervesWithVagus.exf').sha256,exfReadThisPass:false},counts:{targets:23,majorNerveTargets:13,matchedTargetDefinitions:rows.filter(r=>r.matchedAnnotations.length).length,unmatchedTargetDefinitions:rows.filter(r=>!r.matchedAnnotations.length).length,distinctSourceLocalAnnotations:all.length,annotationsFlaggedByRetainedZeroLengthAudit:all.filter(a=>a.zeroLengthElementsInRetainedAudit.length).length},rows,
  interpretation:'Exact lexical candidate association only. Reconstructed estimated paths, lettered branches and ontology IDs are retained verbatim, not validated as complete nerves, digit assignments, branch counts or anatomical equivalence. Parent/division/branch-to labels are not silently substituted for named trunks. No exact match means only that the declared matching policy found none in this pinned annotation file.',
  holds:['Nerve-component authoring provenance, upstream commercial terms and attribution chain remain unresolved for every matched candidate. Dataset-level licence is not component clearance.','Native frame, units, estimated/reconstructed segments, source anatomy and each proposed relation require review. No transform into BodyParts3D or a patient is established.','The retained audit flags zero-length elements in two matched labels; no repair, bridging, welding, mirroring or automatic exclusion was performed. The EXF was not re-read or geometrically revalidated in this metadata mapping.','Generic lettered branch labels require anatomical-extent review; letters are not inferred digit or named-branch assignments.','No candidate or source-local ontology ID is admitted as a new atlas structure, selectable target, quiz answer, imaging mask or clinical approval.'],
  nextAction:'Resolve nerve-specific authoring and component rights before any separate schematic prototype or asset admission. Keep all matches held and pursue other existing website/Atlas work meanwhile.',productChanged:false,previewChanged:false,clinicalApproval:false,sourceFilesUploaded:false};
const stage='F:/VisibleMedicine/staging/20261022-lower-limb-held-nerve-map';assert(!fs.existsSync(stage));fs.mkdirSync(stage);
fs.copyFileSync(new URL(import.meta.url),stage+'/map-lower-limb-nerve-candidate-labels-20261022.mjs',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(stage+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({result:stage+'/RESULT.json',sha256:sha(read(stage+'/RESULT.json')),counts:result.counts,unmatched:rows.filter(r=>!r.matchedAnnotations.length).map(r=>r.targetKey),noGeometryAdmitted:true}));
