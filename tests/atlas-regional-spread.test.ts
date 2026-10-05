import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {regionalSpreadMilestoneBytes} from './atlas-lumbar-sacral-history.ts';
import {withoutFootNotice} from './atlas-foot-notice-history.ts';
import {withoutMidfootNotice} from './atlas-foot-ultrasound-notice-history.ts';
import {withoutShoulderGirdleArterialNotice} from './atlas-shoulder-girdle-ultrasound-notice-history.ts';

const revision='3a60c543c292066864437e4721efaded5c48bf64';
const baseline='167c77f4da6ec16455093008dcacea250b0a6678';
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const old=(p:string)=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:32e6});
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const sourceAt=(p:string)=>execFileSync('git',['show',revision+':'+p],{cwd:'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs',maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});

test('bounded regional Spread reaches learner and protected review without model, licence or access changes',async()=>{
 const review=json('atlas-review/manifest.json'),prior=JSON.parse(old('atlas-review/manifest.json').toString());
 const ultrasoundInputs=['content/hyoid-epiglottis-ultrasound-pins.json','content/hyoid-epiglottis-ultrasound.ts','lib/hyoid-epiglottis-ultrasound.ts'];
 const cranialInputs=['content/cranial-bone-xray-pins.json','content/cranial-bone-xray.ts','lib/cranial-bone-xray.ts'];
 const suprascapularInputs=['content/suprascapular-vessel-ultrasound-pins.json','content/suprascapular-vessel-ultrasound.ts','lib/suprascapular-vessel-ultrasound.ts'];
 const deepBrainInputs=['content/deep-brain-core-teaching-pins.json','content/deep-brain-core-teaching.ts','lib/deep-brain-core-teaching.ts'];
 const footInputs=['content/foot-surface-imaging-pins.json','content/foot-surface-imaging.ts','lib/foot-surface-imaging.ts'];
 const handInputs=['content/hand-bone-ultrasound-pins.json','content/hand-bone-ultrasound.ts','lib/hand-bone-ultrasound.ts'];
 const toeInputs=['content/toe-bone-ultrasound-pins.json','content/toe-bone-ultrasound.ts','lib/toe-bone-ultrasound.ts'];
 const midfootInputs=['content/foot-ultrasound-followup-pins.json','content/foot-ultrasound-followup.ts','lib/foot-ultrasound-followup.ts'];
 const pausedTourInputs=['app/paused-tour-imaging-link.css','app/paused-tour-imaging-link.tsx','lib/paused-tour-imaging.ts'];
 const shoulderGirdleInputs=['content/shoulder-girdle-arterial-ultrasound-pins.json','content/shoulder-girdle-arterial-ultrasound.ts','lib/shoulder-girdle-arterial-ultrasound.ts'];
 const coronaryContextInputs=['lib/coronary-venous-context.ts','public/models/bodyparts3d/coronary-venous/root-vessel-context.json'];
 const organQuizInputs=['content/thoracoabdominal-organ-quiz-pins.json','content/thoracoabdominal-organ-quiz.ts','lib/thoracoabdominal-organ-quiz.ts'];
 const pelvicCoreInputs=['content/pelvic-reproductive-core-pins.json','content/pelvic-reproductive-core.ts','lib/pelvic-reproductive-core.ts'];
 const respiratoryInputs=['content/respiratory-core-depth-pins.json','content/respiratory-core-depth.ts','lib/respiratory-core-depth.ts'];
 const coronaryArterialInputs=['content/coronary-arterial-study-pins.json','lib/coronary-arterial-review.ts','lib/coronary-arterial-study.ts'];
 const coronaryTourInput='lib/coronary-arterial-tour.ts';
 const cardiacCavityInput='content/cardiac-cavity-depth.ts';
 const selectedLabelInput='lib/scene-label-size.ts';
 const thoracicInputs=['content/thoracic-spine-tour-pins.json','lib/thoracic-spine-tour.ts'];
 const calfInputs=['app/specimen-depth-notes.tsx','content/um-calf-depth.ts'];
 const thighInputs=['content/um-thigh-depth.ts','lib/specimen-depth-scope.ts'];
 const deepHipInputs=['content/um-deep-hip-depth.ts'];
 const csfInputs=['app/csf-motion.tsx','content/csf-motion.v1.json','lib/csf-motion.ts','lib/ventricular-guide.ts'];
 assert.deepEqual(review.files.filter((f:any)=>csfInputs.includes(f.path)).map((f:any)=>f.path).sort(),csfInputs);
 for(const path of csfInputs)assert.equal(review.files.find((f:any)=>f.path===path).sourceSha256,sha(sourceAt(path)),path);
 const intrinsicFootInputs=['content/um-foot-depth.ts'];
 assert.deepEqual(review.files.filter((f:any)=>intrinsicFootInputs.includes(f.path)).map((f:any)=>f.path),intrinsicFootInputs);
 for(const path of intrinsicFootInputs)assert.equal(review.files.find((f:any)=>f.path===path).sourceSha256,sha(sourceAt(path)),path);
 assert.equal(review.revision,revision);assert.equal(review.files.length,1018+ultrasoundInputs.length+cranialInputs.length+suprascapularInputs.length+deepBrainInputs.length+footInputs.length+handInputs.length+toeInputs.length+midfootInputs.length+pausedTourInputs.length+shoulderGirdleInputs.length+coronaryContextInputs.length+organQuizInputs.length+pelvicCoreInputs.length+respiratoryInputs.length+coronaryArterialInputs.length+3+thoracicInputs.length+calfInputs.length+thighInputs.length+deepHipInputs.length+intrinsicFootInputs.length+csfInputs.length);assert.deepEqual(review.packages,prior.packages);
 assert.deepEqual(review.files.filter((f:any)=>deepHipInputs.includes(f.path)).map((f:any)=>f.path),deepHipInputs);
 for(const path of deepHipInputs)assert.equal(review.files.find((f:any)=>f.path===path).sourceSha256,sha(sourceAt(path)),path);
 assert.deepEqual(review.files.filter((f:any)=>thighInputs.includes(f.path)).map((f:any)=>f.path).sort(),thighInputs);
 for(const path of thighInputs)assert.equal(review.files.find((f:any)=>f.path===path).sourceSha256,sha(sourceAt(path)),path);
 assert.deepEqual(review.files.filter((f:any)=>calfInputs.includes(f.path)).map((f:any)=>f.path).sort(),calfInputs);
 for(const path of calfInputs)assert.equal(review.files.find((f:any)=>f.path===path).sourceSha256,sha(sourceAt(path)),path);
 assert.deepEqual(review.files.filter((f:any)=>thoracicInputs.includes(f.path)).map((f:any)=>f.path).sort(),thoracicInputs);
 for(const path of thoracicInputs)assert.equal(review.files.find((f:any)=>f.path===path).sourceSha256,sha(sourceAt(path)),path);
 assert.equal(review.files.find((f:any)=>f.path===selectedLabelInput).sourceSha256,sha(sourceAt(selectedLabelInput)),'Exact selected-label helper Review source pin');
 assert.deepEqual(review.files.filter((f:any)=>f.path===cardiacCavityInput).map((f:any)=>f.path),[cardiacCavityInput]);
 assert.equal(review.files.find((f:any)=>f.path===cardiacCavityInput).sourceSha256,sha(sourceAt(cardiacCavityInput)),'Exact cardiac-cavity Review source pin');
 assert.deepEqual(review.files.filter((f:any)=>f.path===coronaryTourInput).map((f:any)=>f.path),[coronaryTourInput]);
 assert.equal(review.files.find((f:any)=>f.path===coronaryTourInput).sourceSha256,sha(sourceAt(coronaryTourInput)),'Exact coronary-tour Review source pin');
 assert.deepEqual(review.files.filter((f:any)=>coronaryArterialInputs.includes(f.path)).map((f:any)=>f.path).sort(),coronaryArterialInputs);
 for(const p of coronaryArterialInputs)assert.equal(review.files.find((f:any)=>f.path===p).sourceSha256,sha(sourceAt(p)),`Exact coronary source pin: ${p}`);
 assert.deepEqual(review.files.filter((f:any)=>respiratoryInputs.includes(f.path)).map((f:any)=>f.path).sort(),respiratoryInputs);
 for(const p of respiratoryInputs)assert.equal(review.files.find((f:any)=>f.path===p).sourceSha256,sha(sourceAt(p)),`Respiratory core source pin: ${p}`);
 assert.deepEqual(review.files.filter((f:any)=>pelvicCoreInputs.includes(f.path)).map((f:any)=>f.path).sort(),pelvicCoreInputs);
 for(const p of pelvicCoreInputs)assert.equal(review.files.find((f:any)=>f.path===p).sourceSha256,sha(sourceAt(p)),`Pelvic core source pin: ${p}`);
 assert.deepEqual(review.files.filter((f:any)=>organQuizInputs.includes(f.path)).map((f:any)=>f.path).sort(),organQuizInputs);
 for(const p of organQuizInputs)assert.equal(review.files.find((f:any)=>f.path===p).sourceSha256,sha(sourceAt(p)),`Organ Quiz source pin: ${p}`);
 assert.deepEqual(review.files.filter((f:any)=>coronaryContextInputs.includes(f.path)).map((f:any)=>f.path).sort(),coronaryContextInputs);
 for(const p of coronaryContextInputs)assert.equal(review.files.find((f:any)=>f.path===p).sourceSha256,sha(sourceAt(p)),`Coronary-context source pin: ${p}`);
 assert.deepEqual(review.files.filter((f:any)=>shoulderGirdleInputs.includes(f.path)).map((f:any)=>f.path).sort(),shoulderGirdleInputs);
 for(const p of shoulderGirdleInputs)assert.equal(review.files.find((f:any)=>f.path===p).sourceSha256,sha(sourceAt(p)),`Shoulder-girdle source pin: ${p}`);
 assert.deepEqual(review.files.filter((f:any)=>ultrasoundInputs.includes(f.path)).map((f:any)=>f.path).sort(),ultrasoundInputs);
 assert.deepEqual(review.files.filter((f:any)=>cranialInputs.includes(f.path)).map((f:any)=>f.path).sort(),cranialInputs);
 assert.deepEqual(review.files.filter((f:any)=>suprascapularInputs.includes(f.path)).map((f:any)=>f.path).sort(),suprascapularInputs);
 assert.deepEqual(review.files.filter((f:any)=>deepBrainInputs.includes(f.path)).map((f:any)=>f.path).sort(),deepBrainInputs);
 assert.deepEqual(review.files.filter((f:any)=>footInputs.includes(f.path)).map((f:any)=>f.path).sort(),footInputs);
 assert.deepEqual(review.files.filter((f:any)=>handInputs.includes(f.path)).map((f:any)=>f.path).sort(),handInputs);
 assert.deepEqual(review.files.filter((f:any)=>toeInputs.includes(f.path)).map((f:any)=>f.path).sort(),toeInputs);
 assert.deepEqual(review.files.filter((f:any)=>midfootInputs.includes(f.path)).map((f:any)=>f.path).sort(),midfootInputs);
 assert.deepEqual(review.files.filter((f:any)=>pausedTourInputs.includes(f.path)).map((f:any)=>f.path).sort(),pausedTourInputs);
 for(const p of pausedTourInputs)assert.equal(review.files.find((f:any)=>f.path===p).sourceSha256,sha(sourceAt(p)),`Paused-tour source pin: ${p}`);
 // Preserve the exact Spread epoch; the lumbar regression proves the later delta.
 const spreadEpoch=JSON.parse(regionalSpreadMilestoneBytes('atlas-review/manifest.json').toString());
 assert.deepEqual(spreadEpoch.files.filter((f:any)=>!prior.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path),['lib/body-spread.ts']);
 assert.deepEqual(spreadEpoch.files.filter((f:any)=>prior.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),['app/body-explorer.tsx','app/body-scene.tsx','content/body-renderer-revision.json']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(old('lib/atlas-model-inventory.json').toString()).models);
 for(const [name,count,added] of [['head-neck',991,true],['shoulder',664,false],['lower-limb',100,true]] as const){
  const base='public/atlas-runtime/'+name+'/',manifest=json(base+'manifest.json'),previous=JSON.parse(old(base+'manifest.json').toString()),inputs=json(base+'source-inputs.json');
  const coronarySceneInputs=['content/coronary-arterial-study-pins.json','lib/coronary-arterial-study.ts'];
  const calfSceneInputs=name==='shoulder'?[]:['app/specimen-depth-notes.tsx'];
  const thighSceneInputs=name==='shoulder'?[]:['lib/specimen-depth-scope.ts'];
  assert.equal(manifest.sourceCommit,revision);assert.equal(inputs.length,count+1+(name==='lower-limb'?0:ultrasoundInputs.length+cranialInputs.length+suprascapularInputs.length+deepBrainInputs.length+footInputs.length+handInputs.length+toeInputs.length+midfootInputs.length+shoulderGirdleInputs.length+organQuizInputs.length+pelvicCoreInputs.length+respiratoryInputs.length+coronarySceneInputs.length)+(name==='head-neck'?pausedTourInputs.length+coronaryContextInputs.length+2+thoracicInputs.length:0)+calfSceneInputs.length+thighSceneInputs.length+(name==='head-neck'?csfInputs.length:name==='lower-limb'?csfInputs.length+1:0));assert.equal(inputs.some((f:any)=>f.path==='lib/body-spread.ts'),added);
  assert.deepEqual(inputs.filter((f:any)=>thighInputs.includes(f.path)).map((f:any)=>f.path).sort(),thighSceneInputs);
  for(const file of inputs.filter((f:any)=>thighSceneInputs.includes(f.path)))assert.equal(file.sha256,sha(sourceAt(file.path)),file.path);
  assert.deepEqual(inputs.filter((f:any)=>calfInputs.includes(f.path)).map((f:any)=>f.path).sort(),calfSceneInputs);
  for(const file of inputs.filter((f:any)=>calfSceneInputs.includes(f.path)))assert.equal(file.sha256,sha(sourceAt(file.path)),file.path);
  assert.deepEqual(inputs.filter((f:any)=>thoracicInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='head-neck'?thoracicInputs:[]);
  for(const file of inputs.filter((f:any)=>thoracicInputs.includes(f.path)))assert.equal(file.sha256,sha(sourceAt(file.path)),file.path);
  assert.equal(inputs.find((f:any)=>f.path===selectedLabelInput).sha256,sha(sourceAt(selectedLabelInput)),`${name}: exact selected-label helper input`);
  assert.deepEqual(inputs.filter((f:any)=>f.path===cardiacCavityInput).map((f:any)=>f.path),name==='head-neck'?[cardiacCavityInput]:[]);
  for(const f of inputs.filter((f:any)=>f.path===cardiacCavityInput))assert.equal(f.sha256,sha(sourceAt(f.path)),`${name}:${f.path}`);
  assert.deepEqual(inputs.filter((f:any)=>f.path===coronaryTourInput).map((f:any)=>f.path),name==='head-neck'?[coronaryTourInput]:[]);
  for(const f of inputs.filter((f:any)=>f.path===coronaryTourInput))assert.equal(f.sha256,sha(sourceAt(f.path)),`${name}:${f.path}`);
  assert.deepEqual(inputs.filter((f:any)=>coronarySceneInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='lower-limb'?[]:coronarySceneInputs);
  for(const f of inputs.filter((f:any)=>coronarySceneInputs.includes(f.path)))assert.equal(f.sha256,sha(sourceAt(f.path)),`${name}:${f.path}`);
  assert(!inputs.some((f:any)=>f.path==='lib/coronary-arterial-review.ts'));
  assert.deepEqual(inputs.filter((f:any)=>respiratoryInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='lower-limb'?[]:respiratoryInputs);
  for(const f of inputs.filter((f:any)=>respiratoryInputs.includes(f.path)))assert.equal(f.sha256,sha(sourceAt(f.path)),`${name}:${f.path}`);
  assert.deepEqual(inputs.filter((f:any)=>pelvicCoreInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='lower-limb'?[]:pelvicCoreInputs);
  for(const f of inputs.filter((f:any)=>pelvicCoreInputs.includes(f.path)))assert.equal(f.sha256,sha(sourceAt(f.path)),`${name}:${f.path}`);
  assert.deepEqual(inputs.filter((f:any)=>organQuizInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='lower-limb'?[]:organQuizInputs);
  for(const f of inputs.filter((f:any)=>organQuizInputs.includes(f.path)))assert.equal(f.sha256,sha(sourceAt(f.path)),`${name}:${f.path}`);
  assert.deepEqual(inputs.filter((f:any)=>coronaryContextInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='head-neck'?coronaryContextInputs:[]);
  for(const f of inputs.filter((f:any)=>coronaryContextInputs.includes(f.path)))assert.equal(f.sha256,sha(sourceAt(f.path)),`${name}:${f.path}`);
  assert.deepEqual(inputs.filter((f:any)=>shoulderGirdleInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='lower-limb'?[]:shoulderGirdleInputs);
  for(const f of inputs.filter((f:any)=>shoulderGirdleInputs.includes(f.path)))assert.equal(f.sha256,sha(sourceAt(f.path)),`${name}:${f.path}`);
  assert.deepEqual(inputs.filter((f:any)=>pausedTourInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='head-neck'?pausedTourInputs:[]);
  for(const f of inputs.filter((f:any)=>pausedTourInputs.includes(f.path)))assert.equal(f.sha256,sha(sourceAt(f.path)),`${name}:${f.path}`);
  assert.deepEqual(inputs.filter((f:any)=>ultrasoundInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='lower-limb'?[]:ultrasoundInputs);
  assert.deepEqual(inputs.filter((f:any)=>cranialInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='lower-limb'?[]:cranialInputs);
  assert.deepEqual(inputs.filter((f:any)=>suprascapularInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='lower-limb'?[]:suprascapularInputs);
  assert.deepEqual(inputs.filter((f:any)=>deepBrainInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='lower-limb'?[]:deepBrainInputs);
  assert.deepEqual(inputs.filter((f:any)=>footInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='lower-limb'?[]:footInputs);
  assert.deepEqual(inputs.filter((f:any)=>handInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='lower-limb'?[]:handInputs);
  assert.deepEqual(inputs.filter((f:any)=>toeInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='lower-limb'?[]:toeInputs);
  assert.deepEqual(inputs.filter((f:any)=>midfootInputs.includes(f.path)).map((f:any)=>f.path).sort(),name==='lower-limb'?[]:midfootInputs);
  assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),previous.files.filter((f:any)=>f.path.startsWith('models/')));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.deepEqual(manifest[flag],previous[flag]);
  const noticePath=base+'LICENSES/THIRD_PARTY_NOTICES.md';
  const completed=execFileSync('git',['show','d6c37e4df4065fb832bf89b3a1a825de0d3033ff:'+noticePath],{maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString();
  const current=readFileSync(noticePath,'utf8');
  const footEpochNotice=execFileSync('git',['show','7eacbbacc76f4e98288552614ce47e8e823d45a9:'+noticePath],{maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString();
  const sourceNotice=execFileSync('git',['show',revision+':LICENSES/THIRD_PARTY_NOTICES.md'],{cwd:'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs',maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString();
  assert.equal(current,sourceNotice,'Exact current source notice, not a rewritten historical fixture');
  const noticeTitle='# Third-party notices\n\n',toeHeading='## Toe-phalanx ultrasound teaching (4 October 2026)\n';
  // Preserve historical notice comparisons at their exact pre-schematic epoch.
  const priorSchematic=execFileSync('git',['show','6636b2b82f85c66c0920c5dd8e5ed492c4c8f417:'+noticePath],{maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString();
  const disclosureEnd=current.indexOf('## Shoulder-girdle arterial ultrasound teaching (4 October 2026)\n');
  assert(disclosureEnd>noticeTitle.length);
  assert.equal(sha(Buffer.from(current.slice(noticeTitle.length,disclosureEnd))),'a737df9ceba187829b0ef22a744355683eebd72a87616e14584784eb219d29d8');
  const beforeCSFNotice=execFileSync('git',['show','9fcf6007719b78c83979a1fbfbca0e4eadbcc42b:LICENSES/THIRD_PARTY_NOTICES.md'],{cwd:'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs',maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString();
  assert(current.startsWith(beforeCSFNotice),'Every pre-CSF notice byte retained');
  assert.equal(sha(Buffer.from(current.slice(beforeCSFNotice.length))),'12f119b1ad3f18a702056dd55da869e02c844fccc71277baf0050af2e9180a1b','Exact original CSF factual-reference/derived-marker appendix');
  assert.equal(noticeTitle+current.slice(disclosureEnd,beforeCSFNotice.length),priorSchematic,'Every preceding licence byte retained');
  const preMidfoot=withoutMidfootNotice(withoutShoulderGirdleArterialNotice(Buffer.from(priorSchematic))).toString();
  assert(preMidfoot.startsWith(noticeTitle+toeHeading));
  assert.equal(preMidfoot.indexOf(toeHeading,noticeTitle.length+toeHeading.length),-1,'No duplicate toe notice');
  const toeEnd=preMidfoot.indexOf('## Deep-brain teaching (3 October 2026)\n',noticeTitle.length+toeHeading.length);
  assert(toeEnd>noticeTitle.length);
  assert.equal(sha(Buffer.from(preMidfoot.slice(noticeTitle.length,toeEnd))),'93999b558889cd65f4edf95b7903b90b35a3a6a5a403a8abdb253e02feaf7e78','Exact added toe notice');
  const beforeToe=noticeTitle+preMidfoot.slice(toeEnd);
  const priorSourceNotice=execFileSync('git',['show','a1cb14f05b3070b8553e85e3596f634b2bf36a5d:LICENSES/THIRD_PARTY_NOTICES.md'],{cwd:'C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs',maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString();
  assert.equal(beforeToe,priorSourceNotice,'All pre-toe notice bytes preserved');
  assert(beforeToe.startsWith(footEpochNotice),'Complete foot epoch preserved before the hand appendix');
  const history=withoutFootNotice(footEpochNotice);
  assert.deepEqual(regionalSpreadMilestoneBytes(noticePath),old(noticePath),'Spread did not change preceding licence bytes');
  const header='# Third-party notices\n\n',circle='## Circle of Willis guided orientation (2 October 2026)\n';
  const spinal='\n## Spinal-bone ultrasound orientation — 3 October 2026\n';
  assert(history.startsWith(header+'## Deep-brain teaching (3 October 2026)\n'));
  const precedingNotice=execFileSync('git',['show','3c0bf9383b9b1668bc51e39340c68d47850f0581:'+noticePath],{maxBuffer:32e6}).toString();
  assert(history.endsWith(precedingNotice.replaceAll('\r','').slice(header.length)),'Every preceding notice byte remains exact after the original deep-brain teaching disclosure');
  const hyoidNotice=execFileSync('git',['show','67d7d3be152679b7a3f23a745d022a50111d9ebe:'+noticePath],{maxBuffer:32e6}).toString();
  assert(hyoidNotice.startsWith(header+'## Hyoid and epiglottis ultrasound teaching (3 October 2026)\n'));
  assert(history.endsWith(hyoidNotice.replaceAll('\r','').slice(header.length)),'All completed hyoid and earlier notice bytes remain exact');
  const previousNotice=execFileSync('git',['show','452f36b1ca5d86bdac8b7ce4c2bfc42da22fb712:'+noticePath],{maxBuffer:32e6}).toString();
  assert(previousNotice.startsWith(header+'## Open3DModel upper-limb candidate (3 October 2026, offline only)\n'));
  assert(history.endsWith(previousNotice.replaceAll('\r','').slice(header.length)),'All prior licence bytes are preserved after the new factual-teaching disclosure');
  const circleAt=history.indexOf(circle),spinalAt=history.indexOf(spinal,circleAt);
  assert(circleAt>header.length&&spinalAt>circleAt);
  assert.equal(history.lastIndexOf(circle),circleAt);assert.equal(history.lastIndexOf(spinal),spinalAt);
  assert.equal(header+history.slice(circleAt,spinalAt),completed.replaceAll('\r',''),'Every completed notice byte remains in the delivery');
  assert.equal(current,readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8'),'Learner and protected Review notices agree');
  const noticeEntry=manifest.files.find((f:any)=>f.path==='LICENSES/THIRD_PARTY_NOTICES.md');
  assert(noticeEntry);assert.equal(sha(Buffer.from(current)),noticeEntry.sha256,'Delivered notice matches its manifest');
  for(const p of ['bundled-dependencies.json','BUNDLED_NOTICES.txt'])assert.deepEqual(readFileSync(base+p),old(base+p));
 }
 const learner=json('public/atlas-runtime/head-neck/manifest.json');
 const text=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync('public/atlas-runtime/head-neck/'+f.path,'utf8')).join('\n');
 assert(text.includes('Spread adds more space across narrow regions'));
 const scene=readFileSync('atlas-review/app/body-scene.tsx','utf8'),explorer=readFileSync('atlas-review/app/body-explorer.tsx','utf8');
 assert.match(scene,/adaptiveSpread\?: boolean/);assert.match(scene,/props\.adaptiveSpread \? bodySpreadScale\(frame\)/);assert.match(scene,/layout === 'spatial' && props\.adaptiveSpread/);
 assert.match(explorer,/\sadaptiveSpread\s/);
 const result=await build({stdin:{contents:"export * from './atlas-review/lib/body-spread';export {Box3,Vector3} from 'three';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 const frame=new api.Box3(new api.Vector3(-1,-4,-.5),new api.Vector3(1,4,.5)),gain=api.bodySpreadScale(frame);
 assert.deepEqual(gain.toArray(),[3,1,3]);
 const origin=new api.Vector3();for(const amount of [0,NaN])assert.deepEqual(api.bodySpreadOffset([1,2,3],origin,amount,false,gain).toArray(),[0,0,0]);
 assert.deepEqual(api.bodySpreadOffset([1,2,3],origin,100,true,gain).toArray(),[0,0,0]);assert.deepEqual(origin.toArray(),[0,0,0]);
 const viewer=json('public/atlas-review-viewer/manifest.json');assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 for(const f of viewer.files)assert.equal(sha(readFileSync('public/atlas-review-viewer/'+f.path)),f.sha256);
});

async function load(previous=false){
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-decisions';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/nested-review-material';export * from './atlas-review/lib/nested-review';export * from './atlas-review/lib/nested-review-api';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
  plugins:previous?[{name:'prior-website-renderer-only',setup(p){p.onLoad({filter:/body-renderer-revision\.json$/},()=>({contents:old('atlas-review/content/body-renderer-revision.json').toString(),loader:'json'}));}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
test('Spread preserves all teaching and rejects stale root/nested geometry before touching storage',async()=>{
 const now=await load(),before=await load(true),storage=new Proxy({},{get(){throw Error('Invalid submission touched storage');}});
 const request=(body:any)=>new Request('https://review.test/api/review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_SPREAD_TEST'},body:JSON.stringify(body)});
 assert.deepEqual(now.bodyReviewSummaries,before.bodyReviewSummaries);assert.equal(now.bodyReviewSummaries.length,1104);
 let roots=0,nested=0,rejected=0;
 for(const row of now.bodyReviewSummaries){
  assert.deepEqual(now.bodyReviewSnapshot(row.id),before.bodyReviewSnapshot(row.id));
  const n=await now.bodyReviewContext(row.id),b=await before.bodyReviewContext(row.id);
  assert.equal(n.sourceHash,b.sourceHash);assert.equal(n.teachingHash,b.teachingHash);assert.equal(n.revisions.teaching,b.revisions.teaching);assert.equal(n.revisions.imaging,null);
  assert.deepEqual(n.checklists,b.checklists);assert.deepEqual(n.blockers,b.blockers);assert.notEqual(n.revisions.geometry,b.revisions.geometry);
  assert(now.bodyReviewStale({catalogScope:b.catalogScope,structureId:row.id,track:'geometry',checklistVersion:b.checklistVersion,revisionHash:b.revisions.geometry},n));
  assert.equal((await now.postBodyDecision(request({catalogScope:n.catalogScope,structureId:row.id,track:'geometry',expectedVersion:0,materialHash:n.materialHash,revisionHash:b.revisions.geometry,checklistVersion:n.checklistVersion,draft:now.blankBodyReview(n,'geometry')}),storage)).status,409);roots++;rejected++;
 }
 assert.deepEqual(now.nestedReviewRows,before.nestedReviewRows);
 for(const group of now.nestedReviewRows)for(const row of group.surfaces){
  const n=await now.nestedReviewMaterial(group.key,row.id),b=await before.nestedReviewMaterial(group.key,row.id),c=n.context,p=b.context;
  assert.deepEqual(n.source,b.source);assert.deepEqual(n.teaching,b.teaching);assert.equal(n.atlasLink,b.atlasLink);
  assert.equal(c.sourceHash,p.sourceHash);assert.equal(c.teachingHash,p.teachingHash);assert.equal(c.revisions.teaching,p.revisions.teaching);assert.equal(c.revisions.imaging,null);
  assert.deepEqual(c.checklists,p.checklists);assert.deepEqual(c.blockers,p.blockers);assert.notEqual(c.revisions.geometry,p.revisions.geometry);
  for(const [track,delta] of [['teaching',{materialHash:p.materialHash}],['geometry',{materialHash:p.materialHash}],['geometry',{revisionHash:p.revisions.geometry}]] as const){
   assert.equal((await now.postNestedReview(request({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft:now.blankNestedReview(c,track),...(delta as Record<string,string>)}),storage)).status,409);rejected++;
  }nested++;
 }
 assert.deepEqual({roots,nested,rejected},{roots:1104,nested:108,rejected:1428});
 for(const p of ['content/body-review-display-pins.json','content/shoulder-arm-muscle-imaging.ts','content/shoulder-arm-muscle-imaging-pins.json','content/shoulder-arterial-ct.ts','content/shoulder-arterial-mri.ts','LICENSES/THIRD_PARTY_NOTICES.md'])assert.deepEqual(regionalSpreadMilestoneBytes('atlas-review/'+p),old('atlas-review/'+p));
 // The host binder conservatively fingerprints the whole review integration.
 // Preserve the exact Spread milestone's source invariants; the later guided
 // Camera/label/tour-layout fixes change display geometry revisions, not authored teaching.
 const shoulder=json('atlas-review/content/review-revisions.json'),priorShoulder=JSON.parse(old('atlas-review/content/review-revisions.json').toString());
 const spreadShoulder=JSON.parse(regionalSpreadMilestoneBytes('atlas-review/content/review-revisions.json').toString());
 assert.deepEqual(spreadShoulder.sourceRevisions,priorShoulder.sourceRevisions);
 const {revisions:_n,websiteIntegrationSha256:_nh,...stable}=spreadShoulder;
 const {revisions:_b,websiteIntegrationSha256:_bh,...priorStable}=priorShoulder;
 assert.deepEqual(stable,priorStable);
 assert.equal(shoulder.modelHash,spreadShoulder.modelHash);
 assert.deepEqual(Object.keys(shoulder.sourceRevisions),Object.keys(spreadShoulder.sourceRevisions));
 // Preserve the exact pre-motion display milestone's original assertions.
 // The current shoulder callback safeguard is checked as a separate one-file
 // delta against this immutable saved host, not added to the historical list.
 const savedDisplayShoulder=JSON.parse(execFileSync('git',['show','34594657e4e20d460921246f9d66a1a22bea5ba6:atlas-review/content/review-revisions.json'],{maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString());
 const previousDisplay=new Map<string,string>(spreadShoulder.display),currentDisplay=new Map<string,string>(savedDisplayShoulder.display);
 const liveDisplay=new Map<string,string>(shoulder.display);
 assert.deepEqual([...liveDisplay.keys()],[...currentDisplay.keys()]);
 assert.deepEqual([...liveDisplay].filter(([path,hash])=>currentDisplay.get(path)!==hash).map(([path])=>path),['app/shoulder-explorer.tsx']);
 assert.equal(liveDisplay.get('app/shoulder-explorer.tsx'),sha(sourceAt('app/shoulder-explorer.tsx')),'Exact current shoulder motion safeguard source');
 const expectedDisplayKeys=[...previousDisplay.keys()];
 expectedDisplayKeys.splice(expectedDisplayKeys.indexOf('app/scene-label-layer.css')+1,0,'lib/scene-label-size.ts','lib/scene-label-focus.ts');
 assert.deepEqual([...currentDisplay.keys()],expectedDisplayKeys);
 assert.deepEqual([...currentDisplay].filter(([path,hash])=>previousDisplay.get(path)!==hash).map(([path])=>path),["app/anatomy-scene.tsx","app/scene-label-layer.tsx","app/scene-label-layer.css","lib/scene-label-size.ts","lib/scene-label-focus.ts","lib/screen-label-layout.ts","app/scene-recovery.tsx","app/fitted-camera.tsx","app/shoulder-tour-player.tsx","app/shoulder-tour-player.css","app/tour-imaging-notes.tsx"]);
 for(const path of ['app/scene-label-layer.tsx','app/scene-label-layer.css','lib/scene-label-size.ts','lib/scene-label-focus.ts'])
  assert.equal(currentDisplay.get(path),sha(sourceAt(path)),`Exact current selected-label display source: ${path}`);
 assert.equal(currentDisplay.get('lib/screen-label-layout.ts'),'87854b4e74d2e98a928a2bd9e8b2450214fa16e7a339036f3838d7d848fe927a');
 assert.equal(currentDisplay.get('app/shoulder-tour-player.tsx'),'0fb1f95ec82c2323b4bc01372fd5e7938c090df8a4b8513f8929c672cfde6740');
 assert.equal(currentDisplay.get('app/shoulder-tour-player.css'),'cab61989340b515193dfa507a8224d63c24798ed64150d8a2130114303301700');
 assert.equal(currentDisplay.get('app/anatomy-scene.tsx'),'65d63c2027cadef511391e414c3ae33f810f583939f55522c75855c73f437ef9');
 assert.equal(currentDisplay.get('app/scene-recovery.tsx'),'b9f90de58345f2608ed60a5d9f649090a0a83a568d883783d6406dc8dd4291df');
 assert.equal(currentDisplay.get('app/fitted-camera.tsx'),'9d13fb2b2c498fff6fae7944b4f6ed95d4563dc9d0e1653eed0cb716aa6743a0');
 assert.equal(currentDisplay.get('app/tour-imaging-notes.tsx'),sha(sourceAt('app/tour-imaging-notes.tsx')));
 for(const [id,tracks] of Object.entries(shoulder.sourceRevisions) as [string,Record<string,string|null>][]){
  assert.equal(tracks.teaching,spreadShoulder.sourceRevisions[id].teaching);
  assert.notEqual(tracks.geometry,spreadShoulder.sourceRevisions[id].geometry);
  for(const track of ['geometry','teaching']){
   assert.notEqual(shoulder.revisions[id][track],priorShoulder.revisions[id][track]);
   assert.equal(shoulder.revisions[id][track],sha(Buffer.from(JSON.stringify({source:tracks[track],website:shoulder.websiteIntegrationSha256}))));
  }assert.equal(shoulder.revisions[id].imaging,null);
 }
});
