import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,statSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const statuses=['verified-local','partial','open','needs-owner','held','proposed','done'];
const scopes=['release-essential','full-roadmap','optional'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const commit=value=>/^[a-f0-9]{40}$/.test(value);
const digest=value=>/^[a-f0-9]{64}$/.test(value);
const installedRegions=['head-neck','shoulder','lower-limb','female-pelvis'];
function exactKeys(value,keys,label){
 assert(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key)),label);
}
function localPath(site,value){
 assert(typeof value==='string'&&value&&!value.includes('\\')&&!value.includes(':')&&!isAbsolute(value)&&!value.split('/').some(part=>!part||part==='.'||part==='..'),'Unsafe installed path');
 const path=resolve(site,value),rel=relative(resolve(site),path);assert(rel&&!rel.startsWith('..')&&!isAbsolute(rel),'Installed path escapes site');return path;
}
function readSite(site,path,read,realpath){
 const file=localPath(site,path),root=realpath(resolve(site)),actual=realpath(file);
 assert(actual.startsWith(root+'/')||actual.startsWith(root+'\\'),'Installed file escapes site through link');
 return read(file);
}
function verifyRows(site,base,rows,read,realpath,label){
 assert(Array.isArray(rows)&&rows.length>0,label+' rows required');
 const seen=new Set();for(const row of rows){
  assert(row&&typeof row.path==='string'&&digest(row.sha256)&&!seen.has(row.path),label+' row identity');seen.add(row.path);
  assert.equal(sha(readSite(site,base?base+'/'+row.path:row.path,read,realpath)),row.sha256,label+': '+row.path);
 }
}
export function evidencePath(data,value){
 const match=/^([a-z]+):(.+)$/.exec(value);assert(match&&Object.hasOwn(data.roots,match[1]),'Unknown evidence root');
 assert(!match[2].includes('\\')&&!match[2].startsWith('/')&&!match[2].split('/').some(part=>!part||part==='.'||part==='..'||part.startsWith('.env')||['.local','private','scans','datasets'].includes(part)),'Unsafe evidence path');
 const root=resolve(data.roots[match[1]]),path=resolve(root,match[2]);assert(!relative(root,path).startsWith('..'));return path.replaceAll('\\','/');
}
export function validateChecklist(data){
 assert.equal(data.schemaVersion,1);assert(Number.isSafeInteger(data.revision)&&data.revision>0);assert(/^\d{4}-\d{2}-\d{2}$/.test(data.updatedAt));assert(Array.isArray(data.items)&&data.items.length>0);
 const imported=data.importedAtlasSource;
 if(imported!==undefined){
  const keys=['commit','tree','reviewIntegration','reviewSourceFiles','rootDraftPlacements','rootPendingPlacements','rootGeneratedIdentificationPlacements','evidence','evidenceSha256'];
  assert(imported&&typeof imported==='object'&&!Array.isArray(imported)&&Object.keys(imported).length===keys.length&&keys.every(k=>Object.hasOwn(imported,k)),'Invalid local import record');
  assert(/^[a-f0-9]{40}$/.test(imported.commit)&&/^[a-f0-9]{40}$/.test(imported.tree)&&/^[a-f0-9]{64}$/.test(imported.reviewIntegration)&&/^[a-f0-9]{64}$/.test(imported.evidenceSha256),'Local import identities must be exact');
  assert(Number.isSafeInteger(imported.reviewSourceFiles)&&imported.reviewSourceFiles>0,'Local import source count');
  const counts=['rootDraftPlacements','rootPendingPlacements','rootGeneratedIdentificationPlacements'].map(k=>imported[k]);
  assert(counts.every(n=>Number.isSafeInteger(n)&&n>=0)&&counts.reduce((a,n)=>a+n,0)===data.baseline.rootTopicPlacements,'Local import must conserve the recorded topic scope');
  assert(typeof imported.evidence==='string'&&imported.evidence.endsWith('.json'),'Local import evidence required');evidencePath(data,imported.evidence);
 }
 if(data.installedAtlasSource!==undefined){
  const current=data.installedAtlasSource;
  exactKeys(current,['installation','installationSha256','sourceSnapshot','sourceSnapshotSha256','readback','readbackSha256','review','learners'],'Invalid installed source fields');
  assert(typeof current.installation==='string'&&current.installation.endsWith('.json')&&typeof current.sourceSnapshot==='string'&&current.sourceSnapshot.endsWith('.json')&&typeof current.readback==='string'&&current.readback.endsWith('.json')&&digest(current.installationSha256)&&digest(current.sourceSnapshotSha256)&&digest(current.readbackSha256),'Installed evidence identities');evidencePath(data,current.installation);evidencePath(data,current.sourceSnapshot);evidencePath(data,current.readback);
  exactKeys(current.review,['commit','tree','integration','sourceFiles','inputFiles','manifestSha256','inputsSha256','viewerSha256'],'Invalid installed Review fields');
  assert(commit(current.review.commit)&&commit(current.review.tree)&&digest(current.review.integration)&&digest(current.review.manifestSha256)&&digest(current.review.inputsSha256)&&digest(current.review.viewerSha256),'Installed Review identities');
  assert(Number.isSafeInteger(current.review.sourceFiles)&&current.review.sourceFiles>0&&Number.isSafeInteger(current.review.inputFiles)&&current.review.inputFiles>0,'Installed Review counts');
  exactKeys(current.learners,installedRegions,'Every installed learner must be declared');
  for(const region of installedRegions){const row=current.learners[region];exactKeys(row,['commit','tree','manifestSha256'],'Invalid learner fields');assert(commit(row.commit)&&commit(row.tree)&&digest(row.manifestSha256),'Installed learner identities');}
 }
 if(data.unpublishedWebsiteCandidate!==undefined){
  assert(data.installedAtlasSource,'Unpublished website candidate requires an installed record');
  const candidate=data.unpublishedWebsiteCandidate;exactKeys(candidate,['sourceReceipt','sourceReceiptSha256'],'Invalid unpublished candidate');
  assert(typeof candidate.sourceReceipt==='string'&&candidate.sourceReceipt.endsWith('.json')&&digest(candidate.sourceReceiptSha256),'Candidate evidence identity');evidencePath(data,candidate.sourceReceipt);
 }
 if(data.pendingAtlasSource!==undefined){
  const p=data.pendingAtlasSource,keys=['commit','tree','rootDraftPlacements','rootPendingPlacements','rootGeneratedIdentificationPlacements','websiteImported','evidence','note'];
  assert(p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).length===keys.length&&keys.every(k=>Object.hasOwn(p,k)),'Invalid pending source fields');
  assert(/^[a-f0-9]{40}$/.test(p.commit)&&/^[a-f0-9]{40}$/.test(p.tree),'Source must have exact Git identities');
  assert(typeof p.websiteImported==='boolean','Source import state must be explicit');
  if(p.websiteImported){
   assert.equal(p.commit,imported?.commit??data.baseline.atlasCommit,'Imported source must match the explicit local import or legacy website baseline');
   assert.equal(p.tree,imported?.tree??data.baseline.atlasTree,'Imported tree must match the explicit local import or legacy website baseline');
   for(const key of ['rootDraftPlacements','rootPendingPlacements','rootGeneratedIdentificationPlacements'])assert.equal(p[key],(imported??data.baseline)[key],'Imported counts must match their declared source');
  }else{
   assert.notEqual(p.commit,imported?.commit??data.baseline.atlasCommit,'Pending source must be a distinct exact Git identity');
   if(data.installedAtlasSource)assert.notEqual(p.commit,data.installedAtlasSource.review.commit,'Pending source must differ from installed Review source');
  }
  const counts=[p.rootDraftPlacements,p.rootPendingPlacements,p.rootGeneratedIdentificationPlacements];assert(counts.every(n=>Number.isSafeInteger(n)&&n>=0)&&counts.reduce((a,n)=>a+n,0)===data.baseline.rootTopicPlacements,'Pending source topic count must conserve this baseline scope');
  assert(typeof p.note==='string'&&p.note.trim()&&typeof p.evidence==='string'&&p.evidence.endsWith('.json'),'Missing pending source evidence');
 }
 const ids=new Set();for(const item of data.items){
  assert(/^[A-Z]+-\d{2}(?:\.\d+)?$/.test(item.id)&&!ids.has(item.id),'Invalid or duplicate item ID');ids.add(item.id);
  assert(statuses.includes(item.status),'Unknown status');assert(scopes.includes(item.scope),'Unknown scope');assert(/^P[0-3]$/.test(item.priority),'Unknown priority');
  for(const key of ['area','owner','task','acceptance'])assert(typeof item[key]==='string'&&item[key].trim().length>0,'Missing '+key);
  assert(Array.isArray(item.evidence)&&item.evidence.length>0,'Evidence references required');for(const ref of item.evidence)evidencePath(data,ref);
  assert(item.status!=='proposed'||item.scope==='optional','Proposals must not silently become requirements');
  if(item.status==='done')assert(item.completion&&typeof item.completion.date==='string'&&typeof item.completion.source==='string'&&Array.isArray(item.completion.evidence)&&item.completion.evidence.length>0,'Done requires a dated source-bound completion record');
 }
 assert(Array.isArray(data.changeLog)&&data.changeLog.some(row=>row.revision===data.revision),'Current revision needs a change-log entry');return data;
}
export function verifyImportedAtlasEvidence(data,site,{read=readFileSync,realpath=realpathSync,git=(repo,ref)=>execFileSync('git',['--no-replace-objects','-C',repo,'rev-parse',ref],{encoding:'utf8',windowsHide:true}).trim()}={}){
 validateChecklist(data);const imported=data.importedAtlasSource;if(!imported){if(data.installedAtlasSource)verifyCurrentAtlasInstallation(data,site,{read,realpath,git});return;}
 const bytes=read(evidencePath(data,imported.evidence));assert.equal(createHash('sha256').update(bytes).digest('hex'),imported.evidenceSha256,'Exact local installation evidence');
 const installed=JSON.parse(bytes);assert.equal(installed.applied,true,'Local import must actually be applied');assert.equal(installed.publicDeployment,false,'Local import is not public-release approval');
 assert.equal(installed.sourceAtlas,imported.commit);assert.equal(installed.review,imported.reviewIntegration);
 // A separate source checkout may advance while the Website keeps this exact import.
 assert.equal(git(data.roots.atlas,imported.commit+'^{commit}'),imported.commit,'Imported immutable Atlas commit');assert.equal(git(data.roots.atlas,imported.commit+'^{tree}'),imported.tree,'Imported immutable Atlas tree');
 // The legacy record remains an authenticated historical event after a later installation.
 if(data.installedAtlasSource){verifyCurrentAtlasInstallation(data,site,{read,realpath,git});return;}
 const document=p=>JSON.parse(read(resolve(site,p))),review=document('atlas-review/manifest.json'),inputs=document('atlas-review/integration-inputs.json'),viewer=document('public/atlas-review-viewer/manifest.json');
 assert.equal(review.revision,imported.commit);assert.equal(review.websiteIntegrationSha256,imported.reviewIntegration);assert.equal(review.files.length,imported.reviewSourceFiles);
 assert.equal(inputs.sourceCommit,imported.commit);assert.equal(inputs.sha256,imported.reviewIntegration);assert.equal(createHash('sha256').update(JSON.stringify(inputs.inputs)).digest('hex'),imported.reviewIntegration,'Review input-list closure');
 assert.equal(viewer.sourceCommit,imported.commit);assert.equal(viewer.websiteIntegrationSha256,imported.reviewIntegration);assert.equal(viewer.personalRecordsIncluded,false);
 for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){const learner=document('public/atlas-runtime/'+name+'/manifest.json');assert.equal(learner.sourceCommit,imported.commit,name+': source');assert.equal(learner.patientDataIncluded,false,name+': no patient data');}
}
export function verifyCurrentAtlasInstallation(data,site,{read=readFileSync,realpath=realpathSync,git=(repo,ref)=>execFileSync('git',['--no-replace-objects','-C',repo,'rev-parse',ref],{encoding:'utf8',windowsHide:true}).trim()}={}){
 validateChecklist(data);const current=data.installedAtlasSource;assert(current,'Explicit installed Atlas contract required');
 const receiptBytes=read(evidencePath(data,current.installation));assert.equal(sha(receiptBytes),current.installationSha256,'Exact immutable installation receipt');
 const receipt=JSON.parse(receiptBytes),r=current.review;
 assert.equal(receipt.source,r.commit,'Installation source');assert.equal(receipt.tree,r.tree,'Installation tree');assert.equal(receipt.review,r.integration,'Installation Review');
 assert.equal(receipt.publicDeployment,false,'Installation is not public deployment');assert.equal(receipt.clinicalApproval,false,'Installation is not clinical approval');
 assert.equal(receipt.spatialRegistration,false,'Installation is not spatial registration');
 assert.equal(receipt.sourceSnapshotSha256,current.sourceSnapshotSha256,'Installation source snapshot identity');
 assert.equal(resolve(receipt.sourceSnapshot),resolve(evidencePath(data,current.sourceSnapshot)),'Installation source snapshot path');
 const snapshotBytes=read(evidencePath(data,current.sourceSnapshot));assert.equal(sha(snapshotBytes),current.sourceSnapshotSha256,'Exact installation source snapshot');
 const snapshot=JSON.parse(snapshotBytes);assert(Array.isArray(snapshot)&&snapshot.length>0,'Installation source snapshot rows');
 const snapshotPaths=new Map();for(const row of snapshot){
  assert(row&&typeof row.path==='string'&&digest(row.sha256)&&Number.isSafeInteger(row.bytes)&&row.bytes>=0,'Installation snapshot row');
  localPath(site,row.path);assert(!snapshotPaths.has(row.path),'Duplicate installation snapshot path '+row.path);snapshotPaths.set(row.path,row);
 }
 if(Number.isSafeInteger(receipt.controlledInputs))assert.equal(snapshot.length,receipt.controlledInputs,'Installation snapshot count');
 const readbackBytes=read(evidencePath(data,current.readback));assert.equal(sha(readbackBytes),current.readbackSha256,'Exact authenticated installed readback');
 const proof=JSON.parse(readbackBytes);
 assert(['vm-authenticated-installed-atlas-readback/1','vm-installed-atlas-source-readback/1'].includes(proof.schema),'Unknown installed readback schema');
 assert.equal(proof.passing,true);
 if(proof.schema==='vm-installed-atlas-source-readback/1')assert.equal(proof.authenticatedBrowserVerified,false,'Source readback must explicitly decline authenticated browser verification');
 assert.equal(resolve(proof.existingInstallation.path),resolve(evidencePath(data,current.installation)));assert.equal(proof.existingInstallation.sha256,current.installationSha256);
 assert.equal(resolve(proof.existingInstallationSnapshot.path),resolve(evidencePath(data,current.sourceSnapshot)));assert.equal(proof.existingInstallationSnapshot.sha256,current.sourceSnapshotSha256);
 assert.equal(proof.atlasCommit,r.commit);assert.equal(proof.atlasTree,r.tree);assert.equal(proof.reviewIntegration,r.integration);assert.equal(proof.reviewSources,r.sourceFiles);assert.equal(proof.protectedInputs,r.inputFiles);
 assert.equal(proof.clinicalApproval,false);assert.equal(proof.patientRegistration,false,'Readback has no patient registration');assert.equal(proof.publicDeployment,false);assert.equal(proof.newInstallationExecuted,false);
 const expectedManifests=new Map([['atlas-review/manifest.json',r.manifestSha256],['atlas-review/integration-inputs.json',r.inputsSha256],['public/atlas-review-viewer/manifest.json',r.viewerSha256],...installedRegions.map(region=>['public/atlas-runtime/'+region+'/manifest.json',current.learners[region].manifestSha256])]);
 assert.equal(proof.manifestRows.length,expectedManifests.size,'Readback manifest cardinality');
 for(const row of proof.manifestRows){assert.equal(row.sha256,expectedManifests.get(row.path),'Readback manifest '+row.path);expectedManifests.delete(row.path);
  const original=snapshotPaths.get(row.path);assert(original,'Current manifest missing from installation snapshot: '+row.path);assert.equal(original.sha256,row.sha256,'Installed manifest differs from installation snapshot: '+row.path);assert.equal(original.bytes,row.bytes,'Installed manifest length differs from installation snapshot: '+row.path);
 }
 assert.equal(expectedManifests.size,0,'All seven readback manifests');
 exactKeys(proof.modules,installedRegions,'Readback module set');
 for(const region of installedRegions){const got=proof.modules[region],pin=current.learners[region];assert.equal(got.manifestPath,'public/atlas-runtime/'+region+'/manifest.json');assert.equal(got.manifestSha256,pin.manifestSha256);assert.equal(got.sourceCommit,pin.commit);assert.equal(got.sourceTree,pin.tree);assert.equal(got.patientDataIncluded,false);}
 const identities=new Map();for(const [source,tree]of [[r.commit,r.tree],...installedRegions.map(region=>[current.learners[region].commit,current.learners[region].tree])]){
  if(identities.has(source))assert.equal(identities.get(source),tree,'One Atlas commit cannot have conflicting trees');else identities.set(source,tree);
 }
 for(const [source,tree]of identities){assert.equal(git(data.roots.atlas,source+'^{commit}'),source,'Immutable installed Atlas commit');assert.equal(git(data.roots.atlas,source+'^{tree}'),tree,'Immutable installed Atlas tree');}
 const document=(path,expected)=>{const bytes=readSite(site,path,read,realpath);assert.equal(sha(bytes),expected,'Installed document '+path);return JSON.parse(bytes);};
 const review=document('atlas-review/manifest.json',r.manifestSha256),inputs=document('atlas-review/integration-inputs.json',r.inputsSha256),viewer=document('public/atlas-review-viewer/manifest.json',r.viewerSha256);
 assert.equal(review.revision,r.commit);assert.equal(review.websiteIntegrationSha256,r.integration);assert.equal(review.files.length,r.sourceFiles);
 assert.equal(inputs.sourceCommit,r.commit);assert.equal(inputs.sha256,r.integration);assert.equal(inputs.inputs.length,r.inputFiles);assert.equal(sha(JSON.stringify(inputs.inputs)),r.integration,'Review input-list closure');
 assert.equal(viewer.sourceCommit,r.commit);assert.equal(viewer.websiteIntegrationSha256,r.integration);assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(proof.reviewViewerFiles,viewer.files.length,'Readback viewer files');
 verifyRows(site,'',inputs.inputs,read,realpath,'Review input');
 const reviewPaths=new Set();for(const row of review.files){assert(row&&typeof row.path==='string'&&digest(row.importedSha256)&&!reviewPaths.has(row.path),'Review source row');reviewPaths.add(row.path);assert.equal(sha(readSite(site,'atlas-review/'+row.path,read,realpath)),row.importedSha256,'Review source '+row.path);}
 verifyRows(site,'public/atlas-review-viewer',viewer.files,read,realpath,'Review viewer');
 for(const region of installedRegions){
  const pin=current.learners[region],base='public/atlas-runtime/'+region,learner=document(base+'/manifest.json',pin.manifestSha256);
  assert.equal(learner.sourceCommit,pin.commit,region+': source');assert.equal(learner.patientDataIncluded,false,region+': no patient data');
  assert.equal(proof.modules[region].files,learner.files.length,region+': readback file count');
  verifyRows(site,base,learner.files,read,realpath,region+' learner');
 }
 if(data.unpublishedWebsiteCandidate){const candidate=data.unpublishedWebsiteCandidate;assert.equal(sha(read(evidencePath(data,candidate.sourceReceipt))),candidate.sourceReceiptSha256,'Exact unpublished source candidate receipt');}
}
const cell=value=>String(value).replaceAll('|','\\|').replaceAll('\n',' ');
export function renderChecklist(data){
 validateChecklist(data);const b=data.baseline,areas=[...new Set(data.items.map(item=>item.area))];
 const out=[`# ${data.title}`,'',`Revision ${data.revision} · Updated ${data.updatedAt}`,'',data.purpose,'',
  'This is the persistent project checklist, not a claim that the whole website is finished. The JSON companion is the editable status register; regenerate this view with `node scripts/refresh-completion-checklist.mjs` and verify with `--check --verify-evidence`.','',
  data.importedAtlasSource?'## Recorded audit baseline':'## Current baseline','',`Atlas source: \`${b.atlasCommit}\`. Website HEAD: \`${b.websiteHead}\` with preserved unpublished changes. Review binding: \`${b.reviewIntegration}\`.`, '',
  `${b.rootRepresentations} root-body representations have ${b.rootTopicPlacements} topic placements: ${b.rootDraftPlacements} editorial drafts, ${b.rootPendingPlacements} pending and ${b.rootGeneratedIdentificationPlacements} generated identification prompts. Separate scopes include ${b.nestedRepresentations} nested selections, ${b.regionalTours} regional tours / ${b.regionalTourStops} stops and ${b.independentGuides} independent guides / ${b.independentGuideStops} stops.`, '',b.limitations,'',
  ...(data.importedAtlasSource?[data.installedAtlasSource?'## Historical local Atlas import':'## Current local Atlas import','',`Atlas source: \`${data.importedAtlasSource.commit}\`. Tree: \`${data.importedAtlasSource.tree}\`. Review binding: \`${data.importedAtlasSource.reviewIntegration}\`. The recorded audit baseline above is retained unchanged; a local import is not clinical sign-off or release approval.`,'']:[]),
  ...(data.installedAtlasSource?['## Verified current local installation','',`Review/Atlas source: \`${data.installedAtlasSource.review.commit}\`. Review binding: \`${data.installedAtlasSource.review.integration}\`. Installed learner revisions: ${installedRegions.map(region=>`${region} \`${data.installedAtlasSource.learners[region].commit}\``).join('; ')}. Exact receipt and installed file closures must pass verification; this is not clinical sign-off or release approval.`,'']:[]),
  ...(data.unpublishedWebsiteCandidate?['## Unpublished website candidate','',`Source receipt: \`${data.unpublishedWebsiteCandidate.sourceReceipt}\` (SHA-256 \`${data.unpublishedWebsiteCandidate.sourceReceiptSha256}\`). This candidate is separate from the verified current local installation; it is not installed or released by this register.`,'']:[]),
  ...(data.pendingAtlasSource?[`${data.installedAtlasSource&&data.pendingAtlasSource.websiteImported?'Historical ':''}${data.pendingAtlasSource.websiteImported?'Integrated':'Pending'} Atlas source: \`${data.pendingAtlasSource.commit}\` (${data.pendingAtlasSource.rootDraftPlacements} draft / ${data.pendingAtlasSource.rootPendingPlacements} pending / ${data.pendingAtlasSource.rootGeneratedIdentificationPlacements} generated topic placements). **${data.installedAtlasSource?(data.pendingAtlasSource.websiteImported?'This field records its original import state; the verified current installation is listed above.':'This unpublished Atlas source is not installed in the current website; the verified installation is listed above.'):data.importedAtlasSource?(data.pendingAtlasSource.websiteImported?'Imported into the current local website; the recorded audit baseline above is unchanged.':'Not imported into the current local website.'):(data.pendingAtlasSource.websiteImported?'Imported into the website baseline above.':'Not imported into the website baseline above.')}** ${data.pendingAtlasSource.note}`,'']:[]),
  ['verified-local','done'].includes(data.items.find(i=>i.id==='BASE-02')?.status)?'Canonical Atlas summaries were refreshed and verified through their generator (BASE-02). Source-candidate evidence remains separate from the website baseline and from clinical, browser and release approval.':'Current evidence was recomputed from the real resolver. Some older canonical Atlas summaries are stale; BASE-02 tracks their refresh. The fresh reports are retained in the audit staging folder without changing anatomy, teaching, masks or private decisions.','',
  '## How to track progress','',
  ...data.rules.map(rule=>'- '+rule),'',
  'A checked item means its **bounded local implementation or inventory criterion** is verified. It does not mean clinical sign-off, physical-device acceptance or public release. Those have their own rows. A held or owner-gated item is not a project-wide stop.','',
  '## Progress by area','', '| Area | Local verified | Partial | Open | Owner input | Held | Optional ideas | Done |','| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'];
 for(const area of areas){const items=data.items.filter(i=>i.area===area);out.push('| '+[area,...statuses.map(status=>items.filter(i=>i.status===status).length)].join(' | ')+' |');}
 out.push('','## Recommended order','',
  '1. Confirm the intended first release scope and learners (BASE-03), and freeze a review candidate (BASE-04). Continue independent development in parallel.','2. Repair complete-suite release assurance (REL-01), complete real desktop/accessibility journeys (UX-01–03), and verify native CT/MRI plus protected Education delivery (IMG-01–02).','3. Review the included anatomy and teaching in the private Clinical Review inbox (ANAT-18, TEACH-10); work through source holds and evidence-backed content gaps in coherent regional batches.','4. Finish the selected course/exam and operational release gates. Add optional ideas only when they improve an agreed learner/author task and do not clutter the UI.','',
  '## Your next inputs','',
  '- Choose the initial audience, regions/modalities and courses; the full roadmap remains intact even if the first private beta is bounded.','- Use [Clinical Review inbox](http://127.0.0.1:3000/workspace/clinical-review-inbox) to review exact model/teaching/head packages. Record corrections and source-bound decisions, not blanket approval.','- Adjudicate held anatomy only within appropriate expertise; nominate specialist help where needed.','- Identify the intended cleared cases, presentation source files and lecture anchors. Local use approval does not itself authorize upload.','- Later, approve the real deployment target, governance/contact details, operational ownership and any commercial activation.','',
  '## My continuing work','',
  'I can inventory sources and gaps, research acceptable references/assets, write review-ready teaching, prepare review packets, implement/test software and maintain this register. I cannot manufacture missing anatomy, clinical approval, registration, rights/privacy clearance, real account authority or permission to publish. Owner-gated items will not prevent independent useful work.','');
 for(const area of areas){out.push(`## ${area}`,'');for(const item of data.items.filter(i=>i.area===area)){
  const checked=['verified-local','done'].includes(item.status)?'x':' ';
  out.push(`- [${checked}] **${item.id} ${item.task}**`, `  ${item.priority} · ${item.scope} · ${item.owner} · ${item.status}`,`  Acceptance: ${item.acceptance}`,`  Evidence: ${item.evidence.map(ref=>`[${cell(ref)}](<${evidencePath(data,ref)}>)`).join(', ')}.`,'');
 }}
 out.push('## Change log','',...data.changeLog.map(row=>`- ${row.date} · revision ${row.revision}: ${row.change}`),'');return out.join('\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const flags=process.argv.slice(2);assert(flags.every(flag=>['--check','--verify-evidence'].includes(flag))&&new Set(flags).size===flags.length,'Unknown or repeated option');
 const base=resolve(fileURLToPath(new URL('..',import.meta.url))),source=resolve(base,'docs/completion-checklist.json'),destination=resolve(base,'docs/completion-checklist.md'),data=validateChecklist(JSON.parse(readFileSync(source,'utf8'))),output=renderChecklist(data);
 verifyImportedAtlasEvidence(data,base);
 if(flags.includes('--verify-evidence'))for(const item of data.items)for(const ref of item.evidence){const path=evidencePath(data,ref);assert(existsSync(path)&&statSync(path).isFile(),'Missing evidence '+ref);}
 if(flags.includes('--check'))assert.equal(readFileSync(destination,'utf8').replaceAll('\r\n','\n'),output,'Checklist view is stale');else writeFileSync(destination,output);
 console.log(JSON.stringify({verdict:'pass',revision:data.revision,items:data.items.length,optional:data.items.filter(i=>i.scope==='optional').length,evidenceChecked:flags.includes('--verify-evidence'),checkOnly:flags.includes('--check')}));
}
