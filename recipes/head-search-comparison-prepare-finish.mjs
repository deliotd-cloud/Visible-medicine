import fs from 'node:fs';import assert from 'node:assert/strict';
const root='F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes';
let text=fs.readFileSync('F:/VisibleMedicine/staging/20261028-regional-scope-recipes/finish.mjs','utf8');
text=text.replaceAll('20261028-regional-scope-recipes','20261028-head-search-comparison-recipes').replaceAll('20261028-regional-scope-discovery','20261028-head-search-comparison').replaceAll('regional-scope-discovery-source-20261028','head-search-comparison-source-20261028').replaceAll('github-regional-scope-discovery-20261028.git','github-head-search-comparison-20261028.git');
function edit(a,b){assert.equal(text.split(a).length,2,a);text=text.replace(a,b);}
edit("sf=stage+'/SOURCE_CANDIDATE.json'","sf=stage+'/SOURCE_CANDIDATE_V2.json'");
edit(".includes('scopeRegionIds')",".includes('Compare views for ')");
edit(".includes('Opens in ')",".includes('head-linked-matching-step')");
edit("scope:'Authored cross-region tour discovery, canonical destination display, and preserved source-bound launch. No anatomy, clinical decisions, imaging mappings or permissions changed.'","scope:'Exact-step comparison links are reachable from visible matching and contributing Guided learning search results, preserving canonical mappings and selected-view gates. No anatomy, clinical decisions, imaging mappings or permissions changed.'");
edit('allExistingTestsPreserved:true','allOriginalTestsRecoverable:true,exactActionExpectationsExtendedForComparison:true');
edit("['prepare.mjs','run.mjs','finish.mjs','state.mjs']","['prepare.mjs','prepare-verification.mjs','adjust-context-test.mjs','repair-tests.mjs','run-v1.mjs','run.mjs','prepare-finish.mjs','finish.mjs','state.mjs']");
edit("path:'recipes/regional-scope-'+name","path:'recipes/head-search-comparison-'+name");
edit("beforeRevision:330,id:'TEACH-09'","beforeRevision:331,id:'TEACH-09'");
edit("rootKey:'regionalscopediscovery'","rootKey:'headsearchcomparison'");
edit("note:'Cross-region tours now appear under their explicit authored framing regions while retaining the canonical launch destination and revision.31focused cases, full configured types and stock build pass. All1842Review inputs and other source bytes unchanged. Preview/WSL unchanged; full suite/account/clinical acceptance remain open.'","note:'Visible matching/contributing Guided learning steps now expose the canonical Compare views action with selected-view/source gates.64focused cases, full configured types and stock build pass; all1842Review inputs and remaining product bytes unchanged. Source history preserved, action expectations extended. Preview/WSL unchanged; full suite/account/clinical acceptance remain open.'");
edit("change:'Make whole-body tours discoverable from their related region filters without redirecting their launch.'","change:'Open exact-step CT/MRI/3D comparisons directly from Guided learning search results.'");
const nextStart=" const next='",start=text.indexOf(nextStart),end=text.indexOf("';\n save(dir",start);assert(start>0&&end>start);
text=text.slice(0,start)+" const next='Continue all71requirements/eightideas from the verified head-search comparison candidate and native44516d0. Visible search steps now link directly to canonical comparison activities; cross-region discovery remains. Prioritize meaningful regional teaching, linked learning and outstanding release coverage. Keep normal preview unchanged and WSL running. C remains critically full: use F for temporary files and evidence; owner needs to free C space. Full suite, authenticated acceptance and clinical sign-off remain open. No public deployment/private uploads/fees/permissions, accepted-mask/desktop PACS edits or invented approvals/registration."+text.slice(end);
edit("kind:'Regional tour scope discovery; full types and stock production build verified'","kind:'Guided search exact-step comparisons; full types and stock production build verified'");
edit("priority:'Per-step linked comparison discovery, meaningful regional teaching and release coverage.'","priority:'Meaningful regional teaching, integrated learning and outstanding release verification.'");
edit('## Current: Regional tour filtering verified — 28 October 2026','## Current: Direct comparisons from Guided learning search — 28 October 2026');
edit('Whole-body tours also appear under their explicitly authored framing regions. Cards identify when they open in Whole body. Source/revision/step links,31focused checks, full configured types and the stock production build pass; Review inputs and current preview unchanged.','Matching and contributing steps now provide canonical Compare views links without opening the full step list.64focused cases, full configured types and stock production build pass; Review inputs and current preview unchanged.');
const mapStart=text.indexOf(' const map=intro+'),mapEnd=text.indexOf('\n const bytes=Buffer.from(map)',mapStart);assert(mapStart>0&&mapEnd>mapStart);
text=text.slice(0,mapStart)+` const map='## Current: Guided search comparisons — 28 October 2026\\n\\nVisible matching/contributing steps now open the canonical CT/MRI/3D comparison.64focused checks, full types and stock build pass. Checklist'+ledger.revision+'. Normal preview and WSL unchanged.\\n\\nCheckpoint: '+checkpoint.path+' (SHA-256 '+checkpoint.sha256+'). Full next priorities and owner policies: CURRENT_CHECKPOINT.json and F:/VisibleMedicine/website/docs/master-plan.md.\\n\\n## Canonical folders\\n\\nWebsite: F:/VisibleMedicine/website. Native Atlas: F:/VisibleMedicine/atlas (outputs junction). Latest candidate: '+site+'. Separate repositories; candidate is uninstalled. Keep generated modules, specialist accepted CT masks, desktop PACS and private data boundaries. No new approvals, registrations or release permissions.\\n\\n## Full previous map/history\\n\\n'+dir+'/WORKSPACE_MAP_BEFORE.md (SHA-256 '+hash(dir+'/WORKSPACE_MAP_BEFORE.md')+'). All history preserved at its exact bytes; follow its older archive links only when relevant. C is critically full; use F for task evidence and temporary files.\\n';`+text.slice(mapEnd);
// Verify original tests remain recoverable, including the intentionally extended action expectations.
const anchor="if(phase==='seal'){";
edit(anchor,anchor+`
 const changes=json(stage+'/PRODUCT_CHANGE.json'),pre=stage+'/test-repair-preimages';
 for(const name of ['tests/head-learning-library-discovery.test.ts','tests/head-learning-search-context.test.ts','tests/head-search-comparison.test.mjs']){
  let value=fs.readFileSync(site+'/'+name,'utf8');for(const r of changes.repairs.edits.filter(r=>r.file===name).toReversed()){assert.equal(value.split(r.after).length,2);value=value.replace(r.after,r.before);}
  assert.equal(value,fs.readFileSync(pre+'/'+name.replaceAll('/','__'),'utf8'));
  if(name==='tests/head-learning-search-context.test.ts')for(const[a,b]of changes.contextTestAdjustment.seams.toReversed()){assert.equal(value.split(b).length,2);value=value.replace(b,a);}
  if(name!=='tests/head-search-comparison.test.mjs')assert.equal(value,fs.readFileSync(p.website+'/'+name,'utf8'));
 }
 const compact='tests/guided-catalogue-compact.test.mjs',raw=fs.readFileSync(site+'/'+compact,'utf8');
 assert.equal(raw.replace("import {headSearchComparisonPredecessor} from './head-search-comparison-predecessor.mjs';\\n",'').replace(changes.compactTestInsertion,''),fs.readFileSync(p.website+'/'+compact,'utf8'));
`);
fs.writeFileSync(root+'/finish.mjs',text,{flag:'wx'});console.log('Finish recipe prepared.');
