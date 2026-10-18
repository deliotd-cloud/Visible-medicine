import { createHash } from 'node:crypto';
import { readFile, writeFile, realpath, mkdir } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { assertDraftExam } from './contract.mjs';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const opaque = (prefix, value) => `${prefix}_${hash(value).slice(0, 32)}`;
const escape = value => String(value ?? 'Unresolved — radiologist review required').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function createDraft(context) {
  const evidence = new Map();
  const locators = new Map();
  const cases = context.cases.map(item => {
    if (item.assets.some(a => a.sourceRecord.hard_negative_tags?.some(tag => ['metal','cast'].includes(tag)))) throw Error('SURGERY_OR_CAST_EXCLUSION_REQUIRED');
    const source = item.assets[0].sourceRecord;
    const caseId = opaque('case', `${source.dataset_id}:${source.patient_key}:${source.study_key}`);
    const evidenceText = json({sourceEvidence: context.sourceEvidence, licenceEvidence: context.licenceEvidence, selectionPolicy: context.selectionPolicy, case: item});
    evidence.set(caseId, evidenceText);
    const assets = item.assets.map(asset => {
      const id = opaque('asset', asset.sha256);
      locators.set(id, asset.path);
      return {assetId: id, ref: `assets/${id.slice(6)}.png`, sha256: asset.sha256,
        view: ['frontal','lateral','oblique'].includes(asset.sourceRecord.view) ? asset.sourceRecord.view : null,
        laterality: ['left','right'].includes(asset.sourceRecord.laterality) ? asset.sourceRecord.laterality : null};
    });
    const classification = {'fracture': 'Fracture — source annotation only; unconfirmed.',
      'no-fracture': 'No fracture labelled by source; this is not a normal-study diagnosis.',
      'indeterminate': null}[item.sourceLabel] ?? null;
    const rationale = `Source study category: ${item.sourceLabel}. All supplied study images are retained. Dataset annotations are not a signed clinical reference standard.`;
    const question = (n, prompt, answer, explanation, criteria) => ({questionId: opaque('question', `${caseId}:${n}`),
      prompt, answer, rationale: explanation, maxMarks: criteria.reduce((s,c) => s+c.maxMarks,0), criteria});
    return {caseId, sourceEvidenceSha256: hash(evidenceText),
      patientLinkage: {status: 'confirmed', groupId: opaque('group', `${source.dataset_id}:${source.patient_key}`)},
      assets, fields: {region: source.anatomy === 'wrist' ? 'wrist' : null,
        laterality: assets.every(a => a.laterality === assets[0].laterality) ? assets[0].laterality : null,
        difficulty: null, findings: null, answer: classification, rationale},
      questions: [
        question(1, 'Review all supplied images. Is a fracture present, absent, or indeterminate on this study?', classification, rationale,
          [{label:'Classification consistent with the radiologist-approved key; unresolved until review.',maxMarks:1}]),
        question(2, 'Describe the image evidence supporting your answer. If a fracture is present, identify the affected bone and site; otherwise describe the relevant findings or uncertainty.', null, null,
          [{label:'Accurate localisation or explanation of uncertainty, according to the reviewed key.',maxMarks:1},
           {label:'Supporting image finding, according to the reviewed key.',maxMarks:1}]),
        question(3, 'State the side and projections represented by the supplied images.',
          assets.every(a=>a.view && a.laterality) ? `${assets[0].laterality}; ${[...new Set(assets.map(a=>a.view))].join(' and ')}.` : null,
          'These are source metadata labels. Frontal has not been converted to AP or PA. Confirm image markers and projection before accepting this key.',
          [{label:'Correct side and all supplied projections, after metadata verification.',maxMarks:1}])
      ]};
  });
  const exam = {schemaVersion:1, examId:opaque('exam', json(cases)), lifecycle:'private-draft',
    scope:{purpose:'assessment',audience:'private-review',integration:'didanix-education-light',mode:'timed',durationMinutes:18}, cases,
    reviews:Object.fromEntries(['clinical','privacy','reuse'].map(g=>[g,{status:'pending',evidence:null}]))};
  const validation = assertDraftExam(exam);
  return {exam, evidence, locators, revision:validation.revision};
}

export function renderReview({exam, revision, locators}) {
  const sections = exam.cases.map((c,i) => `<section id="case-${i+1}" class="case"><div class="case-head"><p class="eyebrow">Case ${i+1} / ${exam.cases.length} · 4 proposed marks</p><h2>Wrist radiographs</h2><p>Difficulty: unresolved · Complete source study · Clinical / privacy / reuse review pending</p></div><div class="images">${c.assets.map((a,j)=>`<figure><a href="${escape(pathToFileURL(locators.get(a.assetId)).href)}"><img src="${escape(pathToFileURL(locators.get(a.assetId)).href)}" alt="Case ${i+1}, original image ${j+1}; awaiting clinical and privacy review"></a><figcaption>Image ${j+1} · Source metadata: ${escape(a.laterality)} / ${escape(a.view)}<br>Open image for full resolution. Confirm metadata against the image.</figcaption></figure>`).join('')}</div><div class="questions">${c.questions.map((q,j)=>`<article><h3>${j+1}. ${escape(q.prompt)}</h3><p class="muted">${q.maxMarks} proposed mark${q.maxMarks>1?'s':''}</p><details><summary>Draft key and marking guidance — unapproved</summary><p>${escape(q.answer)}</p><p>${escape(q.rationale)}</p><ul>${q.criteria.map(k=>`<li>${escape(k.label)} (${k.maxMarks})</li>`).join('')}</ul></details></article>`).join('')}<details><summary>Clinical review checklist and source evidence</summary><ul><li>Verify source classification; resolve diagnosis, affected bone/site and supporting image findings.</li><li>Confirm side, projections, completeness and image quality; do not assume frontal means AP or PA.</li><li>Exclude the whole case if any view shows a cast, surgical hardware or other obvious evidence of surgery. Absence of source metal/cast flags is not visual clearance.</li><li>Set difficulty, accepted alternatives, explanations, marks and timing.</li><li>Inspect every image for embedded identifiers and every metadata field; record required redactions without editing originals.</li><li>Check case-level educational/commercial reuse evidence, attribution and intended audience separately.</li></ul><p><a href="evidence/${c.caseId}.json">Private source evidence</a> · <a href="review-notes.json">Editable review worksheet</a></p></details></div></section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src file:; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; base-uri 'none'"><title>Visible Medicine | Private fracture review</title><style>
  :root{--ink:#132c32;--muted:#51666b;--paper:#f3f7f6;--panel:#edf5f3;--line:#d4e1df;--green:#082a31;--teal:#087b6c}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 'Segoe UI',system-ui,sans-serif}header,main,footer{max-width:1200px;margin:auto;padding:28px}header{border-bottom:1px solid var(--line)}.brand{font-size:22px;font-weight:650}.eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--teal)}h1{font-size:clamp(30px,5vw,52px);line-height:1.1;letter-spacing:-.04em;margin:12px 0}h2{font-size:30px;margin:4px 0}h3{font-size:17px}.muted,figcaption{color:var(--muted)}.notice{padding:18px;background:#fff3d7;border:1px solid #dac694;border-radius:8px}nav{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0}a{color:var(--teal);overflow-wrap:anywhere}nav a{padding:8px 15px;border:1px solid var(--line);border-radius:6px;text-decoration:none}.case{background:white;border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:32px 0}.case-head,.questions{padding:24px}.case-head{background:var(--panel)}.case-head p{margin:5px 0}.images{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;padding:20px;background:#e6eeee}figure{margin:0;min-width:0}img{display:block;width:100%;height:430px;object-fit:contain;background:#061012}figcaption{font-size:13px;margin-top:8px}article{padding-bottom:18px;border-bottom:1px solid var(--line)}summary{cursor:pointer;color:var(--teal);padding:10px 0;font-weight:600}details p,li{overflow-wrap:anywhere}code{overflow-wrap:anywhere;font-size:12px}a:focus-visible,summary:focus-visible{outline:3px solid var(--teal);outline-offset:4px}@media(max-width:650px){header,main,footer{padding:16px}.images{grid-template-columns:1fr;padding:12px}img{height:360px}.case-head,.questions{padding:18px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
  </style></head><body><header><div class="brand">Visible Medicine</div><p class="eyebrow">Private local clinical review · Private draft</p><h1>Fracture examination pilot</h1><p>Six complete wrist studies · 12 original images · 18 draft questions · 24 proposed marks · 18-minute timing proposal</p><p class="notice">For your review only. These images, source labels and keys are unapproved. This file reads originals from this computer; it contains private local locators. Keep this entire folder private. No learner exam or automated marking is enabled.</p><nav aria-label="Cases">${exam.cases.map((_,i)=>`<a href="#case-${i+1}">Case ${i+1}</a>`).join('')}</nav><p>Record corrections in <a href="review-notes.json">review-notes.json</a> in this same private folder. Notes are not sign-off. Rebuild a new revision after edits before formal review.</p><details><summary>Evidence and scope</summary><p>Selection uses distinct existing patient groups from the training partition; existing blinded-review patients are excluded. All source images in each selected study are retained. Patient grouping is inherited from the canonical source, not independently reidentified. Other studies of the same patients remain reserved with those groups. No teaching/assessment split has been released.</p><p>Content revision: <code>${revision}</code></p><p>Image display is local only. If a viewer blocks local images, open this HTML directly from File Explorer in your local browser. Do not upload it to a web preview.</p></details></header><main>${sections}</main><footer>Private draft · Original image bytes unchanged · Clinical, privacy and reuse decisions remain separate.</footer></body></html>`;
}

async function main() {
  const dir = await realpath(resolve(process.argv[2] ?? ''));
  const privateRoot = await realpath(resolve(repo,'.local/fracture-exams'));
  const rel = relative(privateRoot, dir);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw Error('PRIVATE_FOLDER_REQUIRED');
  execFileSync('git',['check-ignore','--quiet',resolve(dir,'exam.draft.json')],{cwd:repo});
  const context = JSON.parse(await readFile(resolve(dir,'context.json'),'utf8'));
  const built = createDraft(context);
  // Verify the referenced original bytes again before generating review artifacts.
  const root = await realpath(context.sourceRoot);
  for (const c of context.cases) for (const a of c.assets) {
    const p = await realpath(a.path), r = relative(root,p);
    if (r.startsWith('..') || isAbsolute(r) || hash(await readFile(p)) !== a.sha256) throw Error('SOURCE_CHANGED');
  }
  await mkdir(resolve(dir,'evidence'),{recursive:true});
  for (const [caseId,value] of built.evidence) await writeFile(resolve(dir,'evidence',`${caseId}.json`),value,{flag:'wx'});
  await writeFile(resolve(dir,'exam.draft.json'),json(built.exam),{flag:'wx'});
  const notes = {schemaVersion:1,status:'unexecuted-review-worksheet',examRevision:built.revision,
    instructions:'Edit here in this ignored private folder. No field records approval; clinical/privacy/reuse sign-off must name the final content revision.',
    cases:built.exam.cases.map((c,i)=>({caseNumber:i+1,caseId:c.caseId,classification:null,findings:null,affectedBoneAndSite:null,lateralityAndViews:null,difficulty:null,acceptedAnswersAndMarks:null,explanation:null,imageQualityAndCompleteness:null,surgeryAndCastVisualScreening:null,embeddedTextAndMetadataPrivacy:null,reuseEvidenceAndAttribution:null,reviewerNotes:null})),timingAndPassStandard:null};
  await writeFile(resolve(dir,'review-notes.json'),json(notes),{flag:'wx'});
  await writeFile(resolve(dir,'review.html'),renderReview(built),{flag:'wx'});
  await writeFile(resolve(dir,'revision.json'),json({revision:built.revision,clinical:'pending',privacy:'pending',reuse:'pending',published:false}),{flag:'wx'});
  console.log(JSON.stringify({cases:built.exam.cases.length,questions:built.exam.cases.flatMap(c=>c.questions).length,revision:built.revision,status:'private-draft'}));
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(()=>{console.error('Private review build failed; no source values logged.');process.exitCode=1;});
}
